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

function formatPrice(amount: number, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
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
      currency: transactions.currency,
      transactionDate: transactions.transactionDate,
      rentalExpiresAt: transactions.rentalExpiresAt,
      propertyId: transactions.propertyId,
      propertyTitle: properties.title,
      buyingPrice: properties.buyingPrice,
      recordedByName: user.name,
    })
    .from(transactions)
    .leftJoin(properties, eq(transactions.propertyId, properties.id))
    .leftJoin(user, eq(transactions.recordedById, user.id))
    .orderBy(desc(transactions.transactionDate))
    .limit(200);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
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
                <TableHead>Buying price</TableHead>
                <TableHead>Selling price</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Lease ends</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const profit =
                  row.status === "SOLD" && row.buyingPrice != null
                    ? row.amount - row.buyingPrice
                    : null;

                return (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(row.transactionDate)}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      {row.propertyId ? (
                        <Link
                          href={`/crm/properties/${row.propertyId}`}
                          className="hover:text-brand hover:underline"
                        >
                          {row.propertyTitle ?? "—"}
                        </Link>
                      ) : (
                        (row.propertyTitle ?? "—")
                      )}
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
                    <TableCell className="text-muted-foreground">
                      {row.status === "SOLD" && row.buyingPrice != null
                        ? formatPrice(row.buyingPrice, row.currency)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {formatPrice(row.amount, row.currency)}
                    </TableCell>
                    <TableCell>
                      {profit == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={
                            profit >= 0
                              ? "font-medium text-emerald-400"
                              : "font-medium text-red-400"
                          }
                        >
                          {formatPrice(profit, row.currency)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.status === "RENTED" && row.rentalExpiresAt
                        ? formatDate(row.rentalExpiresAt)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/crm/transactions/${row.id}`}>View</Link>
                        </Button>
                        {row.propertyId ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/crm/properties/${row.propertyId}`}>
                              Property
                            </Link>
                          </Button>
                        ) : null}
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/crm/transactions/${row.id}/print`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Print
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </main>
  );
}
