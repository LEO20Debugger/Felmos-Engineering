/**
 * Services — the first entity built end to end, and the template the other
 * content types follow.
 */

import { Inject, Injectable } from "@nestjs/common";
import { asc, desc, eq, sql } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { media, services } from "@/db/schema";
import { TenantRepository, type BulkAction } from "@/common/tenant-repository";
import type { TenantContext } from "@/common/tenant-context";

/** The shape returned to callers — media flattened into the row so the web app
    never has to make a second request to render an image. */
export type ServiceRow = {
  id: number;
  slug: string;
  num: string;
  title: string;
  label: string;
  short: string;
  lead: string | null;
  icon: string;
  benefits: string[];
  clients: string[];
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

export type ServiceInput = {
  slug: string;
  num?: string;
  title: string;
  label?: string;
  short?: string;
  lead?: string;
  icon: string;
  imageId?: number | null;
  benefits?: string[];
  clients?: string[];
  status?: "draft" | "published";
};

@Injectable()
export class ServicesRepository extends TenantRepository<typeof services> {
  constructor(@Inject(DB) db: Db) {
    super(db, services);
  }

  /** Columns selected everywhere, with the image joined in one query. */
  private selection() {
    return {
      id: services.id,
      slug: services.slug,
      num: services.num,
      title: services.title,
      label: services.label,
      short: services.short,
      lead: services.lead,
      icon: services.icon,
      benefits: services.benefits,
      clients: services.clients,
      status: services.status,
      sortOrder: services.sortOrder,
      isDeleted: services.isDeleted,
      updatedAt: services.updatedAt,
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
  private shape(row: Record<string, unknown>): ServiceRow {
    const imageId = row["imageId"] as number | null;

    return {
      id: row["id"] as number,
      slug: row["slug"] as string,
      num: row["num"] as string,
      title: row["title"] as string,
      label: row["label"] as string,
      short: row["short"] as string,
      lead: row["lead"] as string | null,
      icon: row["icon"] as string,
      benefits: (row["benefits"] as string[]) ?? [],
      clients: (row["clients"] as string[]) ?? [],
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
  ): Promise<ServiceRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(services)
      .leftJoin(media, eq(media.id, services.imageId))
      .where(this.scope(ctx, undefined, options.includeDeleted ?? false))
      .orderBy(asc(services.sortOrder), desc(services.id));

    return rows.map((r) => this.shape(r as Record<string, unknown>));
  }

  /** Published only, for the public site. */
  async listPublished(ctx: TenantContext): Promise<ServiceRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(services)
      .leftJoin(media, eq(media.id, services.imageId))
      .where(this.scope(ctx, eq(services.status, "published")))
      .orderBy(asc(services.sortOrder), desc(services.id));

    return rows.map((r) => this.shape(r as Record<string, unknown>));
  }

  async findById(ctx: TenantContext, id: number): Promise<ServiceRow> {
    await this.requireRow(ctx, id, true);

    const [row] = await this.db
      .select(this.selection())
      .from(services)
      .leftJoin(media, eq(media.id, services.imageId))
      .where(this.scope(ctx, eq(services.id, id), true))
      .limit(1);

    return this.shape(row as Record<string, unknown>);
  }

  async create(ctx: TenantContext, input: ServiceInput): Promise<number> {
    try {
      const [result] = await this.db.insert(services).values({
        ...this.createStamps(ctx),
        slug: input.slug,
        num: input.num ?? "",
        title: input.title,
        label: input.label ?? "",
        short: input.short ?? "",
        lead: input.lead ?? null,
        icon: input.icon,
        imageId: input.imageId ?? null,
        benefits: input.benefits ?? [],
        clients: input.clients ?? [],
        status: input.status ?? "draft",
        publishedAt:
          input.status === "published" ? sql`CURRENT_TIMESTAMP(3)` : null,
        /* New items go to the end of the list rather than the top — a new
           draft shouldn't displace the running order of published work. */
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
    input: Partial<ServiceInput>
  ): Promise<void> {
    const before = await this.requireRow<{ status: string }>(ctx, id);

    /* Stamp publishedAt the first time something goes live, and never
       afterwards — it is the original publication date, not the last time
       someone pressed save. */
    const goingLive =
      input.status === "published" && before.status !== "published";

    try {
      await this.db
        .update(services)
        .set({
          ...this.updateStamps(ctx),
          ...input,
          ...(goingLive ? { publishedAt: sql`CURRENT_TIMESTAMP(3)` } : {}),
        } as never)
        .where(this.scope(ctx, eq(services.id, id)));
    } catch (error) {
      this.rethrowDuplicate(error);
    }
  }

  /** Publish, unpublish, delete or restore many services — see `bulkApply`. */
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
      .select({ max: sql<number>`COALESCE(MAX(${services.sortOrder}), -1)` })
      .from(services)
      .where(this.scope(ctx));

    return (row?.max ?? -1) + 1;
  }
}
