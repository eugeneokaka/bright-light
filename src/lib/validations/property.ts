import { z } from "zod";

export const PROPERTY_TYPES = [
  "APARTMENT",
  "HOUSE",
  "VILLA",
  "MAISONETTE",
  "TOWNHOUSE",
  "LAND",
  "COMMERCIAL",
  "OFFICE",
  "SHOP",
  "WAREHOUSE",
  "DEVELOPMENT_PROJECT",
] as const;

export const PROPERTY_PURPOSES = ["SALE", "RENT", "INVEST"] as const;

export const PROPERTY_STATUSES = [
  "DRAFT",
  "ACTIVE",
  "UNDER_OFFER",
  "SOLD",
  "RENTED",
  "ARCHIVED",
] as const;

export type PropertyTypeValue = (typeof PROPERTY_TYPES)[number];
export type PropertyPurposeValue = (typeof PROPERTY_PURPOSES)[number];
export type PropertyStatusValue = (typeof PROPERTY_STATUSES)[number];

const optionalNumber = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().finite().optional(),
);

const optionalInt = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().int().nonnegative().optional(),
);

const optionalUrl = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.url("Enter a valid Google Maps link").max(500).optional(),
);

export const propertyInputSchema = z.object({
  title: z.string().trim().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().trim().max(5000).optional(),
  propertyType: z.enum(PROPERTY_TYPES),
  purpose: z.enum(PROPERTY_PURPOSES),
  status: z.enum(PROPERTY_STATUSES).default("DRAFT"),
  price: z.coerce.number().nonnegative("Price must be a positive number"),
  buyingPrice: optionalNumber,
  county: z.string().trim().max(120).optional(),
  town: z.string().trim().max(120).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  address: z.string().trim().max(300).optional(),
  mapUrl: optionalUrl,
  latitude: optionalNumber,
  longitude: optionalNumber,
  bedrooms: optionalInt,
  bathrooms: optionalInt,
  size: optionalNumber,
  sizeUnit: z.string().trim().max(20).optional(),
  parking: optionalInt,
  amenities: z.array(z.string().trim().min(1)).default([]),
  featured: z.boolean().default(false),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        key: z.string().optional(),
        alt: z.string().optional(),
        caption: z.string().optional(),
      }),
    )
    .default([]),
});

export type PropertyInput = z.infer<typeof propertyInputSchema>;
