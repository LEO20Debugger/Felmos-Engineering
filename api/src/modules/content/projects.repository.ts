/**
 * Projects — the case-study record, following the shape services established.
 *
 * Two things make this more than a copy of ServicesRepository. A project owns
 * two collections rather than none: the services it exercised, and the gallery
 * of photographs behind its hero image. Both live in join tables, and both are
 * read in one batched query per list rather than one per project — six projects
 * would otherwise mean thirteen round trips to render a page that used to be a
 * hardcoded array.
 *
 * Both are also written wholesale on save: delete the project's rows, insert the
 * new ones. Diffing two short ordered lists is more code than it saves, and the
 * wholesale version cannot leave a stale row behind.
 */

import { Inject, Injectable } from "@nestjs/common";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { media, projectMedia, projectServices, projects, services } from "@/db/schema";
import { TenantRepository, type BulkAction } from "@/common/tenant-repository";
import type { TenantContext } from "@/common/tenant-context";

/** An image as every consumer of this API expects it — flattened, never a
    second request to resolve. */
export type ProjectImage = {
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
};

export type GalleryImage = ProjectImage & { caption: string | null };

export type ProjectRow = {
  id: number;
  slug: string;
  num: string;
  title: string;
  category: string | null;
  location: string | null;
  /* Null wherever the source material never recorded it. These are deliberately
     nullable rather than defaulted to "" — the site omits a fact it does not
     have, and an empty string would render as a blank cell claiming there is an
     answer. */
  year: number | null;
  client: string | null;
  duration: string | null;
  scope: string | null;
  narrative: string | null;
  result: string | null;
  metricValue: string | null;
  metricLabel: string | null;
  status: "draft" | "published";
  sortOrder: number;
  isDeleted: number;
  updatedAt: string;
  image: ProjectImage | null;
  /** Service slugs, in the order they were attached. */
  services: string[];
  /** Service ids, for the dashboard's picker — the public site wants slugs. */
  serviceIds: number[];
  gallery: GalleryImage[];
};

export type ProjectInput = {
  slug: string;
  num?: string;
  title: string;
  category?: string | null;
  location?: string | null;
  year?: number | null;
  client?: string | null;
  duration?: string | null;
  scope?: string | null;
  narrative?: string | null;
  result?: string | null;
  metricValue?: string | null;
  metricLabel?: string | null;
  imageId?: number | null;
  status?: "draft" | "published";
  /** Omitted means "leave the existing links alone"; an empty array clears
      them. The distinction matters — PATCH with a partial body must not wipe a
      collection it never mentioned. */
  serviceIds?: number[];
  gallery?: number[];
};

@Injectable()
export class ProjectsRepository extends TenantRepository<typeof projects> {
  constructor(@Inject(DB) db: Db) {
    super(db, projects);
  }

