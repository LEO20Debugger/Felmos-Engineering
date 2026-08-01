import {
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { z } from "zod";

import { Tenant } from "@/common/tenant.decorator";
import type { TenantContext } from "@/common/tenant-context";
import { ZodBody } from "@/common/zod.pipe";
import { InternalKeyGuard, JwtAccessGuard } from "@/modules/auth/auth.guards";
import {
  EXPORT_FIELDS,
  LeadsService,
  toCsv,
  type LeadCounts,
  type LeadRow,
} from "./leads.service";

/* Mirrors the validation the site's contact route already performs. Both run:
   the site's copy gives instant field-level feedback, this one is the actual
   guarantee, since the route is only one of the ways a request can arrive. */
const leadSchema = z.object({
  name: z.string().min(2, "Please enter your full name.").max(160),
  phone: z
    .string()
    .max(40)
    .refine((v) => v.replace(/\D/g, "").length >= 7, {
      message: "Please enter a reachable phone number.",
    }),
  email: z.string().email("Please enter a valid email address.").max(255),
  location: z.string().min(2, "Please tell us where the project is.").max(240),
  service: z.string().min(1, "Please choose a service.").max(200),
  date: z.string().max(10).optional(),
  message: z.string().max(2000).optional(),
  landingPath: z.string().max(300).optional(),
  referrer: z.string().max(600).optional(),
  utm: z.record(z.string().max(120)).optional(),
});

const STATUSES = [
  "new",
  "contacted",
  "quoted",
  "won",
  "lost",
  "spam",
] as const;

const patchSchema = z.object({
  status: z.enum(STATUSES).optional(),
  internalNotes: z.string().max(5000).optional(),
});

const bulkSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(200),
  action: z.enum(["delete", "restore", ...STATUSES]),
});

/** Query parsing for the inbox, shared by the list and the CSV so an export
    can never cover a different set than the screen it was launched from.

    An unrecognised `status` is dropped rather than rejected: it arrives from a
    URL somebody may have edited or bookmarked before a status was renamed, and
    showing everything beats a 400 on a page they were only browsing. */
function readQuery(query: Record<string, string | undefined>) {
  const status =
    query.status && (STATUSES as readonly string[]).includes(query.status)
      ? query.status
      : undefined;

  const perPage = Number(query.perPage);
  const page = Number(query.page);

  return {
    status,
    q: query.q?.trim().slice(0, 120) || undefined,
    includeDeleted: query.deleted === "1",
    page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    perPage:
      Number.isFinite(perPage) && perPage > 0
        ? Math.min(Math.floor(perPage), 200)
        : 50,
  };
}

/* ───────────────────────── public submission ───────────────────────── */

@Controller("public/leads")
@UseGuards(InternalKeyGuard)
export class PublicLeadsController {
  constructor(private readonly leads: LeadsService) {}

  /**
   * Called server-to-server by the site's /api/contact route, never by a
   * browser — which is why it sits behind the internal key rather than being
   * open. An open lead endpoint is a spam target, and the key keeps the API's
   * origin out of client-side code entirely.
   */
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post()
  async create(
    @Tenant() tenant: TenantContext,
    @ZodBody(leadSchema) body: z.infer<typeof leadSchema>,
    @Req() request: Request
  ): Promise<{ ok: true; id: number }> {
    /* The proxying route forwards the visitor's address and agent; falling
       back to the request's own would attribute every enquiry to Vercel. */
    const ip =
      (request.get("x-visitor-ip") ?? request.ip ?? "0.0.0.0").split(",")[0]?.trim() ??
      "0.0.0.0";

    const id = await this.leads.submit(tenant, body, {
      ip,
      userAgent: request.get("x-visitor-agent") ?? request.get("user-agent") ?? "",
    });

    return { ok: true, id };
  }
}

/* ──────────────────────────── leads inbox ──────────────────────────── */

@Controller("admin/leads")
@UseGuards(JwtAccessGuard)
export class AdminLeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  async list(
    @Tenant() tenant: TenantContext,
    @Query() query: Record<string, string | undefined>
  ): Promise<{ leads: LeadRow[]; total: number; page: number; perPage: number }> {
    const options = readQuery(query);
    const { rows, total } = await this.leads.list(tenant, options);

    return {
      leads: rows,
      total,
      page: options.page,
      perPage: options.perPage,
    };
  }

  /* Declared before the `:id` routes — Nest matches in declaration order, and
     "counts" would otherwise be parsed as an id. */
  @Get("counts")
  async counts(@Tenant() tenant: TenantContext): Promise<LeadCounts> {
    return this.leads.counts(tenant);
  }

  /**
   * The inbox as a spreadsheet.
   *
   * Returns the string rather than streaming: the cap is five thousand rows,
   * which is a file of a few megabytes at most, and a plain return keeps the
   * tenant scoping in exactly one place.
   */
  @Get("export.csv")
  @Header("content-type", "text/csv; charset=utf-8")
  @Header("cache-control", "no-store")
  async exportCsv(
    @Tenant() tenant: TenantContext,
    @Query() query: Record<string, string | undefined>
  ): Promise<string> {
    const rows = await this.leads.exportRows(tenant, readQuery(query));
    return toCsv(rows, [...EXPORT_FIELDS]);
  }

  @Post("bulk")
  async bulk(
    @Tenant() tenant: TenantContext,
    @ZodBody(bulkSchema) body: z.infer<typeof bulkSchema>
  ): Promise<{ ok: true; affected: number }> {
    const affected = await this.leads.bulk(tenant, body.ids, body.action);
    return { ok: true, affected };
  }

  @Get(":id")
  async get(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ lead: LeadRow }> {
    return { lead: await this.leads.findOne(tenant, id) };
  }

  @Patch(":id")
  async update(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number,
    @ZodBody(patchSchema) body: z.infer<typeof patchSchema>
  ): Promise<{ ok: true }> {
    await this.leads.setStatus(tenant, id, body);
    return { ok: true };
  }

  @Post(":id/resend")
  async resend(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.leads.resend(tenant, id);
    return { ok: true };
  }

  /** Soft delete — recoverable via restore, and never a hard delete. An
      enquiry deleted by mistake is a job lost, so the row stays. */
  @Delete(":id")
  async remove(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.leads.softDelete(tenant, id);
    return { ok: true };
  }

  @Post(":id/restore")
  async restore(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ): Promise<{ ok: true }> {
    await this.leads.restore(tenant, id);
    return { ok: true };
  }
}
