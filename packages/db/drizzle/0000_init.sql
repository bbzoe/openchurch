CREATE TYPE "public"."block_kind" AS ENUM('welcome', 'worship', 'announcement', 'message', 'prayer', 'other');--> statement-breakpoint
CREATE TYPE "public"."capability" AS ENUM('plan', 'live', 'songs', 'people');--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('service', 'gathering');--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('draft', 'scheduled', 'live', 'ended');--> statement-breakpoint
CREATE TYPE "public"."material_kind" AS ENUM('song', 'scripture', 'note');--> statement-breakpoint
CREATE TYPE "public"."membership_role" AS ENUM('sympathizer', 'member', 'ministry', 'admin');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "arrangement" (
	"id" text PRIMARY KEY NOT NULL,
	"song_id" text NOT NULL,
	"name" text NOT NULL,
	"key" text,
	"lyrics" text DEFAULT '' NOT NULL,
	"chords" text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "block" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"position" integer NOT NULL,
	"kind" "block_kind" NOT NULL,
	"title" text NOT NULL,
	"assignee_membership_id" text
);
--> statement-breakpoint
CREATE TABLE "block_material" (
	"id" text PRIMARY KEY NOT NULL,
	"block_id" text NOT NULL,
	"position" integer NOT NULL,
	"kind" "material_kind" NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"reference" text,
	"song_id" text,
	"arrangement_id" text
);
--> statement-breakpoint
CREATE TABLE "event" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"kind" "event_kind" NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"live_block_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "membership_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_capability" (
	"id" text PRIMARY KEY NOT NULL,
	"membership_id" text NOT NULL,
	"capability" "capability" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organization" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "song" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "arrangement" ADD CONSTRAINT "arrangement_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_event_id_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block" ADD CONSTRAINT "block_assignee_membership_id_membership_id_fk" FOREIGN KEY ("assignee_membership_id") REFERENCES "public"."membership"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_material" ADD CONSTRAINT "block_material_block_id_block_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_material" ADD CONSTRAINT "block_material_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_material" ADD CONSTRAINT "block_material_arrangement_id_arrangement_id_fk" FOREIGN KEY ("arrangement_id") REFERENCES "public"."arrangement"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event" ADD CONSTRAINT "event_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership" ADD CONSTRAINT "membership_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_capability" ADD CONSTRAINT "membership_capability_membership_id_membership_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."membership"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song" ADD CONSTRAINT "song_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "membership_org_user" ON "membership" USING btree ("organization_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "membership_capability_unique" ON "membership_capability" USING btree ("membership_id","capability");