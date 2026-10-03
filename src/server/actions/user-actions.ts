"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, user } from "@/db/schema";
import { getAppUrl } from "@/lib/app-url";
import { sendEmail } from "@/lib/email";
import { createInviteCode } from "@/lib/invite";
import { isSuperAdmin } from "@/lib/permissions";
import {
  inviteUserSchema,
  roleSchema,
  userStatusSchema,
  type InviteUserFormInput,
  type RoleValue,
  type UserStatusValue,
} from "@/lib/validations/user";

export type ActionResult = { error: string } | { success: string } | undefined;

async function getSuperAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !isSuperAdmin(session.user.role)) {
    return null;
  }

  return session;
}

function inviteEmailHtml(name: string, email: string, code: string) {
  const link = `${getAppUrl()}/accept-invite?email=${encodeURIComponent(email)}`;

  return `<p>Hello ${name},</p><p>You have been invited to the Bright Light CRM. Use the verification code below to set your password and activate your account.</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${code}</p><p>Enter it at <a href="${link}">${link}</a>. This code expires in 30 minutes. If you did not expect this invitation, you can ignore this email.</p>`;
}

export async function inviteUser(
  input: InviteUserFormInput,
): Promise<{ error: string } | undefined> {
  const session = await getSuperAdmin();

  if (!session) {
    return { error: "Only a Super Admin can invite users." };
  }

  const parsed = inviteUserSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid user details.",
    };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existing) {
    return { error: "A user with that email already exists." };
  }

  const userId = randomUUID();

  await db.insert(user).values({
    id: userId,
    name: data.name,
    email,
    emailVerified: false,
    role: data.role,
    status: "INVITED",
    phone: data.phone || null,
  });

  try {
    const code = await createInviteCode(email);
    await sendEmail(
      email,
      "Your Bright Light CRM invite code",
      inviteEmailHtml(data.name, email, code),
    );
  } catch (error) {
    await db.delete(user).where(eq(user.id, userId));

    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to send the invite email. Please try again.",
    };
  }

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "user.invite",
    resource: "user",
    resourceId: userId,
    metadata: { email, role: data.role },
  });

  revalidatePath("/crm/users");
  redirect("/crm/users?invited=1");
}

export async function resendInvite(userId: string): Promise<ActionResult> {
  const session = await getSuperAdmin();

  if (!session) {
    return { error: "Only a Super Admin can manage users." };
  }

  const [target] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!target) {
    return { error: "User not found." };
  }

  if (target.emailVerified) {
    return { error: "This user has already verified their email." };
  }

  try {
    const code = await createInviteCode(target.email);
    await sendEmail(
      target.email,
      "Your Bright Light CRM invite code",
      inviteEmailHtml(target.name, target.email, code),
    );
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to send the invite email. Please try again.",
    };
  }

  revalidatePath("/crm/users");
  return { success: `A new code was sent to ${target.email}.` };
}

export async function updateUserRole(
  userId: string,
  role: RoleValue,
): Promise<ActionResult> {
  const session = await getSuperAdmin();

  if (!session) {
    return { error: "Only a Super Admin can manage users." };
  }

  const parsed = roleSchema.safeParse(role);

  if (!parsed.success) {
    return { error: "Invalid role." };
  }

  if (userId === session.user.id) {
    return { error: "You cannot change your own role." };
  }

  const [target] = await db
    .select({ id: user.id, role: user.role })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!target) {
    return { error: "User not found." };
  }

  if (target.role === parsed.data) {
    return;
  }

  await db
    .update(user)
    .set({ role: parsed.data, updatedAt: new Date() })
    .where(eq(user.id, userId));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "user.role_change",
    resource: "user",
    resourceId: userId,
    metadata: { from: target.role, to: parsed.data },
  });

  revalidatePath("/crm/users");
  return { success: "Role updated." };
}

export async function updateUserStatus(
  userId: string,
  status: UserStatusValue,
): Promise<ActionResult> {
  const session = await getSuperAdmin();

  if (!session) {
    return { error: "Only a Super Admin can manage users." };
  }

  const parsed = userStatusSchema.safeParse(status);

  if (!parsed.success) {
    return { error: "Invalid status." };
  }

  if (userId === session.user.id) {
    return { error: "You cannot change your own status." };
  }

  const [target] = await db
    .select({ id: user.id, status: user.status })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!target) {
    return { error: "User not found." };
  }

  if (target.status === parsed.data) {
    return;
  }

  await db
    .update(user)
    .set({ status: parsed.data, updatedAt: new Date() })
    .where(eq(user.id, userId));

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "user.status_change",
    resource: "user",
    resourceId: userId,
    metadata: { from: target.status, to: parsed.data },
  });

  revalidatePath("/crm/users");
  return { success: "Status updated." };
}
