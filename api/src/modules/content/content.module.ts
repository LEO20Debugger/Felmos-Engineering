import { Module } from "@nestjs/common";

import { PublicContentController } from "./public.controller";
import {
  AdminServicesController,
  PublicServicesController,
} from "./services.controller";
import { ServicesRepository } from "./services.repository";

@Module({
  controllers: [
    PublicServicesController,
    PublicContentController,
    AdminServicesController,
  ],
  providers: [ServicesRepository],
  exports: [ServicesRepository],
})
export class ContentModule {}
