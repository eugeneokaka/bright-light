import { and, eq, isNotNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { auditLogs, properties } from "@/db/schema";

export async function expireRentals(): Promise<number> {
  const now = new Date();

  const expired = await db
    .update(properties)
    .set({ status: "ACTIVE", rentalExpiresAt: null, updatedAt: now })
    .where(
      and(
        eq(properties.status, "RENTED"),
        isNotNull(properties.rentalExpiresAt),
        lt(properties.rentalExpiresAt, now),
      ),
    )
    .returning({ id: properties.id });

  if (expired.length > 0) {
    await db.insert(auditLogs).values(
      expired.map((row) => ({
        userId: null,
        action: "property.rental_expired",
        resource: "property",
        resourceId: row.id,
        metadata: { reason: "rental_expired", at: now.toISOString() },
      })),
    );
  }

  return expired.length;
}
