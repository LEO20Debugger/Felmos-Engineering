/**
 * Business details and inspection-mail routing — the database replacement for
 * web/lib/site.ts.
 */

import { relations, sql } from "drizzle-orm";
import {
  decimal,
  index,
  json,
  mysqlTable,
  smallint,
  text,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import {
  activeCopyOf,
  actors,
  bigintId,
  pk,
  softDelete,
  timestamps,
} from "./_base";
import { companies } from "./tenancy";

/**
 * Exactly one row per company.
 *
 * Typed columns rather than a key/value bag: this data is read on every page
 * render, feeds JSON-LD and the sitemap, and benefits from Drizzle handing back
 * a real type. A KV table would turn every field access into a lookup that can
 * silently return undefined.
 */
export const siteSettings = mysqlTable(
  "site_settings",
  {
    id: pk(),
    companyId: bigintId("company_id")
      .notNull()
      .references(() => companies.id),

    name: varchar("name", { length: 200 }).notNull(),
    shortName: varchar("short_name", { length: 80 }),
    tagline: varchar("tagline", { length: 300 }),
    /** Meta description fallback for every page that doesn't set its own.
        Kept near 160 characters — search engines truncate past roughly that. */
    description: varchar("description", { length: 400 }),
    url: varchar("url", { length: 300 }),

    phone: varchar("phone", { length: 60 }),
    phoneHref: varchar("phone_href", { length: 60 }),
    secondaryPhone: varchar("secondary_phone", { length: 60 }),
    secondaryPhoneHref: varchar("secondary_phone_href", { length: 60 }),
    email: varchar("email", { length: 255 }),
    emailHref: varchar("email_href", { length: 300 }),

    addressStreet: varchar("address_street", { length: 200 }),
    addressLocality: varchar("address_locality", { length: 120 }),
    addressRegion: varchar("address_region", { length: 120 }),
    addressPostalCode: varchar("address_postal_code", { length: 40 }),
    addressCountry: varchar("address_country", { length: 8 }),
    addressShort: varchar("address_short", { length: 200 }),
    addressFull: varchar("address_full", { length: 300 }),

    /** decimal, not float — coordinates go into JSON-LD and a map URL, where
        binary rounding artefacts show up as a visibly wrong pin. */
    geoLat: decimal("geo_lat", { precision: 9, scale: 6 }),
    geoLng: decimal("geo_lng", { precision: 9, scale: 6 }),
    mapEmbed: text("map_embed"),
    mapLink: text("map_link"),

    /** Human-readable, and the schema.org openingHours form beside it. */
    hours: varchar("hours", { length: 200 }),
    hoursStructured: json("hours_structured")
      .notNull()
      .default(sql`(json_array())`)
      .$type<string[]>(),

    founded: smallint("founded", { unsigned: true }),

    socials: json("socials")
      .notNull()
      .default(sql`(json_array())`)
      .$type<{ label: string; href: string; icon: string }[]>(),

    ...timestamps,
    ...softDelete,
    ...actors,
  },
  (t) => [uniqueIndex("uq_site_settings_company").on(t.companyId)]
);

/**
 * Where an inspection request is emailed.
 *
 * A table rather than a settings column because the requirement is explicitly
 * "more than one person, with CC" — and because who gets the leads changes as
 * staff change, which should never need a deploy.
 *
 * At least one active `to` recipient is required; the mail module refuses to
 * send without one rather than quietly dropping a lead, and the settings screen
 * blocks removing the last one.
 */
export const mailRecipients = mysqlTable(
  "mail_recipients",
  {
    id: pk(),
    companyId: bigintId("company_id")
      .notNull()
      .references(() => companies.id),

    email: varchar("email", { length: 255 }).notNull(),
    emailActive: activeCopyOf("email", 255),
    name: varchar("name", { length: 160 }),

    role: varchar("role", { length: 8 })
      .notNull()
      .default("to")
      .$type<"to" | "cc" | "bcc">(),

    /** Distinct from soft delete: someone on leave should stop receiving mail
        without losing their place in the list. */
    active: tinyint("active").notNull().default(1),
    sortOrder: smallint("sort_order").notNull().default(0),

    ...timestamps,
    ...softDelete,
    ...actors,
  },
  (t) => [
    uniqueIndex("uq_mail_recipients_email_active").on(t.companyId, t.emailActive),
    index("ix_mail_recipients_send").on(t.companyId, t.isDeleted, t.active, t.role),
  ]
);

export const siteSettingsRelations = relations(siteSettings, ({ one }) => ({
  company: one(companies, {
    fields: [siteSettings.companyId],
    references: [companies.id],
  }),
}));

export const mailRecipientsRelations = relations(mailRecipients, ({ one }) => ({
  company: one(companies, {
    fields: [mailRecipients.companyId],
    references: [companies.id],
  }),
}));
