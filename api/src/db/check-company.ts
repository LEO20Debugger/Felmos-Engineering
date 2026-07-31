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

import { closeDb, getDb } from "./client";
import { companies } from "./schema";

async function main(): Promise<void> {
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
