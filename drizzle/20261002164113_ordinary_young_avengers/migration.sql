CREATE TYPE "transaction_status" AS ENUM('SOLD', 'RENTED');--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"property_id" uuid NOT NULL,
	"status" "transaction_status" NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_phone" varchar(32),
	"buyer_email" text,
	"amount" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'KES' NOT NULL,
	"transaction_date" timestamp with time zone DEFAULT now() NOT NULL,
	"notes" text,
	"recorded_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "transactions_property_id_idx" ON "transactions" ("property_id");--> statement-breakpoint
CREATE INDEX "transactions_status_idx" ON "transactions" ("status");--> statement-breakpoint
CREATE INDEX "transactions_transaction_date_idx" ON "transactions" ("transaction_date");--> statement-breakpoint
CREATE INDEX "transactions_recorded_by_idx" ON "transactions" ("recorded_by_id");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recorded_by_id_user_id_fkey" FOREIGN KEY ("recorded_by_id") REFERENCES "user"("id") ON DELETE SET NULL;