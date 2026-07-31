/**
 * Prints the deployment-relevant fields of each company.
 *
 *   npm run check-company
 *
 * Worth having as a command rather than a one-off query: `webUrl` is what the
 * API calls to flush a site's cache and what it puts in lead notification
 * links, and if it is wrong nothing errors — edits just quietly never appear.
 * That is a hard failure to diagnose and a trivial one to check.
 */

import { eq } from "drizzle-orm";

import { closeDb, getDb } from "./client";
import { companies } from "./schema";

/**
 * Optionally repoint a company at its canonical domain:
 *
 *   npm run check-company -- --slug=felmos --set-web-url=https://www.example.com
 *
 * The canonical form matters. If the site redirects www to non-www (or the
 * reverse) and this holds the redirecting one, every revalidation request and
 * every link in a lead notification takes an extra hop — and a POST that gets
 * redirected across hosts is exactly the sort of thing that works in testing
 * and fails quietly in production.
 */
async function main(): Promise<void> {
  const arg = (name: string): string | undefined =>
    process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

  const setWebUrl = arg("set-web-url");

  if (setWebUrl) {
    const slug = arg("slug") ?? "felmos";
    const url = setWebUrl.replace(/\/+$/, "");

    await getDb()
      .update(companies)
      .set({
        webUrl: url,
        /* Kept in step deliberately: allowedOrigins gates the analytics
           beacon, and leaving it on the old host would reject every beacon
           from the site that is actually being served. */
        allowedOrigins: [url],
      })
      .where(eq(companies.slug, slug));

    console.info(`[check-company] ${slug} → ${url}`);
  }

  const rows = await getDb()
    .select({
      id: companies.id,
      slug: companies.slug,
      name: companies.name,
      status: companies.status,
      webUrl: companies.webUrl,
      allowedOrigins: companies.allowedOrigins,
      hasRevalidateSecret: companies.revalidateSecret,
    })
    .from(companies);

  for (const row of rows) {
    console.info({
      ...row,
      /* Never print the secret itself — only whether one is set. A null here
         is fine: the API falls back to REVALIDATE_SECRET from the
         environment. */
      hasRevalidateSecret: Boolean(row.hasRevalidateSecret),
    });
  }
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
