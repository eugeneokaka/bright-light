import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { floors, towers } from "@/db/schema";
import { canManageProperties } from "@/lib/permissions";
import { StallForm } from "@/components/crm/stall-form";
import { Button } from "@/components/ui/button";

type PageParams = Promise<{ id: string }>;

export const metadata = {
  title: "New stall",
};

export default async function NewStallPage({
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

  const { id } = await params;

  const [tower] = await db
    .select({ id: towers.id, name: towers.name })
    .from(towers)
    .where(eq(towers.id, id));

  if (!tower) {
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

      <h1 className="mt-4 text-2xl font-semibold">New stall</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Add a stall to a floor in {tower.name}.
      </p>

      <div className="mt-8">
        <StallForm towerId={tower.id} floors={floorRows} />
      </div>
    </main>
  );
}
