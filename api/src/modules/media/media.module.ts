import { Module } from "@nestjs/common";

import { AdminMediaController, MediaServeController } from "./media.controller";
import { MediaRepository } from "./media.repository";

@Module({
  controllers: [MediaServeController, AdminMediaController],
  providers: [MediaRepository],
  exports: [MediaRepository],
})
export class MediaModule {}
