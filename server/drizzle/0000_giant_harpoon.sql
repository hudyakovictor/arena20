CREATE TABLE `journal_entries` (
	`entry_id` text PRIMARY KEY NOT NULL,
	`profile_id` text NOT NULL,
	`scenario_id` text NOT NULL,
	`content_version` text NOT NULL,
	`decision_id` text NOT NULL,
	`quality` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `profiles` (
	`profile_id` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`xp` integer DEFAULT 0 NOT NULL,
	`rank` integer DEFAULT 0 NOT NULL,
	`credits` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
