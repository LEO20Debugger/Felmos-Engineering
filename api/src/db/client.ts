import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

import * as schema from "./schema";

export type Db = MySql2Database<typeof schema>;

let pool: mysql.Pool | undefined;

/**
 * The connection pool.
 *
 * `timezone: "Z"` together with every datetime column being read as a string
 * (see _base.ts) keeps time handling boring: the database stores UTC, the
 * driver does not reinterpret it against the container's locale, and
 * formatting happens once at the render layer. Skipping this is how a blog
 * date renders as the 4th on the server and the 3rd in the browser.
 */
export function getPool(): mysql.Pool {
  if (!pool) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. On Railway use the MySQL service's private " +
          "connection URL; locally, point it at your own MySQL 8 instance."
      );
    }

    pool = mysql.createPool({
      uri: url,
      /* Railway's MySQL plugin allows a modest number of connections and the
         API is single-replica by necessity (it serves images off a volume that
         can only attach to one instance), so a large pool buys nothing and
         risks exhausting the server's limit. */
      connectionLimit: 10,
      waitForConnections: true,
      queueLimit: 0,
      timezone: "Z",
      dateStrings: true,
      /* Surfaces a dead connection as an error on the next query rather than
         a request that hangs until the client gives up. */
      enableKeepAlive: true,
      keepAliveInitialDelay: 10_000,
    });
  }

  return pool;
}

let db: Db | undefined;

export function getDb(): Db {
  if (!db) {
    db = drizzle(getPool(), { schema, mode: "default" });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
    db = undefined;
  }
}
