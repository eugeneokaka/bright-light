export const ROLES = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "AGENT",
  "BROKER",
  "STAFF",
] as const;

export type Role = (typeof ROLES)[number];

const PROPERTY_MANAGERS: readonly Role[] = ["SUPER_ADMIN", "DIRECTOR"];
const LEAD_MANAGERS: readonly Role[] = ["SUPER_ADMIN", "DIRECTOR", "AGENT"];
const TRANSACTION_MANAGERS: readonly Role[] = [
  "SUPER_ADMIN",
  "DIRECTOR",
  "AGENT",
];

export function canManageProperties(role: string | null | undefined): boolean {
  return PROPERTY_MANAGERS.includes(role as Role);
}

export function canManageLeads(role: string | null | undefined): boolean {
  return LEAD_MANAGERS.includes(role as Role);
}

export function canManageTransactions(
  role: string | null | undefined,
): boolean {
  return TRANSACTION_MANAGERS.includes(role as Role);
}

export function isAdmin(role: string | null | undefined): boolean {
  return role === "SUPER_ADMIN" || role === "DIRECTOR";
}
