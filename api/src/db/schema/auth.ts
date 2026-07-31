/**
 * Dashboard accounts, sessions and the change trail.
 *
 * There is no public signup. The first owner is created by a CLI script against
 * the deployed database; everyone else arrives by invitation from an owner.
 */

import { relations } from "drizzle-orm";
import {
  index,
  json,
  mysqlTable,
  tinyint,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

import {
  activeCopyOf,
  actors,
  appendOnly,
  bigintId,
  pk,
  softDelete,
  timestamps,
} from "./_base";
import { companies } from "./tenancy";

export const users = mysqlTable(
  "users",
  {
    id: pk(),
    companyId: bigintId("company_id")
      .notNull()
      .references(() => companies.id),

    email: varchar("email", { length: 255 }).notNull(),
    /** Unique among live rows only — a disabled-then-deleted account must not
        block the same person being re-added later. See _base.slugColumns for
        why the obvious unique index doesn't work under soft delete. */
    emailActive: activeCopyOf("email", 255),

    name: varchar("name", { length: 160 }).notNull(),

    /** argon2id, via @node-rs/argon2. Null while an invite is outstanding —
        the password is set by the invitee, never chosen for them. */
    passwordHash: varchar("password_hash", { length: 255 }),

    /** owner — everything, including settings, users and mail recipients.
        editor — content only. */
    role: varchar("role", { length: 16 })
      .notNull()
      .default("editor")
      .$type<"owner" | "editor">(),

    status: varchar("status", { length: 16 })
      .notNull()
      .default("invited")
      .$type<"active" | "disabled" | "invited">(),

    invitedBy: bigintId("invited_by"),
    /** Only the hash — an invite link is a credential until it's used. */
    inviteTokenHash: varchar("invite_token_hash", { length: 64 }),
    inviteExpiresAt: varchar("invite_expires_at", { length: 32 }),

    lastLoginAt: varchar("last_login_at", { length: 32 }),

    ...timestamps,
    ...softDelete,
    ...actors,
  },
  (t) => [
    /* Scoped per company, not globally. The same person can hold accounts at
       two businesses; login resolves the company from the email, and only
       prompts for a choice in the rare case one address matches more than one
       live account. */
    uniqueIndex("uq_users_email_active").on(t.companyId, t.emailActive),
    index("ix_users_lookup").on(t.emailActive),
  ]
);

/**
 * Refresh tokens, rotated on every use.
 *
 * `familyId` plus `replacedBy` is what turns rotation into theft detection: if
 * a token that has already been rotated away is presented again, either it was
 * stolen or it was replayed, and in both cases the honest answer is to revoke
 * the entire family and force a fresh login.
 *
 * Append-only — a revoked token must stay on the record to be recognised on
 * replay, which is precisely what soft-deleting it would break.
 */
export const refreshTokens = mysqlTable(
  "refresh_tokens",
  {
    id: pk(),
    ...appendOnly,
    userId: bigintId("user_id")
      .notNull()
      .references(() => users.id),

    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    familyId: varchar("family_id", { length: 36 }).notNull(),

    expiresAt: varchar("expires_at", { length: 32 }).notNull(),
    revokedAt: varchar("revoked_at", { length: 32 }),
    replacedBy: bigintId("replaced_by"),

    userAgent: varchar("user_agent", { length: 400 }),
    /** Hashed, never the raw address. */
    ipHash: varchar("ip_hash", { length: 64 }),
  },
  (t) => [
    uniqueIndex("uq_refresh_token_hash").on(t.tokenHash),
    index("ix_refresh_family").on(t.familyId),
    index("ix_refresh_user").on(t.userId, t.expiresAt),
  ]
);

/**
 * Who changed what.
 *
 * Append-only and never soft-deleted — an audit trail that can be edited or
 * hidden from within the application it audits is not an audit trail.
 * Soft deletes and restores are recorded here as ordinary actions.
 */
export const auditLog = mysqlTable(
  "audit_log",
  {
    id: pk(),
    ...appendOnly,
    userId: bigintId("user_id"),

    /** create | update | delete | restore | login | invite | publish | … */
    action: varchar("action", { length: 40 }).notNull(),
    entity: varchar("entity", { length: 40 }).notNull(),
    entityId: bigintId("entity_id"),

    /** Changed fields only, not whole rows — a full before/after on every post
        save would store the article body twice per edit. */
    before: json("before").$type<Record<string, unknown>>(),
    after: json("after").$type<Record<string, unknown>>(),

    ipHash: varchar("ip_hash", { length: 64 }),
    /** Set when the change came from a script rather than a person. */
    isSystem: tinyint("is_system").notNull().default(0),
  },
  (t) => [
    index("ix_audit_entity").on(t.companyId, t.entity, t.entityId, t.createdAt),
    index("ix_audit_recent").on(t.companyId, t.createdAt),
  ]
);

export const usersRelations = relations(users, ({ one, many }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
  refreshTokens: many(refreshTokens),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));
