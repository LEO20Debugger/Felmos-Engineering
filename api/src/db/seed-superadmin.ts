import { eq, and } from "drizzle-orm";
import { closeDb, getDb } from "./client";
import { companies, users } from "./schema";
import { hashPassword } from "@/common/hashing";

async function main(): Promise<void> {
  const db = getDb();
  const companySlug = "felmos";

  const [company] = await db
    .select({ id: companies.id, name: companies.name })
    .from(companies)
    .where(and(eq(companies.slug, companySlug), eq(companies.isDeleted, 0)))
    .limit(1);

  if (!company) {
    throw new Error(`Company "${companySlug}" not found. Run seed first.`);
  }

  const passwordHash = await hashPassword("Password1234");
  const emails = ["felmosengineering@gmail.com"];

  for (const email of emails) {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.companyId, company.id),
          eq(users.email, email),
          eq(users.isDeleted, 0)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(users)
        .set({
          name: "Super Admin",
          passwordHash,
          role: "owner",
          status: "active",
        })
        .where(eq(users.id, existing.id));
      console.info(`[superadmin] Updated existing account: ${email}`);
    } else {
      await db.insert(users).values({
        companyId: company.id,
        email,
        name: "Super Admin",
        passwordHash,
        role: "owner",
        status: "active",
      });
      console.info(`[superadmin] Created new account: ${email}`);
    }
  }

  console.info("\n[superadmin] Done! Super Admin account ready with password 'Password1234'.");
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error("\n[superadmin] Error:", err);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
