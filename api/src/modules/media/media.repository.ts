import { ConflictException, Inject, Injectable } from "@nestjs/common";
import { and, desc, eq, or, sql } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { media, posts, projects, services, team } from "@/db/schema";
import { TenantRepository } from "@/common/tenant-repository";
import type { TenantContext } from "@/common/tenant-context";

export type MediaRow = {
  id: number;
  kind: "local" | "remote";
  storageKey: string | null;
  remoteUrl: string | null;
  provider: "unsplash" | "pexels" | null;
  providerId: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  blurDataUrl: string | null;
  alt: string;
  title: string | null;
  focalX: number;
  focalY: number;
  createdAt: string;
};

@Injectable()
export class MediaRepository extends TenantRepository<typeof media> {
  constructor(@Inject(DB) db: Db) {
    super(db, media);
  }

  private cols() {
    return {
      id: media.id,
      kind: media.kind,
      storageKey: media.storageKey,
      remoteUrl: media.remoteUrl,
      provider: media.provider,
      providerId: media.providerId,
      width: media.width,
      height: media.height,
      bytes: media.bytes,
      blurDataUrl: media.blurDataUrl,
      alt: media.alt,
      title: media.title,
      focalX: media.focalX,
      focalY: media.focalY,
      createdAt: media.createdAt,
    };
  }

  async list(ctx: TenantContext, search?: string): Promise<MediaRow[]> {
    const term = search?.trim();

    return this.db
      .select(this.cols())
      .from(media)
      .where(
        this.scope(
          ctx,
          term
            ? or(
                sql`${media.alt} LIKE ${`%${term}%`}`,
                sql`${media.title} LIKE ${`%${term}%`}`,
                sql`${media.storageKey} LIKE ${`%${term}%`}`
              )
            : undefined
        )
      )
      .orderBy(desc(media.id))
      .limit(200) as Promise<MediaRow[]>;
  }

  /** Used by the image-serving route, which has no session — it resolves the
      row by id and must confirm the row belongs to the company named in the
      URL rather than trusting the path. */
  async findForServing(
    id: number
  ): Promise<{ storageKey: string | null; companyId: number } | null> {
    const [row] = await this.db
      .select({ storageKey: media.storageKey, companyId: media.companyId })
      .from(media)
      .where(and(eq(media.id, id), eq(media.isDeleted, 0)))
      .limit(1);

    return row ?? null;
  }

  async create(
    ctx: TenantContext,
    values: Partial<MediaRow> & { kind: "local" | "remote" }
  ): Promise<number> {
    const [result] = await this.db
      .insert(media)
      .values({ ...this.createStamps(ctx), ...values } as never);

    return (result as unknown as { insertId: number }).insertId;
  }

  async update(
    ctx: TenantContext,
    id: number,
    values: { alt?: string; title?: string; focalX?: number; focalY?: number }
  ): Promise<void> {
    await this.requireRow(ctx, id);
    await this.db
      .update(media)
      .set({ ...this.updateStamps(ctx), ...values } as never)
      .where(this.scope(ctx, eq(media.id, id)));
  }

  /**
   * Refuse to delete an image something still points at.
   *
   * A nullable FK means the database would happily let this succeed and leave
   * services rendering a blank space. The 409 names the affected items so the
   * editor can go and change them, rather than just saying no.
   */
  async deleteIfUnused(ctx: TenantContext, id: number): Promise<void> {
    await this.requireRow(ctx, id);

    /* `team` is deliberately not in this union — its display column is `name`,
       not `title`, so it gets its own query below. */
    const scoped = (table: typeof services | typeof projects | typeof posts) =>
      this.db
        .select({ title: sql<string>`COALESCE(${table.title}, '')` })
        .from(table)
        .where(
          and(
            eq(table.companyId, ctx.companyId),
            eq(table.isDeleted, 0),
            eq(table.imageId, id)
          )
        )
        .limit(5);

    const [inServices, inProjects, inPosts, inTeam] = await Promise.all([
      scoped(services),
      scoped(projects),
      scoped(posts),
      this.db
        .select({ title: team.name })
        .from(team)
        .where(
          and(
            eq(team.companyId, ctx.companyId),
            eq(team.isDeleted, 0),
            eq(team.imageId, id)
          )
        )
        .limit(5),
    ]);

    const used = [
      ...inServices.map((r) => `service “${r.title}”`),
      ...inProjects.map((r) => `project “${r.title}”`),
      ...inPosts.map((r) => `article “${r.title}”`),
      ...inTeam.map((r) => `team member “${r.title}”`),
    ];

    if (used.length > 0) {
      throw new ConflictException(
        `This image is still used by ${used.join(", ")}. Replace it there first.`
      );
    }

    await this.softDelete(ctx, id);
  }
}
