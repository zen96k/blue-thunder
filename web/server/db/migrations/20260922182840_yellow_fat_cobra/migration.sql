CREATE TABLE `articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`platform` text NOT NULL,
	`url` text NOT NULL UNIQUE,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`published_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `articles_published_at_idx` ON `articles` (`published_at`);