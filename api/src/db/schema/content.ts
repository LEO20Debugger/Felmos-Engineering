/**
 * The editable content tables — the direct replacements for web/lib/content.ts
 * and web/lib/blog.ts.
 *
 * Field names deliberately mirror the existing TypeScript types so the seed is
 * a straight copy and the public API can return shapes the site already knows
 * how to render.
 */

import { relations, sql } from "drizzle-orm";
import {
  index,
  json,
  mysqlTable,
  primaryKey,
  smallint,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import {
  actors,
  bigintId,
  pk,
  publishing,
  slugColumns,
  softDelete,
  timestamps,
} from "./_base";
import { media } from "./media";
import { companies } from "./tenancy";

/** Everything an editable content row carries before its own fields. */
const contentBase = {
  companyId: bigintId("company_id")
    .notNull()
    .references(() => companies.id),
  ...slugColumns,
  ...publishing,
  ...timestamps,
  ...softDelete,
  ...actors,
};

/* ──────────────────────────────── services ──────────────────────────────── */

export const services = mysqlTable(
  "services",
  {
    id: pk(),
    ...contentBase,

    /** Display number ("01"). Editorial, not derived from sortOrder — the
        current site's numbering is part of the copy. */
    num: varchar("num", { length: 8 }).notNull().default(""),
    title: varchar("title", { length: 200 }).notNull(),
    /** One or two words, for places the full title won't fit (the vertical
        spine of a collapsed service panel). */
    label: varchar("label", { length: 80 }).notNull().default(""),
    short: varchar("short", { length: 400 }).notNull().default(""),
    lead: text("lead"),

    /** A lucide-react export name, e.g. "ShieldCheck" — not a component.
        Validated against the allowlist in common/icon-allowlist.ts on write,
        and resolved back to a component by web/lib/icons.ts on render. It has
        to be a string: a React component cannot cross the server/client
        boundary as a prop, and several of the components that consume this are
        client components. */
    icon: varchar("icon", { length: 48 }).notNull().default("Wrench"),

    imageId: bigintId("image_id").references(() => media.id),

    /** Ordered, short, never queried across rows, always edited as a whole
        list — a child table would buy nothing and cost an ordering column.
        Shape is enforced by zod on write. */
    benefits: json("benefits")
      .notNull()
      .default(sql`(json_array())`)
      .$type<string[]>(),
    clients: json("clients")
      .notNull()
      .default(sql`(json_array())`)
      .$type<string[]>(),
  },
  (t) => [
    uniqueIndex("uq_services_slug_active").on(t.companyId, t.slugActive),
    index("ix_services_listing").on(t.companyId, t.isDeleted, t.status, t.sortOrder),
  ]
);

/* ──────────────────────────────── projects ──────────────────────────────── */

export const projects = mysqlTable(
  "projects",
  {
    id: pk(),
    ...contentBase,

    num: varchar("num", { length: 8 }).notNull().default(""),
    title: varchar("title", { length: 200 }).notNull(),
    category: varchar("category", { length: 80 }),
    location: varchar("location", { length: 160 }),
    year: smallint("year", { unsigned: true }),
    client: varchar("client", { length: 160 }),
    duration: varchar("duration", { length: 80 }),

    scope: text("scope"),
    narrative: text("narrative"),
    result: text("result"),

    /** The headline figure on a case-study card. Flattened from the nested
        `metric: { value, label }` object — two scalar columns are easier to
        validate, sort and edit than a JSON blob with two keys. `value` is a
        string because the current data holds things like "40%" and "3 weeks". */
    metricValue: varchar("metric_value", { length: 40 }),
    metricLabel: varchar("metric_label", { length: 120 }),

    imageId: bigintId("image_id").references(() => media.id),
  },
  (t) => [
    uniqueIndex("uq_projects_slug_active").on(t.companyId, t.slugActive),
    index("ix_projects_listing").on(t.companyId, t.isDeleted, t.status, t.sortOrder),
  ]
);

/**
 * Which services a project exercised — replaces `services: string[]` of slugs.
 *
 * Carries `companyId` so a row can never join a project in one tenant to a
 * service in another, even if an id is guessed or a bug leaks one.
 *
 * Note what is NOT here: `ON DELETE RESTRICT` on `serviceId`. It would be
 * pointless — soft deletes are UPDATEs, so no FK action ever fires. Referential
 * integrity for this relationship lives in the service layer instead
 * (ContentIntegrityService), which is also the only thing that can catch a
 * project still pointing at a soft-deleted service.
 */
export const projectServices = mysqlTable(
  "project_services",
  {
    companyId: bigintId("company_id")
      .notNull()
      .references(() => companies.id),
    projectId: bigintId("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    serviceId: bigintId("service_id")
      .notNull()
      .references(() => services.id),
    sortOrder: smallint("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.serviceId] }),
    index("ix_project_services_service").on(t.companyId, t.serviceId),
  ]
);

/**
 * The supporting photographs behind a project — everything except the hero.
 *
 * `projects.imageId` stays the single hero image: it is what the index cards,
 * the homepage teaser and the open-graph tag all read, and none of them want a
 * list. This table is the gallery on the project's own page, which is where the
 * site actually has room for five photographs of one building.
 *
 * Carries `companyId` for the same reason `project_services` does — a row can
 * never join a project in one tenant to an image in another, even if an id is
 * guessed or a bug leaks one.
 */
export const projectMedia = mysqlTable(
  "project_media",
  {
    companyId: bigintId("company_id")
      .notNull()
      .references(() => companies.id),
    projectId: bigintId("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    mediaId: bigintId("media_id")
      .notNull()
      .references(() => media.id),
    sortOrder: smallint("sort_order").notNull().default(0),
    /** Optional per-photograph caption. `media.alt` describes the picture for
        someone who cannot see it; this says something about it to someone who
        can, and most galleries want neither the same text nor any text. */
    caption: varchar("caption", { length: 200 }),
  },
  (t) => [
    primaryKey({ columns: [t.projectId, t.mediaId] }),
    index("ix_project_media_media").on(t.companyId, t.mediaId),
  ]
);

/* ───────────────────────────────── team ───────────────────────────────── */

export const team = mysqlTable(
  "team",
  {
    id: pk(),
    ...contentBase,

    name: varchar("name", { length: 160 }).notNull(),
    role: varchar("role", { length: 160 }),
    /** Short qualifier shown under the role on the team grid. */
    tag: varchar("tag", { length: 80 }),
    bio: text("bio"),
    imageId: bigintId("image_id").references(() => media.id),
  },
  (t) => [
    uniqueIndex("uq_team_slug_active").on(t.companyId, t.slugActive),
    index("ix_team_listing").on(t.companyId, t.isDeleted, t.status, t.sortOrder),
  ]
);

/* ─────────────────────────────── insights ─────────────────────────────── */

/** The post body's block model, unchanged from web/lib/blog.ts. */
export type PostBlock =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "quote"; text: string; attribution?: string }
  | { kind: "list"; items: string[] };

export const posts = mysqlTable(
  "posts",
  {
    id: pk(),
    ...contentBase,

    title: varchar("title", { length: 220 }).notNull(),
    excerpt: varchar("excerpt", { length: 600 }),

    /** The editorial date shown on the article — distinct from `publishedAt`,
        which is when it actually went live. Backdating a post is normal;
        lying about when the row was published is not. */
    date: varchar("date", { length: 10 }).notNull(),

    /** Author as an FK, with the rendered name denormalised alongside it. The
        current code enforces authorship through a `TeamName` string-union type,
        which can't survive the move to a database. The denormalised copy means
        removing someone from the team page doesn't blank the byline on three
        years of articles. */
    authorTeamId: bigintId("author_team_id").references(() => team.id),
    authorName: varchar("author_name", { length: 120 }).notNull().default(""),

    category: varchar("category", { length: 80 }),
    imageId: bigintId("image_id").references(() => media.id),

    /** Block[] as a JSON document.
        Blocks are never queried individually, ordering is intrinsic to the
        array, and every edit rewrites the whole body — a child table would add
        an ordering column, N+1 reads and transactional reordering for no gain.
        Validated on write by a zod discriminated union mirroring PostBlock. */
    body: json("body")
      .notNull()
      .default(sql`(json_array())`)
      .$type<PostBlock[]>(),

    /** Computed from `body` on save rather than per request — it is a pure
        function of content that changes only when the content does. */
    readMinutes: smallint("read_minutes", { unsigned: true }),
  },
  (t) => [
    uniqueIndex("uq_posts_slug_active").on(t.companyId, t.slugActive),
    index("ix_posts_listing").on(t.companyId, t.isDeleted, t.status, t.date),
  ]
);

/* ───────────────────────────── testimonials ───────────────────────────── */

export const testimonials = mysqlTable(
  "testimonials",
  {
    id: pk(),
    ...contentBase,

    quote: text("quote").notNull(),
    author: varchar("author", { length: 160 }).notNull(),
    role: varchar("role", { length: 160 }),
    company: varchar("company", { length: 160 }),
    projectId: bigintId("project_id").references(() => projects.id),
    rating: smallint("rating", { unsigned: true }),
  },
  (t) => [
    uniqueIndex("uq_testimonials_slug_active").on(t.companyId, t.slugActive),
    index("ix_testimonials_listing").on(
      t.companyId,
      t.isDeleted,
      t.status,
      t.sortOrder
    ),
  ]
);

/* ──────────────────────────────── relations ──────────────────────────────── */

export const servicesRelations = relations(services, ({ one, many }) => ({
  image: one(media, { fields: [services.imageId], references: [media.id] }),
  projects: many(projectServices),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  image: one(media, { fields: [projects.imageId], references: [media.id] }),
  services: many(projectServices),
  gallery: many(projectMedia),
}));

export const projectMediaRelations = relations(projectMedia, ({ one }) => ({
  project: one(projects, {
    fields: [projectMedia.projectId],
    references: [projects.id],
  }),
  media: one(media, {
    fields: [projectMedia.mediaId],
    references: [media.id],
  }),
}));

export const projectServicesRelations = relations(projectServices, ({ one }) => ({
  project: one(projects, {
    fields: [projectServices.projectId],
    references: [projects.id],
  }),
  service: one(services, {
    fields: [projectServices.serviceId],
    references: [services.id],
  }),
}));

export const teamRelations = relations(team, ({ one }) => ({
  image: one(media, { fields: [team.imageId], references: [media.id] }),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  image: one(media, { fields: [posts.imageId], references: [media.id] }),
  author: one(team, { fields: [posts.authorTeamId], references: [team.id] }),
}));

export const testimonialsRelations = relations(testimonials, ({ one }) => ({
  project: one(projects, {
    fields: [testimonials.projectId],
    references: [projects.id],
  }),
}));
