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
 * So: modules never import a table and query it directly. They go through this
 * class, which owns the predicate.
 *
 * The TenantContext is passed per call rather than injected. Injecting it would
 * mean making every repository REQUEST-scoped, which forces Nest to rebuild the
 * entire dependency subtree on each request — and worse, silently promotes any
 * service that injects one, so a single request-scoped repository can turn the
 * whole graph request-scoped without anyone noticing. An explicit argument is
 * cheaper and makes the scoping visible at every call site.
 */

import { ConflictException, NotFoundException } from "@nestjs/common";
import { and, eq, sql, type SQL } from "drizzle-orm";
import type { AnyMySqlColumn, MySqlTable } from "drizzle-orm/mysql-core";

import type { Db } from "@/db/client";
import type { TenantContext } from "./tenant-context";

/** Loosened view of the table's columns.
 *
 *  Drizzle's column generics don't survive this abstraction — the whole point
 *  is to operate on any table that spreads `base`, which TypeScript can't
 *  express against Drizzle's builder types without naming every column. The
 *  cast is confined to `col()` so it happens once here rather than at each
 *  call site, and the columns it names are guaranteed by `base`. */
type Cols = Record<string, AnyMySqlColumn>;

type BaseColumn = "id" | "companyId" | "isDeleted" | "slug" | "sortOrder";

/** The four things a dashboard's multi-select bar can do to a set of rows. */
export type BulkAction = "publish" | "draft" | "delete" | "restore";

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
  protected col(name: BaseColumn): AnyMySqlColumn {
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
  protected scope(
    ctx: TenantContext,
    extra?: SQL,
    includeDeleted = false
  ): SQL {
    const companyId = ctx.companyId;
    if (!Number.isInteger(companyId) || companyId <= 0) {
      /* Defensive, and worth the check: a context that somehow arrived without
         a company must fail loudly, not fall back to "no filter". */
      throw new Error(
        "TenantRepository used without a resolved companyId — refusing to run " +
          "an unscoped query."
      );
    }

    const parts: (SQL | undefined)[] = [eq(this.col("companyId"), companyId)];
    if (!includeDeleted) parts.push(eq(this.col("isDeleted"), 0));
    if (extra) parts.push(extra);

    return and(...parts) as SQL;
  }

  /** Columns to stamp on insert. */
  protected createStamps(ctx: TenantContext): Record<string, unknown> {
    return {
      companyId: ctx.companyId,
      createdBy: ctx.actorUserId,
      updatedBy: ctx.actorUserId,
    };
  }

  /** Columns to stamp on update. `companyId` is never among them — a row does
      not change tenant, and allowing the column in an update payload would
      reintroduce the hole this class exists to close. */
  protected updateStamps(ctx: TenantContext): Record<string, unknown> {
    return { updatedBy: ctx.actorUserId };
  }

  /**
   * Soft delete. Sets flag and timestamp together — they are only ever written
   * as a pair, which is what lets the `slug_active` generated column key off
   * `is_deleted` alone.
   */
  protected deleteStamps(ctx: TenantContext): Record<string, unknown> {
    return {
      isDeleted: 1,
      deletedAt: sql`CURRENT_TIMESTAMP(3)`,
      deletedBy: ctx.actorUserId,
    };
  }

  protected restoreStamps(ctx: TenantContext): Record<string, unknown> {
    return {
      isDeleted: 0,
      deletedAt: null,
      deletedBy: null,
      updatedBy: ctx.actorUserId,
    };
  }

  /** Fetch one row by id within the tenant, or 404. */
  protected async requireRow<R = Record<string, unknown>>(
    ctx: TenantContext,
    id: number,
    includeDeleted = false
  ): Promise<R> {
    const [row] = await this.db
      .select()
      .from(this.table as MySqlTable)
      .where(this.scope(ctx, eq(this.col("id"), id), includeDeleted))
      .limit(1);

    if (!row) {
      /* Deliberately the same 404 whether the row belongs to another tenant or
         doesn't exist. Distinguishing them would let a caller enumerate which
         ids are real in someone else's account. */
      throw new NotFoundException("Not found.");
    }
    return row as R;
  }

  /** Soft-delete by id. Returns nothing; 404s if it isn't this tenant's. */
  async softDelete(ctx: TenantContext, id: number): Promise<void> {
    await this.requireRow(ctx, id);
    await this.db
      .update(this.table as MySqlTable)
      .set(this.deleteStamps(ctx) as never)
      .where(this.scope(ctx, eq(this.col("id"), id)));
  }

  /** Undo a soft delete — the "Undo" affordance behind every delete action. */
  async restore(ctx: TenantContext, id: number): Promise<void> {
    await this.requireRow(ctx, id, true);
    try {
      await this.db
        .update(this.table as MySqlTable)
        .set(this.restoreStamps(ctx) as never)
        .where(this.scope(ctx, eq(this.col("id"), id), true));
    } catch (error) {
      /* Restoring can collide: the slug may have been reused since. That is a
         genuine conflict the user has to resolve, not an internal error. */
      this.rethrowDuplicate(error, "slug");
    }
  }

  /**
   * Apply one action to many rows.
   *
   * A loop rather than a single UPDATE ... WHERE id IN (…) because publishing
   * is not a plain column write: each entity's own `update()` stamps
   * publishedAt the first time a row goes live and never again, and soft delete
   * and restore each have their own stamps and their own slug-collision failure
   * mode. Seventeen round trips inside one request is a fair price for not
   * reimplementing any of that — which is also why the publish/draft step is
   * handed back to the caller rather than written here.
   *
   * Ids that are not this tenant's are skipped rather than fatal. The caller is
   * a checkbox list that may have been rendered before someone else deleted a
   * row, and failing the whole batch over one stale id would be worse than
   * quietly applying the rest — the returned count is what the dashboard
   * reports back.
   */
  protected async bulkApply(
    ctx: TenantContext,
    ids: number[],
    action: BulkAction,
    setStatus: (id: number, status: "draft" | "published") => Promise<void>
  ): Promise<number> {
    let affected = 0;

    for (const id of ids) {
      try {
        if (action === "delete") await this.softDelete(ctx, id);
        else if (action === "restore") await this.restore(ctx, id);
        else await setStatus(id, action === "publish" ? "published" : "draft");
        affected += 1;
      } catch (error) {
        /* A 404 means the row moved out from under the list. Anything else —
           a slug collision on restore, say — is a real failure the editor
           needs to see. */
        if ((error as { status?: number })?.status === 404) continue;
        throw error;
      }
    }

    return affected;
  }

  /**
   * Apply a manual ordering as one statement per row inside a transaction.
   *
   * Takes the complete ordered list of ids rather than a pair to swap, so
   * concurrent reorders can't interleave into a half-applied order.
   */
  async reorder(ctx: TenantContext, orderedIds: number[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const [index, id] of orderedIds.entries()) {
        await tx
          .update(this.table as MySqlTable)
          .set({ sortOrder: index, ...this.updateStamps(ctx) } as never)
          .where(this.scope(ctx, eq(this.col("id"), id)));
      }
    });
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
