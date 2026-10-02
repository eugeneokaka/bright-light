import Link from "next/link";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, transactions, user } from "@/db/schema";
import { canManageTransactions } from "@/lib/permissions";
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
  title: "Transactions",
};

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

export default async function TransactionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const canCreate = canManageTransactions(session?.user.role);

  const rows = await db
    .select({
      id: transactions.id,
      status: transactions.status,
      buyerName: transactions.buyerName,
      amount: transactions.amount,
      transactionDate: transactions.transactionDate,
      rentalExpiresAt: transactions.rentalExpiresAt,
      propertyTitle: properties.title,
      recordedByName: user.name,
    })
    .from(transactions)
    .leftJoin(properties, eq(transactions.propertyId, properties.id))
    .leftJoin(user, eq(transactions.recordedById, user.id))
    .orderBy(desc(transactions.transactionDate))
    .limit(200);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} transaction{rows.length === 1 ? "" : "s"}
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/crm/transactions/new">New transaction</Link>
          </Button>
        ) : null}
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No transactions have been recorded yet.
          </p>
        </div>
      ) : (
        <Card className="mt-8 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Buyer / Tenant</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Lease ends</TableHead>
                <TableHead>Recorded by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(row.transactionDate)}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {row.propertyTitle ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={row.status === "SOLD" ? "default" : "secondary"}
                    >
                      {row.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.buyerName}
                  </TableCell>
                  <TableCell>{formatPrice(row.amount)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.status === "RENTED" && row.rentalExpiresAt
                      ? formatDate(row.rentalExpiresAt)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.recordedByName ?? "—"}
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
