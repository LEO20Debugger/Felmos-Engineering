import { Inject, Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { and, asc, desc, eq, lt, sql } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { companies, leads, services } from "@/db/schema";
import { hashIp, sessionHash } from "@/common/hashing";
import { TenantRepository } from "@/common/tenant-repository";
import type { TenantContext } from "@/common/tenant-context";
import {
  MailNotConfiguredError,
  MailService,
  NoRecipientsError,
} from "@/modules/mail/mail.service";
import { buildLeadEmail } from "./lead.email";

export type LeadInput = {
  name: string;
  phone: string;
  email: string;
  location: string;
  service: string;
  date?: string;
  message?: string;
  landingPath?: string;
  referrer?: string;
  utm?: Record<string, string | undefined>;
};

export type LeadRow = Record<string, unknown>;

const MAX_ATTEMPTS = 5;

@Injectable()
export class LeadsService extends TenantRepository<typeof leads> {
  constructor(
    @Inject(DB) db: Db,
    private readonly mail: MailService
  ) {
    super(db, leads);
  }

  /**
   * Record an enquiry, then try to notify.
   *
   * The order is the whole point. Until now this form called console.info and
   * the enquiry existed only in a log that has long since rolled over. The row
   * is committed before any mail is attempted, and a mail failure never
   * propagates to the visitor — an outage at Google must not turn into a lost
   * job or an error on the contact form.
   */
  async submit(
    ctx: TenantContext,
    input: LeadInput,
    meta: { ip: string; userAgent: string }
  ): Promise<number> {
    /* Match the submitted service name to a row so the dashboard can group by
       service. A miss is expected and fine — the form offers "Not sure —
       advise me", and the literal text is stored either way so renaming a
       service never rewrites history on old enquiries. */
    const [matched] = await this.db
      .select({ id: services.id })
      .from(services)
      .where(
        and(
          eq(services.companyId, ctx.companyId),
          eq(services.isDeleted, 0),
          eq(services.title, input.service)
        )
      )
      .limit(1);

    const referrerHost = safeHost(input.referrer);

    const [result] = await this.db.insert(leads).values({
      companyId: ctx.companyId,
      name: input.name,
      phone: input.phone,
      email: input.email,
      location: input.location,
      serviceText: input.service,
      serviceId: matched?.id ?? null,
      preferredDate: input.date || null,
      message: input.message || null,
      landingPath: input.landingPath?.slice(0, 300) ?? null,
      referrerHost,
      referrerUrl: input.referrer?.slice(0, 600) ?? null,
      utmSource: input.utm?.["utm_source"]?.slice(0, 120) ?? null,
      utmMedium: input.utm?.["utm_medium"]?.slice(0, 120) ?? null,
      utmCampaign: input.utm?.["utm_campaign"]?.slice(0, 120) ?? null,
      utmTerm: input.utm?.["utm_term"]?.slice(0, 120) ?? null,
      utmContent: input.utm?.["utm_content"]?.slice(0, 120) ?? null,
      sessionHash: sessionHash(meta.ip, meta.userAgent),
      device: deviceFrom(meta.userAgent),
      userAgent: meta.userAgent.slice(0, 400),
      ipHash: hashIp(meta.ip),
      emailStatus: "pending",
    } as never);

    const id = (result as unknown as { insertId: number }).insertId;

    /* Not awaited. The visitor's response should not wait on an SMTP
       handshake, and the outcome is recorded on the row either way. */
    void this.notify(ctx.companyId, id);

    return id;
  }

  /** Send the notification and record what happened. Never throws. */
  private async notify(companyId: number, leadId: number): Promise<void> {
    const [lead] = await this.db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) return;

    const [company] = await this.db
      .select({ webUrl: companies.webUrl })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    try {
      const message = buildLeadEmail({
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        location: lead.location,
        serviceText: lead.serviceText,
        preferredDate: lead.preferredDate,
        message: lead.message,
        referrerHost: lead.referrerHost,
        landingPath: lead.landingPath,
        adminUrl: company?.webUrl ?? process.env.WEB_URL ?? "",
        leadId,
      });

      await this.mail.send(companyId, message);

      await this.db
        .update(leads)
        .set({
          emailStatus: "sent",
          emailSentAt: new Date().toISOString(),
          emailError: null,
        })
        .where(eq(leads.id, leadId));
    } catch (error) {
      const notConfigured = error instanceof MailNotConfiguredError;

      /* An unconfigured provider is not a delivery failure. Counting it as an
         attempt would burn all five retries before anyone has set up a sending
         account, and the enquiries would then never be emailed at all — they
         stay 'pending' instead, and go out on the first run after the
         credentials appear. */
      await this.db
        .update(leads)
        .set({
          emailStatus: notConfigured ? "pending" : "failed",
          emailError: String(
            (error as { message?: string }).message ?? error
          ).slice(0, 400),
          ...(notConfigured
            ? {}
            : { emailAttempts: sql`LEAST(CAST(email_attempts AS UNSIGNED) + 1, 99)` }),
        } as never)
        .where(eq(leads.id, leadId));

      console.error(
        `[leads] notification for #${leadId} ${
          notConfigured ? "deferred (no sending account configured)" : "failed"
        }:`,
        (error as { message?: string }).message ?? error
      );
    }
  }

  /**
   * Retry anything undelivered.
   *
   * Covers both a transient Google outage and the ordinary case of the sending
   * account being configured after the site went live — enquiries taken in the
   * meantime are notified on the next run rather than being silently skipped.
   */
  @Cron("*/15 * * * *")
  async retryUndelivered(): Promise<void> {
    if (!this.mail.configured) return;

    const pending = await this.db
      .select({ id: leads.id, companyId: leads.companyId })
      .from(leads)
      .where(
        and(
          sql`${leads.emailStatus} IN ('pending','failed')`,
          lt(sql`CAST(${leads.emailAttempts} AS UNSIGNED)`, MAX_ATTEMPTS),
          eq(leads.isDeleted, 0)
        )
      )
      .orderBy(asc(leads.id))
      .limit(25);

    if (pending.length === 0) return;

    console.info(`[leads] retrying ${pending.length} undelivered notification(s)`);
    for (const row of pending) {
      await this.notify(row.companyId, row.id);
    }
  }

  /* ─────────────────────────────── dashboard ─────────────────────────────── */

  async list(
    ctx: TenantContext,
    options: { status?: string } = {}
  ): Promise<LeadRow[]> {
    return this.db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        email: leads.email,
        location: leads.location,
        serviceText: leads.serviceText,
        preferredDate: leads.preferredDate,
        message: leads.message,
        status: leads.status,
        emailStatus: leads.emailStatus,
        emailError: leads.emailError,
        referrerHost: leads.referrerHost,
        landingPath: leads.landingPath,
        internalNotes: leads.internalNotes,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(
        this.scope(
          ctx,
          options.status ? eq(leads.status, options.status as never) : undefined
        )
      )
      .orderBy(desc(leads.createdAt))
      .limit(200);
  }

  async findOne(ctx: TenantContext, id: number): Promise<LeadRow> {
    return this.requireRow(ctx, id);
  }

  async setStatus(
    ctx: TenantContext,
    id: number,
    values: { status?: string; internalNotes?: string }
  ): Promise<void> {
    await this.requireRow(ctx, id);
    await this.db
      .update(leads)
      .set({ ...this.updateStamps(ctx), ...values } as never)
      .where(this.scope(ctx, eq(leads.id, id)));
  }

  /** Manual "send it again" from the leads inbox, for a failed notification. */
  async resend(ctx: TenantContext, id: number): Promise<void> {
    await this.requireRow(ctx, id);
    await this.db
      .update(leads)
      .set({ emailAttempts: "0" } as never)
      .where(this.scope(ctx, eq(leads.id, id)));
    await this.notify(ctx.companyId, id);
  }
}

/* ────────────────────────────── helpers ────────────────────────────── */

function safeHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).host.slice(0, 160);
  } catch {
    return null;
  }
}

function deviceFrom(userAgent: string): "mobile" | "tablet" | "desktop" | "bot" {
  const ua = userAgent.toLowerCase();
  if (/bot|crawler|spider|headless/.test(ua)) return "bot";
  if (/ipad|tablet/.test(ua)) return "tablet";
  if (/mobi|android|iphone/.test(ua)) return "mobile";
  return "desktop";
}
