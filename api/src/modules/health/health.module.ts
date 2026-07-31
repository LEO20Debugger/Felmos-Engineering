import { Controller, Get, Inject, Module } from "@nestjs/common";
import { sql } from "drizzle-orm";

import { DB } from "@/db/db.module";
import type { Db } from "@/db/client";
import { mediaRoot } from "@/common/media-root";

@Controller("health")
class HealthController {
  constructor(@Inject(DB) private readonly db: Db) {}

  /**
   * Railway's healthcheck target.
   *
   * It queries the database rather than just returning 200: an API that can
   * answer HTTP but not reach MySQL is not healthy, and letting a deploy go
   * green in that state means the rollback that should have happened doesn't.
   */
  @Get()
  async check(): Promise<{
    ok: boolean;
    db: boolean;
    mediaRoot: string;
    uptimeSeconds: number;
  }> {
    let dbOk = false;
    try {
      await this.db.execute(sql`SELECT 1`);
      dbOk = true;
    } catch (error) {
      console.error("[health] database unreachable", error);
    }

    return {
      ok: dbOk,
      db: dbOk,
      mediaRoot: mediaRoot(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}

@Module({ controllers: [HealthController] })
export class HealthModule {}
