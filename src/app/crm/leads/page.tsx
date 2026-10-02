import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  or,
  type SQL,
} from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leads, user } from "@/db/schema";
import { canManageLeads } from "@/lib/permissions";
import {
  LEAD_PRIORITIES,
  LEAD_SOURCES,
  LEAD_STATUSES,
} from "@/lib/validations/lead";
import { LeadFilters } from "@/components/crm/lead-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Leads",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(date);
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

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const canCreate = canManageLeads(session?.user.role);

  const params = await searchParams;
  const keyword = first(params.keyword)?.trim();
  const status = first(params.status)?.trim();
  const source = first(params.source)?.trim();
  const priority = first(params.priority)?.trim();
  const agent = first(params.agent)?.trim();

  const conditions: (SQL | undefined)[] = [];

  if (keyword) {
    const like = `%${keyword}%`;
    conditions.push(
      or(
        ilike(leads.name, like),
        ilike(leads.phone, like),
        ilike(leads.email, like),
      ),
    );
  }
  if (status) {
    conditions.push(eq(leads.status, status as (typeof LEAD_STATUSES)[number]));
  }
  if (source) {
    conditions.push(eq(leads.source, source as (typeof LEAD_SOURCES)[number]));
  }
  if (priority) {
    conditions.push(
      eq(leads.priority, priority as (typeof LEAD_PRIORITIES)[number]),
    );
  }
  if (agent) conditions.push(eq(leads.assignedAgentId, agent));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const hasFilters = conditions.length > 0;

  const [rows, agentRows] = await Promise.all([
    db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        email: leads.email,
        source: leads.source,
        status: leads.status,
        priority: leads.priority,
        createdAt: leads.createdAt,
        assignedAgentName: user.name,
      })
      .from(leads)
      .leftJoin(user, eq(leads.assignedAgentId, user.id))
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(200),
    db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(inArray(user.role, ["SUPER_ADMIN", "DIRECTOR", "AGENT"]))
      .orderBy(asc(user.name)),
  ]);

  const agentOptions = agentRows.map((item) => ({
    value: item.id,
    label: item.name,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} lead{rows.length === 1 ? "" : "s"}
            {hasFilters ? " matching your filters" : ""}
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/crm/leads/new">New lead</Link>
          </Button>
        ) : null}
      </div>

      <Suspense fallback={null}>
        <LeadFilters agents={agentOptions} />
      </Suspense>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "No leads match your filters."
              : "No leads have been captured yet."}
          </p>
        </div>
      ) : (
        <Card className="mt-8 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Assigned</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium text-foreground">
                    {lead.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.source.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(lead.status)}>
                      {lead.status.replace(/_/g, " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.priority}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {lead.assignedAgentName ?? "Unassigned"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(lead.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/crm/leads/${lead.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </main>
  );
}
