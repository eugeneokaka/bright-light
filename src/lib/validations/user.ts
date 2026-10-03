import { z } from "zod";
import { ROLES } from "@/lib/permissions";

export const USER_STATUSES = ["ACTIVE", "INVITED", "SUSPENDED"] as const;

export const roleSchema = z.enum(ROLES);
export const userStatusSchema = z.enum(USER_STATUSES);

export const inviteUserSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(200),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address")),
  role: roleSchema,
  phone: z.string().trim().max(32).optional(),
});

export const acceptInviteSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .pipe(z.email("Enter a valid email address")),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit verification code"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type InviteUserFormInput = z.input<typeof inviteUserSchema>;
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;
export type RoleValue = z.infer<typeof roleSchema>;
export type UserStatusValue = z.infer<typeof userStatusSchema>;
