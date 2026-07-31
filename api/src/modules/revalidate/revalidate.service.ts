import { Global, Inject, Injectable, Module } from "@nestjs/common";
import { eq } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { companies } from "@/db/schema";

/**
 * Tells a tenant's website that something it caches has changed.
 *
 * The site caches content for an hour, which keeps pages fast and the database
 * quiet. Without this, an editor would save a change and then watch the live
 * page not change for up to an hour — which reads as the dashboard being
 * broken. This closes that gap to a second or two.
 *
 * Fire-and-forget, and never allowed to fail a save. A revalidation that
 * doesn't land means the change appears at the next natural cache expiry; an
 * exception here would mean the editor's work appears to have been rejected.
 *
 * The target URL and secret come from the company row rather than environment
 * variables, so a second tenant's edits can never revalidate the first
 * tenant's site.
 */
@Injectable()
export class RevalidateService {
  constructor(@Inject(DB) private readonly db: Db) {}

  emit(companyId: number, tags: string[], paths: string[] = []): void {
    void this.send(companyId, tags, paths);
  }

  private async send(
    companyId: number,
    tags: string[],
    paths: string[]
  ): Promise<void> {
    try {
      const [company] = await this.db
        .select({
          webUrl: companies.webUrl,
          secret: companies.revalidateSecret,
        })
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      let webUrl = company?.webUrl ?? process.env.WEB_URL;
      const secret = company?.secret ?? process.env.REVALIDATE_SECRET;

      if (!webUrl || !secret) return;

      /* Outside production, only ever talk to a local site.
         The company row holds the real domain — correct for the deployed API,
         and a trap for a developer running this against the same database: a
         local edit would otherwise fire a revalidation at the live website,
         flushing its cache from a laptop. */
      if (process.env.NODE_ENV !== "production") {
        const local = process.env.WEB_URL ?? "http://localhost:3000";
        if (!/^https?:\/\/(localhost|127\.0\.0\.1)/.test(webUrl)) {
          console.info(
            `[revalidate] development: redirecting ${webUrl} → ${local}`
          );
          webUrl = local;
        }
      }

      const response = await fetch(`${webUrl}/api/revalidate`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-revalidate-secret": secret,
        },
        body: JSON.stringify({ tags, paths }),
        /* A hung website must not leave this promise pending forever. */
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        console.warn(
          `[revalidate] ${webUrl} returned ${response.status} for [${tags.join(", ")}]`
        );
      }
    } catch (error) {
      console.warn(
        `[revalidate] could not reach the site for [${tags.join(", ")}]:`,
        (error as { message?: string }).message ?? error
      );
    }
  }
}

@Global()
@Module({
  providers: [RevalidateService],
  exports: [RevalidateService],
})
export class RevalidateModule {}