  private selection() {
    return {
      id: projects.id,
      slug: projects.slug,
      num: projects.num,
      title: projects.title,
      category: projects.category,
      location: projects.location,
      year: projects.year,
      client: projects.client,
      duration: projects.duration,
      scope: projects.scope,
      narrative: projects.narrative,
      result: projects.result,
      metricValue: projects.metricValue,
      metricLabel: projects.metricLabel,
      status: projects.status,
      sortOrder: projects.sortOrder,
      isDeleted: projects.isDeleted,
      updatedAt: projects.updatedAt,
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

  /** Flatten the joined media columns into a nested `image`. Collections are
      filled in afterwards by `attach()`, which reads them for the whole page. */
  private shape(row: Record<string, unknown>): ProjectRow {
    const imageId = row["imageId"] as number | null;

    return {
      id: row["id"] as number,
      slug: row["slug"] as string,
      num: row["num"] as string,
      title: row["title"] as string,
      category: row["category"] as string | null,
      location: row["location"] as string | null,
      year: row["year"] as number | null,
      client: row["client"] as string | null,
      duration: row["duration"] as string | null,
      scope: row["scope"] as string | null,
      narrative: row["narrative"] as string | null,
      result: row["result"] as string | null,
      metricValue: row["metricValue"] as string | null,
      metricLabel: row["metricLabel"] as string | null,
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
      services: [],
      serviceIds: [],
      gallery: [],
    };
  }

  /**
   * Fill in `services`, `serviceIds` and `gallery` for a whole set of rows.
   *
   * Two queries regardless of how many projects were selected. Mutates in place
   * because the rows were just built here and nothing else holds them.
   */
  private async attach(
    ctx: TenantContext,
    rows: ProjectRow[]
  ): Promise<ProjectRow[]> {
    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return rows;

    const [links, photos] = await Promise.all([
      this.db
        .select({
          projectId: projectServices.projectId,
          serviceId: services.id,
          slug: services.slug,
        })
        .from(projectServices)
        .innerJoin(services, eq(services.id, projectServices.serviceId))
        .where(
          and(
            eq(projectServices.companyId, ctx.companyId),
            inArray(projectServices.projectId, ids),
            /* A soft-deleted service must not surface as a tag linking to a
               page that no longer exists. */
            eq(services.isDeleted, 0)
          )
        )
        .orderBy(asc(projectServices.sortOrder)),

      this.db
        .select({
          projectId: projectMedia.projectId,
          caption: projectMedia.caption,
          id: media.id,
          kind: media.kind,
          remoteUrl: media.remoteUrl,
          provider: media.provider,
          providerId: media.providerId,
          storageKey: media.storageKey,
          width: media.width,
          height: media.height,
          blurDataUrl: media.blurDataUrl,
          alt: media.alt,
          focalX: media.focalX,
          focalY: media.focalY,
        })
        .from(projectMedia)
        .innerJoin(media, eq(media.id, projectMedia.mediaId))
        .where(
          and(
            eq(projectMedia.companyId, ctx.companyId),
            inArray(projectMedia.projectId, ids),
            eq(media.isDeleted, 0)
          )
        )
        .orderBy(asc(projectMedia.sortOrder)),
    ]);

    const byId = new Map(rows.map((r) => [r.id, r]));

    for (const link of links) {
      const row = byId.get(link.projectId);
      if (!row) continue;
      row.services.push(link.slug);
      row.serviceIds.push(link.serviceId);
    }

    for (const { projectId, ...photo } of photos) {
      byId.get(projectId)?.gallery.push(photo as GalleryImage);
    }

    return rows;
  }

  /** Everything, for the dashboard — drafts included. */
  async listAll(
    ctx: TenantContext,
    options: { includeDeleted?: boolean } = {}
  ): Promise<ProjectRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(projects)
      .leftJoin(media, eq(media.id, projects.imageId))
      .where(this.scope(ctx, undefined, options.includeDeleted ?? false))
      .orderBy(asc(projects.sortOrder), desc(projects.id));

    return this.attach(
      ctx,
      rows.map((r) => this.shape(r as Record<string, unknown>))
    );
  }

  /** Published only, for the public site. */
  async listPublished(ctx: TenantContext): Promise<ProjectRow[]> {
    const rows = await this.db
      .select(this.selection())
      .from(projects)
      .leftJoin(media, eq(media.id, projects.imageId))
      .where(this.scope(ctx, eq(projects.status, "published")))
      .orderBy(asc(projects.sortOrder), desc(projects.id));

    return this.attach(
      ctx,
      rows.map((r) => this.shape(r as Record<string, unknown>))
    );
  }

  async findById(ctx: TenantContext, id: number): Promise<ProjectRow> {
    await this.requireRow(ctx, id, true);

    const [row] = await this.db
      .select(this.selection())
      .from(projects)
      .leftJoin(media, eq(media.id, projects.imageId))
      .where(this.scope(ctx, eq(projects.id, id), true))
      .limit(1);

    const [shaped] = await this.attach(ctx, [
      this.shape(row as Record<string, unknown>),
    ]);
    return shaped as ProjectRow;
  }

  async create(ctx: TenantContext, input: ProjectInput): Promise<number> {
    let id: number;

    try {
      const [result] = await this.db.insert(projects).values({
        ...this.createStamps(ctx),
        ...this.columns(input),
        slug: input.slug,
        title: input.title,
        num: input.num ?? "",
        status: input.status ?? "draft",
        publishedAt:
          input.status === "published" ? sql`CURRENT_TIMESTAMP(3)` : null,
        /* New items go to the end of the list rather than the top — a new draft
           shouldn't displace the running order of published work. */
        sortOrder: await this.nextSortOrder(ctx),
      } as never);

      id = (result as unknown as { insertId: number }).insertId;
    } catch (error) {
      this.rethrowDuplicate(error);
    }

    await this.writeServices(ctx, id, input.serviceIds);
    await this.writeGallery(ctx, id, input.gallery);
    return id;
  }

  async update(
    ctx: TenantContext,
    id: number,
    input: Partial<ProjectInput>
  ): Promise<void> {
    const before = await this.requireRow<{ status: string }>(ctx, id);

    /* Stamp publishedAt the first time something goes live, and never
       afterwards — it is the original publication date, not the last time
       someone pressed save. */
    const goingLive =
      input.status === "published" && before.status !== "published";

    try {
      await this.db
        .update(projects)
        .set({
          ...this.updateStamps(ctx),
          ...this.columns(input),
          ...(input.slug !== undefined ? { slug: input.slug } : {}),
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.num !== undefined ? { num: input.num } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
          ...(goingLive ? { publishedAt: sql`CURRENT_TIMESTAMP(3)` } : {}),
        } as never)
        .where(this.scope(ctx, eq(projects.id, id)));
    } catch (error) {
      this.rethrowDuplicate(error);
    }

    await this.writeServices(ctx, id, input.serviceIds);
    await this.writeGallery(ctx, id, input.gallery);
  }

  /** Publish, unpublish, delete or restore many projects — see `bulkApply`. */
  async bulk(
    ctx: TenantContext,
    ids: number[],
    action: BulkAction
  ): Promise<number> {
    return this.bulkApply(ctx, ids, action, (id, status) =>
      this.update(ctx, id, { status })
    );
  }

  /**
   * The plain scalar columns, as a partial set.
   *
   * Only keys actually present in `input` are emitted, so a PATCH that mentions
   * three fields updates three fields. `undefined` and `null` mean different
   * things here: absent leaves the column alone, null clears it.
   */
  private columns(input: Partial<ProjectInput>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const keys = [
      "category",
      "location",
      "year",
      "client",
      "duration",
      "scope",
      "narrative",
      "result",
      "metricValue",
      "metricLabel",
      "imageId",
    ] as const;

    for (const key of keys) {
      if (input[key] !== undefined) out[key] = input[key];
    }
    return out;
  }

  /** Replace the project's service links, in the given order. */
  private async writeServices(
    ctx: TenantContext,
    projectId: number,
    serviceIds?: number[]
  ): Promise<void> {
    if (!serviceIds) return;

    await this.db.transaction(async (tx) => {
      await tx
        .delete(projectServices)
        .where(
          and(
            eq(projectServices.companyId, ctx.companyId),
            eq(projectServices.projectId, projectId)
          )
        );

      /* Deduplicated: the join's primary key is (projectId, serviceId), so a
         repeated id in the payload would abort the whole write. */
      for (const [order, serviceId] of [...new Set(serviceIds)].entries()) {
        await tx
          .insert(projectServices)
          .values({
            companyId: ctx.companyId,
            projectId,
            serviceId,
            sortOrder: order,
          });
      }
    });
  }

  /** Replace the project's gallery, in the given order. */
  private async writeGallery(
    ctx: TenantContext,
    projectId: number,
    mediaIds?: number[]
  ): Promise<void> {
    if (!mediaIds) return;

    await this.db.transaction(async (tx) => {
      await tx
        .delete(projectMedia)
        .where(
          and(
            eq(projectMedia.companyId, ctx.companyId),
            eq(projectMedia.projectId, projectId)
          )
        );

      for (const [order, mediaId] of [...new Set(mediaIds)].entries()) {
        await tx
          .insert(projectMedia)
          .values({ companyId: ctx.companyId, projectId, mediaId, sortOrder: order });
      }
    });
  }

  private async nextSortOrder(ctx: TenantContext): Promise<number> {
    const [row] = await this.db
      .select({ max: sql<number>`COALESCE(MAX(${projects.sortOrder}), -1)` })
      .from(projects)
      .where(this.scope(ctx));

    return (row?.max ?? -1) + 1;
  }
}
