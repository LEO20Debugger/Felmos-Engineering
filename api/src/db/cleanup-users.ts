import { notInArray, inArray } from "drizzle-orm";
import { closeDb, getDb } from "./client";
import { users, refreshTokens } from "./schema";

async function main(): Promise<void> {
  const db = getDb();
  const keepEmails = ["leonard6oba@gmail.com", "felmosengineering@gmail.com"];

  // Find IDs of users to keep
  const keepUsers = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, keepEmails));

  const keepIds = keepUsers.map((u) => u.id);
  console.info("[cleanup] Keeping users:", keepUsers);

  // Hard delete refresh tokens of users to be deleted
  const deleteTokensResult = await db
    .delete(refreshTokens)
    .where(notInArray(refreshTokens.userId, keepIds));
  console.info("[cleanup] Deleted refresh tokens for other users.");

  // Hard delete users not in keep list
  const deleteUsersResult = await db
    .delete(users)
    .where(notInArray(users.email, keepEmails));
  console.info("[cleanup] Hard deleted all other accounts.");

  // List remaining users
  const remaining = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      status: users.status,
    })
    .from(users);

  console.info("\n[cleanup] Remaining active users in database:");
  console.table(remaining);
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (err: unknown) => {
    console.error("\n[cleanup] Error during cleanup:", err);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
