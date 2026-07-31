/**
 * Traffic and engagement.
 *
 * Self-hosted, cookieless and no third-party script. A visitor is identified
 * only by sha256(ip + user-agent + APP_SALT + today's date), truncated — which
 * is enough to count unique visits within a day and structurally incapable of
 * following anyone across days.
 *
 * Two things here are easy to postpone and expensive to retrofit, so they ship
 * together with the ingest endpoint, not after it:
 *
 *   - the daily rollups at the bottom of this file. Once these tables hold a
 *     few hundred thousand rows, a dashboard that aggregates raw rows on every
 *     load starts timing out, and adding a rollup to a table already being
 *     queried live is a migration under load.
 *   - the retention delete. These are the only tables with unbounded growth,
 *     and they are hard-deleted (see `appendOnly` in _base.ts) precisely so the
 *     retention job can actually reclaim the space.
 */

import {
  date,
  index,
  json,
  mysqlTable,
  primaryKey,
  smallint,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";

import { appendOnly, bigintId, pk } from "./_base";

/** What a view or event was about, so content can be ranked without parsing
    URLs. Resolved at ingest from the path the beacon reports. */
const contentRef = {
  contentType: varchar("content_type", { length: 12 })
    .notNull()
    .default("page")
    .$type<"page" | "service" | "project" | "post" | "other">(),
  contentId: bigintId("content_id"),
};

export const pageViews = mysqlTable(
  "page_views",
  {
    id: pk(),
    ...appendOnly,

    path: varchar("path", { length: 300 }).notNull(),
    ...contentRef,

    sessionHash: varchar("session_hash", { length: 32 }).notNull(),
    /** First view in this session, which is what makes a "visits" count
        possible without storing anything durable about the visitor. */
    isNewSession: tinyint("is_new_session").notNull().default(0),

    referrerHost: varchar("referrer_host", { length: 160 }),
    referrerUrl: varchar("referrer_url", { length: 600 }),
    utmSource: varchar("utm_source", { length: 120 }),
    utmMedium: varchar("utm_medium", { length: 120 }),
    utmCampaign: varchar("utm_campaign", { length: 120 }),

    device: varchar("device", { length: 12 }).$type<
      "mobile" | "tablet" | "desktop"
    >(),
    os: varchar("os", { length: 40 }),
    browser: varchar("browser", { length: 40 }),
    /** From the platform's geo header when present; never geo-IP lookup. */
    country: varchar("country", { length: 2 }),

    /** Sent on pagehide via sendBeacon, so it is frequently absent — treat a
        null here as "unknown", never as zero. */
    durationMs: bigintId("duration_ms"),
  },
  (t) => [
    index("ix_views_recent").on(t.companyId, t.createdAt),
    index("ix_views_path").on(t.companyId, t.path, t.createdAt),
    index("ix_views_content").on(t.companyId, t.contentType, t.contentId, t.createdAt),
    index("ix_views_session").on(t.sessionHash, t.createdAt),
  ]
);

/**
 * Discrete interactions — the click-throughs that reveal intent a pageview
 * doesn't: phone_click, whatsapp_click, email_click, cta_click, form_start,
 * form_submit, scroll_75.
 *
 * `name` is a plain varchar rather than an enum so a new interaction can be
 * instrumented on the site without a migration; the ingest endpoint validates
 * against an allowlist so it can't become a junk drawer.
 */
export const events = mysqlTable(
  "events",
  {
    id: pk(),
    ...appendOnly,

    name: varchar("name", { length: 48 }).notNull(),
    path: varchar("path", { length: 300 }).notNull(),
    /** What was clicked — a phone number, a CTA label, a destination. */
    target: varchar("target", { length: 200 }),
    ...contentRef,

    sessionHash: varchar("session_hash", { length: 32 }).notNull(),
    meta: json("meta").$type<Record<string, string | number>>(),
  },
  (t) => [
    index("ix_events_name").on(t.companyId, t.name, t.createdAt),
    index("ix_events_recent").on(t.companyId, t.createdAt),
  ]
);

/* ─────────────────────────────── rollups ─────────────────────────────── */

/**
 * Nightly aggregate of `pageViews`.
 *
 * The dashboard reads rollups for any range beyond the last 24 hours and raw
 * rows only for today. Raw rows are deleted after 180 days; these are kept
 * indefinitely, because they are small and are the only long-run history.
 */
export const dailyStats = mysqlTable(
  "daily_stats",
  {
    companyId: bigintId("company_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    path: varchar("path", { length: 300 }).notNull(),
    contentType: varchar("content_type", { length: 12 }).notNull().default("page"),
    contentId: bigintId("content_id"),

    views: bigintId("views").notNull().default(0),
    uniques: bigintId("uniques").notNull().default(0),
    avgDurationMs: bigintId("avg_duration_ms"),
  },
  (t) => [
    primaryKey({ columns: [t.companyId, t.day, t.path] }),
    index("ix_daily_stats_content").on(t.companyId, t.contentType, t.contentId, t.day),
  ]
);

export const dailyEventStats = mysqlTable(
  "daily_event_stats",
  {
    companyId: bigintId("company_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    name: varchar("name", { length: 48 }).notNull(),
    count: bigintId("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.day, t.name] })]
);

/** Referrer breakdown, rolled up on the same schedule. */
export const dailyReferrerStats = mysqlTable(
  "daily_referrer_stats",
  {
    companyId: bigintId("company_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    referrerHost: varchar("referrer_host", { length: 160 }).notNull(),
    views: bigintId("views").notNull().default(0),
    uniques: bigintId("uniques").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.day, t.referrerHost] })]
);

/** Device split, same schedule. Small enough to keep forever. */
export const dailyDeviceStats = mysqlTable(
  "daily_device_stats",
  {
    companyId: bigintId("company_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    device: varchar("device", { length: 12 }).notNull(),
    views: bigintId("views").notNull().default(0),
    uniques: bigintId("uniques").notNull().default(0),
    /** smallint is plenty — this is a count of distinct device buckets. */
    sessions: smallint("sessions", { unsigned: true }).notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.companyId, t.day, t.device] })]
);
