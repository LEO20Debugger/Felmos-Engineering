/**
 * Creates the first dashboard account.
 *
 *   npm run create-owner -- --email=you@example.com --name="Your Name"
 *
 * There is no public signup, so this is the only way an owner comes into
 * existence. Everyone after them arrives by invitation from inside the
 * dashboard.
 *
 * The password is prompted for, never taken as an argument. A password on the
 * command line ends up in shell history, in `ps` output while the process
 * runs, and — when this is invoked through `railway run` — in Railway's own
 * deploy logs, where it is retained and visible to anyone with project access.
 */

import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";

import { eq, and } from "drizzle-orm";

import { closeDb, getDb } from "./client";
import { companies, users } from "./schema";
import { hashPassword } from "@/common/hashing";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

/**
 * Read a line with the terminal echo suppressed.
 *
 * readline has no built-in masked input, so this mutes the output stream while
 * the answer is typed. On a terminal that doesn't support raw mode the
 * characters would be visible — acceptable, since the alternative is refusing
 * to run at all.
 */
function prompt(question: string, masked = false): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });

  return new Promise((resolve) => {
    if (masked) {
      const output = rl as unknown as { output: NodeJS.WriteStream };
      const original = output.output.write.bind(output.output);
      output.output.write = ((chunk: string) =>
        original(chunk.includes(question) ? chunk : "")) as never;

      rl.question(question, (answer) => {
        output.output.write = original as never;
        stdout.write("\n");
        rl.close();
        resolve(answer);
      });
      return;
    }

    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main(): Promise<void> {
  const db = getDb();

  const companySlug = arg("company-slug") ?? "felmos";
  const email = (arg("email") ?? (await prompt("Email: "))).trim().toLowerCase();
  const name = arg("name") ?? (await prompt("Full name: ")).trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    throw new Error(`"${email}" is not a valid email address.`);
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
    throw new Error(
      `${email} already has an account at ${company.name}. To reset the ` +
        `password, use the dashboard rather than this script.`
    );
  }

  /* OWNER_PASSWORD lets this run unattended (CI, scripted provisioning).
     An environment variable rather than an argument: argv is visible in `ps`
     while the process runs and is recorded by shell history and Railway's
     deploy logs, whereas an env var is only visible to the process itself. */
  const fromEnv = process.env.OWNER_PASSWORD;
  const password = fromEnv ?? (await prompt("Password (hidden): ", true));

  if (password.length < 12) {
    /* A length floor rather than a composition rule. Character-class
       requirements push people toward predictable substitutions; length is
       what actually costs an attacker. */
    throw new Error("Password must be at least 12 characters.");
  }

  /* Only ask for confirmation when a human typed it — there is nothing to
     mistype when it came from the environment. */
  if (!fromEnv) {
    const confirm = await prompt("Confirm password: ", true);
    if (password !== confirm) {
      throw new Error("Passwords did not match. Nothing was written.");
    }
  }

  await db.insert(users).values({
    companyId: company.id,
    email,
    name: name || email,
    passwordHash: await hashPassword(password),
    role: "owner",
    status: "active",
  });

  console.info(`\n[create-owner] ${email} is now an owner at ${company.name}.`);
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(
      `\n[create-owner] ${(error as { message?: string }).message ?? String(error)}`
    );
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
