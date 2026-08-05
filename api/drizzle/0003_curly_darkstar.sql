ALTER TABLE `testimonials` ADD `source` varchar(16) DEFAULT 'staff' NOT NULL;--> statement-breakpoint
ALTER TABLE `testimonials` ADD `submitter_email` varchar(255);--> statement-breakpoint
ALTER TABLE `testimonials` ADD `submitted_ip` varchar(45);--> statement-breakpoint
ALTER TABLE `testimonials` ADD `submitted_user_agent` varchar(400);--> statement-breakpoint
CREATE INDEX `ix_testimonials_queue` ON `testimonials` (`company_id`,`is_deleted`,`source`,`status`);