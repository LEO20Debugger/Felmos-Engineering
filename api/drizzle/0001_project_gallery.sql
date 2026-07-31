CREATE TABLE `project_media` (
	`company_id` bigint unsigned NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`media_id` bigint unsigned NOT NULL,
	`sort_order` smallint NOT NULL DEFAULT 0,
	`caption` varchar(200),
	CONSTRAINT `project_media_project_id_media_id_pk` PRIMARY KEY(`project_id`,`media_id`)
);
--> statement-breakpoint
ALTER TABLE `project_media` ADD CONSTRAINT `project_media_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_media` ADD CONSTRAINT `project_media_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_media` ADD CONSTRAINT `project_media_media_id_media_id_fk` FOREIGN KEY (`media_id`) REFERENCES `media`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ix_project_media_media` ON `project_media` (`company_id`,`media_id`);