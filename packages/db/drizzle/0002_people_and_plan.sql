CREATE TABLE "block_person" (
	"id" text PRIMARY KEY NOT NULL,
	"block_id" text NOT NULL,
	"person_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "church_role" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "person" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"role_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "block" ADD COLUMN "duration_minutes" integer;--> statement-breakpoint
ALTER TABLE "block_person" ADD CONSTRAINT "block_person_block_id_block_id_fk" FOREIGN KEY ("block_id") REFERENCES "public"."block"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "block_person" ADD CONSTRAINT "block_person_person_id_person_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."person"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "church_role" ADD CONSTRAINT "church_role_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person" ADD CONSTRAINT "person_role_id_church_role_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."church_role"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "block_person_unique" ON "block_person" USING btree ("block_id","person_id");