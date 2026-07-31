/**
 * Mints an API key for a company.
 *
 *   npm run create-api-key -- --label="Vercel production" --scope=internal
 *
 * Two scopes, and the difference is not cosmetic:
 *
 *   internal — held by a trusted server (the site's server-side fetchers).
 *              Reads that company's published content and files leads. Must
 *              never reach a browser.
 *
 *   public   — embedded in browser JavaScript for the analytics beacon. Assume
 *              it is public knowledge, because it will be. It identifies a
 *              tenant and authorises nothing beyond "record a pageview", and is
 *              additionally gated on the company's allowed origins.
 *
 * The plaintext is printed once and never stored — only its sha256 goes into
 * the database. If it is lost, mint another and revoke this one; there is no
 * way to recover it, which is the point.
 */

import { and, eq } from "drizzle-orm";

import { closeDb, getDb } from "./client";
import { apiKeys, companies } from "./schema";
import { generateToken, hashToken } from "@/common/hashing";

function arg(name: string, fallback?: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
}

async function main(): Promise<void> {
  const db = getDb();

  const companySlug = arg("company-slug", "felmos") as string;
  const label = arg("label", "Local development") as string;
  const scope = arg("scope", "internal") as "internal" | "public";

  if (scope !== "internal" && scope !== "public") {
    throw new Error(`--scope must be "internal" or "public", got "${scope}".`);
  }

  const [company] = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(and(eq(companies.slug, companySlug), eq(companies.isDeleted, 0)))
    .limit(1);

  if (!company) {
    throw new Error(
      `No company with slug "${companySlug}". Run \`npm run seed\` first.`
    );
  }

  const key = generateToken();

  await db.insert(apiKeys).values({
    companyId: company.id,
    label,
    scope,
    keyHash: hashToken(key),
  });

  console.info(
    `\n[create-api-key] ${scope} key for ${company.name} — "${label}"\n\n` +
      `  ${key}\n\n` +
      `Shown once and not recoverable. Put it in the consuming app's env:\n` +
      (scope === "internal"
        ? `  web/.env.local → INTERNAL_API_KEY=${key}\n`
        : `  web/.env.local → NEXT_PUBLIC_COMPANY_KEY=${key}\n`)
  );
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(
      `\n[create-api-key] ${(error as { message?: string }).message ?? String(error)}`
    );
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
