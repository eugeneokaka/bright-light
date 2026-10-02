CREATE TYPE "stall_status" AS ENUM('AVAILABLE', 'BLOCKED', 'RESERVED', 'UNDER_OFFER', 'SOLD', 'RENTED');--> statement-breakpoint
CREATE TABLE "floors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tower_id" uuid NOT NULL,
	"name" text NOT NULL,
	"level" integer,
	"description" text,
	"images" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stalls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"tower_id" uuid NOT NULL,
	"floor_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text,
	"status" "stall_status" DEFAULT 'AVAILABLE'::"stall_status" NOT NULL,
	"price" bigint,
	"area" numeric(10,2),
	"description" text,
	"images" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "towers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"location" text,
	"description" text,
	"images" jsonb DEFAULT '[]',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "floors_tower_id_idx" ON "floors" ("tower_id");--> statement-breakpoint
CREATE INDEX "stalls_tower_id_idx" ON "stalls" ("tower_id");--> statement-breakpoint
CREATE INDEX "stalls_floor_id_idx" ON "stalls" ("floor_id");--> statement-breakpoint
CREATE INDEX "stalls_status_idx" ON "stalls" ("status");--> statement-breakpoint
CREATE INDEX "towers_name_idx" ON "towers" ("name");--> statement-breakpoint
ALTER TABLE "floors" ADD CONSTRAINT "floors_tower_id_towers_id_fkey" FOREIGN KEY ("tower_id") REFERENCES "towers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stalls" ADD CONSTRAINT "stalls_tower_id_towers_id_fkey" FOREIGN KEY ("tower_id") REFERENCES "towers"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "stalls" ADD CONSTRAINT "stalls_floor_id_floors_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "floors"("id") ON DELETE CASCADE;