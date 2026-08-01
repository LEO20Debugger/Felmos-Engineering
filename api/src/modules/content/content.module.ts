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
import { AdminTeamController, PublicTeamController } from "./team.controller";
import { TeamRepository } from "./team.repository";

@Module({
  controllers: [
    PublicServicesController,
    PublicProjectsController,
    PublicTeamController,
    PublicContentController,
    AdminServicesController,
    AdminProjectsController,
    AdminTeamController,
  ],
  providers: [ServicesRepository, ProjectsRepository, TeamRepository],
  exports: [ServicesRepository, ProjectsRepository, TeamRepository],
})
export class ContentModule {}
