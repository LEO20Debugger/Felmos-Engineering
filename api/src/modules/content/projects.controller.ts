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
import { InternalKeyGuard, JwtAccessGuard } from "@/modules/auth/auth.guards";
import { RevalidateService } from "@/modules/revalidate/revalidate.service";
import { ProjectsRepository, type ProjectRow } from "./projects.repository";

/* Same rule as services: lowercase, digits and single hyphens. Slugs become
   URLs on the public site — now one URL per project, not an anchor. */
const slug = z
  .string()
  .min(1)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens."
  );

/**
 * A field the source material may simply not record.
 *
 * The dashboard posts every input on every save, so an untouched optional field
 * arrives as "". That has to become null rather than an empty string: the site
 * decides whether to render a fact by asking whether it has one, and "" would
 * answer yes.
 */
const optional = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.trim() || null)
    .nullable()
    .optional();

const projectSchema = z.object({
  slug,
  num: z.string().max(8).optional(),
  title: z.string().min(1, "A title is required.").max(200),
  category: optional(80),
  location: optional(160),
  /* Arrives from a form as a string, and empty means "not recorded" rather
     than zero. The bounds are a typo guard, not a business rule. */
  year: z
    .union([z.string(), z.number()])
    .transform((value) => (String(value).trim() === "" ? null : Number(value)))
    .refine(
      (value) => value === null || (Number.isInteger(value) && value >= 1900 && value <= 2100),
      "Enter a four-digit year."
    )
    .nullable()
    .optional(),
  client: optional(160),
  duration: optional(80),
  scope: optional(600),
  narrative: optional(5000),
  result: optional(600),
  metricValue: optional(40),
  metricLabel: optional(120),
  imageId: z.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
  serviceIds: z.array(z.number().int().positive()).max(20).optional(),
  gallery: z.array(z.number().int().positive()).max(40).optional(),
});

const patchSchema = projectSchema.partial();
const reorderSchema = z.object({ ids: z.array(z.number().int().positive()) });

const bulkSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  action: z.enum(["publish", "draft", "delete", "restore"]),
});

/* ─────────────────────────── public (site) ─────────────────────────── */

/** The nested `metric` object the site's components have always read. Kept as
    a shaping step here rather than a column pair on the wire, so the cutover
    from the hardcoded array stayed a change of source and not a rewrite. */
function forSite(row: ProjectRow) {
  const { metricValue, metricLabel, serviceIds, status, sortOrder, isDeleted, ...rest } =
    row;

  return {
    ...rest,
    metric: metricValue ? { value: metricValue, label: metricLabel ?? "" } : null,
  };
}

@Controller("public/projects")
@UseGuards(InternalKeyGuard)
export class PublicProjectsController {
  constructor(private readonly repo: ProjectsRepository) {}

  @Get()
  async list(@Tenant() tenant: TenantContext) {
    const rows = await this.repo.listPublished(tenant);
    return { projects: rows.map(forSite) };
  }
}

/* ────────────────────────── admin (dashboard) ────────────────────────── */

@Controller("admin/projects")
@UseGuards(JwtAccessGuard)
export class AdminProjectsController {
  constructor(
    private readonly repo: ProjectsRepository,
    private readonly revalidate: RevalidateService
  ) {}

  /* A project appears on the homepage teaser, the index, and its own page. */
  private refresh(companyId: number, slug?: string): void {
    this.revalidate.emit(
      companyId,
      ["projects"],
      ["/", "/projects", ...(slug ? [`/projects/${slug}`] : [])]
    );
  }

  @Get()
  async list(
    @Tenant() tenant: TenantContext,
    @Query("deleted") deleted?: string
  ): Promise<{ projects: ProjectRow[] }> {
    return {
      projects: await this.repo.listAll(tenant, {
        includeDeleted: deleted === "1",
      }),
    };
  }

  @Get(":id")
  async get(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ project: ProjectRow }> {
    return { project: await this.repo.findById(tenant, id) };
  }

  @Post()
  async create(
    @Tenant() tenant: TenantContext,
    @ZodBody(projectSchema) body: z.infer<typeof projectSchema>
  ): Promise<{ id: number }> {
    const id = await this.repo.create(tenant, body);
    this.refresh(tenant.companyId, body.slug);
    return { id };
  }

  /**
   * One action across many projects.
   *
   * Declared before the `:id` routes for the same reason `reorder` is — Nest
   * matches in declaration order, and "bulk" would otherwise be read as an id.
   *
   * A single endpoint rather than the dashboard looping over the per-project
   * ones: seventeen PATCHes would mean seventeen revalidation emits, and the
   * site would rebuild the projects pages seventeen times for one click.
   */
  @Post("bulk")
  async bulk(
    @Tenant() tenant: TenantContext,
    @ZodBody(bulkSchema) body: z.infer<typeof bulkSchema>
  ): Promise<{ ok: true; affected: number }> {
    const affected = await this.repo.bulk(tenant, body.ids, body.action);

    /* Tag-based, so every project's own page is covered without listing
       seventeen slugs — they all read the same tagged fetch. */
    this.refresh(tenant.companyId);
    return { ok: true, affected };
  }

  @Patch("reorder")
  async reorder(
    @Tenant() tenant: TenantContext,
    @ZodBody(reorderSchema) body: z.infer<typeof reorderSchema>
  ): Promise<{ ok: true }> {
    await this.repo.reorder(tenant, body.ids);
    this.refresh(tenant.companyId);
    return { ok: true };
  }

  @Patch(":id")
  async update(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number,
    @ZodBody(patchSchema) body: z.infer<typeof patchSchema>
  ): Promise<{ ok: true }> {
    /* Read the slug before the update as well as after: renaming a project
       leaves a stale page at the old URL unless both are revalidated. */
    const before = await this.repo.findById(tenant, id);
    await this.repo.update(tenant, id, body);

    this.refresh(tenant.companyId, before.slug);
    if (body.slug && body.slug !== before.slug) {
      this.refresh(tenant.companyId, body.slug);
    }
    return { ok: true };
  }

  /** Soft delete — recoverable via restore, and never a hard delete. */
  @Delete(":id")
  async remove(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    const before = await this.repo.findById(tenant, id);
    await this.repo.softDelete(tenant, id);
    this.refresh(tenant.companyId, before.slug);
    return { ok: true };
  }

  @Post(":id/restore")
  async restore(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.repo.restore(tenant, id);
    const after = await this.repo.findById(tenant, id);
    this.refresh(tenant.companyId, after.slug);
    return { ok: true };
  }
}
