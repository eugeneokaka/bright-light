import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { floors, towers } from "@/db/schema";
import { canManageProperties } from "@/lib/permissions";
import { FloorForm } from "@/components/crm/floor-form";
import { Button } from "@/components/ui/button";

type PageParams = Promise<{ id: string; floorId: string }>;

export const metadata = {
  title: "Edit floor",
};

export default async function EditFloorPage({
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

  const { id, floorId } = await params;

  const [tower] = await db
    .select({ id: towers.id, name: towers.name })
    .from(towers)
    .where(eq(towers.id, id))
    .limit(1);

  if (!tower) {
    notFound();
  }

  const [floor] = await db
    .select()
    .from(floors)
    .where(eq(floors.id, floorId))
    .limit(1);

  if (!floor || floor.towerId !== tower.id) {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={`/crm/towers/${tower.id}`}>← Back to {tower.name}</Link>
      </Button>

      <h1 className="mt-4 text-2xl font-semibold">Edit floor</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Update the details for {floor.name}.
      </p>

      <div className="mt-8">
        <FloorForm
          towerId={tower.id}
          floor={{
            id: floor.id,
            name: floor.name,
            level: floor.level,
            description: floor.description,
            images: floor.images,
          }}
        />
      </div>
    </main>
  );
}
