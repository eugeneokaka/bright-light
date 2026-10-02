import { z } from "zod";

export const TRANSACTION_STATUSES = ["SOLD", "RENTED"] as const;

export type TransactionStatusValue = (typeof TRANSACTION_STATUSES)[number];

const optionalDate = z.preprocess(
  (value) =>
    value === "" || value === null || value === undefined ? undefined : value,
  z.coerce.date().optional(),
);

export const transactionInputSchema = z.object({
  propertyId: z.string().min(1, "Please select a property"),
  status: z.enum(TRANSACTION_STATUSES),
  buyerName: z
    .string()
    .trim()
    .min(2, "Buyer or tenant name is required")
    .max(200),
  buyerPhone: z.string().trim().max(32).optional(),
  buyerEmail: z.string().trim().max(200).optional(),
  amount: z.coerce.number().nonnegative("Amount must be a positive number"),
  transactionDate: optionalDate,
  rentalExpiresAt: optionalDate,
  notes: z.string().trim().max(2000).optional(),
});

export type TransactionInput = z.infer<typeof transactionInputSchema>;
export type TransactionFormInput = z.input<typeof transactionInputSchema>;
