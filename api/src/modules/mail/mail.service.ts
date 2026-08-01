/**
 * Sending mail.
 *
 * Deliberately small and provider-shaped: everything provider-specific is
 * confined to `client()` and the one call inside `send()`, so moving to another
 * service later is a change to this file and nothing else.
 *
 * Resend rather than SMTP because a cloud host blocks the outbound SMTP port
 * and mail from an unrecognised IP is treated as spam. An HTTPS API sidesteps
 * both, and the sending domain is authenticated with SPF/DKIM at the DNS level
 * rather than by signing in to somebody's mailbox.
 *
 * MAIL_FROM must be on a domain verified in Resend. An address on a domain you
 * have not verified is rejected at send time, not at startup — which is why a
 * rejected send is surfaced loudly onto the lead row rather than swallowed.
 */

import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import { Resend } from "resend";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { mailRecipients } from "@/db/schema";

export type Recipients = { to: string[]; cc: string[]; bcc: string[] };

export type Outgoing = {
  subject: string;
  text: string;
  html: string;
  /** Replies go here rather than to the sending account — so staff hitting
      Reply reach the person who enquired, not a notifications mailbox. */
  replyTo?: string;
  /** Overrides the recipient list from the database. Used by the confirmation
      mail, which goes to the person who enquired rather than to staff. */
  to?: string[];
};

/** Thrown when there is nothing to send *to*, which is a configuration
    problem rather than a delivery failure and should read differently in the
    leads inbox. */
export class NoRecipientsError extends Error {}

/** Thrown when no sending account is configured yet. Distinguished from a
    genuine failure so the retry job can wait rather than burning attempts. */
export class MailNotConfiguredError extends Error {}

const CACHE_MS = 60_000;

@Injectable()
export class MailService {
  /**
   * Keyed by company, not a single slot.
   *
   * A shared slot would be a cross-tenant leak rather than mere staleness: the
   * second company's leads would go to the first company's recipient list for
   * up to a minute, and nothing about that failure is visible from either
   * dashboard.
   */
  private readonly cached = new Map<number, { at: number; value: Recipients }>();
  private resend?: Resend;

  constructor(@Inject(DB) private readonly db: Db) {}

  get configured(): boolean {
    return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
  }

  private client(): Resend {
    if (!this.configured) {
      throw new MailNotConfiguredError(
        "RESEND_API_KEY and MAIL_FROM are not both set — no sending account configured."
      );
    }

    this.resend ??= new Resend(process.env.RESEND_API_KEY);
    return this.resend;
  }

  /**
   * Who gets notified, from the database rather than configuration.
   *
   * Cached for a minute: this is read on every submission and changes rarely.
   * The settings module drops the entry on every recipient change, so the
   * minute is a ceiling for changes made outside the dashboard rather than a
   * delay anybody actually experiences.
   */
  async recipients(companyId: number): Promise<Recipients> {
    const hit = this.cached.get(companyId);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

    const rows = await this.db
      .select({ email: mailRecipients.email, role: mailRecipients.role })
      .from(mailRecipients)
      .where(
        and(
          eq(mailRecipients.companyId, companyId),
          eq(mailRecipients.isDeleted, 0),
          eq(mailRecipients.active, 1)
        )
      )
      .orderBy(asc(mailRecipients.sortOrder));

    const value: Recipients = { to: [], cc: [], bcc: [] };
    for (const row of rows) value[row.role].push(row.email);

    this.cached.set(companyId, { at: Date.now(), value });
    return value;
  }

  /** Drop the cache so a recipient change is visible immediately. Without a
      company, drops everything — only useful in tests. */
  invalidate(companyId?: number): void {
    if (companyId === undefined) this.cached.clear();
    else this.cached.delete(companyId);
  }

  async send(companyId: number, message: Outgoing): Promise<void> {
    /* An explicit `to` is the customer confirmation, which has exactly one
       recipient and must never be cc'd to staff. */
    const direct = message.to && message.to.length > 0;
    const recipients = direct
      ? { to: message.to as string[], cc: [], bcc: [] }
      : await this.recipients(companyId);

    if (recipients.to.length === 0) {
      throw new NoRecipientsError(
        "No active recipients are configured, so there is nobody to notify."
      );
    }

    /* Resend reports a rejected send in the response rather than by throwing,
       so an unchecked call records as delivered when it was not. */
    const { error } = await this.client().emails.send({
      from: process.env.MAIL_FROM as string,
      to: recipients.to,
      cc: recipients.cc.length > 0 ? recipients.cc : undefined,
      bcc: recipients.bcc.length > 0 ? recipients.bcc : undefined,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });

    if (error) {
      throw new Error(`${error.name ?? "Send failed"}: ${error.message}`);
    }
  }
}
