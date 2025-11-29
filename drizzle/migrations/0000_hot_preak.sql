CREATE TYPE "public"."category" AS ENUM('general', 'surah', 'ayah', 'dua', 'azkar', 'names99', 'salawat', 'kalimat');--> statement-breakpoint
CREATE TYPE "public"."event_type" AS ENUM('tap', 'bulk', 'repeat', 'learn_mark', 'goal_completed', 'auto_reset');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('active', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."goal_type" AS ENUM('recite', 'learn');--> statement-breakpoint
CREATE TYPE "public"."prayer_segment" AS ENUM('fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'none');--> statement-breakpoint
CREATE TABLE "daily_azkar" (
	"user_id" uuid NOT NULL,
	"date_local" text NOT NULL,
	"fajr" integer DEFAULT 0 NOT NULL,
	"dhuhr" integer DEFAULT 0 NOT NULL,
	"asr" integer DEFAULT 0 NOT NULL,
	"maghrib" integer DEFAULT 0 NOT NULL,
	"isha" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "daily_azkar_user_id_date_local_pk" PRIMARY KEY("user_id","date_local")
);
--> statement-breakpoint
CREATE TABLE "dhikr_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_id" uuid,
	"goal_id" uuid,
	"category" "category" NOT NULL,
	"item_id" uuid,
	"event_type" "event_type" NOT NULL,
	"delta" integer NOT NULL,
	"value_after" integer NOT NULL,
	"prayer_segment" "prayer_segment" DEFAULT 'none',
	"at_ts" timestamp with time zone DEFAULT now(),
	"tz" text DEFAULT 'UTC' NOT NULL,
	"offline_id" text,
	"suspected" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" "category" NOT NULL,
	"item_id" uuid,
	"goal_type" "goal_type" NOT NULL,
	"target_count" integer NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"status" "goal_status" DEFAULT 'active' NOT NULL,
	"prayer_segment" "prayer_segment" DEFAULT 'none',
	"created_at" timestamp with time zone DEFAULT now(),
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category" "category" NOT NULL,
	"slug" text NOT NULL,
	"title_json" jsonb NOT NULL,
	"meta_json" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"goal_id" uuid,
	"prayer_segment" "prayer_segment" DEFAULT 'none',
	"started_at" timestamp with time zone DEFAULT now(),
	"ended_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"telegram_user_id" text NOT NULL,
	"locale" text DEFAULT 'en' NOT NULL,
	"madhab" text DEFAULT 'hanafi' NOT NULL,
	"tz" text DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "daily_azkar" ADD CONSTRAINT "daily_azkar_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dhikr_log" ADD CONSTRAINT "dhikr_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dhikr_log" ADD CONSTRAINT "dhikr_log_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dhikr_log" ADD CONSTRAINT "dhikr_log_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dhikr_log" ADD CONSTRAINT "dhikr_log_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dhikr_log_offline_id_idx" ON "dhikr_log" USING btree ("offline_id");--> statement-breakpoint
CREATE INDEX "items_slug_idx" ON "items" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "users_telegram_user_id_idx" ON "users" USING btree ("telegram_user_id");