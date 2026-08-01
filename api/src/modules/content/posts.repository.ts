/**
 * Insights — the articles behind /blog.
 *
 * Same shape as the other content repositories, with two differences that are
 * intrinsic to a post rather than incidental:
 *
 *   The body is a JSON block array, so it is validated on the way in (by the
 *   controller's zod union) and re-measured on the way in too — `readMinutes`
 *   is derived here rather than typed by an editor, because a hand-entered
 *   figure is a second source of truth that goes stale on the next edit.
 *
 *   The byline is an FK plus a denormalised name. Removing someone from the
 *   team page must not blank the byline on three years of articles, so the
 *   printed name is stored even when the link is kept.
 */

import { Inject, Injectable } from "@nestjs/common";
import { desc, eq, sql } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { media, posts } from "@/db/schema";
import type { PostBlock } from "@/db/schema/content";
import { TenantRepository, type BulkAction } from "@/common/tenant-repository";
import type { TenantContext } from "@/common/tenant-context";

/** The shape returned to callers — media flattened into the row so the web app
    never has to make a second request to render the article's photograph. */
export type PostRow = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  date: string;
  authorTeamId: number | null;
  authorName: string;
  category: string | null;
  body: PostBlock[];
  readMinutes: number | null;
  status: "draft" | "published";
  isDeleted: number;
  updatedAt: string;
  image: {
    id: number;
    kind: "local" | "remote";
    remoteUrl: string | null;
    provider: "unsplash" | "pexels" | null;
    providerId: string | null;
    storageKey: string | null;
    width: number | null;
    height: number | null;
    blurDataUrl: string | null;
    alt: string;
    focalX: number;
    focalY: number;
  } | null;
};

export type PostInput = {
  slug: string;
  title: string;
  excerpt?: string | null;
  date: string;
  authorTeamId?: number | null;
  authorName: string;
  category?: string | null;
  imageId?: number | null;
  body?: PostBlock[];
  status?: "draft" | "published";
};

/**
 * Reading time, derived from the body.
 *
 * 200 wpm is the conventional figure for considered prose, and the result is
 * floored at one minute so a short post never advertises "0 min read" — the
 * same rule the site applied when posts were a hardcoded array.
 */
export function readMinutes(body: PostBlock[]): number {
  const words = body.reduce((count, block) => {
    const text = block.kind === "list" ? block.items.join(" ") : block.text;
    return count + text.trim().split(/\s+/).filter(Boolean).length;
  }, 0);

  return Math.max(1, Math.round(words / 200));
}

@Injectable()
export class PostsRepository extends TenantRepository<typeof posts> {
  constructor(@Inject(DB) db: Db) {
    super(db, posts);
  }

  /** Columns selected everywhere, with the image joined in one query. */
  private selection() {
    return {
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      excerpt: posts.excerpt,
      date: posts.date,
      authorTeamId: posts.authorTeamId,
      authorName: posts.authorName,
      category: posts.category,
      body: posts.body,
      readMinutes: posts.readMinutes,
      status: posts.status,
      isDeleted: posts.isDeleted,
      updatedAt: posts.updatedAt,
      imageId: media.id,
      imageKind: media.kind,
      imageRemoteUrl: media.remoteUrl,
      imageProvider: media.provider,
      imageProviderId: media.providerId,
      imageStorageKey: media.storageKey,
      imageWidth: media.width,
      imageHeight: media.height,
      imageBlur: media.blurDataUrl,
      imageAlt: media.alt,
      imageFocalX: media.focalX,
      imageFocalY: media.focalY,
    };
  }

  /** Flatten the joined media columns into a nested `image` object. */
  private shape(row: Record<string, unknown>): PostRow {
    const imageId = row["imageId"] as number | null;

    return {
      id: row["id"] as number,
      slug: row["slug"] as string,
      title: row["title"] as string,
      excerpt: row["excerpt"] as string | null,
      date: row["date"] as string,
      authorTeamId: row["authorTeamId"] as number | null,
      authorName: (row["authorName"] as string) ?? "",
      category: row["category"] as string | null,
      /* MySQL hands JSON back parsed, but a row written before the column had a
         default — or by hand — can still arrive as null. The renderer maps over
         this, so an empty array is the only safe absence. */
      body: (row["body"] as PostBlock[] | null) ?? [],
      readMinutes: row["readMinutes"] as number | null,
      status: row["status"] as "draft" | "published",
      isDeleted: row["isDeleted"] as number,
      updatedAt: row["updatedAt"] as string,
      image: imageId
        ? {
            id: imageId,
            kind: row["imageKind"] as "local" | "remote",
            remoteUrl: row["imageRemoteUrl"] as string | null,
            provider: row["imageProvider"] as "unsplash" | "pexels" | null,
            providerId: row["imageProviderId"] as string | null,
            storageKey: row["imageStorageKey"] as string | null,
            width: row["imageWidth"] as number | null,
            height: row["imageHeight"] as number | null,
            blurDataUrl: row["imageBlur"] as string | null,
            alt: (row["imageAlt"] as string) ?? "",
            focalX: (row["imageFocalX"] as number) ?? 50,
            focalY: (row["imageFocalY"] as number) ?? 50,
          }
        : null,
    };
  }

