/**
 * The whole schema, in one import.
 *
 * Drizzle's query builder needs every table and every `relations()` declaration
 * registered together, so this file re-exports all of them rather than letting
 * modules import individual schema files.
 *
 * Note for anyone adding a table: import the shared column blocks from
 * ./_base rather than redeclaring `company_id`, the timestamps or the
 * soft-delete pair by hand. Two of those — the `slug_active` generated column
 * and the matching unique index — are easy to leave out, and the failure mode
 * ("I can't recreate the thing I deleted last month") shows up long after the
 * table ships.
 */

export * from "./_base";
export * from "./tenancy";
export * from "./media";
export * from "./content";
export * from "./auth";
export * from "./settings";
export * from "./leads";
export * from "./analytics";
