import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { z } from "zod";

import { Tenant } from "@/common/tenant.decorator";
import type { TenantContext } from "@/common/tenant-context";
import { ZodBody } from "@/common/zod.pipe";
import { JwtAccessGuard, RolesGuard, Roles } from "@/modules/auth/auth.guards";
import { RevalidateService } from "@/modules/revalidate/revalidate.service";
import { SettingsService } from "./settings.service";

const updateSettingsSchema = z.object({
  name: z.string().min(1, "Company name is required.").optional(),
  shortName: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  url: z.string().nullable().optional(),

  phone: z.string().nullable().optional(),
  phoneHref: z.string().nullable().optional(),
  secondaryPhone: z.string().nullable().optional(),
  secondaryPhoneHref: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  emailHref: z.string().nullable().optional(),

  addressStreet: z.string().nullable().optional(),
  addressLocality: z.string().nullable().optional(),
  addressRegion: z.string().nullable().optional(),
  addressPostalCode: z.string().nullable().optional(),
  addressCountry: z.string().nullable().optional(),
  addressShort: z.string().nullable().optional(),
  addressFull: z.string().nullable().optional(),

  geoLat: z.union([z.string(), z.number()]).nullable().optional(),
  geoLng: z.union([z.string(), z.number()]).nullable().optional(),

  hours: z.string().nullable().optional(),
  hoursStructured: z.array(z.string()).optional(),
  founded: z.number().int().positive().nullable().optional(),

  socials: z
    .array(
      z.object({
        label: z.string(),
        href: z.string(),
        icon: z.string(),
      })
    )
    .optional(),
});

const mailRecipientSchema = z.object({
  email: z.string().email("Valid email address required."),
  name: z.string().nullable().optional(),
  role: z.enum(["to", "cc", "bcc"]).default("to"),
  active: z.boolean().optional(),
});

const updateMailRecipientSchema = mailRecipientSchema.partial();

@Controller("admin/settings")
@UseGuards(JwtAccessGuard, RolesGuard)
@Roles("owner")
export class AdminSettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly revalidate: RevalidateService
  ) {}

  private refresh(companyId: number): void {
    this.revalidate.emit(companyId, ["settings"], ["/", "/about", "/contact"]);
  }

  @Get()
  async get(@Tenant() tenant: TenantContext) {
    return this.settingsService.getSettings(tenant);
  }

  @Patch()
  async update(
    @Tenant() tenant: TenantContext,
    @ZodBody(updateSettingsSchema) body: z.infer<typeof updateSettingsSchema>
  ) {
    const res = await this.settingsService.updateSettings(
      tenant,
      body as never
    );
    this.refresh(tenant.companyId);
    return res;
  }

  @Post("mail-recipients")
  async createRecipient(
    @Tenant() tenant: TenantContext,
    @ZodBody(mailRecipientSchema) body: z.infer<typeof mailRecipientSchema>
  ) {
    return this.settingsService.createMailRecipient(tenant, body as never);
  }

  @Patch("mail-recipients/:id")
  async updateRecipient(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number,
    @ZodBody(updateMailRecipientSchema)
    body: z.infer<typeof updateMailRecipientSchema>
  ) {
    return this.settingsService.updateMailRecipient(tenant, id, body as never);
  }

  @Delete("mail-recipients/:id")
  async deleteRecipient(
    @Tenant() tenant: TenantContext,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.settingsService.deleteMailRecipient(tenant, id);
  }
}
