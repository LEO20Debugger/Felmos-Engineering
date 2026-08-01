import { Inject, Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { and, asc, count, desc, eq, like, or, sql, type SQL } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { leads, services } from "@/db/schema";
import { hashIp, sessionHash } from "@/common/hashing";
import { TenantRepository } from "@/common/tenant-repository";
import type { TenantContext } from "@/common/tenant-context";
import { BrandService } from "@/modules/mail/brand";
import {
  MailNotConfiguredError,
  MailService,
  NoRecipientsError,
} from "@/modules/mail/mail.service";
import { buildConfirmationEmail } from "./confirmation.email";
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

export type LeadStatus =
  | "new"
  | "contacted"
  | "quoted"
  | "won"
  | "lost"
  | "spam";

/** What the inbox's multi-select bar can do to a set of enquiries. Leads have
    no published/draft state, so the vocabulary is triage plus soft delete. */
export type LeadBulkAction = "delete" | "restore" | LeadStatus;

export type LeadListOptions = {
  status?: string;
  /** Free text, matched against name, phone, email, location and service. */
  q?: string;
  includeDeleted?: boolean;
  page?: number;
  perPage?: number;
};

export type LeadCounts = {
  byStatus: Record<string, number>;
  total: number;
  undelivered: number;
  deleted: number;
};

const MAX_ATTEMPTS = 5;
const DEFAULT_PER_PAGE = 50;

/** A hard ceiling on the CSV, so a request for one can never try to hold the
    entire table in memory. Far above any realistic enquiry volume. */
const EXPORT_CAP = 5000;

/* The inbox needs enough to render a row and its expanded panel, and nothing
   more — `ipHash`, `userAgent` and `sessionHash` stay out of the list payload
   because no screen shows them. */
const LIST_COLUMNS = {
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
  confirmationSentAt: leads.confirmationSentAt,
  referrerHost: leads.referrerHost,
  landingPath: leads.landingPath,
  utmSource: leads.utmSource,
  utmMedium: leads.utmMedium,
  utmCampaign: leads.utmCampaign,
  device: leads.device,
  internalNotes: leads.internalNotes,
  isDeleted: leads.isDeleted,
  createdAt: leads.createdAt,
} as const;

/* The CSV carries the attribution columns too — that is most of the point of
   exporting, and a spreadsheet is where campaign analysis actually happens. */
const EXPORT_COLUMNS = {
  ...LIST_COLUMNS,
  utmTerm: leads.utmTerm,
  utmContent: leads.utmContent,
  referrerUrl: leads.referrerUrl,
  emailSentAt: leads.emailSentAt,
} as const;

/** Column order in the CSV — the details you act on first, attribution after,
    delivery state last. Explicit rather than Object.keys so reordering the
    projection above never silently reshuffles somebody's spreadsheet. */
export const EXPORT_FIELDS = [
  "createdAt",
  "name",
  "phone",
  "email",
  "location",
  "serviceText",
  "preferredDate",
  "status",
  "message",
  "internalNotes",
  "landingPath",
  "referrerHost",
  "referrerUrl",
  "utmSource",
  "utmMedium",
  "utmCampaign",
  "utmTerm",
  "utmContent",
  "device",
  "emailStatus",
  "emailSentAt",
  "confirmationSentAt",
  "isDeleted",
  "id",
] as const;

@Injectable()
export class LeadsService extends TenantRepository<typeof leads> {
  constructor(
    @Inject(DB) db: Db,
    private readonly mail: MailService,
    private readonly brand: BrandService
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

  /** Send the notifications and record what happened. Never throws. */
  private async notify(companyId: number, leadId: number): Promise<void> {
    const [lead] = await this.db
      .select()
      .from(leads)
      .where(eq(leads.id, leadId))
      .limit(1);

    if (!lead) return;

    const brand = await this.brand.get(companyId);

    /* Staff first, and the two are not a transaction. The notification to the
       business is the one that decides whether this lead is delivered; the
       enquirer's confirmation is courtesy. Sending the confirmation first
       would mean a courtesy failure could stop the notification. */
    if (lead.emailStatus !== "sent") {
      try {
        const message = buildLeadEmail(
          {
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            location: lead.location,
            serviceText: lead.serviceText,
            preferredDate: lead.preferredDate,
            message: lead.message,
            referrerHost: lead.referrerHost,
            landingPath: lead.landingPath,
            utmSource: lead.utmSource,
            utmCampaign: lead.utmCampaign,
            leadId,
          },
          brand
        );

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
        await this.recordFailure(leadId, error);
        return;
      }
    }

    /* Best-effort, and deliberately after the staff mail has been marked sent.
       A bounce off a mistyped address is not a reason to show this lead as
       undelivered in the inbox — the business has it either way. */
    if (!lead.confirmationSentAt) {
      try {
        await this.mail.send(companyId, {
          ...buildConfirmationEmail(
            {
              name: lead.name,
              phone: lead.phone,
              location: lead.location,
              serviceText: lead.serviceText,
              preferredDate: lead.preferredDate,
              message: lead.message,
            },
            brand
          ),
          to: [lead.email],
        });

        await this.db
          .update(leads)
          .set({ confirmationSentAt: new Date().toISOString() } as never)
          .where(eq(leads.id, leadId));
      } catch (error) {
        console.error(
          `[leads] confirmation to the enquirer for #${leadId} failed:`,
          (error as { message?: string }).message ?? error
        );
      }
    }
  }

  /** Stamp a failed staff notification onto the row. */
  private async recordFailure(leadId: number, error: unknown): Promise<void> {
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

  /**
   * Retry anything undelivered.
   *
   * Covers both a transient provider outage and the ordinary case of the
   * sending account being configured after the site went live — enquiries taken
   * in the meantime are notified on the next run rather than being silently
   * skipped.
   *
   * Also picks up leads whose staff notification landed but whose confirmation
   * did not: `notify()` skips whichever half is already done, so a repeat run
   * never double-sends.
   *
   * The confirmation half is bounded to the last day rather than by an attempt
   * count. It has no counter of its own, and the common reason it never
   * succeeds is a mistyped address — which will not start working. Without the
   * window those rows would be retried every fifteen minutes forever.
   */
  @Cron("*/15 * * * *")
  async retryUndelivered(): Promise<void> {
    if (!this.mail.configured) return;

    const pending = await this.db
      .select({ id: leads.id, companyId: leads.companyId })
      .from(leads)
      .where(
        and(
          sql`(
            (${leads.emailStatus} IN ('pending','failed')
             AND CAST(${leads.emailAttempts} AS UNSIGNED) < ${MAX_ATTEMPTS})
            OR (${leads.emailStatus} = 'sent'
                AND ${leads.confirmationSentAt} IS NULL
                AND ${leads.createdAt} > NOW() - INTERVAL 1 DAY)
          )`,
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

  /**
   * The inbox query.
   *
   * Returns a total alongside the page because the old version capped at 200
   * rows and said nothing — a business that took its 201st enquiry would have
   * silently lost the oldest one from every view it had.
   */
  async list(
    ctx: TenantContext,
    options: LeadListOptions = {}
  ): Promise<{ rows: LeadRow[]; total: number }> {
    const where = this.scope(
      ctx,
      this.filters(options),
      options.includeDeleted ?? false
    );

    const [[totals], rows] = await Promise.all([
      this.db.select({ total: count() }).from(leads).where(where),
      this.db
        .select(LIST_COLUMNS)
        .from(leads)
        .where(where)
        .orderBy(desc(leads.createdAt))
        .limit(options.perPage ?? DEFAULT_PER_PAGE)
        .offset(((options.page ?? 1) - 1) * (options.perPage ?? DEFAULT_PER_PAGE)),
    ]);

    return { rows, total: Number(totals?.total ?? 0) };
  }

  /** Every row matching the filters, for the CSV. Deliberately unpaginated —
      an export that only covered the visible page would be a trap. */
  async exportRows(
    ctx: TenantContext,
    options: LeadListOptions = {}
  ): Promise<LeadRow[]> {
    return this.db
      .select(EXPORT_COLUMNS)
      .from(leads)
      .where(
        this.scope(ctx, this.filters(options), options.includeDeleted ?? false)
      )
      .orderBy(desc(leads.createdAt))
      .limit(EXPORT_CAP);
  }

  /**
   * Counts for the filter pills and the overview tile.
   *
   * One grouped query rather than one per status — this runs on every render
   * of the inbox, and six round trips for six numbers is the kind of thing
   * that only shows up as slowness once the table is big.
   */
  async counts(ctx: TenantContext): Promise<LeadCounts> {
    const rows = await this.db
      .select({ status: leads.status, n: count() })
      .from(leads)
      .where(this.scope(ctx))
      .groupBy(leads.status);

    const byStatus: Record<string, number> = {};
    let total = 0;
    for (const row of rows) {
      byStatus[row.status] = Number(row.n);
      total += Number(row.n);
    }

    const [undelivered] = await this.db
      .select({ n: count() })
      .from(leads)
      .where(this.scope(ctx, sql`${leads.emailStatus} <> 'sent'`));

    const [deleted] = await this.db
      .select({ n: count() })
      .from(leads)
      .where(
        and(eq(leads.companyId, ctx.companyId), eq(leads.isDeleted, 1)) as never
      );

    return {
      byStatus,
      total,
      undelivered: Number(undelivered?.n ?? 0),
      deleted: Number(deleted?.n ?? 0),
    };
  }

  /**
   * Apply one action to a set of rows.
   *
   * Its own loop rather than `bulkApply`, whose publish/draft vocabulary does
   * not apply to an enquiry — but with the same skip-a-404 behaviour, and for
   * the same reason: the checkbox list may have been rendered before somebody
   * else deleted a row, and failing the whole batch over one stale id is worse
   * than applying the rest.
   */
  async bulk(
    ctx: TenantContext,
    ids: number[],
    action: LeadBulkAction
  ): Promise<number> {
    let affected = 0;

    for (const id of ids) {
      try {
        if (action === "delete") await this.softDelete(ctx, id);
        else if (action === "restore") await this.restore(ctx, id);
        else await this.setStatus(ctx, id, { status: action });
        affected += 1;
      } catch (error) {
        if ((error as { status?: number })?.status === 404) continue;
        throw error;
      }
    }

    return affected;
  }

  async findOne(ctx: TenantContext, id: number): Promise<LeadRow> {
    return this.requireRow(ctx, id, true);
  }

  /** Status and free-text search, shared by the list, the count and the CSV so
      an export can never cover a different set than the screen it came from. */
  private filters(options: LeadListOptions): SQL | undefined {
    const parts: SQL[] = [];

    if (options.status) {
      parts.push(eq(leads.status, options.status as never));
    }

    if (options.q) {
      /* Escaped so a customer search for "50%" doesn't turn into a wildcard
         that matches the whole table. */
      const term = `%${options.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
      parts.push(
        or(
          like(leads.name, term),
          like(leads.phone, term),
          like(leads.email, term),
          like(leads.location, term),
          like(leads.serviceText, term)
        ) as SQL
      );
    }

    if (parts.length === 0) return undefined;
    return parts.length === 1 ? parts[0] : (and(...parts) as SQL);
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

  /** Manual "send it again" from the leads inbox, for a failed notification.

      Resets the status as well as the attempt count: `notify()` skips the half
      of the job that is already done, so leaving a 'sent' row alone would make
      this button do nothing. */
  async resend(ctx: TenantContext, id: number): Promise<void> {
    await this.requireRow(ctx, id);
    await this.db
      .update(leads)
      .set({ emailAttempts: "0", emailStatus: "pending" } as never)
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

/**
 * Rows to CSV.
 *
 * Two details matter and neither is obvious. Excel only reads UTF-8 correctly
 * when the file opens with a byte-order mark, and a Nigerian address or a name
 * with an accent is otherwise mojibake in the one program these files are
 * opened in. And a value beginning =, +, - or @ is executed as a formula on
 * open — a phone number entered as "+234…" is the ordinary case here, not a
 * contrived one — so those are prefixed with a tab to defuse them.
 */
export function toCsv(rows: LeadRow[], columns: string[]): string {
  const cell = (value: unknown): string => {
    if (value === null || value === undefined) return "";

    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `\t${text}`;

    return `"${text.replace(/"/g, '""')}"`;
  };

  const lines = [
    columns.map((c) => cell(headerLabel(c))).join(","),
    ...rows.map((row) => columns.map((c) => cell(row[c])).join(",")),
  ];

  /* CRLF and a BOM, both for the same reason: this is opened in Excel. */
  return `﻿${lines.join("\r\n")}\r\n`;
}

/** "serviceText" → "Service text". The CSV is read by people, not parsed. */
function headerLabel(key: string): string {
  const spaced = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
