CREATE TYPE "lead_type" AS ENUM('PERSON', 'PROJECT');--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "type" "lead_type" DEFAULT 'PERSON'::"lead_type" NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "source" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "source" SET DATA TYPE text USING "source"::text;--> statement-breakpoint
DROP TYPE "lead_source";