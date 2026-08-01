/**
 * Team — the people shown on the About page.
 *
 * Follows the shape services set: one selection, one shaping step, the image
 * joined in rather than fetched separately. Nothing here is novel; that is the
 * point.
 */

import { Inject, Injectable } from "@nestjs/common";
import { asc, desc, eq, sql } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { media, team } from "@/db/schema";
import { TenantRepository, type BulkAction } from "@/common/tenant-repository";
import type { TenantContext } from "@/common/tenant-context";

/** The shape returned to callers — media flattened into the row so the web app
    never has to make a second request to render a portrait. */
export type TeamRow = {
  id: number;
  slug: string;
  name: string;
  role: string | null;
  tag: string | null;
  bio: string | null;
  status: "draft" | "published";
  sortOrder: number;
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

export type TeamInput = {
  slug: string;
  name: string;
  role?: string | null;
  tag?: string | null;
  bio?: string | null;
  imageId?: number | null;
  status?: "draft" | "published";
};

@Injectable()
export class TeamRepository extends TenantRepository<typeof team> {
  constructor(@Inject(DB) db: Db) {
    super(db, team);
  }

  /** Columns selected everywhere, with the image joined in one query. */
  private selection() {
    return {
      id: team.id,
      slug: team.slug,
      name: team.name,
      role: team.role,
      tag: team.tag,
      bio: team.bio,
      status: team.status,
      sortOrder: team.sortOrder,
      isDeleted: team.isDeleted,
      updatedAt: team.updatedAt,
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
  private shape(row: Record<string, unknown>): TeamRow {
    const imageId = row["imageId"] as number | null;

    return {
      id: row["id"] as number,
      slug: row["slug"] as string,
      name: row["name"] as string,
      role: row["role"] as string | null,
      tag: row["tag"] as string | null,
      bio: row["bio"] as string | null,
      status: row["status"] as "draft" | "published",
      sortOrder: row["sortOrder"] as number,
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

  /** Everything, for the dashboard — drafts included. */
  async listAll(
    ctx: TenantContext,
    options: { includeDeleted?: boolean } = {}
  ): Promise<TeamRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(team)
      .leftJoin(media, eq(media.id, team.imageId))
      .where(this.scope(ctx, undefined, options.includeDeleted ?? false))
      .orderBy(asc(team.sortOrder), desc(team.id));

    return rows.map((r) => this.shape(r as Record<string, unknown>));
  }

  /** Published only, for the public site. */
  async listPublished(ctx: TenantContext): Promise<TeamRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(team)
      .leftJoin(media, eq(media.id, team.imageId))
      .where(this.scope(ctx, eq(team.status, "published")))
      .orderBy(asc(team.sortOrder), desc(team.id));

    return rows.map((r) => this.shape(r as Record<string, unknown>));
  }

  async findById(ctx: TenantContext, id: number): Promise<TeamRow> {
    await this.requireRow(ctx, id, true);

    const [row] = await this.db
      .select(this.selection())
      .from(team)
      .leftJoin(media, eq(media.id, team.imageId))
      .where(this.scope(ctx, eq(team.id, id), true))
      .limit(1);

    return this.shape(row as Record<string, unknown>);
  }

  async create(ctx: TenantContext, input: TeamInput): Promise<number> {
    try {
      const [result] = await this.db.insert(team).values({
        ...this.createStamps(ctx),
        slug: input.slug,
        name: input.name,
        role: input.role ?? null,
        tag: input.tag ?? null,
        bio: input.bio ?? null,
        imageId: input.imageId ?? null,
        status: input.status ?? "draft",
        publishedAt:
          input.status === "published" ? sql`CURRENT_TIMESTAMP(3)` : null,
        /* New people go to the end of the list rather than the top — adding
           someone shouldn't reshuffle the order of the About page. */
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
    input: Partial<TeamInput>
  ): Promise<void> {
    const before = await this.requireRow<{ status: string }>(ctx, id);

    /* Stamp publishedAt the first time someone goes live, and never
       afterwards — it is the original publication date, not the last time
       someone pressed save. */
    const goingLive =
      input.status === "published" && before.status !== "published";

    try {
      await this.db
        .update(team)
        .set({
          ...this.updateStamps(ctx),
          ...input,
          ...(goingLive ? { publishedAt: sql`CURRENT_TIMESTAMP(3)` } : {}),
        } as never)
        .where(this.scope(ctx, eq(team.id, id)));
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  /** Publish, unpublish, delete or restore many people — see `bulkApply`. */
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
      .select({ max: sql<number>`COALESCE(MAX(${team.sortOrder}), -1)` })
      .from(team)
      .where(this.scope(ctx));

    return (row?.max ?? -1) + 1;
  }
}
