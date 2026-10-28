CREATE TYPE "public"."section_type" AS ENUM('verse', 'chorus', 'bridge', 'tag', 'intro', 'ending', 'other');--> statement-breakpoint
CREATE TYPE "public"."slide_mode" AS ENUM('section', 'lines');--> statement-breakpoint
CREATE TABLE "song_line" (
	"id" text PRIMARY KEY NOT NULL,
	"section_id" text NOT NULL,
	"position" integer NOT NULL,
	"text" text DEFAULT '' NOT NULL,
	"chords" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_section" (
	"id" text PRIMARY KEY NOT NULL,
	"song_id" text NOT NULL,
	"position" integer NOT NULL,
	"type" "section_type" NOT NULL,
	"label" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "person" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "arrangement" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "arrangement" ADD COLUMN IF NOT EXISTS "sequence" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "arrangement" ADD COLUMN IF NOT EXISTS "slide_mode" "slide_mode" DEFAULT 'lines' NOT NULL;--> statement-breakpoint
ALTER TABLE "arrangement" ADD COLUMN IF NOT EXISTS "lines_per_slide" integer DEFAULT 2 NOT NULL;--> statement-breakpoint
ALTER TABLE "arrangement" ADD COLUMN IF NOT EXISTS "breaks" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN IF NOT EXISTS "leader_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "block_person" ADD COLUMN IF NOT EXISTS "position" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "advance" text DEFAULT 'manual' NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "website" text;--> statement-breakpoint
ALTER TABLE "person" ADD COLUMN IF NOT EXISTS "image" text;--> statement-breakpoint
ALTER TABLE "song" ADD COLUMN IF NOT EXISTS "songbook_number" text;--> statement-breakpoint
ALTER TABLE "song" ADD COLUMN IF NOT EXISTS "default_key" text;--> statement-breakpoint
ALTER TABLE "song_line" ADD CONSTRAINT "song_line_section_id_song_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."song_section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_section" ADD CONSTRAINT "song_section_song_id_song_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."song"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "song_line_section_idx" ON "song_line" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "song_section_song_idx" ON "song_section" USING btree ("song_id");--> statement-breakpoint
UPDATE "song" AS s
SET "default_key" = a."key"
FROM "arrangement" AS a
WHERE a."song_id" = s."id"
  AND s."default_key" IS NULL
  AND a."key" IS NOT NULL
  AND length(btrim(a."key")) > 0;--> statement-breakpoint
DO $$
DECLARE
  rec record;
  sec_id text;
  line text;
  pos int;
  sec_pos int;
BEGIN
  FOR rec IN
    SELECT * FROM "arrangement"
    WHERE length(btrim("lyrics")) > 0 OR length(btrim("chords")) > 0
  LOOP
    SELECT coalesce(max("position") + 1, 0) INTO sec_pos FROM "song_section" WHERE "song_id" = rec.song_id;
    sec_id := gen_random_uuid()::text;
    INSERT INTO "song_section" ("id", "song_id", "position", "type", "label")
    VALUES (sec_id, rec.song_id, sec_pos, 'verse', '1');
    pos := 0;
    IF length(btrim(rec.lyrics)) > 0 THEN
      FOREACH line IN ARRAY regexp_split_to_array(replace(rec.lyrics, chr(13), ''), chr(10)) LOOP
        IF length(btrim(line)) = 0 THEN
          CONTINUE;
        END IF;
        INSERT INTO "song_line" ("id", "section_id", "position", "text", "chords")
        VALUES (gen_random_uuid()::text, sec_id, pos, btrim(line), '[]'::jsonb);
        pos := pos + 1;
      END LOOP;
    END IF;
    IF length(btrim(rec.chords)) > 0 THEN
      FOREACH line IN ARRAY regexp_split_to_array(replace(rec.chords, chr(13), ''), chr(10)) LOOP
        IF length(btrim(line)) = 0 THEN
          CONTINUE;
        END IF;
        INSERT INTO "song_line" ("id", "section_id", "position", "text", "chords")
        VALUES (gen_random_uuid()::text, sec_id, pos, btrim(line), '[]'::jsonb);
        pos := pos + 1;
      END LOOP;
    END IF;
    UPDATE "arrangement"
    SET "sequence" = jsonb_build_array(sec_id)
    WHERE "id" = rec.id;
  END LOOP;
END $$;--> statement-breakpoint
ALTER TABLE "arrangement" DROP COLUMN IF EXISTS "lyrics";--> statement-breakpoint
ALTER TABLE "arrangement" DROP COLUMN IF EXISTS "chords";