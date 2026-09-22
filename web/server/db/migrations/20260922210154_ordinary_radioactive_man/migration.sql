PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_articles` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`platform` text NOT NULL,
	`provider_key` text NOT NULL,
	`url` text NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`published_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);--> statement-breakpoint
INSERT INTO `__new_articles`(`id`, `platform`, `provider_key`, `url`, `title`, `author`, `published_at`, `created_at`, `updated_at`)
SELECT
	`id`,
	`platform`,
	-- 実行時と同じ規則: URL の最後の部分（/ より後ろ）を記事の ID とする
	replace(`url`, rtrim(`url`, replace(`url`, '/', '')), ''),
	`url`, `title`, `author`, `published_at`, `created_at`, `updated_at`
FROM `articles`;--> statement-breakpoint
-- 実行時（extractProviderKey）と同じ形以外の URL が残っていたら、ここで失敗させる。
-- 蓄積した記事を勝手に消さず、人が確認して直せるようにするため（provider_key が NOT NULL なので中断する）。
-- 想定する形: https://qiita.com/{ユーザー}/items/{ID} と https://zenn.dev/{ユーザーまたは Publication}/articles/{slug}
INSERT INTO `__new_articles`(`id`, `platform`, `provider_key`, `url`, `title`, `author`, `published_at`, `created_at`, `updated_at`)
SELECT `id`, `platform`, NULL, `url`, `title`, `author`, `published_at`, `created_at`, `updated_at`
FROM `articles`
WHERE
	instr(`url`, '%') > 0
	-- 「https://{ホスト}/{1 つ目}/{items|articles}/{ID}」の形（スラッシュはちょうど 5 個）だけを通す
	OR length(`url`) - length(replace(`url`, '/', '')) <> 5
	OR NOT (
		(`platform` = 'qiita' AND `url` GLOB 'https://qiita.com/?*/items/?*')
		OR (`platform` = 'zenn' AND `url` GLOB 'https://zenn.dev/?*/articles/?*')
	);--> statement-breakpoint
-- 同じ記事が複数行になっていた場合は、最初に保存した行だけを残す
DELETE FROM `__new_articles`
WHERE `id` NOT IN (SELECT MIN(`id`) FROM `__new_articles` GROUP BY `platform`, `provider_key`);--> statement-breakpoint
DROP TABLE `articles`;--> statement-breakpoint
ALTER TABLE `__new_articles` RENAME TO `articles`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `articles_platform_provider_key_idx` ON `articles` (`platform`,`provider_key`);--> statement-breakpoint
CREATE INDEX `articles_published_at_idx` ON `articles` (`published_at`);
