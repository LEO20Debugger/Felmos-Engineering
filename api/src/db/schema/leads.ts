/**
 * Inspection requests.
 *
 * This table is the point of the whole project. Today the contact form's route
 * validates a submission and then calls console.info on it — every enquiry the
 * site has ever received exists only in a log that has long since rolled over.
 * From here on a lead is a row first and an email second.
 */

import { relations } from "drizzle-orm";
import { index, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

import { actors, bigintId, pk, softDelete, timestamps } from "./_base";
import { services } from "./content";
import { users } from "./auth";
import { companies } from "./tenancy";

export const leads = mysqlTable(
  "leads",
  {
    id: pk(),
    companyId: bigintId("company_id")
      .notNull()
      .references(() => companies.id),

    /* ── what the visitor submitted, exactly as submitted ── */
    name: varchar("name", { length: 160 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    location: varchar("location", { length: 240 }).notNull(),

    /** The literal string chosen in the form's select. Kept verbatim, and
        resolved to `serviceId` separately, because the options include
        "Not sure — advise me" and because renaming a service must not rewrite
        history on enquiries that predate the change. */
    serviceText: varchar("service_text", { length: 200 }).notNull(),
    serviceId: bigintId("service_id").references(() => services.id),

    preferredDate: varchar("preferred_date", { length: 10 }),
    message: text("message"),

    /* ── triage ── */
    status: varchar("status", { length: 16 })
      .notNull()
      .default("new")
      .$type<"new" | "contacted" | "quoted" | "won" | "lost" | "spam">(),
    assignedTo: bigintId("assigned_to").references(() => users.id),
    internalNotes: text("internal_notes"),

    source: varchar("source", { length: 16 })
      .notNull()
      .default("web_form")
      .$type<"web_form" | "phone" | "whatsapp" | "other">(),

    /* ── attribution: which page and which campaign produced this ── */
    landingPath: varchar("landing_path", { length: 300 }),
    referrerHost: varchar("referrer_host", { length: 160 }),
    referrerUrl: varchar("referrer_url", { length: 600 }),
    utmSource: varchar("utm_source", { length: 120 }),
    utmMedium: varchar("utm_medium", { length: 120 }),
    utmCampaign: varchar("utm_campaign", { length: 120 }),
    utmTerm: varchar("utm_term", { length: 120 }),
    utmContent: varchar("utm_content", { length: 120 }),

    /** Joins to page_views, so the dashboard can show what someone read before
        they enquired. Same cookieless daily hash — it deliberately cannot
        follow anyone across days. */
    sessionHash: varchar("session_hash", { length: 32 }),
    device: varchar("device", { length: 12 }).$type<
      "mobile" | "tablet" | "desktop" | "bot"
    >(),
    userAgent: varchar("user_agent", { length: 400 }),
    /** sha256(ip + APP_SALT). Enough to spot a flood from one source; not
        enough to recover the address. */
    ipHash: varchar("ip_hash", { length: 64 }),

    /* ── delivery ──
       Kept on the lead itself so a failed send is visible in the inbox rather
       than only in logs. The visitor's submission is committed before any mail
       is attempted: an outage at the mail provider must never turn into a lost
       enquiry or an error on the form. */
    emailStatus: varchar("email_status", { length: 12 })
      .notNull()
      .default("pending")
      .$type<"pending" | "sent" | "failed">(),
    emailAttempts: varchar("email_attempts", { length: 4 }).notNull().default("0"),
    emailError: varchar("email_error", { length: 400 }),
    emailSentAt: varchar("email_sent_at", { length: 32 }),

    ...timestamps,
    ...softDelete,
    ...actors,
  },
  (t) => [
    index("ix_leads_inbox").on(t.companyId, t.isDeleted, t.status, t.createdAt),
    index("ix_leads_recent").on(t.companyId, t.isDeleted, t.createdAt),
    index("ix_leads_service").on(t.companyId, t.serviceId, t.createdAt),
    /* Drives the retry cron — a partial-index equivalent, cheap because almost
       every row is 'sent'. */
    index("ix_leads_delivery").on(t.emailStatus, t.createdAt),
  ]
);

export const leadsRelations = relations(leads, ({ one }) => ({
  service: one(services, {
    fields: [leads.serviceId],
    references: [services.id],
  }),
  assignee: one(users, { fields: [leads.assignedTo], references: [users.id] }),
}));
