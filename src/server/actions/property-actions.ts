"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { auditLogs, properties, propertyImages } from "@/db/schema";
import { canManageProperties } from "@/lib/permissions";
import { uniqueSlug } from "@/lib/slug";
import {
  propertyInputSchema,
  type PropertyInput,
} from "@/lib/validations/property";

export type CreatePropertyResult = { error: string } | undefined;

export async function createProperty(
  input: PropertyInput,
): Promise<CreatePropertyResult> {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return { error: "You must be signed in to create a listing." };
  }

  if (!canManageProperties(session.user.role)) {
    return { error: "You do not have permission to create listings." };
  }

  const parsed = propertyInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Invalid property details.",
    };
  }

  const data = parsed.data;

  const [property] = await db
    .insert(properties)
    .values({
      title: data.title,
      slug: uniqueSlug(data.title),
      description: data.description || null,
      propertyType: data.propertyType,
      purpose: data.purpose,
      status: data.status,
      price: Math.round(data.price),
      buyingPrice:
        data.buyingPrice === undefined ? null : Math.round(data.buyingPrice),
      currency: "KES",
      county: data.county || null,
      town: data.town || null,
      neighborhood: data.neighborhood || null,
      address: data.address || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      size: data.size ?? null,
      sizeUnit: data.sizeUnit || null,
      parking: data.parking ?? null,
      amenities: data.amenities,
      featured: data.featured,
      agentId: session.user.id,
    })
    .returning({ id: properties.id });

  if (data.images.length > 0) {
    await db.insert(propertyImages).values(
      data.images.map((image, index) => ({
        propertyId: property.id,
        url: image.url,
        alt: image.alt || data.title,
        caption: image.caption || null,
        sortOrder: index,
        isCover: index === 0,
      })),
    );
  }

  await db.insert(auditLogs).values({
    userId: session.user.id,
    action: "property.create",
    resource: "property",
    resourceId: property.id,
    metadata: { title: data.title, status: data.status },
  });

  revalidatePath("/crm/properties");
  redirect("/crm/properties");
}
