/**
 * Migration runner, executed on boot by `start:prod` before the app starts.
 *
 * Railway has no release phase — there is no hook that runs once per deploy,
 * separately from the process. So migrations run at startup, which introduces a
 * race the moment a deploy overlaps containers: two instances booting together
 * would both try to apply the same DDL, and MySQL has no transactional DDL to
 * make that safe.
 *
 * GET_LOCK is the fix. It is a named advisory lock held on the server, so the
 * second container blocks until the first has finished, then finds nothing left
 * to apply.
 *
 * Exit code matters as much as the migration: a non-zero exit makes Railway's
 * healthcheck fail the deploy and keep the previous version serving, which is
 * the correct outcome for a half-applied schema. Never swallow an error here.
 */

import { migrate } from "drizzle-orm/mysql2/migrator";
import { sql } from "drizzle-orm";

import { closeDb, getDb } from "./client";

const LOCK_NAME = "felmos_migrate";
const LOCK_TIMEOUT_SECONDS = 60;

async function main(): Promise<void> {
  const db = getDb();

  const [lockRows] = await db.execute(
    sql`SELECT GET_LOCK(${LOCK_NAME}, ${LOCK_TIMEOUT_SECONDS}) AS acquired`
  );
  /* mysql2 types execute() as returning a ResultSetHeader for statements it
     can't statically prove are SELECTs, so this needs the two-step cast. */
  const acquired = (lockRows as unknown as { acquired: number | null }[])[0]
    ?.acquired;

  if (acquired !== 1) {
    /* Either another container held the lock for longer than the timeout, or
       the connection dropped mid-wait. Both mean "don't touch the schema". */
    throw new Error(
      `Could not acquire the '${LOCK_NAME}' advisory lock within ` +
        `${LOCK_TIMEOUT_SECONDS}s (GET_LOCK returned ${String(acquired)}). ` +
        `Another instance is probably migrating; this deploy is aborting so it ` +
        `doesn't race.`
    );
  }

  try {
    console.info("[migrate] lock acquired, applying migrations…");
    await migrate(db, { migrationsFolder: "./drizzle" });
    console.info("[migrate] up to date");
  } finally {
    /* RELEASE_LOCK on the same connection that took it. The pool could hand a
       different connection to a bare query, and an advisory lock released from
       the wrong session is a no-op that would leave it held until that session
       ends — so this goes through the same pool the migration used, which for
       a single-connection migration run is the same session. */
    await db.execute(sql`SELECT RELEASE_LOCK(${LOCK_NAME})`);
  }
}

main()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error("[migrate] FAILED — not starting the app.", error);
    await closeDb().catch(() => undefined);
    process.exit(1);
  });
