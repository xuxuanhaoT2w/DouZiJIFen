CREATE TABLE `rooms` (
  `id` text PRIMARY KEY NOT NULL,
  `state` text NOT NULL,
  `updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_rooms_updated_at` ON `rooms` (`updated_at`);