  /** Everything, for the dashboard — drafts included.
   *
   *  Ordered by the editorial date rather than `sortOrder`: the blog index is
   *  chronological, so an ordering column would be a control the dashboard
   *  offers and the website ignores. */
  async listAll(
    ctx: TenantContext,
    options: { includeDeleted?: boolean } = {}
  ): Promise<PostRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(posts)
      .leftJoin(media, eq(media.id, posts.imageId))
      .where(this.scope(ctx, undefined, options.includeDeleted ?? false))
      .orderBy(desc(posts.date), desc(posts.id));

    return rows.map((r) => this.shape(r as Record<string, unknown>));
  }

  /** Published only, for the public site. */
  async listPublished(ctx: TenantContext): Promise<PostRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(posts)
      .leftJoin(media, eq(media.id, posts.imageId))
      .where(this.scope(ctx, eq(posts.status, "published")))
      .orderBy(desc(posts.date), desc(posts.id));

    return rows.map((r) => this.shape(r as Record<string, unknown>));
  }

  async findById(ctx: TenantContext, id: number): Promise<PostRow> {
    await this.requireRow(ctx, id, true);

    const [row] = await this.db
      .select(this.selection())
      .from(posts)
      .leftJoin(media, eq(media.id, posts.imageId))
      .where(this.scope(ctx, eq(posts.id, id), true))
      .limit(1);

    return this.shape(row as Record<string, unknown>);
  }

  /* Byline options are not served from here. The dashboard already reads
     /admin/team for its own page and can pick the names out of that response,
     so a second endpoint returning a subset of the same rows would only be one
     more thing to keep in step. */

  async create(ctx: TenantContext, input: PostInput): Promise<number> {
    const body = input.body ?? [];

    try {
      const [result] = await this.db.insert(posts).values({
        ...this.createStamps(ctx),
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt ?? null,
        date: input.date,
        authorTeamId: input.authorTeamId ?? null,
        authorName: input.authorName,
        category: input.category ?? null,
        imageId: input.imageId ?? null,
        body,
        readMinutes: readMinutes(body),
        status: input.status ?? "draft",
        publishedAt:
          input.status === "published" ? sql`CURRENT_TIMESTAMP(3)` : null,
        /* Posts are ordered by date everywhere they are read, so this column
           only has to be stable — it is not a control the dashboard exposes. */
        sortOrder: await this.nextSortOrder(ctx),
      } as never);

      return (result as unknown as { insertId: number }).insertId;
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  async update(
    ctx: TenantContext,
    id: number,
    input: Partial<PostInput>
  ): Promise<void> {
    const before = await this.requireRow<{ status: string }>(ctx, id);

    /* Stamp publishedAt the first time a post goes live, and never afterwards —
       it is the original publication date, not the last time someone pressed
       save. The editorial `date` column is separate and freely backdated. */
    const goingLive =
      input.status === "published" && before.status !== "published";

    try {
      await this.db
        .update(posts)
        .set({
          ...this.updateStamps(ctx),
          ...input,
          /* Re-measured whenever the body is part of the save, so the figure on
             the card can never disagree with the article under it. */
          ...(input.body ? { readMinutes: readMinutes(input.body) } : {}),
          ...(goingLive ? { publishedAt: sql`CURRENT_TIMESTAMP(3)` } : {}),
        } as never)
        .where(this.scope(ctx, eq(posts.id, id)));
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  /** Publish, unpublish, delete or restore many posts — see `bulkApply`. */
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
      .select({ max: sql<number>`COALESCE(MAX(${posts.sortOrder}), -1)` })
      .from(posts)
      .where(this.scope(ctx));

    return (row?.max ?? -1) + 1;
  }
}
