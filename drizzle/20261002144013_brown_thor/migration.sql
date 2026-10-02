CREATE TYPE "lead_activity_type" AS ENUM('NOTE', 'STATUS_CHANGE', 'ASSIGNMENT', 'CALL', 'EMAIL', 'WHATSAPP');--> statement-breakpoint
CREATE TYPE "lead_intent" AS ENUM('BUY', 'RENT', 'INVEST', 'SELL');--> statement-breakpoint
CREATE TYPE "lead_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "lead_source" AS ENUM('WEBSITE', 'PROPERTY_PAGE', 'PROJECT_PAGE', 'BLOG', 'CONTACT_FORM', 'SELL_WITH_US', 'BUY_WITH_US', 'WHATSAPP', 'ORGANIC_SEARCH', 'GOOGLE_ADS', 'META_ADS');--> statement-breakpoint
CREATE TYPE "lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'VIEWING_SCHEDULED', 'NEGOTIATING', 'WON', 'LOST', 'SPAM');--> statement-breakpoint
CREATE TYPE "property_purpose" AS ENUM('SALE', 'RENT', 'INVEST');--> statement-breakpoint
CREATE TYPE "property_status" AS ENUM('DRAFT', 'ACTIVE', 'UNDER_OFFER', 'SOLD', 'RENTED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "property_type" AS ENUM('APARTMENT', 'HOUSE', 'VILLA', 'MAISONETTE', 'TOWNHOUSE', 'LAND', 'COMMERCIAL', 'OFFICE', 'SHOP', 'WAREHOUSE', 'DEVELOPMENT_PROJECT');--> statement-breakpoint
CREATE TYPE "user_role" AS ENUM('SUPER_ADMIN', 'DIRECTOR', 'AGENT', 'BROKER', 'STAFF');--> statement-breakpoint
CREATE TYPE "user_status" AS ENUM('ACTIVE', 'INVITED', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text,
	"action" text NOT NULL,
	"resource" text NOT NULL,
	"resource_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"lead_id" uuid NOT NULL,
	"user_id" text,
	"type" "lead_activity_type" NOT NULL,
	"body" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" text NOT NULL,
	"phone" varchar(32) NOT NULL,
	"email" text,
	"message" text,
	"property_id" uuid,
	"property_title" text,
	"source" "lead_source" DEFAULT 'WEBSITE'::"lead_source" NOT NULL,
	"status" "lead_status" DEFAULT 'NEW'::"lead_status" NOT NULL,
	"intent" "lead_intent",
	"priority" "lead_priority" DEFAULT 'MEDIUM'::"lead_priority" NOT NULL,
	"assigned_agent_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"property_type" "property_type" NOT NULL,
	"purpose" "property_purpose" NOT NULL,
	"price" bigint NOT NULL,
	"currency" varchar(3) DEFAULT 'KES' NOT NULL,
	"county" text,
	"town" text,
	"neighborhood" text,
	"address" text,
	"latitude" double precision,
	"longitude" double precision,
	"bedrooms" integer,
	"bathrooms" integer,
	"size" numeric(12,2),
	"size_unit" text,
	"parking" integer,
	"amenities" jsonb DEFAULT '[]',
	"featured" boolean DEFAULT false NOT NULL,
	"status" "property_status" DEFAULT 'DRAFT'::"property_status" NOT NULL,
	"agent_id" text,
	"project_id" text,
	"unit_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"property_id" uuid NOT NULL,
	"url" text NOT NULL,
	"alt" text,
	"caption" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_cover" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs" ("user_id");--> statement-breakpoint
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs" ("resource");--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "lead_activities_lead_id_idx" ON "lead_activities" ("lead_id");--> statement-breakpoint
CREATE INDEX "lead_activities_created_at_idx" ON "lead_activities" ("created_at");--> statement-breakpoint
CREATE INDEX "leads_status_idx" ON "leads" ("status");--> statement-breakpoint
CREATE INDEX "leads_source_idx" ON "leads" ("source");--> statement-breakpoint
CREATE INDEX "leads_assigned_agent_idx" ON "leads" ("assigned_agent_id");--> statement-breakpoint
CREATE INDEX "leads_created_at_idx" ON "leads" ("created_at");--> statement-breakpoint
CREATE INDEX "leads_phone_idx" ON "leads" ("phone");--> statement-breakpoint
CREATE UNIQUE INDEX "properties_slug_idx" ON "properties" ("slug");--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" ("status");--> statement-breakpoint
CREATE INDEX "properties_featured_idx" ON "properties" ("featured");--> statement-breakpoint
CREATE INDEX "properties_type_idx" ON "properties" ("property_type");--> statement-breakpoint
CREATE INDEX "properties_purpose_idx" ON "properties" ("purpose");--> statement-breakpoint
CREATE INDEX "properties_location_idx" ON "properties" ("county","town");--> statement-breakpoint
CREATE INDEX "properties_price_idx" ON "properties" ("price");--> statement-breakpoint
CREATE INDEX "properties_created_at_idx" ON "properties" ("created_at");--> statement-breakpoint
CREATE INDEX "property_images_property_id_idx" ON "property_images" ("property_id");--> statement-breakpoint
ALTER TABLE "lead_activities" ADD CONSTRAINT "lead_activities_lead_id_leads_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "leads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fkey" FOREIGN KEY ("property_id") REFERENCES "properties"("id") ON DELETE CASCADE;