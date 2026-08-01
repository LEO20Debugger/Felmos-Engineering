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
import { TeamRepository, type TeamRow } from "./team.repository";

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

const teamSchema = z.object({
  slug,
  name: z.string().min(1, "A name is required.").max(160),
  role: z.string().max(160).nullable().optional(),
  tag: z.string().max(80).nullable().optional(),
  bio: z.string().max(4000).nullable().optional(),
  imageId: z.number().int().positive().nullable().optional(),
  status: z.enum(["draft", "published"]).optional(),
});

const patchSchema = teamSchema.partial();
const reorderSchema = z.object({ ids: z.array(z.number().int().positive()) });

const bulkSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  action: z.enum(["publish", "draft", "delete", "restore"]),
});

/* ─────────────────────────── public (site) ─────────────────────────── */

@Controller("public/team")
@UseGuards(InternalKeyGuard)
export class PublicTeamController {
  constructor(private readonly repo: TeamRepository) {}

  @Get()
  async list(@Tenant() tenant: TenantContext): Promise<{ team: TeamRow[] }> {
    return { team: await this.repo.listPublished(tenant) };
  }
}

/* ────────────────────────── admin (dashboard) ────────────────────────── */

@Controller("admin/team")
@UseGuards(JwtAccessGuard)
export class AdminTeamController {
  constructor(
    private readonly repo: TeamRepository,
    private readonly revalidate: RevalidateService
  ) {}

  /* The team grid lives on the About page, and bylines on articles are
     denormalised copies rather than joins — so a change here touches About and
     nothing else. */
  private refresh(companyId: number): void {
    this.revalidate.emit(companyId, ["team"], ["/about"]);
  }

  @Get()
  async list(
    @Tenant() tenant: TenantContext,
    @Query("deleted") deleted?: string
  ): Promise<{ team: TeamRow[] }> {
    return {
      team: await this.repo.listAll(tenant, {
        includeDeleted: deleted === "1",
      }),
    };
  }

  @Get(":id")
  async get(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ member: TeamRow }> {
    return { member: await this.repo.findById(tenant, id) };
  }

  @Post()
  async create(
    @Tenant() tenant: TenantContext,
    @ZodBody(teamSchema) body: z.infer<typeof teamSchema>
  ): Promise<{ id: number }> {
    const id = await this.repo.create(tenant, body);
    this.refresh(tenant.companyId);
    return { id };
  }

  /**
   * One action across many people.
   *
   * Declared before the `:id` routes for the same reason `reorder` is — Nest
   * matches in declaration order, and "bulk" would otherwise be read as an id.
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
