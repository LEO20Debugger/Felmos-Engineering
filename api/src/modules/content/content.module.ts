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
  AdminReviewsController,
  PublicReviewsController,
} from "./reviews.controller";
import { ReviewsRepository } from "./reviews.repository";
import {
  AdminServicesController,
  PublicServicesController,
} from "./services.controller";
import { ServicesRepository } from "./services.repository";
import { AdminTeamController, PublicTeamController } from "./team.controller";
import { TeamRepository } from "./team.repository";

/**
 * MailService and BrandService are injected by PublicReviewsController without
 * being imported here — LeadsModule is `@Global()` and exports both.
 */
@Module({
  controllers: [
    PublicServicesController,
    PublicProjectsController,
    PublicTeamController,
    PublicReviewsController,
    PublicContentController,
    AdminServicesController,
    AdminProjectsController,
    AdminTeamController,
    AdminPostsController,
    AdminReviewsController,
  ],
  providers: [
    ServicesRepository,
    ProjectsRepository,
    TeamRepository,
    PostsRepository,
    ReviewsRepository,
  ],
  exports: [
    ServicesRepository,
    ProjectsRepository,
    TeamRepository,
    PostsRepository,
    ReviewsRepository,
  ],
})
export class ContentModule {}
