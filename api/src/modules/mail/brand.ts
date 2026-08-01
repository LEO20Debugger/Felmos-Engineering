/**
 * The business details every outgoing email is signed with.
 *
 * Read from `site_settings` rather than hardcoded or taken from env: the
 * dashboard already owns the phone number, address and hours, and an email
 * footer that disagrees with the website's own footer is worse than no footer.
 *
 * Cached per company for five minutes. These change roughly never, and mail is
 * sent from a fire-and-forget path where an extra round trip is pure latency on
 * something the visitor is already waiting behind.
 */

import { Inject, Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { companies, siteSettings } from "@/db/schema";

export type Brand = {
  name: string;
  phone: string | null;
  phoneHref: string | null;
  email: string | null;
  url: string | null;
  address: string | null;
  hours: string | null;
  /** Where the dashboard lives, for the "open this lead" link. */
  adminUrl: string;
  /**
   * Absolute URL of the logo for email headers, or null when the site URL is
   * unknown.
   *
   * A PNG served off the public site rather than the inline SVG the site
   * itself uses: Gmail and Outlook both strip `<svg>` out of mail entirely, so
   * the site's own Logo component cannot be reused here. It must also be
   * absolute — a relative path in an email resolves against the mail client,
   * not against the site.
   */
  logoUrl: string | null;
};

const CACHE_MS = 5 * 60_000;

@Injectable()
export class BrandService {
  private readonly cached = new Map<number, { at: number; value: Brand }>();

  constructor(@Inject(DB) private readonly db: Db) {}

  async get(companyId: number): Promise<Brand> {
    const hit = this.cached.get(companyId);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.value;

    const [settings] = await this.db
      .select({
        name: siteSettings.name,
        phone: siteSettings.phone,
        phoneHref: siteSettings.phoneHref,
        email: siteSettings.email,
        url: siteSettings.url,
        address: siteSettings.addressFull,
        addressShort: siteSettings.addressShort,
        hours: siteSettings.hours,
      })
      .from(siteSettings)
      .where(
        and(
          eq(siteSettings.companyId, companyId),
          eq(siteSettings.isDeleted, 0)
        )
      )
      .limit(1);

    const [company] = await this.db
      .select({ name: companies.name, webUrl: companies.webUrl })
      .from(companies)
      .where(eq(companies.id, companyId))
      .limit(1);

    const siteUrl = (settings?.url ?? company?.webUrl ?? "").replace(/\/+$/, "");

    const value: Brand = {
      /* Falls back through the company row to a generic label rather than
         rendering an empty header — an email that arrives titled "" reads as
         broken, and settings may legitimately not be filled in yet. */
      name: settings?.name ?? company?.name ?? "Inspection requests",
      phone: settings?.phone ?? null,
      phoneHref: settings?.phoneHref ?? settings?.phone ?? null,
      email: settings?.email ?? null,
      url: settings?.url ?? company?.webUrl ?? null,
      address: settings?.address ?? settings?.addressShort ?? null,
      hours: settings?.hours ?? null,
      adminUrl: (company?.webUrl ?? process.env.WEB_URL ?? "").replace(/\/+$/, ""),
      /* Served by Next from web/app/apple-icon.png. Skipped entirely rather
         than guessed at when there is no site URL — a broken image in the
         header looks worse than no image. */
      logoUrl: siteUrl ? `${siteUrl}/apple-icon.png` : null,
    };

    this.cached.set(companyId, { at: Date.now(), value });
    return value;
  }

  invalidate(companyId?: number): void {
    if (companyId === undefined) this.cached.clear();
    else this.cached.delete(companyId);
  }
}
