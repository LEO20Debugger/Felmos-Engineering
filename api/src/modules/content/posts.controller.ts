import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { Tenant } from "@/common/tenant.decorator";
import type { TenantContext } from "@/common/tenant-context";
import { ZodBody } from "@/common/zod.pipe";
import { JwtAccessGuard } from "@/modules/auth/auth.guards";
import { RevalidateService } from "@/modules/revalidate/revalidate.service";
import { PostsRepository, type PostRow } from "./posts.repository";

/* Same rule as the other content types: lowercase, digits and single hyphens.
   A post's slug is a public URL — /blog/<slug> — so anything that would need
   escaping there causes trouble far from where it was entered. */
const slug = z
  .string()
  .min(1)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens."
  );

/** A field the editor may simply have left empty. The dashboard posts every
    input on every save, so an untouched optional field arrives as "" — which
    has to become null, since the site decides whether to render a fact by
    asking whether it has one. */
const optional = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim() || null)
    .nullable()
    .optional();

/**
 * One block of article body.
 *
 * A discriminated union rather than free HTML: a typo in a kind is a rejected
 * save rather than a blank section on the live site, and every block the editor
 * can produce is one PostBody.tsx already knows how to render. Widening this is
 * a deliberate act — add the kind here and in the renderer together.
 */
const blockSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("p"),
    text: z.string().min(1, "A paragraph cannot be empty.").max(5000),
  }),
  z.object({
    kind: z.literal("h2"),
    text: z.string().min(1, "A heading cannot be empty.").max(200),
  }),
  z.object({
    kind: z.literal("quote"),
    text: z.string().min(1, "A quote cannot be empty.").max(1200),
    /* Absent rather than null when empty: this lands in a JSON column, and a
       stored `"attribution": null` is a key the renderer then has to test for
       separately from a missing one. */
    attribution: z
      .string()
      .max(160)
      .nullish()
      .transform((value) => value?.trim() || undefined),
  }),
  z.object({
    kind: z.literal("list"),
    items: z
      .array(z.string().min(1).max(800))
      .min(1, "A list needs at least one item.")
      .max(30),
  }),
]);

const postSchema = z.object({
  slug,
  title: z.string().min(1, "A title is required.").max(220),
  excerpt: optional(600),
  /* Stored as a string, not a date: it is the editorial date printed on the
     article, and a timestamp would drag a timezone into something that is a
     calendar day everywhere it is read. */
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a date like 2026-08-01.")
    .refine(
      (value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)),
      "That is not a real date."
    ),
  authorTeamId: z.number().int().positive().nullable().optional(),
  authorName: z.string().min(1, "A byline is required.").max(120),
  category: optional(80),
  imageId: z.number().int().positive().nullable().optional(),
  body: z.array(blockSchema).max(200).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const patchSchema = postSchema.partial();

const bulkSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  action: z.enum(["publish", "draft", "delete", "restore"]),
});

/* The public site reads posts through PublicContentController — a hand-written
   select in the shape lib/cms.ts expects — so there is no public controller
   here. Only the dashboard writes. */

@Controller("admin/posts")
@UseGuards(JwtAccessGuard)
export class AdminPostsController {
  constructor(
    private readonly repo: PostsRepository,
    private readonly revalidate: RevalidateService
  ) {}

  /** A post appears on the index and on its own page, and nowhere else. */
  private refresh(companyId: number): void {
    this.revalidate.emit(companyId, ["posts"], ["/blog"]);
  }

  @Get()
  async list(
    @Tenant() tenant: TenantContext,
    @Query("deleted") deleted?: string
  ): Promise<{ posts: PostRow[] }> {
    return {
      posts: await this.repo.listAll(tenant, {
        includeDeleted: deleted === "1",
      }),
    };
  }

  @Get(":id")
  async get(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ post: PostRow }> {
    return { post: await this.repo.findById(tenant, id) };
  }

  @Post()
  async create(
    @Tenant() tenant: TenantContext,
    @ZodBody(postSchema) body: z.infer<typeof postSchema>
  ): Promise<{ id: number }> {
    const id = await this.repo.create(tenant, body);
    this.refresh(tenant.companyId);
    return { id };
  }

  /** Declared before the `:id` routes — Nest matches in declaration order, and
      "bulk" would otherwise be read as an id. */
  @Post("bulk")
  async bulk(
    @Tenant() tenant: TenantContext,
    @ZodBody(bulkSchema) body: z.infer<typeof bulkSchema>
  ): Promise<{ ok: true; affected: number }> {
    const affected = await this.repo.bulk(tenant, body.ids, body.action);
    this.refresh(tenant.companyId);
    return { ok: true, affected };
  }

  @Patch(":id")
  async update(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number,
    @ZodBody(patchSchema) body: z.infer<typeof patchSchema>
  ): Promise<{ ok: true }> {
    await this.repo.update(tenant, id, body);
    this.refresh(tenant.companyId);
    return { ok: true };
  }

  /** Soft delete — recoverable via restore, and never a hard delete. */
  @Delete(":id")
  async remove(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.repo.softDelete(tenant, id);
    this.refresh(tenant.companyId);
    return { ok: true };
  }

  @Post(":id/restore")
  async restore(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.repo.restore(tenant, id);
    this.refresh(tenant.companyId);
    return { ok: true };
  }
}
