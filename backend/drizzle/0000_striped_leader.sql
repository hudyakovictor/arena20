CREATE TABLE `answer_distribution` (
	`template_id` text NOT NULL,
	`variant` integer NOT NULL,
	`count` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `answer_distribution_pk` ON `answer_distribution` (`template_id`,`variant`);--> statement-breakpoint
CREATE TABLE `attempts` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text,
	`client_attempt_id` text,
	`template_id` text NOT NULL,
	`content_version` text NOT NULL,
	`seed` integer NOT NULL,
	`mode` text DEFAULT 'standard' NOT NULL,
	`answer` integer,
	`evidence` text DEFAULT '[]' NOT NULL,
	`confidence` text,
	`opened_sources` text DEFAULT '[]' NOT NULL,
	`sequence` text DEFAULT '[]' NOT NULL,
	`verdict` text,
	`blind_opened` integer DEFAULT false NOT NULL,
	`result` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`budget_delta` integer DEFAULT 0 NOT NULL,
	`duration_ms` integer DEFAULT 0 NOT NULL,
	`flags` text DEFAULT '[]' NOT NULL,
	`tournament_id` text,
	`client_ts` integer,
	`server_ts` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `attempts_user_idx` ON `attempts` (`user_id`);--> statement-breakpoint
CREATE INDEX `attempts_template_idx` ON `attempts` (`template_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attempts_client_id_uq` ON `attempts` (`user_id`,`client_attempt_id`);--> statement-breakpoint
CREATE TABLE `calibration` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`bucket` text NOT NULL,
	`predicted` real NOT NULL,
	`actual` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `calibration_user_idx` ON `calibration` (`user_id`);--> statement-breakpoint
CREATE TABLE `card_progress` (
	`user_id` text NOT NULL,
	`card_id` text NOT NULL,
	`rank` integer DEFAULT 0 NOT NULL,
	`atoms_done` text DEFAULT '[]' NOT NULL,
	`granted_at` integer,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `card_progress_pk` ON `card_progress` (`user_id`,`card_id`);--> statement-breakpoint
CREATE TABLE `combo_progress` (
	`user_id` text NOT NULL,
	`combo_id` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`unlocked_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `combo_progress_pk` ON `combo_progress` (`user_id`,`combo_id`);--> statement-breakpoint
CREATE TABLE `configs` (
	`version` text NOT NULL,
	`segment` text DEFAULT 'default' NOT NULL,
	`json` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `configs_pk` ON `configs` (`version`,`segment`);--> statement-breakpoint
CREATE TABLE `content_packages` (
	`version` text PRIMARY KEY NOT NULL,
	`published_at` integer NOT NULL,
	`json` text NOT NULL,
	`autotest` text,
	`active` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE `daily_seeds` (
	`user_id` text NOT NULL,
	`day` text NOT NULL,
	`seed` integer NOT NULL,
	`weather_mode` text NOT NULL,
	`issued_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `daily_seeds_pk` ON `daily_seeds` (`user_id`,`day`);--> statement-breakpoint
CREATE TABLE `devices` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`user_agent` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `devices_user_idx` ON `devices` (`user_id`);--> statement-breakpoint
CREATE TABLE `enemy_progress` (
	`user_id` text NOT NULL,
	`enemy_id` text NOT NULL,
	`stage_reached` integer DEFAULT 0 NOT NULL,
	`trophy_layers` text DEFAULT '[]' NOT NULL,
	`error_profile` text DEFAULT '{}' NOT NULL,
	`identified` integer DEFAULT false NOT NULL,
	`last_win_at` integer,
	`encounters` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `enemy_progress_pk` ON `enemy_progress` (`user_id`,`enemy_id`);--> statement-breakpoint
CREATE TABLE `event_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text,
	`session_id` text,
	`name` text NOT NULL,
	`epoch` text,
	`level` integer,
	`content_version` text,
	`payload` text DEFAULT '{}' NOT NULL,
	`client_ts` integer,
	`server_ts` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `event_log_name_idx` ON `event_log` (`name`);--> statement-breakpoint
CREATE INDEX `event_log_user_idx` ON `event_log` (`user_id`);--> statement-breakpoint
CREATE TABLE `mistake_scroll` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`atom` text NOT NULL,
	`enemy_id` text NOT NULL,
	`stage` integer NOT NULL,
	`template_id` text NOT NULL,
	`missed_evidence` text NOT NULL,
	`mutation_depth` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	`closed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `mistake_scroll_user_idx` ON `mistake_scroll` (`user_id`);--> statement-breakpoint
CREATE TABLE `progress` (
	`user_id` text PRIMARY KEY NOT NULL,
	`level` integer DEFAULT 1 NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`coins` integer DEFAULT 0 NOT NULL,
	`epoch` text DEFAULT 'street' NOT NULL,
	`risk_budget` integer DEFAULT 100 NOT NULL,
	`streak` integer DEFAULT 0 NOT NULL,
	`last_active_day` text,
	`hubris_streak` integer DEFAULT 0 NOT NULL,
	`tilt_streak` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`sku` text NOT NULL,
	`kind` text NOT NULL,
	`price_sig` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schedule_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_type` text NOT NULL,
	`ref` text NOT NULL,
	`template_id` text NOT NULL,
	`seed` integer NOT NULL,
	`due_at` integer NOT NULL,
	`priority` integer DEFAULT 0 NOT NULL,
	`reason` text NOT NULL,
	`consumed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `schedule_user_idx` ON `schedule_queue` (`user_id`,`consumed_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`risk_budget_start` integer NOT NULL,
	`risk_budget_end` integer,
	`weather_mode` text NOT NULL,
	`ended_by` text,
	`attempts` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `shadow_runs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`tournament_id` text NOT NULL,
	`device_id` text NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`score` integer DEFAULT 0 NOT NULL,
	`total_ms` integer DEFAULT 0 NOT NULL,
	`joined_at` integer NOT NULL,
	`finished_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tournament_id`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `shadow_runs_pk` ON `shadow_runs` (`user_id`,`tournament_id`);--> statement-breakpoint
CREATE TABLE `template_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`template_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`provider` text NOT NULL,
	`model` text,
	`request` text NOT NULL,
	`template` text NOT NULL,
	`report` text NOT NULL,
	`created_at` integer NOT NULL,
	`reviewed_at` integer,
	`review_note` text
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer NOT NULL,
	`seed_set` text NOT NULL,
	`config_version` text NOT NULL,
	`content_version` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`auth_kind` text DEFAULT 'anonymous' NOT NULL,
	`email` text,
	`segment` text DEFAULT 'default' NOT NULL,
	`display_name` text,
	`premium` integer DEFAULT false NOT NULL
);
