import { randomInt, randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { db } from "@/db";
import { verification } from "@/db/schema";

export const INVITE_CODE_TTL_SECONDS = 60 * 30;
const MAX_ATTEMPTS = 5;

type InviteCodeValue = { hash: string; attempts: number };

function inviteIdentifier(email: string) {
  return `invite:${email.toLowerCase()}`;
}

export function generateInviteCode() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function createInviteCode(email: string) {
  const code = generateInviteCode();
  const hash = await hashPassword(code);
  const identifier = inviteIdentifier(email);

  await db.delete(verification).where(eq(verification.identifier, identifier));
  await db.insert(verification).values({
    id: randomUUID(),
    identifier,
    value: JSON.stringify({ hash, attempts: 0 } satisfies InviteCodeValue),
    expiresAt: new Date(Date.now() + INVITE_CODE_TTL_SECONDS * 1000),
  });

  return code;
}

export type VerifyInviteResult =
  | { ok: true }
  | { ok: false; error: string };

export async function verifyInviteCode(
  email: string,
  code: string,
): Promise<VerifyInviteResult> {
  const identifier = inviteIdentifier(email);

  const [record] = await db
    .select()
    .from(verification)
    .where(eq(verification.identifier, identifier))
    .limit(1);

  if (!record) {
    return { ok: false, error: "No active invite code. Request a new one." };
  }

  if (record.expiresAt.getTime() < Date.now()) {
    await db.delete(verification).where(eq(verification.id, record.id));
    return { ok: false, error: "This code has expired. Request a new one." };
  }

  let value: InviteCodeValue;
  try {
    value = JSON.parse(record.value) as InviteCodeValue;
  } catch {
    value = { hash: record.value, attempts: 0 };
  }

  const valid = await verifyPassword({ hash: value.hash, password: code });

  if (!valid) {
    const attempts = value.attempts + 1;

    if (attempts >= MAX_ATTEMPTS) {
      await db.delete(verification).where(eq(verification.id, record.id));
      return {
        ok: false,
        error: "Too many incorrect attempts. Request a new code.",
      };
    }

    await db
      .update(verification)
      .set({
        value: JSON.stringify({ ...value, attempts }),
        updatedAt: new Date(),
      })
      .where(eq(verification.id, record.id));

    return { ok: false, error: "Incorrect code. Please try again." };
  }

  await db.delete(verification).where(eq(verification.id, record.id));
  return { ok: true };
}
