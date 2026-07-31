import { Module } from "@nestjs/common";

import { PublicContentController } from "./public.controller";
import {
  AdminProjectsController,
  PublicProjectsController,
} from "./projects.controller";
import { ProjectsRepository } from "./projects.repository";
import {
  AdminServicesController,
  PublicServicesController,
} from "./services.controller";
import { ServicesRepository } from "./services.repository";

@Module({
  controllers: [
    PublicServicesController,
    PublicProjectsController,
    PublicContentController,
    AdminServicesController,
    AdminProjectsController,
  ],
  providers: [ServicesRepository, ProjectsRepository],
  exports: [ServicesRepository, ProjectsRepository],
})
export class ContentModule {}
