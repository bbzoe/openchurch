CREATE TABLE "platform_admin" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "country_code" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "city" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "denomination_slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN "denomination_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "platform_admin" ADD CONSTRAINT "platform_admin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;