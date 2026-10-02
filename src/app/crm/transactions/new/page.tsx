import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { canManageTransactions } from "@/lib/permissions";
import { TransactionForm } from "@/components/crm/transaction-form";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "New transaction",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!canManageTransactions(session.user.role)) {
    redirect("/crm/transactions");
  }

  const params = await searchParams;
  const rawPropertyId = params.propertyId;
  const defaultPropertyId = Array.isArray(rawPropertyId)
    ? rawPropertyId[0]
    : rawPropertyId;

  const propertyOptions = await db
    .select({ id: properties.id, title: properties.title })
    .from(properties)
    .orderBy(asc(properties.title));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/crm/transactions">← Back to transactions</Link>
      </Button>

      <h1 className="mt-4 text-2xl font-semibold">New transaction</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Record a sold or rented property. The linked property status is updated
        automatically.
      </p>

      <div className="mt-8">
        <TransactionForm
          key={defaultPropertyId ?? "new"}
          properties={propertyOptions}
          defaultPropertyId={defaultPropertyId}
        />
      </div>
    </main>
  );
}
