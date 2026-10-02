import Link from "next/link";
import { headers } from "next/headers";
import { desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { floors, stalls, towers } from "@/db/schema";
import { canManageProperties } from "@/lib/permissions";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Towers",
};

export default async function TowersPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const canCreate = canManageProperties(session?.user.role);

  const [towerRows, floorCountRows, stallCountRows] = await Promise.all([
    db.select().from(towers).orderBy(desc(towers.createdAt)),
    db
      .select({ towerId: floors.towerId, value: sql<number>`count(*)::int` })
      .from(floors)
      .groupBy(floors.towerId),
    db
      .select({ towerId: stalls.towerId, value: sql<number>`count(*)::int` })
      .from(stalls)
      .groupBy(stalls.towerId),
  ]);

  const floorCounts = new Map(
    floorCountRows.map((row) => [row.towerId, row.value]),
  );
  const stallCounts = new Map(
    stallCountRows.map((row) => [row.towerId, row.value]),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Towers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {towerRows.length} tower{towerRows.length === 1 ? "" : "s"}
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/crm/towers/new">New tower</Link>
          </Button>
        ) : null}
      </div>

      {towerRows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No towers yet. Create one to start adding floors and stalls.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {towerRows.map((tower) => {
            const cover = tower.images?.[0];
            const floorCount = floorCounts.get(tower.id) ?? 0;
            const stallCount = stallCounts.get(tower.id) ?? 0;

            return (
              <Link
                key={tower.id}
                href={`/crm/towers/${tower.id}`}
                className="group overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 transition hover:ring-foreground/25"
              >
                <div className="aspect-[16/10] w-full overflow-hidden bg-muted/40">
                  {cover ? (
                    <img
                      src={cover}
                      alt={tower.name}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <div>
                    <h2 className="font-medium text-foreground">
                      {tower.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {tower.location ?? "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      {floorCount} floor{floorCount === 1 ? "" : "s"}
                    </span>
                    <span>
                      {stallCount} stall{stallCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
