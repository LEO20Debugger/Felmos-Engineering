/**
 * Changes an account's password.
 *
 *   npm run set-password -- --email=you@example.com
 *
 * Prompts with the echo suppressed. There is no --password flag on purpose:
 * an argument lands in shell history, in `ps` output while the process runs,
 * and in Railway's retained deploy logs when invoked through `railway run`.
 *
 * Every existing session is ended as part of the change. That is the point of
 * changing a password — if the old one leaked, whoever has it may already be
 * signed in, and leaving their refresh token valid for thirty more days would
 * make the reset cosmetic.
 */

import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { and, eq, isNull } from "drizzle-orm";

import { closeDb, getDb } from "./client";
import { refreshTokens, users } from "./schema";
import { hashPassword } from "@/common/hashing";

function arg(name: string): string | undefined {
  return process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
}

function prompt(question: string, masked = false): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout, terminal: true });

  return new Promise((resolve) => {
    if (masked) {
      const out = rl as unknown as { output: NodeJS.WriteStream };
      const original = out.output.write.bind(out.output);
      out.output.write = ((chunk: string) =>
        original(chunk.includes(question) ? chunk : "")) as never;

      rl.question(question, (answer) => {
        out.output.write = original as never;
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

  const email = (arg("email") ?? (await prompt("Email: "))).trim().toLowerCase();

  const [user] = await db
    .select({ id: users.id, name: users.name, companyId: users.companyId })
    .from(users)
    .where(and(eq(users.email, email), eq(users.isDeleted, 0)))
    .limit(1);

  if (!user) throw new Error(`No account for ${email}.`);

  const password = process.env.NEW_PASSWORD ?? (await prompt("New password (hidden): ", true));

  if (password.length < 12) {
    /* A length floor and no composition rules: character-class requirements
       push people toward predictable substitutions, whereas length is what
       actually costs an attacker. */
    throw new Error("Password must be at least 12 characters.");
  }

  if (!process.env.NEW_PASSWORD) {
    const confirm = await prompt("Confirm: ", true);
    if (password !== confirm) throw new Error("Passwords did not match. Nothing changed.");
  }

  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password) })
    .where(eq(users.id, user.id));

  const [result] = await db
    .update(refreshTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(and(eq(refreshTokens.userId, user.id), isNull(refreshTokens.revokedAt)));

  const ended = (result as unknown as { affectedRows?: number }).affectedRows ?? 0;

  console.info(
    `\n[set-password] updated ${email}` +
      (ended > 0 ? ` and ended ${ended} active session(s).` : ".")
  );
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(`\n[set-password] ${(error as { message?: string }).message ?? error}`);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
