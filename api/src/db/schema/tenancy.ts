/**
 * The tenant root, and how a request proves which tenant it belongs to.
 */

import { relations, sql } from "drizzle-orm";
import {
  index,
  json,
  mysqlTable,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import {
  activeCopyOf,
  actors,
  bigintId,
  pk,
  slugColumns,
  softDelete,
  timestamps,
} from "./_base";

/**
 * A business. Felmos is seeded as id 1.
 *
 * This is the one table with no `companyId` of its own — it is the thing being
 * scoped to.
 *
 * `webUrl` and `revalidateSecretHash` live here rather than in environment
 * variables on purpose. They are per-tenant facts, and holding them as env
 * vars would mean a second business could not be onboarded without an API
 * redeploy — and worse, would make it easy to fire one company's revalidation
 * webhook at another company's site.
 */
export const companies = mysqlTable(
  "companies",
  {
    id: pk(),
    ...slugColumns,
    name: varchar("name", { length: 200 }).notNull(),
    legalName: varchar("legal_name", { length: 240 }),

    status: varchar("status", { length: 16 })
      .notNull()
      .default("active")
      .$type<"active" | "suspended">(),

    /** Where this tenant's public site lives, and the shared secret its
        /api/revalidate route checks. Hashed: the API only ever needs to send
        it, but a leaked database dump shouldn't hand over the ability to
        force-revalidate someone's site. Stored alongside a hash so rotation
        doesn't require a deploy. */
    webUrl: varchar("web_url", { length: 300 }),
    revalidateSecret: varchar("revalidate_secret", { length: 200 }),

    /** Origins permitted to post analytics beacons for this company. The
        beacon endpoint carries no secret, so this is the only thing standing
        between it and anyone with the public company key. */
    allowedOrigins: json("allowed_origins")
      .notNull()
      .default(sql`(json_array())`)
      .$type<string[]>(),

    /** Verified Resend sender for this tenant's transactional mail. */
    mailFrom: varchar("mail_from", { length: 240 }),

    ...timestamps,
    ...softDelete,
    ...actors,
  },
  (t) => [uniqueIndex("uq_companies_slug_active").on(t.slugActive)]
);

/**
 * Long-lived keys that map an inbound request to a company.
 *
 * Two scopes, and the difference matters:
 *
 *   internal — held by a trusted server (the Next.js site's server-side
 *              fetchers). Grants read of that company's published content and
 *              the right to file a lead. Never shipped to a browser.
 *
 *   public   — embedded in browser JavaScript for the analytics beacon. Assume
 *              it is public knowledge, because it is. It identifies a tenant;
 *              it authorises nothing beyond "record a pageview", and is
 *              additionally gated on `companies.allowedOrigins`.
 *
 * Only the hash is stored. The plaintext is shown once, at creation.
 */
export const apiKeys = mysqlTable(
  "api_keys",
  {
    id: pk(),
    companyId: bigintId("company_id")
      .notNull()
      .references(() => companies.id),

    label: varchar("label", { length: 120 }).notNull(),
    scope: varchar("scope", { length: 16 })
      .notNull()
      .$type<"internal" | "public">(),

    /** sha256 of the plaintext key. Not argon2: this is verified on every
        public request and must stay cheap, and unlike a password the input is
        high-entropy and machine-generated, so there is nothing to brute force. */
    keyHash: varchar("key_hash", { length: 64 }).notNull(),
    keyHashActive: activeCopyOf("key_hash", 64),

    /** Shown in the dashboard so a stale key is obvious before it's revoked. */
    lastUsedAt: varchar("last_used_at", { length: 32 }),

    ...timestamps,
    ...softDelete,
    ...actors,
  },
  (t) => [
    uniqueIndex("uq_api_keys_hash_active").on(t.keyHashActive),
    index("ix_api_keys_company").on(t.companyId, t.isDeleted, t.scope),
  ]
);

export const companiesRelations = relations(companies, ({ many }) => ({
  apiKeys: many(apiKeys),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  company: one(companies, {
    fields: [apiKeys.companyId],
    references: [companies.id],
  }),
}));
