import { Module } from "@nestjs/common";

import { DbModule } from "@/db/db.module";
import { RevalidateModule } from "@/modules/revalidate/revalidate.service";
import { SettingsService } from "./settings.service";
import { AdminSettingsController } from "./settings.controller";

@Module({
  imports: [DbModule, RevalidateModule],
  controllers: [AdminSettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
