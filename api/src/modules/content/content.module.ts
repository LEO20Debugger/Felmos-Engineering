import { Module } from "@nestjs/common";

import { AdminPostsController } from "./posts.controller";
import { PostsRepository } from "./posts.repository";
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
    AdminPostsController,
  ],
  providers: [
    ServicesRepository,
    ProjectsRepository,
    TeamRepository,
    PostsRepository,
  ],
  exports: [
    ServicesRepository,
    ProjectsRepository,
    TeamRepository,
    PostsRepository,
  ],
})
export class ContentModule {}
