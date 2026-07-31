/**
 * Proves the two schema-wide invariants that everything else is built on.
 *
 *   npm run verify
 *
 * Both are the kind of thing that looks obviously correct in the schema file
 * and fails on contact with a real server, and both fail *silently* — which is
 * why they get an executable check rather than a code review.
 *
 *   1. Soft delete does not poison slugs. A deleted row keeps its slug, so
 *      without the `slug_active` generated column the slug is burned forever
 *      and recreating a deleted service fails against a row that is invisible
 *      in every UI.
 *
 *   2. Tenants are isolated. With one company in the database, a missing
 *      company_id filter behaves perfectly and reveals nothing. It starts
 *      returning another business's rows on the day a second client is
 *      onboarded — long after the code was written. This seeds a throwaway
 *      second company, checks isolation, and removes it.
 *
 * Safe to run against a seeded database: everything it creates is namespaced
 * and removed, and it never touches existing rows.
 */

import { and, eq, sql } from "drizzle-orm";

import { closeDb, getDb } from "./client";
import { companies, services } from "./schema";

const PROBE = "__verify-probe";
const PROBE_COMPANY = "__verify-throwaway";

let failures = 0;

function check(label: string, passed: boolean, detail = ""): void {
  if (passed) {
    console.info(`  ✓ ${label}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main(): Promise<void> {
  const db = getDb();

  const [felmos] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, "felmos"))
    .limit(1);

  if (!felmos) throw new Error("Company 'felmos' not found — run the seed first.");
  const companyA = felmos.id;

  /* Leave no residue from an interrupted previous run. */
  await cleanup(db, companyA);

  /* ── 1. soft delete and slug reuse ───────────────────────────────────── */
  console.info("\nSoft delete:");

  await db.insert(services).values({
    companyId: companyA,
    slug: PROBE,
    title: "Probe A",
    status: "published",
  });

  const live = async (): Promise<number> => {
    const rows = await db
      .select({ id: services.id })
      .from(services)
      .where(
        and(
          eq(services.companyId, companyA),
          eq(services.slug, PROBE),
          eq(services.isDeleted, 0)
        )
      );
    return rows.length;
  };

  check("row is live after insert", (await live()) === 1);

  /* A second LIVE row with the same slug must be rejected. This is the half
     that the naive `UNIQUE (company_id, slug, deleted_at)` silently allows. */
  let rejectedDuplicate = false;
  try {
    await db.insert(services).values({
      companyId: companyA,
      slug: PROBE,
      title: "Probe A duplicate",
    });
  } catch (error) {
    rejectedDuplicate = (error as { code?: string }).code === "ER_DUP_ENTRY";
  }
  check("a second live row with the same slug is rejected", rejectedDuplicate);

  /* Soft delete it. */
  await db
    .update(services)
    .set({ isDeleted: 1, deletedAt: sql`CURRENT_TIMESTAMP(3)` })
    .where(and(eq(services.companyId, companyA), eq(services.slug, PROBE)));

  check("row is excluded from live reads once deleted", (await live()) === 0);

  /* And the slug must now be free again — the whole point of the generated
     column. Without it this insert fails and the slug is unusable forever. */
  let reuseWorked = true;
  let reuseError = "";
  try {
    await db.insert(services).values({
      companyId: companyA,
      slug: PROBE,
      title: "Probe A recreated",
      status: "published",
    });
  } catch (error) {
    reuseWorked = false;
    reuseError = String((error as { message?: string }).message);
  }
  check("the slug can be reused after deletion", reuseWorked, reuseError);
  check("exactly one live row carries the slug again", (await live()) === 1);

  /* ── 2. tenant isolation ─────────────────────────────────────────────── */
  console.info("\nTenant isolation:");

  await db
    .insert(companies)
    .values({ slug: PROBE_COMPANY, name: "Throwaway", status: "active" });

  const [throwaway] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, PROBE_COMPANY))
    .limit(1);

  const companyB = throwaway?.id;
  if (!companyB) throw new Error("Could not create the throwaway company.");

  /* The same slug, already live in company A. Different tenant, so it must be
     permitted — slugs are unique per company, not globally. */
  let crossTenantSlugAllowed = true;
  try {
    await db.insert(services).values({
      companyId: companyB,
      slug: PROBE,
      title: "Probe B",
      status: "published",
    });
  } catch (error) {
    crossTenantSlugAllowed = false;
    console.error("    ", (error as { message?: string }).message);
  }
  check("a slug live in company A can be created in company B", crossTenantSlugAllowed);

  /* The scoped read company A actually performs must not see B's row. */
  const aRows = await db
    .select({ id: services.id, title: services.title })
    .from(services)
    .where(
      and(
        eq(services.companyId, companyA),
        eq(services.slug, PROBE),
        eq(services.isDeleted, 0)
      )
    );
  check(
    "company A's scoped read returns only its own row",
    aRows.length === 1 && aRows[0]?.title === "Probe A recreated",
    `saw ${JSON.stringify(aRows)}`
  );

  /* And the unscoped read that a forgotten filter would produce sees both —
     confirming the isolation above comes from the predicate, not from the
     data happening not to overlap. */
  const allRows = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.slug, PROBE), eq(services.isDeleted, 0)));
  check(
    "an UNSCOPED read sees both tenants (so the filter is what isolates)",
    allRows.length === 2,
    `saw ${allRows.length}`
  );

  await cleanup(db, companyA);

  console.info(
    failures === 0
      ? "\nAll checks passed.\n"
      : `\n${failures} check(s) FAILED.\n`
  );
  if (failures > 0) process.exitCode = 1;
}

async function cleanup(db: ReturnType<typeof getDb>, companyA: number): Promise<void> {
  await db.delete(services).where(eq(services.slug, PROBE));
  const [probe] = await db
    .select({ id: companies.id })
    .from(companies)
    .where(eq(companies.slug, PROBE_COMPANY))
    .limit(1);
  if (probe) {
    await db.delete(services).where(eq(services.companyId, probe.id));
    await db.delete(companies).where(eq(companies.id, probe.id));
  }
  /* Belt and braces: never leave a probe row in the real company. */
  await db
    .delete(services)
    .where(and(eq(services.companyId, companyA), eq(services.slug, PROBE)));
}

main()
  .then(async () => {
    await closeDb();
    process.exit(process.exitCode ?? 0);
  })
  .catch(async (error: unknown) => {
    console.error("[verify] FAILED", error);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
