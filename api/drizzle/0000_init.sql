CREATE TABLE `api_keys` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`label` varchar(120) NOT NULL,
	`scope` varchar(16) NOT NULL,
	`key_hash` varchar(64) NOT NULL,
	`key_hash_active` varchar(64) GENERATED ALWAYS AS ((if(`is_deleted` = 0, `key_hash`, null))) STORED,
	`last_used_at` varchar(32),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_api_keys_hash_active` UNIQUE(`key_hash_active`)
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`slug` varchar(160) NOT NULL,
	`slug_active` varchar(160) GENERATED ALWAYS AS ((if(`is_deleted` = 0, `slug`, null))) STORED,
	`name` varchar(200) NOT NULL,
	`legal_name` varchar(240),
	`status` varchar(16) NOT NULL DEFAULT 'active',
	`web_url` varchar(300),
	`revalidate_secret` varchar(200),
	`allowed_origins` json NOT NULL DEFAULT (json_array()),
	`mail_from` varchar(240),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_companies_slug_active` UNIQUE(`slug_active`)
);
--> statement-breakpoint
CREATE TABLE `media` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`kind` varchar(8) NOT NULL,
	`storage_key` varchar(255),
	`remote_url` varchar(600),
	`provider` varchar(16),
	`provider_id` varchar(64),
	`mime` varchar(40),
	`width` smallint unsigned,
	`height` smallint unsigned,
	`bytes` bigint unsigned,
	`blur_data_url` varchar(2048),
	`alt` varchar(300) NOT NULL DEFAULT '',
	`title` varchar(200),
	`focal_x` tinyint NOT NULL DEFAULT 50,
	`focal_y` tinyint NOT NULL DEFAULT 50,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	CONSTRAINT `media_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `posts` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`slug` varchar(160) NOT NULL,
	`slug_active` varchar(160) GENERATED ALWAYS AS ((if(`is_deleted` = 0, `slug`, null))) STORED,
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`published_at` datetime(3),
	`sort_order` bigint NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	`title` varchar(220) NOT NULL,
	`excerpt` varchar(600),
	`date` varchar(10) NOT NULL,
	`author_team_id` bigint unsigned,
	`author_name` varchar(120) NOT NULL DEFAULT '',
	`category` varchar(80),
	`image_id` bigint unsigned,
	`body` json NOT NULL DEFAULT (json_array()),
	`read_minutes` smallint unsigned,
	CONSTRAINT `posts_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_posts_slug_active` UNIQUE(`company_id`,`slug_active`)
);
--> statement-breakpoint
CREATE TABLE `project_services` (
	`company_id` bigint unsigned NOT NULL,
	`project_id` bigint unsigned NOT NULL,
	`service_id` bigint unsigned NOT NULL,
	`sort_order` smallint NOT NULL DEFAULT 0,
	CONSTRAINT `project_services_project_id_service_id_pk` PRIMARY KEY(`project_id`,`service_id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`slug` varchar(160) NOT NULL,
	`slug_active` varchar(160) GENERATED ALWAYS AS ((if(`is_deleted` = 0, `slug`, null))) STORED,
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`published_at` datetime(3),
	`sort_order` bigint NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	`num` varchar(8) NOT NULL DEFAULT '',
	`title` varchar(200) NOT NULL,
	`category` varchar(80),
	`location` varchar(160),
	`year` smallint unsigned,
	`client` varchar(160),
	`duration` varchar(80),
	`scope` text,
	`narrative` text,
	`result` text,
	`metric_value` varchar(40),
	`metric_label` varchar(120),
	`image_id` bigint unsigned,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_projects_slug_active` UNIQUE(`company_id`,`slug_active`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`slug` varchar(160) NOT NULL,
	`slug_active` varchar(160) GENERATED ALWAYS AS ((if(`is_deleted` = 0, `slug`, null))) STORED,
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`published_at` datetime(3),
	`sort_order` bigint NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	`num` varchar(8) NOT NULL DEFAULT '',
	`title` varchar(200) NOT NULL,
	`label` varchar(80) NOT NULL DEFAULT '',
	`short` varchar(400) NOT NULL DEFAULT '',
	`lead` text,
	`icon` varchar(48) NOT NULL DEFAULT 'Wrench',
	`image_id` bigint unsigned,
	`benefits` json NOT NULL DEFAULT (json_array()),
	`clients` json NOT NULL DEFAULT (json_array()),
	CONSTRAINT `services_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_services_slug_active` UNIQUE(`company_id`,`slug_active`)
);
--> statement-breakpoint
CREATE TABLE `team` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`slug` varchar(160) NOT NULL,
	`slug_active` varchar(160) GENERATED ALWAYS AS ((if(`is_deleted` = 0, `slug`, null))) STORED,
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`published_at` datetime(3),
	`sort_order` bigint NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	`name` varchar(160) NOT NULL,
	`role` varchar(160),
	`tag` varchar(80),
	`bio` text,
	`image_id` bigint unsigned,
	CONSTRAINT `team_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_team_slug_active` UNIQUE(`company_id`,`slug_active`)
);
--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`slug` varchar(160) NOT NULL,
	`slug_active` varchar(160) GENERATED ALWAYS AS ((if(`is_deleted` = 0, `slug`, null))) STORED,
	`status` varchar(16) NOT NULL DEFAULT 'draft',
	`published_at` datetime(3),
	`sort_order` bigint NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	`quote` text NOT NULL,
	`author` varchar(160) NOT NULL,
	`role` varchar(160),
	`company` varchar(160),
	`project_id` bigint unsigned,
	`rating` smallint unsigned,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_testimonials_slug_active` UNIQUE(`company_id`,`slug_active`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`user_id` bigint unsigned,
	`action` varchar(40) NOT NULL,
	`entity` varchar(40) NOT NULL,
	`entity_id` bigint unsigned,
	`before` json,
	`after` json,
	`ip_hash` varchar(64),
	`is_system` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `refresh_tokens` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`user_id` bigint unsigned NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`family_id` varchar(36) NOT NULL,
	`expires_at` varchar(32) NOT NULL,
	`revoked_at` varchar(32),
	`replaced_by` bigint unsigned,
	`user_agent` varchar(400),
	`ip_hash` varchar(64),
	CONSTRAINT `refresh_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_refresh_token_hash` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_active` varchar(255) GENERATED ALWAYS AS ((if(`is_deleted` = 0, `email`, null))) STORED,
	`name` varchar(160) NOT NULL,
	`password_hash` varchar(255),
	`role` varchar(16) NOT NULL DEFAULT 'editor',
	`status` varchar(16) NOT NULL DEFAULT 'invited',
	`invited_by` bigint unsigned,
	`invite_token_hash` varchar(64),
	`invite_expires_at` varchar(32),
	`last_login_at` varchar(32),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_users_email_active` UNIQUE(`company_id`,`email_active`)
);
--> statement-breakpoint
CREATE TABLE `mail_recipients` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`email` varchar(255) NOT NULL,
	`email_active` varchar(255) GENERATED ALWAYS AS ((if(`is_deleted` = 0, `email`, null))) STORED,
	`name` varchar(160),
	`role` varchar(8) NOT NULL DEFAULT 'to',
	`active` tinyint NOT NULL DEFAULT 1,
	`sort_order` smallint NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	CONSTRAINT `mail_recipients_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_mail_recipients_email_active` UNIQUE(`company_id`,`email_active`)
);
--> statement-breakpoint
CREATE TABLE `site_settings` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`name` varchar(200) NOT NULL,
	`short_name` varchar(80),
	`tagline` varchar(300),
	`description` varchar(400),
	`url` varchar(300),
	`phone` varchar(60),
	`phone_href` varchar(60),
	`secondary_phone` varchar(60),
	`secondary_phone_href` varchar(60),
	`email` varchar(255),
	`email_href` varchar(300),
	`address_street` varchar(200),
	`address_locality` varchar(120),
	`address_region` varchar(120),
	`address_postal_code` varchar(40),
	`address_country` varchar(8),
	`address_short` varchar(200),
	`address_full` varchar(300),
	`geo_lat` decimal(9,6),
	`geo_lng` decimal(9,6),
	`map_embed` text,
	`map_link` text,
	`hours` varchar(200),
	`hours_structured` json NOT NULL DEFAULT (json_array()),
	`founded` smallint unsigned,
	`socials` json NOT NULL DEFAULT (json_array()),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	CONSTRAINT `site_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `uq_site_settings_company` UNIQUE(`company_id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`name` varchar(160) NOT NULL,
	`phone` varchar(40) NOT NULL,
	`email` varchar(255) NOT NULL,
	`location` varchar(240) NOT NULL,
	`service_text` varchar(200) NOT NULL,
	`service_id` bigint unsigned,
	`preferred_date` varchar(10),
	`message` text,
	`status` varchar(16) NOT NULL DEFAULT 'new',
	`assigned_to` bigint unsigned,
	`internal_notes` text,
	`source` varchar(16) NOT NULL DEFAULT 'web_form',
	`landing_path` varchar(300),
	`referrer_host` varchar(160),
	`referrer_url` varchar(600),
	`utm_source` varchar(120),
	`utm_medium` varchar(120),
	`utm_campaign` varchar(120),
	`utm_term` varchar(120),
	`utm_content` varchar(120),
	`session_hash` varchar(32),
	`device` varchar(12),
	`user_agent` varchar(400),
	`ip_hash` varchar(64),
	`email_status` varchar(12) NOT NULL DEFAULT 'pending',
	`email_attempts` varchar(4) NOT NULL DEFAULT '0',
	`email_error` varchar(400),
	`email_sent_at` varchar(32),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`updated_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
	`is_deleted` tinyint NOT NULL DEFAULT 0,
	`deleted_at` datetime(3),
	`created_by` bigint unsigned,
	`updated_by` bigint unsigned,
	`deleted_by` bigint unsigned,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `daily_device_stats` (
	`company_id` bigint unsigned NOT NULL,
	`day` date NOT NULL,
	`device` varchar(12) NOT NULL,
	`views` bigint unsigned NOT NULL DEFAULT 0,
	`uniques` bigint unsigned NOT NULL DEFAULT 0,
	`sessions` smallint unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `daily_device_stats_company_id_day_device_pk` PRIMARY KEY(`company_id`,`day`,`device`)
);
--> statement-breakpoint
CREATE TABLE `daily_event_stats` (
	`company_id` bigint unsigned NOT NULL,
	`day` date NOT NULL,
	`name` varchar(48) NOT NULL,
	`count` bigint unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `daily_event_stats_company_id_day_name_pk` PRIMARY KEY(`company_id`,`day`,`name`)
);
--> statement-breakpoint
CREATE TABLE `daily_referrer_stats` (
	`company_id` bigint unsigned NOT NULL,
	`day` date NOT NULL,
	`referrer_host` varchar(160) NOT NULL,
	`views` bigint unsigned NOT NULL DEFAULT 0,
	`uniques` bigint unsigned NOT NULL DEFAULT 0,
	CONSTRAINT `daily_referrer_stats_company_id_day_referrer_host_pk` PRIMARY KEY(`company_id`,`day`,`referrer_host`)
);
--> statement-breakpoint
CREATE TABLE `daily_stats` (
	`company_id` bigint unsigned NOT NULL,
	`day` date NOT NULL,
	`path` varchar(300) NOT NULL,
	`content_type` varchar(12) NOT NULL DEFAULT 'page',
	`content_id` bigint unsigned,
	`views` bigint unsigned NOT NULL DEFAULT 0,
	`uniques` bigint unsigned NOT NULL DEFAULT 0,
	`avg_duration_ms` bigint unsigned,
	CONSTRAINT `daily_stats_company_id_day_path_pk` PRIMARY KEY(`company_id`,`day`,`path`)
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`name` varchar(48) NOT NULL,
	`path` varchar(300) NOT NULL,
	`target` varchar(200),
	`content_type` varchar(12) NOT NULL DEFAULT 'page',
	`content_id` bigint unsigned,
	`session_hash` varchar(32) NOT NULL,
	`meta` json,
	CONSTRAINT `events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `page_views` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`company_id` bigint unsigned NOT NULL,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`path` varchar(300) NOT NULL,
	`content_type` varchar(12) NOT NULL DEFAULT 'page',
	`content_id` bigint unsigned,
	`session_hash` varchar(32) NOT NULL,
	`is_new_session` tinyint NOT NULL DEFAULT 0,
	`referrer_host` varchar(160),
	`referrer_url` varchar(600),
	`utm_source` varchar(120),
	`utm_medium` varchar(120),
	`utm_campaign` varchar(120),
	`device` varchar(12),
	`os` varchar(40),
	`browser` varchar(40),
	`country` varchar(2),
	`duration_ms` bigint unsigned,
	CONSTRAINT `page_views_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `api_keys` ADD CONSTRAINT `api_keys_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `media` ADD CONSTRAINT `media_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_author_team_id_team_id_fk` FOREIGN KEY (`author_team_id`) REFERENCES `team`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `posts` ADD CONSTRAINT `posts_image_id_media_id_fk` FOREIGN KEY (`image_id`) REFERENCES `media`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_services` ADD CONSTRAINT `project_services_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_services` ADD CONSTRAINT `project_services_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `project_services` ADD CONSTRAINT `project_services_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `projects` ADD CONSTRAINT `projects_image_id_media_id_fk` FOREIGN KEY (`image_id`) REFERENCES `media`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_image_id_media_id_fk` FOREIGN KEY (`image_id`) REFERENCES `media`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team` ADD CONSTRAINT `team_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `team` ADD CONSTRAINT `team_image_id_media_id_fk` FOREIGN KEY (`image_id`) REFERENCES `media`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testimonials` ADD CONSTRAINT `testimonials_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `testimonials` ADD CONSTRAINT `testimonials_project_id_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `mail_recipients` ADD CONSTRAINT `mail_recipients_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_settings` ADD CONSTRAINT `site_settings_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_company_id_companies_id_fk` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_assigned_to_users_id_fk` FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `ix_api_keys_company` ON `api_keys` (`company_id`,`is_deleted`,`scope`);--> statement-breakpoint
