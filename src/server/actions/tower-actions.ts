"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, floors, stalls, towers } from "@/db/schema";
import { canManageProperties } from "@/lib/permissions";
import {
  floorInputSchema,
  stallInputSchema,
  towerInputSchema,
  type FloorFormInput,
  type StallFormInput,
  type TowerFormInput,
} from "@/lib/validations/tower";

export type TowerActionResult = { error: string } | undefined;

async function getManager() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session || !canManageProperties(session.user.role)) {
    return null;
  }

  return session;
}

export async function createTower(
  input: TowerFormInput,
): Promise<TowerActionResult> {
  const session = await getManager();

  if (!session) {
    return { error: "You do not have permission to manage towers." };
  }

  const parsed = towerInputSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid tower." };
  }

  const data = parsed.data;

  const [tower] = await db
    .insert(towers)
    .values({
      name: data.name,
      location: data.location || null,
      description: data.description || null,
      images: data.images,
    })
    .returning({ id: towers.id });

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "tower.create",
    resource: "tower",
    resourceId: tower.id,
    metadata: { name: data.name },
  });

  revalidatePath("/crm/towers");
  redirect(`/crm/towers/${tower.id}`);
}

export async function createFloor(
  input: FloorFormInput,
): Promise<TowerActionResult> {
  const session = await getManager();

  if (!session) {
    return { error: "You do not have permission to manage floors." };
  }

  const parsed = floorInputSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid floor." };
  }

  const data = parsed.data;

  const [tower] = await db
    .select({ id: towers.id })
    .from(towers)
    .where(eq(towers.id, data.towerId))
    .limit(1);

  if (!tower) {
    return { error: "Tower not found." };
  }

  await db.insert(floors).values({
    towerId: data.towerId,
    name: data.name,
    level: data.level ?? null,
    description: data.description || null,
    images: data.images,
  });

  revalidatePath(`/crm/towers/${data.towerId}`);
  redirect(`/crm/towers/${data.towerId}`);
}

export async function createStall(
  input: StallFormInput,
): Promise<TowerActionResult> {
  const session = await getManager();

  if (!session) {
    return { error: "You do not have permission to manage stalls." };
  }

  const parsed = stallInputSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid stall." };
  }

  const data = parsed.data;

  const [floor] = await db
    .select({ id: floors.id, towerId: floors.towerId })
    .from(floors)
    .where(eq(floors.id, data.floorId))
    .limit(1);

  if (!floor) {
    return { error: "Floor not found." };
  }

  if (floor.towerId !== data.towerId) {
    return { error: "The selected floor does not belong to this tower." };
  }

  await db.insert(stalls).values({
    towerId: floor.towerId,
    floorId: floor.id,
    code: data.code,
    name: data.name || null,
    status: data.status,
    price: data.price === undefined ? null : Math.round(data.price),
    area: data.area ?? null,
    description: data.description || null,
    images: data.images,
  });

  revalidatePath(`/crm/towers/${data.towerId}`);
  redirect(`/crm/towers/${data.towerId}`);
}
