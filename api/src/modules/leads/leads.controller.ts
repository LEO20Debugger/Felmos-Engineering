import {
  Controller,
  Get,
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
import { LeadsService, type LeadRow } from "./leads.service";

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

const patchSchema = z.object({
  status: z
    .enum(["new", "contacted", "quoted", "won", "lost", "spam"])
    .optional(),
  internalNotes: z.string().max(5000).optional(),
});

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
    @Query("status") status?: string
  ): Promise<{ leads: LeadRow[] }> {
    return { leads: await this.leads.list(tenant, { status }) };
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
}
