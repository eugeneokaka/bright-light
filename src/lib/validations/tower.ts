import { z } from "zod";

export const STALL_STATUSES = [
  "AVAILABLE",
  "BLOCKED",
  "RESERVED",
  "UNDER_OFFER",
  "SOLD",
  "RENTED",
] as const;

export type StallStatusValue = (typeof STALL_STATUSES)[number];

const images = z.array(z.string().min(1)).default([]);

const optionalNumber = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().finite().optional(),
);

const optionalInt = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.number().int().optional(),
);

export const towerInputSchema = z.object({
  name: z.string().trim().min(2, "Tower name is required").max(200),
  location: z.string().trim().max(200).optional(),
  description: z.string().trim().max(4000).optional(),
  images,
});

export const floorInputSchema = z.object({
  towerId: z.string().min(1),
  name: z.string().trim().min(1, "Floor name is required").max(120),
  level: optionalInt,
  description: z.string().trim().max(4000).optional(),
  images,
});

export const stallInputSchema = z.object({
  towerId: z.string().min(1),
  floorId: z.string().min(1, "Please select a floor"),
  code: z.string().trim().min(1, "Stall code is required").max(60),
  name: z.string().trim().max(120).optional(),
  status: z.enum(STALL_STATUSES).default("AVAILABLE"),
  price: optionalNumber,
  area: optionalNumber,
  description: z.string().trim().max(4000).optional(),
  images,
});

export const floorUpdateSchema = floorInputSchema.extend({
  id: z.string().min(1),
});

export const stallUpdateSchema = stallInputSchema.extend({
  id: z.string().min(1),
});

export type TowerInput = z.infer<typeof towerInputSchema>;
export type TowerFormInput = z.input<typeof towerInputSchema>;
export type FloorInput = z.infer<typeof floorInputSchema>;
export type FloorFormInput = z.input<typeof floorInputSchema>;
export type FloorUpdateInput = z.input<typeof floorUpdateSchema>;
export type StallInput = z.infer<typeof stallInputSchema>;
export type StallFormInput = z.input<typeof stallInputSchema>;
export type StallUpdateInput = z.input<typeof stallUpdateSchema>;
