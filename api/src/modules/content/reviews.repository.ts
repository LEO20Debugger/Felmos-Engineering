/**
 * Reviews — client feedback, star-rated, shown on the site once approved.
 *
 * Stored in the `testimonials` table: the columns were already right, and a
 * rename would have cost a data migration to buy nothing. Everything from here
 * outwards says "review", which is what the dashboard and the site call it.
 *
 * The shape follows team.repository.ts. Three things are its own:
 *
 *   - Moderation. A visitor's submission is a `draft` with `source = 'visitor'`,
 *     so approving one is the same publish every other content table already
 *     has, and `bulkApply` needed no special case.
 *   - The aggregate. `ratingSummary` is what the star badge on the homepage
 *     reads, computed here so no caller is tempted to average a page of rows
 *     and call it the site's rating.
 *   - Slugs. A visitor cannot be asked for one, so `createFromVisitor` derives
 *     it — see `slugFor`.
 */

import { Inject, Injectable } from "@nestjs/common";
import { and, asc, avg, count, desc, eq, isNotNull, sql } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { testimonials } from "@/db/schema";
import { TenantRepository, type BulkAction } from "@/common/tenant-repository";
import type { TenantContext } from "@/common/tenant-context";

/** The full row, for the dashboard. */
export type ReviewRow = {
  id: number;
  slug: string;
  quote: string;
  author: string;
  role: string | null;
  company: string | null;
  rating: number | null;
  projectId: number | null;
  source: "staff" | "visitor";
  submitterEmail: string | null;
  submittedIp: string | null;
  submittedUserAgent: string | null;
  status: "draft" | "published";
  publishedAt: string | null;
  sortOrder: number;
  isDeleted: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * What the public site is allowed to see.
 *
 * A separate type rather than a `delete row.submitterEmail` on the way out:
 * omitting a field by construction is the version that stays correct when
 * somebody adds a column later. `name` rather than `author` because that is
 * what the site's component has always read.
 */
export type PublicReviewRow = {
  id: number;
  quote: string;
  name: string;
  role: string | null;
  company: string | null;
  rating: number | null;
  projectId: number | null;
  publishedAt: string | null;
};

export type RatingSummary = { average: number; count: number };

export type ReviewInput = {
  slug: string;
  quote: string;
  author: string;
  role?: string | null;
  company?: string | null;
  rating?: number | null;
  projectId?: number | null;
  status?: "draft" | "published";
};

export type VisitorReviewInput = {
  quote: string;
  author: string;
  role?: string | null;
  company?: string | null;
  rating: number;
  projectId?: number | null;
  submitterEmail: string;
};

export type ReviewListOptions = {
  includeDeleted?: boolean;
  status?: "draft" | "published";
  source?: "staff" | "visitor";
};

/**
 * How many rated reviews before the aggregate is worth publishing.
 *
 * "5.0 out of 5 from 1 review" is worse than no badge at all — it reads as
 * something the business wrote about itself, which is the opposite of what a
 * rating is for.
 */
const MIN_REVIEWS_FOR_SUMMARY = 3;

@Injectable()
export class ReviewsRepository extends TenantRepository<typeof testimonials> {
  constructor(@Inject(DB) db: Db) {
    super(db, testimonials);
  }

  private selection() {
    return {
      id: testimonials.id,
      slug: testimonials.slug,
      quote: testimonials.quote,
      author: testimonials.author,
      role: testimonials.role,
      company: testimonials.company,
      rating: testimonials.rating,
      projectId: testimonials.projectId,
      source: testimonials.source,
      submitterEmail: testimonials.submitterEmail,
      submittedIp: testimonials.submittedIp,
      submittedUserAgent: testimonials.submittedUserAgent,
      status: testimonials.status,
      publishedAt: testimonials.publishedAt,
      sortOrder: testimonials.sortOrder,
      isDeleted: testimonials.isDeleted,
      createdAt: testimonials.createdAt,
      updatedAt: testimonials.updatedAt,
    };
  }

  /** Narrow a full row to the public shape. */
  private publicShape(row: ReviewRow): PublicReviewRow {
    return {
      id: row.id,
      quote: row.quote,
      name: row.author,
      role: row.role,
      company: row.company,
      rating: row.rating,
      projectId: row.projectId,
      publishedAt: row.publishedAt,
    };
  }

  /**
   * Everything, for the dashboard — drafts, submissions and (optionally)
   * deleted rows.
   *
   * Ordered newest-first rather than by `sortOrder`. This list is worked as a
   * queue: what matters is which submission arrived while you were away, not
   * the order they will eventually appear in on the homepage.
   */
  async listAll(
    ctx: TenantContext,
    options: ReviewListOptions = {}
  ): Promise<ReviewRow[]> {
    const filters = [
      options.status ? eq(testimonials.status, options.status) : undefined,
      options.source ? eq(testimonials.source, options.source) : undefined,
    ].filter(Boolean);

    const rows = await this.db
      .select(this.selection())
      .from(testimonials)
      .where(
        this.scope(
          ctx,
          filters.length > 0 ? (and(...filters) as never) : undefined,
          options.includeDeleted ?? false
        )
      )
      .orderBy(desc(testimonials.createdAt), desc(testimonials.id));

    return rows as ReviewRow[];
  }

  /**
   * Published only, for the public site.
   *
   * `sortOrder` first so staff can pin a favourite to the front, then newest
   * published. Every visitor submission lands on sortOrder 0, so without the
   * second key their relative order would be whatever MySQL felt like.
   */
  async listPublished(ctx: TenantContext): Promise<PublicReviewRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(testimonials)
      .where(this.scope(ctx, eq(testimonials.status, "published")))
      .orderBy(
        asc(testimonials.sortOrder),
        desc(testimonials.publishedAt),
        desc(testimonials.id)
      );

    return (rows as ReviewRow[]).map((r) => this.publicShape(r));
  }

  /**
   * The site-wide star rating, or null when there is not enough of it.
   *
   * Unrated rows are excluded rather than counted as zero — a staff-entered
   * quote from before ratings existed is still worth showing, but it is not a
   * one-star review.
   */
  async ratingSummary(ctx: TenantContext): Promise<RatingSummary | null> {
    const [row] = await this.db
      .select({ average: avg(testimonials.rating), n: count() })
      .from(testimonials)
      .where(
        this.scope(
          ctx,
          and(
            eq(testimonials.status, "published"),
            isNotNull(testimonials.rating)
          ) as never
        )
      );

    const n = Number(row?.n ?? 0);
    if (n < MIN_REVIEWS_FOR_SUMMARY) return null;

    /* MySQL's AVG comes back as a decimal string. One place rounds it, here,
       so the badge and the section can never disagree by a decimal. */
    return { average: Math.round(Number(row?.average ?? 0) * 10) / 10, count: n };
  }

  /** How many submissions are waiting on a decision — the dashboard's badge. */
  async pendingCount(ctx: TenantContext): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(testimonials)
      .where(
        this.scope(
          ctx,
          and(
            eq(testimonials.source, "visitor"),
            eq(testimonials.status, "draft")
          ) as never
        )
      );

    return Number(row?.n ?? 0);
  }

  /** Published reviews attached to one project, for its dossier page. */
  async listForProject(
    ctx: TenantContext,
    projectId: number
  ): Promise<PublicReviewRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(testimonials)
      .where(
        this.scope(
          ctx,
          and(
            eq(testimonials.status, "published"),
            eq(testimonials.projectId, projectId)
          ) as never
        )
      )
      .orderBy(asc(testimonials.sortOrder), desc(testimonials.id));

    return (rows as ReviewRow[]).map((r) => this.publicShape(r));
  }

  async findById(ctx: TenantContext, id: number): Promise<ReviewRow> {
    await this.requireRow(ctx, id, true);

    const [row] = await this.db
      .select(this.selection())
      .from(testimonials)
      .where(this.scope(ctx, eq(testimonials.id, id), true))
      .limit(1);

    return row as ReviewRow;
  }

  async create(ctx: TenantContext, input: ReviewInput): Promise<number> {
    try {
      const [result] = await this.db.insert(testimonials).values({
        ...this.createStamps(ctx),
        slug: input.slug,
        quote: input.quote,
        author: input.author,
        role: input.role ?? null,
        company: input.company ?? null,
        rating: input.rating ?? null,
        projectId: input.projectId ?? null,
        source: "staff",
        status: input.status ?? "draft",
        publishedAt:
          input.status === "published" ? sql`CURRENT_TIMESTAMP(3)` : null,
        sortOrder: await this.nextSortOrder(ctx),
      } as never);

      return (result as unknown as { insertId: number }).insertId;
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  /**
   * A review left by a visitor on the site.
   *
   * Separate from `create` rather than a flag on it, because the fields a
   * stranger controls and the fields staff control are not the same set.
   * `status`, `source` and `sortOrder` are decided here, not accepted: an
   * endpoint that could be talked into inserting a published row would make
   * the whole moderation step decorative.
   *
   * `createStamps` is deliberately not used — there is no actor. The row's
   * `createdBy` stays null, which is what "nobody on staff made this" means
   * everywhere else in the schema.
   */
  async createFromVisitor(
    ctx: TenantContext,
    input: VisitorReviewInput,
    meta: { ip: string; userAgent: string }
  ): Promise<number> {
    const values = {
      companyId: ctx.companyId,
      quote: input.quote,
      author: input.author,
      role: input.role ?? null,
      company: input.company ?? null,
      rating: input.rating,
      projectId: input.projectId ?? null,
      source: "visitor" as const,
      submitterEmail: input.submitterEmail,
      submittedIp: meta.ip.slice(0, 45),
      submittedUserAgent: meta.userAgent.slice(0, 400),
      status: "draft" as const,
      publishedAt: null,
      /* Front of the queue if it is ever published, which is where a new
         review belongs — staff can demote it by reordering. */
      sortOrder: 0,
    };

    try {
      const [result] = await this.db
        .insert(testimonials)
        .values({ ...values, slug: slugFor(input.author) } as never);

      return (result as unknown as { insertId: number }).insertId;
    } catch (error) {
      if ((error as { code?: string })?.code !== "ER_DUP_ENTRY") throw error;

      /* Two people called Ade reviewing in the same millisecond is the only
         way to land here. Retry once with a fresh suffix rather than showing
         a stranger a conflict they cannot act on. */
      const [result] = await this.db
        .insert(testimonials)
        .values({ ...values, slug: slugFor(input.author) } as never);

      return (result as unknown as { insertId: number }).insertId;
    }
  }

  async update(
    ctx: TenantContext,
    id: number,
    input: Partial<ReviewInput>
  ): Promise<void> {
    const before = await this.requireRow<{ status: string }>(ctx, id);

    /* First transition to published only — this is the date the review went
       live, not the last time somebody fixed a typo in it. */
    const goingLive =
      input.status === "published" && before.status !== "published";

    try {
      await this.db
        .update(testimonials)
        .set({
          ...this.updateStamps(ctx),
          ...input,
          ...(goingLive ? { publishedAt: sql`CURRENT_TIMESTAMP(3)` } : {}),
        } as never)
        .where(this.scope(ctx, eq(testimonials.id, id)));
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  /** Approve, unpublish, delete or restore many at once — see `bulkApply`. */
  async bulk(
    ctx: TenantContext,
    ids: number[],
    action: BulkAction
  ): Promise<number> {
    return this.bulkApply(ctx, ids, action, (id, status) =>
      this.update(ctx, id, { status })
    );
  }

  private async nextSortOrder(ctx: TenantContext): Promise<number> {
    const [row] = await this.db
      .select({ max: sql<number>`COALESCE(MAX(${testimonials.sortOrder}), -1)` })
      .from(testimonials)
      .where(this.scope(ctx));

    return (row?.max ?? -1) + 1;
  }
}

/* ────────────────────────────── helpers ────────────────────────────── */

/**
 * A slug for a review nobody was asked to name.
 *
 * Every content table carries one because they are URLs elsewhere; a review is
 * never addressed by slug, but the column is `NOT NULL` and unique among live
 * rows, so it still has to be something. Name plus a random suffix: readable in
 * the database, and it cannot collide with the same client reviewing twice.
 *
 * The name is stripped to the same lowercase/hyphen alphabet the admin slug
 * validator enforces, and falls back to "review" when a name reduces to nothing
 * — which it does for a review left entirely in a non-Latin script.
 */
function slugFor(author: string): string {
  const stem =
    author
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "review";

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${stem}-${suffix}`;
}
