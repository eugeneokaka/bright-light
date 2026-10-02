ALTER TABLE "properties" ADD COLUMN "rental_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "rental_expires_at" timestamp with time zone;