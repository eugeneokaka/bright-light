import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, user } from "@/db/schema";
import { canManageLeads } from "@/lib/permissions";
import { LeadForm } from "@/components/crm/lead-form";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "New lead",
};

export default async function NewLeadPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!canManageLeads(session.user.role)) {
    redirect("/crm/leads");
  }

  const [agentRows, propertyRows] = await Promise.all([
    db
      .select({ id: user.id, name: user.name })
      .from(user)
      .where(inArray(user.role, ["SUPER_ADMIN", "DIRECTOR", "AGENT"]))
      .orderBy(asc(user.name)),
    db
      .select({ id: properties.id, title: properties.title })
      .from(properties)
      .orderBy(asc(properties.title)),
  ]);

  const agents = agentRows.map((item) => ({ id: item.id, label: item.name }));
  const propertyOptions = propertyRows.map((item) => ({
    id: item.id,
    label: item.title,
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/crm/leads">← Back to leads</Link>
      </Button>

      <h1 className="mt-4 text-2xl font-semibold">New lead</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Capture a lead manually and assign it to an agent.
      </p>

      <div className="mt-8">
        <LeadForm agents={agents} properties={propertyOptions} />
      </div>
    </main>
  );
}
