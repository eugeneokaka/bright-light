"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, properties, transactions } from "@/db/schema";
import { canManageTransactions } from "@/lib/permissions";
import {
  transactionInputSchema,
  type TransactionFormInput,
} from "@/lib/validations/transaction";

export type CreateTransactionResult = { error: string } | undefined;

export async function createTransaction(
  input: TransactionFormInput,
): Promise<CreateTransactionResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { error: "You must be signed in to record a transaction." };
  }

  if (!canManageTransactions(session.user.role)) {
    return { error: "You do not have permission to record transactions." };
  }

  const parsed = transactionInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid transaction details.",
    };
  }

  const data = parsed.data;

  const [property] = await db
    .select({ id: properties.id, title: properties.title })
    .from(properties)
    .where(eq(properties.id, data.propertyId))
    .limit(1);

  if (!property) {
    return { error: "The selected property could not be found." };
  }

  if (data.status === "RENTED" && !data.rentalExpiresAt) {
    return { error: "A lease end date is required for rentals." };
  }

  const rentalExpiresAt =
    data.status === "RENTED" ? (data.rentalExpiresAt ?? null) : null;

  const [transaction] = await db
    .insert(transactions)
    .values({
      propertyId: data.propertyId,
      status: data.status,
      buyerName: data.buyerName,
      buyerPhone: data.buyerPhone || null,
      buyerEmail: data.buyerEmail || null,
      amount: Math.round(data.amount),
      currency: "KES",
      transactionDate: data.transactionDate ?? new Date(),
      rentalExpiresAt,
      notes: data.notes || null,
      recordedById: session.user.id,
    })
    .returning({ id: transactions.id });

  await db
    .update(properties)
    .set({
      status: data.status,
      rentalExpiresAt,
      updatedAt: new Date(),
    })
    .where(eq(properties.id, data.propertyId));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "transaction.create",
    resource: "transaction",
    resourceId: transaction.id,
    metadata: {
      propertyId: data.propertyId,
      status: data.status,
      amount: data.amount,
    },
  });

  revalidatePath("/crm/transactions");
  revalidatePath("/crm/properties");
  redirect("/crm/transactions");
}
