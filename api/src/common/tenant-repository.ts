/**
 * The only sanctioned way to read or write a tenant-scoped table.
 *
 * Why this exists rather than "remember to add the filter":
 *
 * Drizzle has no global scope hook — nothing that can force every query
 * through a predicate the way an ORM with model-level scopes would. So a
 * forgotten `eq(t.companyId, …)` is a plain, silent bug. And it is the worst
 * kind of silent: with one tenant in the database it behaves perfectly, passes
 * review, passes QA, and only starts returning another business's rows on the
 * day a second client is onboarded — by which point the code is months old and
 * nobody is looking at it.
 *
 * The same argument applies to `isDeleted`. A missed filter there means deleted
 * services quietly reappear on the public site.
 *
 * So: modules never import a table and query it directly. They extend this
 * class, which owns the predicate. `.eslintrc` enforces the import ban; this
 * file is the single place the rule is allowed to be broken.
 */

import { ConflictException, NotFoundException } from "@nestjs/common";
import { and, eq, type SQL } from "drizzle-orm";
import type { AnyMySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";

import type { Db } from "@/db/client";
import type { TenantContext } from "./tenant-context";

/** Loosened view of the table's columns.
 *
 *  Drizzle's column generics don't survive this abstraction — the whole point
 *  is to operate on any table that spreads `base`, which TypeScript can't
 *  express against Drizzle's builder types without naming every column. The
 *  cast is confined to `this.c` so it happens once here rather than at each
 *  call site, and the columns it names (`companyId`, `isDeleted`, `id`) are
 *  guaranteed by `base`. */
type Cols = Record<string, AnyMySqlColumn>;

export abstract class TenantRepository<T extends MySqlTable> {
  protected constructor(
    protected readonly db: Db,
    protected readonly table: T
  ) {}

  /**
   * Look up one of the base columns by name.
   *
   * Throws rather than returning undefined if the column is missing, which
   * only happens if a table was declared without spreading `base`. That is a
   * programming error, and the loud version is much better than the quiet one:
   * a missing `companyId` silently dropped from the predicate is exactly the
   * unscoped query this class exists to prevent.
   */
  private col(name: "id" | "companyId" | "isDeleted"): AnyMySqlColumn {
    const column = (this.table as unknown as Cols)[name];
    if (!column) {
      throw new Error(
        `Table passed to TenantRepository has no '${name}' column — it must ` +
          `spread the shared \`base\` block from db/schema/_base.ts.`
      );
    }
    return column;
  }

  /**
   * The predicate every read starts from: this tenant, not deleted.
   *
   * `includeDeleted` exists for exactly one caller — the dashboard's "Show
   * deleted" view — and is deliberately explicit at each use so it can never
   * be the accidental default.
   */
  protected scope(extra?: SQL, includeDeleted = false): SQL {
    const parts: (SQL | undefined)[] = [
      eq(this.col("companyId"), this.ctxCompanyId()),
    ];

    if (!includeDeleted) {
      parts.push(eq(this.col("isDeleted"), 0));
    }
    if (extra) {
      parts.push(extra);
    }

    /* and() over a non-empty list always returns a SQL node. */
    return and(...parts) as SQL;
  }

  /* The context is supplied per request; subclasses wire it in their
     constructor or via a request-scoped provider. */
  protected abstract context(): TenantContext;

  private ctxCompanyId(): number {
    const id = this.context().companyId;
    if (!Number.isInteger(id) || id <= 0) {
      /* Defensive, and worth the check: a context that somehow arrived without
         a company must fail loudly, not fall back to "no filter". */
      throw new Error(
        "TenantRepository used without a resolved companyId — refusing to run " +
          "an unscoped query."
      );
    }
    return id;
  }

  /** Columns to stamp on insert. */
  protected createStamps(): Record<string, unknown> {
    const ctx = this.context();
    return {
      companyId: ctx.companyId,
      createdBy: ctx.actorUserId,
      updatedBy: ctx.actorUserId,
    };
  }

  /** Columns to stamp on update. `companyId` is never among them — a row does
      not change tenant, and allowing the column in an update payload would
      reintroduce the hole this class exists to close. */
  protected updateStamps(): Record<string, unknown> {
    return { updatedBy: this.context().actorUserId };
  }

  /**
   * Soft delete. Sets both flag and timestamp together — they are only ever
   * written as a pair, which is what lets the `slug_active` generated column
   * key off `is_deleted` alone.
   */
  protected deleteStamps(): Record<string, unknown> {
    return {
      isDeleted: 1,
      deletedAt: new Date().toISOString().slice(0, 23).replace("T", " "),
      deletedBy: this.context().actorUserId,
    };
  }

  protected restoreStamps(): Record<string, unknown> {
    return {
      isDeleted: 0,
      deletedAt: null,
      deletedBy: null,
      updatedBy: this.context().actorUserId,
    };
  }

  /** Fetch one row by id within the tenant, or 404. */
  async findByIdOrFail(id: number, includeDeleted = false): Promise<unknown> {
    const [row] = await this.db
      .select()
      .from(this.table as MySqlTable)
      .where(this.scope(eq(this.col("id"), id), includeDeleted))
      .limit(1);

    if (!row) {
      /* Deliberately the same 404 whether the row belongs to another tenant or
         doesn't exist. Distinguishing them would let a caller enumerate which
         ids are real in someone else's account. */
      throw new NotFoundException("Not found.");
    }
    return row;
  }

  /**
   * Translate MySQL's duplicate-key error into something an editor can act on.
   *
   * Worth special handling because of the soft-delete interaction: the row you
   * collide with may be invisible in every list, so "Duplicate entry" alone
   * sends people hunting for something they cannot see.
   */
  protected rethrowDuplicate(error: unknown, field = "slug"): never {
    const code = (error as { code?: string } | null)?.code;
    if (code === "ER_DUP_ENTRY") {
      throw new ConflictException(
        `That ${field} is already in use by another live item.`
      );
    }
    throw error as Error;
  }
}
