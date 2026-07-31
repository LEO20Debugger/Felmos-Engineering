import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./modules/auth/auth.module";
import { ContentModule } from "./modules/content/content.module";
import { DbModule } from "./db/db.module";
import { HealthModule } from "./modules/health/health.module";
import { LeadsModule } from "./modules/leads/leads.module";
import { MediaModule } from "./modules/media/media.module";
import { MetaModule } from "./modules/meta/meta.module";
import { RevalidateModule } from "./modules/revalidate/revalidate.service";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    ScheduleModule.forRoot(),

    /* A floor, not the real defence. The analytics beacon sets its own tighter
       per-hash limit; this stops a single client hammering any endpoint. */
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),

    DbModule,
    RevalidateModule,
    AuthModule,
    ContentModule,
    HealthModule,
    LeadsModule,
    MediaModule,
    MetaModule,
  ],
})
export class AppModule {}
