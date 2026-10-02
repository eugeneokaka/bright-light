import { z } from "zod";

export const LEAD_SOURCES = [
  "WEBSITE",
  "PROPERTY_PAGE",
  "PROJECT_PAGE",
  "BLOG",
  "CONTACT_FORM",
  "SELL_WITH_US",
  "BUY_WITH_US",
  "WHATSAPP",
  "ORGANIC_SEARCH",
  "GOOGLE_ADS",
  "META_ADS",
  "REFERRAL",
  "WALK_IN",
  "PHONE_CALL",
] as const;

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING_SCHEDULED",
  "NEGOTIATING",
  "WON",
  "LOST",
  "SPAM",
] as const;

export const LEAD_INTENTS = ["BUY", "RENT", "INVEST", "SELL"] as const;

export const LEAD_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;

export type LeadSourceValue = (typeof LEAD_SOURCES)[number];
export type LeadStatusValue = (typeof LEAD_STATUSES)[number];
export type LeadIntentValue = (typeof LEAD_INTENTS)[number];
export type LeadPriorityValue = (typeof LEAD_PRIORITIES)[number];

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(200),
  phone: z.string().trim().min(7, "Phone number is required").max(32),
  email: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
  source: z.enum(LEAD_SOURCES).default("WEBSITE"),
  status: z.enum(LEAD_STATUSES).default("NEW"),
  intent: z.enum(LEAD_INTENTS).optional(),
  priority: z.enum(LEAD_PRIORITIES).default("MEDIUM"),
  assignedAgentId: z.string().max(64).optional(),
  propertyId: z.string().max(64).optional(),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
export type LeadFormInput = z.input<typeof leadInputSchema>;
