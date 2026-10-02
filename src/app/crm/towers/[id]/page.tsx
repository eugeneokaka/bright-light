import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { floors, stalls, towers } from "@/db/schema";
import { canManageProperties } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PageParams = Promise<{ id: string }>;

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function stallVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "AVAILABLE":
      return "default";
    case "SOLD":
    case "RENTED":
      return "destructive";
    case "RESERVED":
    case "UNDER_OFFER":
      return "secondary";
    default:
      return "outline";
  }
}

export default async function TowerDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const canManage = canManageProperties(session.user.role);
  const { id } = await params;

  const [tower] = await db.select().from(towers).where(eq(towers.id, id));

  if (!tower) {
    notFound();
  }

  const [floorRows, stallRows] = await Promise.all([
    db
      .select()
      .from(floors)
      .where(eq(floors.towerId, id))
      .orderBy(asc(floors.level), asc(floors.name)),
    db
      .select()
      .from(stalls)
      .where(eq(stalls.towerId, id))
      .orderBy(asc(stalls.code)),
  ]);

  const stallsByFloor = new Map<string, typeof stallRows>();
  for (const stall of stallRows) {
    const list = stallsByFloor.get(stall.floorId) ?? [];
    list.push(stall);
    stallsByFloor.set(stall.floorId, list);
  }

  const cover = tower.images?.[0];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/crm/towers">← Back to towers</Link>
      </Button>

      <div className="mt-4 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
        {cover ? (
          <img
            src={cover}
            alt={tower.name}
            className="h-56 w-full object-cover"
          />
        ) : null}
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{tower.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {tower.location ?? "—"}
            </p>
            {tower.description ? (
              <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                {tower.description}
              </p>
            ) : null}
            <p className="mt-3 text-xs text-muted-foreground">
              {floorRows.length} floor{floorRows.length === 1 ? "" : "s"} ·{" "}
              {stallRows.length} stall{stallRows.length === 1 ? "" : "s"}
            </p>
          </div>

          {canManage ? (
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/crm/towers/${tower.id}/stalls/new`}>
                  Add stall
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={`/crm/towers/${tower.id}/floors/new`}>
                  Add floor
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold">Floors &amp; stalls</h2>

      {floorRows.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No floors yet. Add a floor to start adding stalls.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {floorRows.map((floor) => {
            const floorStalls = stallsByFloor.get(floor.id) ?? [];
            const floorCover = floor.images?.[0];

            return (
              <Card key={floor.id} className="overflow-hidden py-0">
                {floorCover ? (
                  <img
                    src={floorCover}
                    alt={floor.name}
                    className="h-32 w-full object-cover"
                  />
                ) : null}
                <CardHeader className="pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>{floor.name}</CardTitle>
                    {floor.level != null ? (
                      <Badge variant="outline">Level {floor.level}</Badge>
                    ) : null}
                  </div>
                  {floor.description ? (
                    <p className="text-sm text-muted-foreground">
                      {floor.description}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="pb-5">
                  {floorStalls.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No stalls on this floor yet.
                    </p>
                  ) : (
                    <ul className="flex flex-col divide-y divide-border/70">
                      {floorStalls.map((stall) => (
                        <li
                          key={stall.id}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {stall.code}
                              {stall.name ? (
                                <span className="ml-2 font-normal text-muted-foreground">
                                  {stall.name}
                                </span>
                              ) : null}
                            </p>
                            {stall.price != null ? (
                              <p className="text-xs text-muted-foreground">
                                {formatPrice(stall.price)}
                              </p>
                            ) : null}
                          </div>
                          <Badge variant={stallVariant(stall.status)}>
                            {stall.status.replace(/_/g, " ")}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}
