"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, leadActivities, leads, properties } from "@/db/schema";
import { canManageLeads } from "@/lib/permissions";
import {
  leadInputSchema,
  LEAD_PRIORITIES,
  LEAD_STATUSES,
  type LeadFormInput,
  type LeadPriorityValue,
  type LeadStatusValue,
} from "@/lib/validations/lead";

export type LeadActionResult = { error: string } | undefined;

async function getLeadManager() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return null;
  }

  if (!canManageLeads(session.user.role)) {
    return null;
  }

  return session;
}

function revalidateLead(leadId?: string) {
  revalidatePath("/crm/leads");
  if (leadId) {
    revalidatePath(`/crm/leads/${leadId}`);
  }
}

export async function createLead(input: LeadFormInput): Promise<LeadActionResult> {
  const session = await getLeadManager();

  if (!session) {
    return { error: "You do not have permission to create leads." };
  }

  const parsed = leadInputSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid lead details." };
  }

  const data = parsed.data;

  let propertyTitle: string | null = null;
  if (data.propertyId) {
    const [property] = await db
      .select({ title: properties.title })
      .from(properties)
      .where(eq(properties.id, data.propertyId))
      .limit(1);
    propertyTitle = property?.title ?? null;
  }

  const [lead] = await db
    .insert(leads)
    .values({
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message: data.message || null,
      source: data.source,
      status: data.status,
      intent: data.intent ?? null,
      priority: data.priority,
      assignedAgentId: data.assignedAgentId || null,
      propertyId: data.propertyId || null,
      propertyTitle,
    })
    .returning({ id: leads.id });

  await db.insert(leadActivities).values({
    leadId: lead.id,
    userId: session.user.id,
    type: "CREATED",
    body: `Lead created from ${data.source}`,
  });

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "lead.create",
    resource: "lead",
    resourceId: lead.id,
    metadata: { source: data.source, status: data.status },
  });

  revalidateLead();
  redirect(`/crm/leads/${lead.id}`);
}

export async function updateLeadStatus(
  leadId: string,
  status: LeadStatusValue,
): Promise<LeadActionResult> {
  const session = await getLeadManager();

  if (!session) {
    return { error: "You do not have permission to update leads." };
  }

  if (!LEAD_STATUSES.includes(status)) {
    return { error: "Invalid status." };
  }

  const [existing] = await db
    .select({ status: leads.status })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!existing) {
    return { error: "Lead not found." };
  }

  if (existing.status === status) {
    return;
  }

  await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  await db.insert(leadActivities).values({
    leadId,
    userId: session.user.id,
    type: "STATUS_CHANGE",
    body: `Status changed from ${existing.status} to ${status}`,
    metadata: { from: existing.status, to: status },
  });

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "lead.status_change",
    resource: "lead",
    resourceId: leadId,
    metadata: { from: existing.status, to: status },
  });

  revalidateLead(leadId);
}

export async function updateLeadPriority(
  leadId: string,
  priority: LeadPriorityValue,
): Promise<LeadActionResult> {
  const session = await getLeadManager();

  if (!session) {
    return { error: "You do not have permission to update leads." };
  }

  if (!LEAD_PRIORITIES.includes(priority)) {
    return { error: "Invalid priority." };
  }

  const [existing] = await db
    .select({ priority: leads.priority })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!existing) {
    return { error: "Lead not found." };
  }

  if (existing.priority === priority) {
    return;
  }

  await db
    .update(leads)
    .set({ priority, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  await db.insert(leadActivities).values({
    leadId,
    userId: session.user.id,
    type: "NOTE",
    body: `Priority changed from ${existing.priority} to ${priority}`,
    metadata: { from: existing.priority, to: priority },
  });

  revalidateLead(leadId);
}

export async function assignLead(
  leadId: string,
  agentId: string | null,
): Promise<LeadActionResult> {
  const session = await getLeadManager();

  if (!session) {
    return { error: "You do not have permission to update leads." };
  }

  await db
    .update(leads)
    .set({ assignedAgentId: agentId, updatedAt: new Date() })
    .where(eq(leads.id, leadId));

  await db.insert(leadActivities).values({
    leadId,
    userId: session.user.id,
    type: "ASSIGNMENT",
    body: agentId ? "Lead assigned" : "Lead unassigned",
    metadata: agentId ? { assignedAgentId: agentId } : undefined,
  });

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "lead.assign",
    resource: "lead",
    resourceId: leadId,
    metadata: { assignedAgentId: agentId },
  });

  revalidateLead(leadId);
}

export async function addLeadNote(
  leadId: string,
  body: string,
): Promise<LeadActionResult> {
  const session = await getLeadManager();

  if (!session) {
    return { error: "You do not have permission to update leads." };
  }

  const trimmed = body.trim();

  if (trimmed.length === 0) {
    return { error: "Note cannot be empty." };
  }

  await db.insert(leadActivities).values({
    leadId,
    userId: session.user.id,
    type: "NOTE",
    body: trimmed.slice(0, 2000),
  });

  revalidateLead(leadId);
}
