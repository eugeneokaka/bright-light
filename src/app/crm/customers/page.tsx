import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leads, transactions } from "@/db/schema";
import { canManageLeads } from "@/lib/permissions";
import { CustomerSearch } from "@/components/crm/customer-search";
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
  title: "Customers",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

type Customer = {
  phone: string;
  name: string;
  email: string | null;
  leadCount: number;
  transactionCount: number;
  totalValue: number;
  interactions: number;
  lastActivity: Date;
};

function normalizePhone(phone: string | null | undefined): string {
  return (phone ?? "").replace(/[^\d+]/g, "");
}

function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(date);
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  if (!canManageLeads(session.user.role)) {
    redirect("/crm");
  }

  const params = await searchParams;
  const rawQuery = params.q;
  const query = (Array.isArray(rawQuery) ? rawQuery[0] : rawQuery)?.trim() ?? "";

  const [leadRows, transactionRows] = await Promise.all([
    db
      .select({
        name: leads.name,
        phone: leads.phone,
        email: leads.email,
        createdAt: leads.createdAt,
      })
      .from(leads),
    db
      .select({
        name: transactions.buyerName,
        phone: transactions.buyerPhone,
        email: transactions.buyerEmail,
        amount: transactions.amount,
        at: transactions.transactionDate,
      })
      .from(transactions),
  ]);

  const customers = new Map<string, Customer>();

  function record(
    rawPhone: string | null | undefined,
    name: string,
    email: string | null,
    at: Date,
    kind: "lead" | "transaction",
    amount: number,
  ) {
    const key = normalizePhone(rawPhone);
    if (!key) return;

    let customer = customers.get(key);
    if (!customer) {
      customer = {
        phone: (rawPhone ?? "").trim(),
        name,
        email,
        leadCount: 0,
        transactionCount: 0,
        totalValue: 0,
        interactions: 0,
        lastActivity: at,
      };
      customers.set(key, customer);
    }

    if (at.getTime() > customer.lastActivity.getTime()) {
      customer.lastActivity = at;
      if (name) customer.name = name;
      if (email) customer.email = email;
    }
    if (!customer.name && name) customer.name = name;
    if (!customer.email && email) customer.email = email;

    if (kind === "lead") {
      customer.leadCount += 1;
    } else {
      customer.transactionCount += 1;
      customer.totalValue += amount;
    }
    customer.interactions += 1;
  }

  for (const lead of leadRows) {
    record(lead.phone, lead.name, lead.email, lead.createdAt, "lead", 0);
  }
  for (const transaction of transactionRows) {
    record(
      transaction.phone,
      transaction.name,
      transaction.email,
      transaction.at,
      "transaction",
      transaction.amount,
    );
  }

  const needle = query.toLowerCase();
  const rows = [...customers.values()]
    .filter((customer) => {
      if (!needle) return true;
      return (
        customer.name.toLowerCase().includes(needle) ||
        customer.phone.toLowerCase().includes(needle) ||
        (customer.email ?? "").toLowerCase().includes(needle)
      );
    })
    .sort(
      (a, b) =>
        b.interactions - a.interactions ||
        b.lastActivity.getTime() - a.lastActivity.getTime(),
    );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} customer{rows.length === 1 ? "" : "s"}, most active
            first
          </p>
        </div>
        <Suspense fallback={null}>
          <CustomerSearch />
        </Suspense>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {query
              ? "No customers match your search."
              : "No customers yet — they appear here from leads and transactions."}
          </p>
        </div>
      ) : (
        <Card className="mt-8 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Leads</TableHead>
                <TableHead className="text-right">Transactions</TableHead>
                <TableHead className="text-right">Total value</TableHead>
                <TableHead>Last activity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((customer) => (
                <TableRow key={customer.phone}>
                  <TableCell className="font-medium text-foreground">
                    {customer.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.phone}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.email ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {customer.leadCount}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {customer.transactionCount}
                  </TableCell>
                  <TableCell className="text-right">
                    {customer.totalValue > 0
                      ? formatPrice(customer.totalValue)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(customer.lastActivity)}
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
