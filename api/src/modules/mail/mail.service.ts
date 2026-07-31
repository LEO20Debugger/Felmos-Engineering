/**
 * Sending mail.
 *
 * Deliberately small and provider-shaped: everything provider-specific is the
 * transport built in `transporter()`, so moving from Gmail to a dedicated
 * service later is a change to that one method rather than to any caller.
 *
 * Gmail rather than a mail service because the brief is minimum third-party
 * surface. A server cannot hand mail directly to Gmail — cloud hosts block the
 * outbound SMTP port and mail from an unrecognised IP is treated as spam — so
 * the app signs in to an account the receiving providers already trust.
 *
 * Note that the sending account need not be the client's. Credentials are only
 * needed for the account mail is sent *from*; the recipients need none.
 */

import { Inject, Injectable } from "@nestjs/common";
import { and, asc, eq } from "drizzle-orm";
import nodemailer, { type Transporter } from "nodemailer";

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
};

/** Thrown when there is nothing to send *to*, which is a configuration
    problem rather than a delivery failure and should read differently in the
    leads inbox. */
export class NoRecipientsError extends Error {}

/** Thrown when no sending account is configured yet. Distinguished from a
    genuine failure so the retry job can wait rather than burning attempts. */
export class MailNotConfiguredError extends Error {}

@Injectable()
export class MailService {
  private cached?: { at: number; value: Recipients };
  private transport?: Transporter;

  constructor(@Inject(DB) private readonly db: Db) {}

  get configured(): boolean {
    return Boolean(process.env.SMTP_USER && process.env.SMTP_PASSWORD);
  }

  private transporter(): Transporter {
    if (!this.configured) {
      throw new MailNotConfiguredError(
        "SMTP_USER and SMTP_PASSWORD are not set — no sending account configured."
      );
    }

    this.transport ??= nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        /* A Google *app password*, not the account password. Generated under
           Security → App passwords with 2-Step Verification on. It grants mail
           access only and can be revoked without changing the login. */
        pass: process.env.SMTP_PASSWORD,
      },
    });

    return this.transport;
  }

  /**
   * Who gets notified, from the database rather than configuration.
   *
   * Cached for a minute: this is read on every submission and changes rarely,
   * but a minute is short enough that adding someone in the dashboard takes
   * effect while the person who added them is still looking at the screen.
   */
  async recipients(companyId: number): Promise<Recipients> {
    if (this.cached && Date.now() - this.cached.at < 60_000) {
      return this.cached.value;
    }

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

    this.cached = { at: Date.now(), value };
    return value;
  }

  /** Drop the cache so a recipient change is visible immediately. */
  invalidate(): void {
    this.cached = undefined;
  }

  async send(companyId: number, message: Outgoing): Promise<void> {
    const recipients = await this.recipients(companyId);

    if (recipients.to.length === 0) {
      throw new NoRecipientsError(
        "No active recipients are configured, so there is nobody to notify."
      );
    }

    await this.transporter().sendMail({
      from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
      to: recipients.to,
      cc: recipients.cc.length > 0 ? recipients.cc : undefined,
      bcc: recipients.bcc.length > 0 ? recipients.bcc : undefined,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}
