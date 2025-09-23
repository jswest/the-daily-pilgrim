CREATE TABLE IF NOT EXISTS `article_authors` (
	`article_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`order_position` integer NOT NULL,
	PRIMARY KEY(`article_id`, `author_id`),
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_article_authors_order` ON `article_authors` (`article_id`,`order_position`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`hed` text NOT NULL,
	`dek` text,
	`body` text NOT NULL,
	`title_image_id` integer,
	`order_in_edition` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`title_image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_articles_order` ON `articles` (`order_in_edition`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `authors` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`bio` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_authors_name` ON `authors` (`name`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `edition_articles` (
	`edition_id` integer NOT NULL,
	`article_id` integer NOT NULL,
	`order_position` integer NOT NULL,
	PRIMARY KEY(`edition_id`, `article_id`),
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_edition_articles_order` ON `edition_articles` (`edition_id`,`order_position`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `edition_images` (
	`edition_id` integer NOT NULL,
	`image_id` integer NOT NULL,
	`usage_type` text NOT NULL,
	`order_position` integer,
	PRIMARY KEY(`edition_id`, `image_id`),
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_edition_images_order` ON `edition_images` (`edition_id`,`order_position`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `edition_poems` (
	`edition_id` integer NOT NULL,
	`poem_id` integer NOT NULL,
	`order_position` integer NOT NULL,
	PRIMARY KEY(`edition_id`, `poem_id`),
	FOREIGN KEY (`edition_id`) REFERENCES `editions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`poem_id`) REFERENCES `poems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_edition_poems_order` ON `edition_poems` (`edition_id`,`order_position`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `editions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`issue_number` integer NOT NULL,
	`published_at` text NOT NULL,
	`cover_image_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`cover_image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `editions_issue_number_unique` ON `editions` (`issue_number`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_editions_published_at` ON `editions` (`published_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `image_authors` (
	`image_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`role` text DEFAULT 'photographer',
	PRIMARY KEY(`image_id`, `author_id`),
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_image_authors_role` ON `image_authors` (`image_id`,`role`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`original_path` text NOT NULL,
	`processed_path` text,
	`caption` text,
	`image_type` text NOT NULL,
	`width` integer,
	`height` integer,
	`is_processed` integer DEFAULT false,
	`processing_status` text DEFAULT 'pending',
	`processing_started_at` text,
	`processing_completed_at` text,
	`processing_error` text,
	`processing_attempts` integer DEFAULT 0,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "chk_images_processing_attempts_nonneg" CHECK("images"."processing_attempts" >= 0)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_images_type` ON `images` (`image_type`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_images_processed` ON `images` (`is_processed`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_images_processing_status` ON `images` (`processing_status`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_images_processing_queue` ON `images` (`processing_status`,`processing_attempts`,`created_at`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `poem_authors` (
	`poem_id` integer NOT NULL,
	`author_id` integer NOT NULL,
	`order_position` integer NOT NULL,
	PRIMARY KEY(`poem_id`, `author_id`),
	FOREIGN KEY (`poem_id`) REFERENCES `poems`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `authors`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_poem_authors_order` ON `poem_authors` (`poem_id`,`order_position`);--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `poems` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`order_in_edition` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `idx_poems_order` ON `poems` (`order_in_edition`);