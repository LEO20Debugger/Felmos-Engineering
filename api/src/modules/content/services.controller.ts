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

import { ICON_NAMES } from "@/common/icon-allowlist";
import { Tenant } from "@/common/tenant.decorator";
import type { TenantContext } from "@/common/tenant-context";
import { ZodBody } from "@/common/zod.pipe";
import { InternalKeyGuard, JwtAccessGuard } from "@/modules/auth/auth.guards";
import { RevalidateService } from "@/modules/revalidate/revalidate.service";
import { ServicesRepository, type ServiceRow } from "./services.repository";

/* The slug rule is stricter than the database's: lowercase, digits and single
   hyphens only. Slugs become URLs on the public site, and permitting anything
   that needs escaping there causes trouble far from where it was entered. */
const slug = z
  .string()
  .min(1)
  .max(160)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use lowercase letters, numbers and single hyphens."
  );

const serviceSchema = z.object({
  slug,
  num: z.string().max(8).optional(),
  title: z.string().min(1, "A title is required.").max(200),
  label: z.string().max(80).optional(),
  short: z.string().max(400).optional(),
  lead: z.string().max(5000).optional(),
  /* Validated against the allowlist, not just "a string": the web app resolves
     icons through an explicitly enumerated map, so an unknown name renders a
     fallback glyph on the live site rather than failing loudly. */
  icon: z.enum(ICON_NAMES),
  imageId: z.number().int().positive().nullable().optional(),
  benefits: z.array(z.string().max(300)).max(20).optional(),
  clients: z.array(z.string().max(120)).max(20).optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const patchSchema = serviceSchema.partial();
const reorderSchema = z.object({ ids: z.array(z.number().int().positive()) });

const bulkSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  action: z.enum(["publish", "draft", "delete", "restore"]),
});

/* ─────────────────────────── public (site) ─────────────────────────── */

@Controller("public/services")
@UseGuards(InternalKeyGuard)
export class PublicServicesController {
  constructor(private readonly repo: ServicesRepository) {}

  @Get()
  async list(@Tenant() tenant: TenantContext): Promise<{ services: ServiceRow[] }> {
    return { services: await this.repo.listPublished(tenant) };
  }
}

/* ────────────────────────── admin (dashboard) ────────────────────────── */

@Controller("admin/services")
@UseGuards(JwtAccessGuard)
export class AdminServicesController {
  constructor(
    private readonly repo: ServicesRepository,
    private readonly revalidate: RevalidateService
  ) {}

  /* Services appear on the homepage, the services page and the contact form's
     dropdown, and projects link through to them — so a change to one touches
     more than its own tag. */
  private refresh(companyId: number): void {
    this.revalidate.emit(companyId, ["services", "projects"], [
      "/",
      "/services",
      "/contact",
    ]);
  }

  @Get()
  async list(
    @Tenant() tenant: TenantContext,
    @Query("deleted") deleted?: string
  ): Promise<{ services: ServiceRow[] }> {
    return {
      services: await this.repo.listAll(tenant, {
        includeDeleted: deleted === "1",
      }),
    };
  }

  @Get(":id")
  async get(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ service: ServiceRow }> {
    return { service: await this.repo.findById(tenant, id) };
  }

  @Post()
  async create(
    @Tenant() tenant: TenantContext,
    @ZodBody(serviceSchema) body: z.infer<typeof serviceSchema>
  ): Promise<{ id: number }> {
    const id = await this.repo.create(tenant, body);
    this.refresh(tenant.companyId);
    return { id };
  }

  /**
   * One action across many services.
   *
   * Declared before the `:id` routes for the same reason `reorder` is — Nest
   * matches in declaration order, and "bulk" would otherwise be read as an id.
   *
   * A single endpoint rather than the dashboard looping over the per-service
   * ones: seventeen PATCHes would mean seventeen revalidation emits, and
   * services touch the homepage, the services page and the contact form, so
   * the site would rebuild all three seventeen times for one click.
   */
  @Post("bulk")
  async bulk(
    @Tenant() tenant: TenantContext,
    @ZodBody(bulkSchema) body: z.infer<typeof bulkSchema>
  ): Promise<{ ok: true; affected: number }> {
    const affected = await this.repo.bulk(tenant, body.ids, body.action);
    this.refresh(tenant.companyId);
    return { ok: true, affected };
  }

  @Patch("reorder")
  async reorder(
    @Tenant() tenant: TenantContext,
    @ZodBody(reorderSchema) body: z.infer<typeof reorderSchema>
  ): Promise<{ ok: true }> {
    /* Takes the whole ordered list rather than a moved pair, so two people
       dragging at once can't interleave into a half-applied order. */
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
