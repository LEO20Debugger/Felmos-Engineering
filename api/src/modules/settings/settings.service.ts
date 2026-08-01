import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { eq, and, asc } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { siteSettings, mailRecipients } from "@/db/schema";
import { TenantContext } from "@/common/tenant-context";
import { BrandService } from "@/modules/mail/brand";
import { MailService } from "@/modules/mail/mail.service";

export type UpdateSettingsInput = {
  name?: string;
  shortName?: string | null;
  tagline?: string | null;
  description?: string | null;
  url?: string | null;
  phone?: string | null;
  phoneHref?: string | null;
  secondaryPhone?: string | null;
  secondaryPhoneHref?: string | null;
  email?: string | null;
  emailHref?: string | null;
  addressStreet?: string | null;
  addressLocality?: string | null;
  addressRegion?: string | null;
  addressPostalCode?: string | null;
  addressCountry?: string | null;
  addressShort?: string | null;
  addressFull?: string | null;
  geoLat?: string | number | null;
  geoLng?: string | number | null;
  hours?: string | null;
  hoursStructured?: string[];
  founded?: number | null;
  socials?: { label: string; href: string; icon: string }[];
};

export type MailRecipientInput = {
  email: string;
  name?: string | null;
  role: "to" | "cc" | "bcc";
  active?: boolean;
};

