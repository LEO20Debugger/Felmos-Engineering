import { defineConfig } from "drizzle-kit";

/**
 * Migrations are generated locally and committed as SQL.
 *
 * `drizzle-kit push` is never run against a deployed database: it diffs and
 * applies in one step with no artefact to review, which is fine for a scratch
 * schema and not fine for one holding a client's leads.
 */
export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  strict: true,
  verbose: true,
});
