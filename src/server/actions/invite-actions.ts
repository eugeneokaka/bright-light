"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/db";
import { account, auditLogs, user } from "@/db/schema";
import { verifyInviteCode } from "@/lib/invite";
import {
  acceptInviteSchema,
  type AcceptInviteInput,
} from "@/lib/validations/user";

export type AcceptInviteResult = { error: string } | undefined;

export async function acceptInvite(
  input: AcceptInviteInput,
): Promise<AcceptInviteResult> {
  const parsed = acceptInviteSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid details.",
    };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  const [target] = await db
    .select({
      id: user.id,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (!target) {
    return { error: "No invitation was found for that email." };
  }

  if (target.emailVerified) {
    return { error: "This account is already active. Please sign in." };
  }

  const verification = await verifyInviteCode(email, data.code);

  if (!verification.ok) {
    return { error: verification.error };
  }

  const hashedPassword = await hashPassword(data.password);

  const [existingAccount] = await db
    .select({ id: account.id })
    .from(account)
    .where(
      and(eq(account.userId, target.id), eq(account.providerId, "credential")),
    )
    .limit(1);

  if (existingAccount) {
    await db
      .update(account)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(account.id, existingAccount.id));
  } else {
    await db.insert(account).values({
      id: randomUUID(),
      accountId: target.id,
      providerId: "credential",
      userId: target.id,
      password: hashedPassword,
    });
  }

  await db
    .update(user)
    .set({ emailVerified: true, status: "ACTIVE", updatedAt: new Date() })
    .where(eq(user.id, target.id));

  await db.insert(auditLogs).values({
    userId: target.id,
    action: "user.activate",
    resource: "user",
    resourceId: target.id,
  });

  redirect("/login?activated=1");
}
