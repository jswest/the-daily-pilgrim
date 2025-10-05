ALTER TABLE `articles` ADD `url` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `source_publication` text;--> statement-breakpoint
ALTER TABLE `articles` ADD `hostname` text;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_url_unique` ON `articles` (`url`);