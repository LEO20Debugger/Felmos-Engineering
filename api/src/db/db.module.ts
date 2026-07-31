import { Global, Module } from "@nestjs/common";

import { getDb, type Db } from "./client";

export const DB = Symbol("DB");

/**
 * The Drizzle instance, injectable as `@Inject(DB)`.
 *
 * Global because nearly every module needs it and threading an import through
 * each one adds noise without adding isolation — the isolation that matters
 * here is tenant scoping, which lives in TenantRepository, not in the module
 * graph.
 */
@Global()
@Module({
  providers: [{ provide: DB, useFactory: (): Db => getDb() }],
  exports: [DB],
})
export class DbModule {}
