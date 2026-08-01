import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { and, asc, desc, eq } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { media, posts, testimonials } from "@/db/schema";
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

  /* Projects used to be read here too. It moved to PublicProjectsController,
     which shares ProjectsRepository with the dashboard — a project now carries
     a gallery and a service list, and two hand-written copies of that shape
     would only stay in step until the first one was edited alone. */

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

  /* Team moved to PublicTeamController for the same reason projects did: the
     dashboard now writes these rows, and a hand-written copy of the shape here
     would only stay in step with the repository's until the first one was
     edited alone. */

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
