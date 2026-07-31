/**
 * The row contract every business table shares.
 *
 * Defined once and spread into each table so the shape cannot drift. Two
 * decisions are encoded here and both are load-bearing:
 *
 *   1. `companyId` on every table. The same database is intended to serve more
 *      than one business, so tenancy is a column, not a deployment. Nothing is
 *      global except `companies` itself.
 *
 *   2. Soft delete (`isDeleted` + `deletedAt`) rather than DELETE. Rows are
 *      recoverable and the audit trail stays intact.
 *
 * Soft delete has a consequence that is easy to miss and expensive to discover
 * late: a deleted row still occupies its slug, so recreating something you
 * deleted fails on the unique index. `slugActive` below is the fix — see the
 * comment on it. Analytics tables deliberately opt out of all of this; see
 * `appendOnly`.
 */

import { sql } from "drizzle-orm";
import {
  bigint,
  datetime,
  tinyint,
  varchar,
  type AnyMySqlColumn,
} from "drizzle-orm/mysql-core";

/** `datetime(3)` everywhere, read as a string.
 *
 *  `mode: "string"` is deliberate. Letting the driver hand back JS `Date`
 *  objects means the API's local timezone silently participates in every
 *  serialisation, which is exactly the class of bug `formatDate` in
 *  web/lib/blog.ts pins itself to UTC to avoid. Strings in, strings out,
 *  formatting decided once at the render layer. */
const dt = (name: string) => datetime(name, { mode: "string", fsp: 3 });

/** Unsigned bigint FK/PK, the only integer identity type used in this schema. */
export const bigintId = (name: string) =>
  bigint(name, { mode: "number", unsigned: true });

export const pk = () => bigintId("id").autoincrement().primaryKey();

/** Created/updated stamps. MySQL maintains both; the app never sets them.
 *
 *  `updatedAt` folds `ON UPDATE` into the default expression rather than using
 *  Drizzle's `$onUpdate`, which is a client-side hook — it only fires on writes
 *  that go through Drizzle. The retry cron and any future raw UPDATE would
 *  silently leave the stamp stale. Expressed this way MySQL maintains it, so
 *  it is true regardless of who does the writing. */
export const timestamps = {
  createdAt: dt("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  updatedAt: dt("updated_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
};

/**
 * Soft-delete columns.
 *
 * `isDeleted` is redundant against `deletedAt IS NOT NULL`, and that redundancy
 * is on purpose: it is a narrow, indexable tinyint that every query filters on,
 * and it is what the `slugActive` generated column can key off. Keep them in
 * lockstep — only ever written together, by the repository layer.
 */
export const softDelete = {
  isDeleted: tinyint("is_deleted").notNull().default(0),
  deletedAt: dt("deleted_at"),
};

/**
 * Who touched the row. Nullable because seeds and system jobs have no user.
 *
 * Not declared as foreign keys: `users` itself spreads this block, and a
 * self-referencing FK on a table that also carries `companyId` makes the
 * migration ordering circular for no integrity benefit that the service layer
 * doesn't already provide.
 */
export const actors = {
  createdBy: bigintId("created_by"),
  updatedBy: bigintId("updated_by"),
  deletedBy: bigintId("deleted_by"),
};

/**
 * The full contract: tenancy + timestamps + soft delete + actors.
 *
 * `companyId` is intentionally NOT declared with a `.references()` callback
 * here — the reference is added per-table so Drizzle can order migrations, and
 * because `companies` cannot reference itself.
 */
export const base = {
  companyId: bigintId("company_id").notNull(),
  ...timestamps,
  ...softDelete,
  ...actors,
};

/**
 * Append-only tables (page_views, events, refresh_tokens, audit_log) take this
 * instead of `base`.
 *
 * They are never soft-deleted. Soft-deleting an analytics row would silently
 * poison every aggregate built on top of it, and these are the tables that grow
 * without bound — they need real DELETEs from the retention job, not a flag
 * that keeps the rows forever.
 */
export const appendOnly = {
  companyId: bigintId("company_id").notNull(),
  createdAt: dt("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
};

/* ─────────────────────── the soft-delete/unique problem ─────────────────────── */

/**
 * A slug column plus the generated companion that makes uniqueness work.
 *
 * The obvious approaches both fail:
 *
 *   UNIQUE (company_id, slug)
 *     A soft-deleted row keeps its slug forever, so recreating a service you
 *     deleted last week is rejected. The row you're colliding with is invisible
 *     in every UI, which makes this maddening to diagnose.
 *
 *   UNIQUE (company_id, slug, deleted_at)
 *     Looks like the fix, isn't. MySQL treats NULLs as distinct in a unique
 *     index, so two *live* rows (both `deleted_at IS NULL`) with the same slug
 *     are both accepted. This is strictly worse than doing nothing: it silently
 *     permits duplicates on exactly the rows that matter.
 *
 * The working version is a stored generated column that is the slug while the
 * row is live and NULL once it isn't. Live rows collide; deleted rows are all
 * NULL and therefore all distinct, so any number of them can share a slug.
 *
 *   slug_active = IF(is_deleted = 0, slug, NULL)
 *   UNIQUE (company_id, slug_active)
 *
 * Same trick applies to any "unique while live" column — see `activeCopyOf`,
 * used for user and mail-recipient email addresses.
 */
export const slugColumns = {
  slug: varchar("slug", { length: 160 }).notNull(),
  slugActive: varchar("slug_active", { length: 160 }).generatedAlwaysAs(
    sql`(if(\`is_deleted\` = 0, \`slug\`, null))`,
    { mode: "stored" }
  ),
};

/**
 * The same live-only-uniqueness trick for a column that isn't called `slug`.
 * Pair the result with a unique index on (company_id, <name>_active).
 */
export const activeCopyOf = (column: string, length: number) =>
  varchar(`${column}_active`, { length }).generatedAlwaysAs(
    sql`(if(\`is_deleted\` = 0, \`${sql.raw(column)}\`, null))`,
    { mode: "stored" }
  );

/* ───────────────────────────── shared enums ───────────────────────────── */

/** Draft/published state carried by every editable content table. */
export const publishing = {
  status: varchar("status", { length: 16 })
    .notNull()
    .default("draft")
    .$type<"draft" | "published">(),
  publishedAt: dt("published_at"),
  /** Manual ordering, set by drag-and-drop in the dashboard. */
  sortOrder: bigint("sort_order", { mode: "number" }).notNull().default(0),
};

/** Convenience for declaring an FK to a table without repeating the mode. */
export const fk = (name: string, ref: () => AnyMySqlColumn) =>
  bigintId(name).references(ref);
