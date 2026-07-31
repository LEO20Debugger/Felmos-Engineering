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
  constructor(private readonly repo: ServicesRepository) {}

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
    return { id: await this.repo.create(tenant, body) };
  }

  @Patch("reorder")
  async reorder(
    @Tenant() tenant: TenantContext,
    @ZodBody(reorderSchema) body: z.infer<typeof reorderSchema>
  ): Promise<{ ok: true }> {
    /* Takes the whole ordered list rather than a moved pair, so two people
       dragging at once can't interleave into a half-applied order. */
    await this.repo.reorder(tenant, body.ids);
    return { ok: true };
  }

  @Patch(":id")
  async update(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number,
    @ZodBody(patchSchema) body: z.infer<typeof patchSchema>
  ): Promise<{ ok: true }> {
    await this.repo.update(tenant, id, body);
    return { ok: true };
  }

  /** Soft delete — recoverable via restore, and never a hard delete. */
  @Delete(":id")
  async remove(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.repo.softDelete(tenant, id);
    return { ok: true };
  }

  @Post(":id/restore")
  async restore(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.repo.restore(tenant, id);
    return { ok: true };
  }
}
