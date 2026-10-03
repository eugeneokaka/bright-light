import { z } from "zod";

export const LEAD_TYPES = ["PERSON", "PROJECT"] as const;

export const LEAD_SOURCE_SUGGESTIONS = [
  "Website",
  "Property page",
  "Project page",
  "Blog",
  "Contact form",
  "Sell with us",
  "Buy with us",
  "WhatsApp",
  "Organic search",
  "Google Ads",
  "Meta Ads",
  "Referral",
  "Walk in",
  "Phone call",
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

export type LeadTypeValue = (typeof LEAD_TYPES)[number];
export type LeadStatusValue = (typeof LEAD_STATUSES)[number];
export type LeadIntentValue = (typeof LEAD_INTENTS)[number];
export type LeadPriorityValue = (typeof LEAD_PRIORITIES)[number];

export const leadInputSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(200),
  type: z.enum(LEAD_TYPES).default("PERSON"),
  phone: z.string().trim().min(7, "Phone number is required").max(32),
  email: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
  source: z.string().trim().min(1, "Source is required").max(100),
  status: z.enum(LEAD_STATUSES).default("NEW"),
  intent: z.enum(LEAD_INTENTS).optional(),
  priority: z.enum(LEAD_PRIORITIES).default("MEDIUM"),
  assignedAgentId: z.string().max(64).optional(),
  propertyId: z.string().max(64).optional(),
});

export type LeadInput = z.infer<typeof leadInputSchema>;
export type LeadFormInput = z.input<typeof leadInputSchema>;
