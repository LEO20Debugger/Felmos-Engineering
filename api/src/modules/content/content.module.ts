import { Module } from "@nestjs/common";

import {
  AdminServicesController,
  PublicServicesController,
} from "./services.controller";
import { ServicesRepository } from "./services.repository";

@Module({
  controllers: [PublicServicesController, AdminServicesController],
  providers: [ServicesRepository],
  exports: [ServicesRepository],
})
export class ContentModule {}
