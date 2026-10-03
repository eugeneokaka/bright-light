import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { floors, stalls, towers } from "@/db/schema";
import { canManageProperties } from "@/lib/permissions";
import { StallForm } from "@/components/crm/stall-form";
import { Button } from "@/components/ui/button";

type PageParams = Promise<{ id: string; stallId: string }>;

export const metadata = {
  title: "Edit stall",
};

export default async function EditStallPage({
  params,
}: {
  params: PageParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!canManageProperties(session.user.role)) {
    redirect("/crm/towers");
  }

  const { id, stallId } = await params;

  const [tower] = await db
    .select({ id: towers.id, name: towers.name })
    .from(towers)
    .where(eq(towers.id, id))
    .limit(1);

  if (!tower) {
    notFound();
  }

  const [stall] = await db
    .select()
    .from(stalls)
    .where(eq(stalls.id, stallId))
    .limit(1);

  if (!stall || stall.towerId !== tower.id) {
    notFound();
  }

  const floorRows = await db
    .select({ id: floors.id, name: floors.name })
    .from(floors)
    .where(eq(floors.towerId, tower.id))
    .orderBy(asc(floors.level), asc(floors.name));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/crm/towers/${tower.id}`}>← Back to {tower.name}</Link>
      </Button>

      <h1 className="mt-4 text-2xl font-semibold">Edit stall</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update the details for stall {stall.code}.
      </p>

      <div className="mt-8">
        <StallForm
          towerId={tower.id}
          floors={floorRows}
          stall={{
            id: stall.id,
            floorId: stall.floorId,
            code: stall.code,
            name: stall.name,
            status: stall.status,
            price: stall.price,
            area: stall.area,
            description: stall.description,
            images: stall.images,
          }}
        />
      </div>
    </main>
  );
}
