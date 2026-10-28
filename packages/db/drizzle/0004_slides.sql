CREATE TYPE "public"."deck_item_kind" AS ENUM('slide', 'group');--> statement-breakpoint
CREATE TABLE "deck_item" (
	"id" text PRIMARY KEY NOT NULL,
	"block_id" text NOT NULL,
	"position" integer NOT NULL,
	"kind" "deck_item_kind" NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"song_id" text,
	"arrangement_id" text
);
--> statement-breakpoint
CREATE TABLE "slide" (
	"id" text PRIMARY KEY NOT NULL,
	"deck_item_id" text NOT NULL,
	"position" integer NOT NULL,
	"label" text DEFAULT '' NOT NULL,
	"section_type" "section_type",
	"section_id" text DEFAULT '' NOT NULL,
	"occurrence" integer DEFAULT 0 NOT NULL,
	"background" text DEFAULT 'forest' NOT NULL,
	"font" text DEFAULT 'sans' NOT NULL,
	"color" text DEFAULT '' NOT NULL,
	"lines" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deck_item" ADD CONSTRAINT "deck_item_block_id_block_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_item" ADD CONSTRAINT "deck_item_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deck_item" ADD CONSTRAINT "deck_item_arrangement_id_arrangement_id_fk" FOREIGN KEY ("arrangement_id") REFERENCES "public"."arrangement"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slide" ADD CONSTRAINT "slide_deck_item_id_deck_item_id_fk" FOREIGN KEY ("deck_item_id") REFERENCES "public"."deck_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "deck_item_block_idx" ON "deck_item" USING btree ("block_id");--> statement-breakpoint
CREATE INDEX "slide_deck_item_idx" ON "slide" USING btree ("deck_item_id");
