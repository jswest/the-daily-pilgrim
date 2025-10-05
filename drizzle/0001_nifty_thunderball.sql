CREATE TABLE `note_articles` (
	`note_id` integer NOT NULL,
	`article_id` integer NOT NULL,
	PRIMARY KEY(`note_id`, `article_id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `note_images` (
	`note_id` integer NOT NULL,
	`image_id` integer NOT NULL,
	PRIMARY KEY(`note_id`, `image_id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `note_poems` (
	`note_id` integer NOT NULL,
	`poem_id` integer NOT NULL,
	PRIMARY KEY(`note_id`, `poem_id`),
	FOREIGN KEY (`note_id`) REFERENCES `notes`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`poem_id`) REFERENCES `poems`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE INDEX `idx_notes_title` ON `notes` (`title`);--> statement-breakpoint
ALTER TABLE `edition_articles` ADD `note_id` integer REFERENCES notes(id);--> statement-breakpoint
ALTER TABLE `edition_images` ADD `note_id` integer REFERENCES notes(id);--> statement-breakpoint
ALTER TABLE `edition_poems` ADD `note_id` integer REFERENCES notes(id);