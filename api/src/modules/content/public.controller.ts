import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { and, asc, desc, eq, inArray } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import {
  media,
  posts,
  projectServices,
  projects,
  services,
  team,
  testimonials,
} from "@/db/schema";
import { Tenant } from "@/common/tenant.decorator";
import type { TenantContext } from "@/common/tenant-context";
import { InternalKeyGuard } from "@/modules/auth/auth.guards";

/**
 * Everything the public website reads, in the shape it already renders.
 *
 * Field names mirror the arrays these replace in web/lib/content.ts and
 * web/lib/blog.ts, so the cutover is a change of where the data comes from
 * rather than a rewrite of every component that consumes it.
 *
 * Published rows only, and always the current tenant — both enforced by the
 * query rather than by the caller.
 */

/** The joined media columns, flattened, so a page never needs a second call. */
const imageShape = {
  id: media.id,
  kind: media.kind,
  remoteUrl: media.remoteUrl,
  provider: media.provider,
  providerId: media.providerId,
  width: media.width,
  height: media.height,
  blurDataUrl: media.blurDataUrl,
  alt: media.alt,
  focalX: media.focalX,
  focalY: media.focalY,
};

type Row = Record<string, unknown>;

/** Turn the flat select into `{ …fields, image }`. */
function withImage(row: Row): Row {
  const image = row["image"] as Row | null;
  return { ...row, image: image?.["id"] ? image : null };
}

@Controller("public")
@UseGuards(InternalKeyGuard)
export class PublicContentController {
  constructor(@Inject(DB) private readonly db: Db) {}

  @Get("projects")
  async projects(@Tenant() tenant: TenantContext) {
    const rows = await this.db
      .select({
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
        image: imageShape,
      })
      .from(projects)
      .leftJoin(media, eq(media.id, projects.imageId))
      .where(
        and(
          eq(projects.companyId, tenant.companyId),
          eq(projects.isDeleted, 0),
          eq(projects.status, "published")
        )
      )
      .orderBy(asc(projects.sortOrder), desc(projects.id));

    /* The service slugs each project exercised, fetched in one query rather
       than per project — six projects would otherwise mean seven round trips
       to render a single page. */
    const ids = rows.map((r) => r.id);
    const joins = ids.length
      ? await this.db
          .select({
            projectId: projectServices.projectId,
            slug: services.slug,
          })
          .from(projectServices)
          .innerJoin(services, eq(services.id, projectServices.serviceId))
          .where(
            and(
              eq(projectServices.companyId, tenant.companyId),
              inArray(projectServices.projectId, ids)
            )
          )
          .orderBy(asc(projectServices.sortOrder))
      : [];

    const byProject = new Map<number, string[]>();
    for (const join of joins) {
      const list = byProject.get(join.projectId) ?? [];
      list.push(join.slug);
      byProject.set(join.projectId, list);
    }

    return {
      projects: rows.map((row) => ({
        ...withImage(row as Row),
        /* Shaped as the nested object the existing components read. */
        metric: { value: row.metricValue ?? "", label: row.metricLabel ?? "" },
        services: byProject.get(row.id) ?? [],
      })),
    };
  }

  @Get("posts")
  async posts(@Tenant() tenant: TenantContext) {
    const rows = await this.db
      .select({
        id: posts.id,
        slug: posts.slug,
        title: posts.title,
        excerpt: posts.excerpt,
        date: posts.date,
        author: posts.authorName,
        category: posts.category,
        readMinutes: posts.readMinutes,
        body: posts.body,
        image: imageShape,
      })
      .from(posts)
      .leftJoin(media, eq(media.id, posts.imageId))
      .where(
        and(
          eq(posts.companyId, tenant.companyId),
          eq(posts.isDeleted, 0),
          eq(posts.status, "published")
        )
      )
      /* Newest first, matching postsByDate() in the current lib/blog.ts. */
      .orderBy(desc(posts.date));

    return { posts: rows.map((r) => withImage(r as Row)) };
  }

  @Get("team")
  async team(@Tenant() tenant: TenantContext) {
    const rows = await this.db
      .select({
        id: team.id,
        slug: team.slug,
        name: team.name,
        role: team.role,
        tag: team.tag,
        bio: team.bio,
        image: imageShape,
      })
      .from(team)
      .leftJoin(media, eq(media.id, team.imageId))
      .where(
        and(
          eq(team.companyId, tenant.companyId),
          eq(team.isDeleted, 0),
          eq(team.status, "published")
        )
      )
      .orderBy(asc(team.sortOrder));

    return { team: rows.map((r) => withImage(r as Row)) };
  }

  @Get("testimonials")
  async testimonials(@Tenant() tenant: TenantContext) {
    const rows = await this.db
      .select({
        id: testimonials.id,
        quote: testimonials.quote,
        /* The current component reads `name`, not `author`. */
        name: testimonials.author,
        role: testimonials.role,
        company: testimonials.company,
      })
      .from(testimonials)
      .where(
        and(
          eq(testimonials.companyId, tenant.companyId),
          eq(testimonials.isDeleted, 0),
          eq(testimonials.status, "published")
        )
      )
      .orderBy(asc(testimonials.sortOrder));

    return { testimonials: rows };
  }
}
