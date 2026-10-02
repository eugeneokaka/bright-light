import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leadActivities, leads, user } from "@/db/schema";
import { canManageLeads } from "@/lib/permissions";
import { LeadControls } from "@/components/crm/lead-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageParams = Promise<{ id: string }>;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "WON":
      return "default";
    case "NEW":
      return "secondary";
    case "LOST":
    case "SPAM":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function LeadDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!canManageLeads(session.user.role)) {
    redirect("/crm/leads");
  }

  const { id } = await params;

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);

  if (!lead) {
    notFound();
  }

  const [activities, agentRows] = await Promise.all([
    db
      .select({
        id: leadActivities.id,
        type: leadActivities.type,
        body: leadActivities.body,
        createdAt: leadActivities.createdAt,
        userName: user.name,
      })
      .from(leadActivities)
      .leftJoin(user, eq(leadActivities.userId, user.id))
      .where(eq(leadActivities.leadId, id))
      .orderBy(desc(leadActivities.createdAt))
      .limit(100),
    db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(inArray(user.role, ["SUPER_ADMIN", "DIRECTOR", "AGENT"]))
      .orderBy(asc(user.name)),
  ]);

  const agents = agentRows.map((item) => ({ id: item.id, label: item.name }));

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/crm/leads">← Back to leads</Link>
      </Button>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{lead.name}</h1>
        <Badge variant={statusVariant(lead.status)}>
          {lead.status.replace(/_/g, " ")}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {lead.source.replace(/_/g, " ")} · created {formatDateTime(lead.createdAt)}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="mt-0.5">{lead.phone}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd className="mt-0.5">{lead.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Intent</dt>
                <dd className="mt-0.5">{lead.intent ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Property</dt>
                <dd className="mt-0.5">{lead.propertyTitle ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Message</dt>
                <dd className="mt-0.5 whitespace-pre-wrap">
                  {lead.message ?? "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <LeadControls
          lead={{
            id: lead.id,
            status: lead.status,
            priority: lead.priority,
            assignedAgentId: lead.assignedAgentId,
          }}
          agents={agents}
        />
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
          <CardDescription>Timeline of updates and notes.</CardDescription>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity recorded yet.
            </p>
          ) : (
            <ol className="flex flex-col gap-4">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="border-l-2 border-border pl-4"
                >
                  <p className="text-sm">{activity.body ?? activity.type}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {activity.userName ?? "System"} ·{" "}
                    {formatDateTime(activity.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
