CREATE TYPE "public"."cleanliness" AS ENUM('horrifying', 'dirty', 'smudged up', 'decent', 'immaculate');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "doors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"cleanliness" "cleanliness" NOT NULL,
	"image_url" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "doors_location_idx" ON "doors" USING btree ("latitude","longitude");