CREATE INDEX `ix_media_company` ON `media` (`company_id`,`is_deleted`,`id`);--> statement-breakpoint
CREATE INDEX `ix_media_kind` ON `media` (`company_id`,`kind`,`is_deleted`);--> statement-breakpoint
CREATE INDEX `ix_posts_listing` ON `posts` (`company_id`,`is_deleted`,`status`,`date`);--> statement-breakpoint
CREATE INDEX `ix_project_services_service` ON `project_services` (`company_id`,`service_id`);--> statement-breakpoint
CREATE INDEX `ix_projects_listing` ON `projects` (`company_id`,`is_deleted`,`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `ix_services_listing` ON `services` (`company_id`,`is_deleted`,`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `ix_team_listing` ON `team` (`company_id`,`is_deleted`,`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `ix_testimonials_listing` ON `testimonials` (`company_id`,`is_deleted`,`status`,`sort_order`);--> statement-breakpoint
CREATE INDEX `ix_audit_entity` ON `audit_log` (`company_id`,`entity`,`entity_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_audit_recent` ON `audit_log` (`company_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_refresh_family` ON `refresh_tokens` (`family_id`);--> statement-breakpoint
CREATE INDEX `ix_refresh_user` ON `refresh_tokens` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `ix_users_lookup` ON `users` (`email_active`);--> statement-breakpoint
CREATE INDEX `ix_mail_recipients_send` ON `mail_recipients` (`company_id`,`is_deleted`,`active`,`role`);--> statement-breakpoint
CREATE INDEX `ix_leads_inbox` ON `leads` (`company_id`,`is_deleted`,`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_leads_recent` ON `leads` (`company_id`,`is_deleted`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_leads_service` ON `leads` (`company_id`,`service_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_leads_delivery` ON `leads` (`email_status`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_daily_stats_content` ON `daily_stats` (`company_id`,`content_type`,`content_id`,`day`);--> statement-breakpoint
CREATE INDEX `ix_events_name` ON `events` (`company_id`,`name`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_events_recent` ON `events` (`company_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_views_recent` ON `page_views` (`company_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_views_path` ON `page_views` (`company_id`,`path`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_views_content` ON `page_views` (`company_id`,`content_type`,`content_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `ix_views_session` ON `page_views` (`session_hash`,`created_at`);