@Injectable()
export class SettingsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    /* Provided globally by LeadsModule. Injected here so a recipient change
       takes effect on the next submission rather than up to a minute later —
       whoever just added an address is usually about to test it. */
    private readonly mail: MailService,
    /* Same reasoning for the details emails are signed with. */
    private readonly brand: BrandService
  ) {}

  async getSettings(tenant: TenantContext) {
    const [settings] = await this.db
      .select()
      .from(siteSettings)
      .where(
        and(
          eq(siteSettings.companyId, tenant.companyId),
          eq(siteSettings.isDeleted, 0)
        )
      )
      .limit(1);

    const recipients = await this.db
      .select()
      .from(mailRecipients)
      .where(
        and(
          eq(mailRecipients.companyId, tenant.companyId),
          eq(mailRecipients.isDeleted, 0)
        )
      )
      .orderBy(asc(mailRecipients.sortOrder), asc(mailRecipients.id));

    return { settings: settings ?? null, mailRecipients: recipients };
  }

  async updateSettings(tenant: TenantContext, input: UpdateSettingsInput) {
    const [existing] = await this.db
      .select({ id: siteSettings.id })
      .from(siteSettings)
      .where(
        and(
          eq(siteSettings.companyId, tenant.companyId),
          eq(siteSettings.isDeleted, 0)
        )
      )
      .limit(1);

    const data: Record<string, unknown> = {
      updatedBy: tenant.actorUserId,
    };

    if (input.name !== undefined) data.name = input.name;
    if (input.shortName !== undefined) data.shortName = input.shortName;
    if (input.tagline !== undefined) data.tagline = input.tagline;
    if (input.description !== undefined) data.description = input.description;
    if (input.url !== undefined) data.url = input.url;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.phoneHref !== undefined) data.phoneHref = input.phoneHref;
    if (input.secondaryPhone !== undefined) data.secondaryPhone = input.secondaryPhone;
    if (input.secondaryPhoneHref !== undefined) data.secondaryPhoneHref = input.secondaryPhoneHref;
    if (input.email !== undefined) data.email = input.email;
    if (input.emailHref !== undefined) data.emailHref = input.emailHref;
    if (input.addressStreet !== undefined) data.addressStreet = input.addressStreet;
    if (input.addressLocality !== undefined) data.addressLocality = input.addressLocality;
    if (input.addressRegion !== undefined) data.addressRegion = input.addressRegion;
    if (input.addressPostalCode !== undefined) data.addressPostalCode = input.addressPostalCode;
    if (input.addressCountry !== undefined) data.addressCountry = input.addressCountry;
    if (input.addressShort !== undefined) data.addressShort = input.addressShort;
    if (input.addressFull !== undefined) data.addressFull = input.addressFull;
    if (input.geoLat !== undefined) data.geoLat = input.geoLat !== null ? String(input.geoLat) : null;
    if (input.geoLng !== undefined) data.geoLng = input.geoLng !== null ? String(input.geoLng) : null;
    if (input.hours !== undefined) data.hours = input.hours;
    if (input.hoursStructured !== undefined) data.hoursStructured = input.hoursStructured;
    if (input.founded !== undefined) data.founded = input.founded;
    if (input.socials !== undefined) data.socials = input.socials;

    if (existing) {
      await this.db
        .update(siteSettings)
        .set(data as never)
        .where(eq(siteSettings.id, existing.id));
    } else {
      await this.db.insert(siteSettings).values({
        companyId: tenant.companyId,
        name: input.name ?? "Company Settings",
        ...data,
      } as never);
    }

    this.brand.invalidate(tenant.companyId);
    return this.getSettings(tenant);
  }

  async createMailRecipient(tenant: TenantContext, input: MailRecipientInput) {
    const normalised = input.email.trim().toLowerCase();

    const [existing] = await this.db
      .select({ id: mailRecipients.id })
      .from(mailRecipients)
      .where(
        and(
          eq(mailRecipients.companyId, tenant.companyId),
          eq(mailRecipients.emailActive, normalised)
        )
      )
      .limit(1);

    if (existing) {
      throw new BadRequestException(
        `"${normalised}" is already in the recipient list.`
      );
    }

    await this.db.insert(mailRecipients).values({
      companyId: tenant.companyId,
      email: normalised,
      name: input.name?.trim() || null,
      role: input.role ?? "to",
      active: input.active === false ? 0 : 1,
      createdBy: tenant.actorUserId,
    } as never);

    this.mail.invalidate(tenant.companyId);
    return this.getSettings(tenant);
  }

  async updateMailRecipient(
    tenant: TenantContext,
    id: number,
    input: Partial<MailRecipientInput>
  ) {
    const [recipient] = await this.db
      .select()
      .from(mailRecipients)
      .where(
        and(
          eq(mailRecipients.id, id),
          eq(mailRecipients.companyId, tenant.companyId),
          eq(mailRecipients.isDeleted, 0)
        )
      )
      .limit(1);

    if (!recipient) {
      throw new NotFoundException("Mail recipient not found.");
    }

    if (input.active === false || input.role === "cc" || input.role === "bcc") {
      const activeToRecipients = await this.db
        .select({ id: mailRecipients.id })
        .from(mailRecipients)
        .where(
          and(
            eq(mailRecipients.companyId, tenant.companyId),
            eq(mailRecipients.isDeleted, 0),
            eq(mailRecipients.active, 1),
            eq(mailRecipients.role, "to")
          )
        );

      if (
        activeToRecipients.length === 1 &&
        activeToRecipients[0]?.id === recipient.id
      ) {
        throw new BadRequestException(
          "Cannot deactivate or change role of the last active 'To' recipient."
        );
      }
    }

    const data: Record<string, unknown> = {
      updatedBy: tenant.actorUserId,
    };

    if (input.email !== undefined) {
      const normalised = input.email.trim().toLowerCase();
      data.email = normalised;
    }
    if (input.name !== undefined) data.name = input.name?.trim() || null;
    if (input.role !== undefined) data.role = input.role;
    if (input.active !== undefined) data.active = input.active ? 1 : 0;

    await this.db
      .update(mailRecipients)
      .set(data as never)
      .where(eq(mailRecipients.id, recipient.id));

    this.mail.invalidate(tenant.companyId);
    return this.getSettings(tenant);
  }

  async deleteMailRecipient(tenant: TenantContext, id: number) {
    const [recipient] = await this.db
      .select()
      .from(mailRecipients)
      .where(
        and(
          eq(mailRecipients.id, id),
          eq(mailRecipients.companyId, tenant.companyId),
          eq(mailRecipients.isDeleted, 0)
        )
      )
      .limit(1);

    if (!recipient) {
      throw new NotFoundException("Mail recipient not found.");
    }

    if (recipient.active === 1 && recipient.role === "to") {
      const activeToRecipients = await this.db
        .select({ id: mailRecipients.id })
        .from(mailRecipients)
        .where(
          and(
            eq(mailRecipients.companyId, tenant.companyId),
            eq(mailRecipients.isDeleted, 0),
            eq(mailRecipients.active, 1),
            eq(mailRecipients.role, "to")
          )
        );

      if (activeToRecipients.length <= 1) {
        throw new BadRequestException(
          "At least one active 'To' recipient must remain."
        );
      }
    }

    await this.db
      .update(mailRecipients)
      .set({
        isDeleted: 1,
        deletedAt: new Date().toISOString().replace("T", " ").slice(0, 23),
        deletedBy: tenant.actorUserId,
      } as never)
      .where(eq(mailRecipients.id, recipient.id));

    this.mail.invalidate(tenant.companyId);
    return this.getSettings(tenant);
  }
}
