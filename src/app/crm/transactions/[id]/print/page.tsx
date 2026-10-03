import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, transactions, user } from "@/db/schema";
import { BrandMark } from "@/components/brand";
import { TransactionPrintToolbar } from "@/components/crm/transaction-print-toolbar";

export const metadata = {
  title: "Transaction receipt",
};

type PageParams = Promise<{ id: string }>;

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "long",
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

export default async function TransactionPrintPage({
  params,
}: {
  params: PageParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const [row] = await db
    .select({
      id: transactions.id,
      status: transactions.status,
      buyerName: transactions.buyerName,
      buyerPhone: transactions.buyerPhone,
      buyerEmail: transactions.buyerEmail,
      amount: transactions.amount,
      currency: transactions.currency,
      transactionDate: transactions.transactionDate,
      rentalExpiresAt: transactions.rentalExpiresAt,
      notes: transactions.notes,
      createdAt: transactions.createdAt,
      recordedByName: user.name,
      propertyTitle: properties.title,
      propertyType: properties.propertyType,
      county: properties.county,
      town: properties.town,
      neighborhood: properties.neighborhood,
      address: properties.address,
      mapUrl: properties.mapUrl,
    })
    .from(transactions)
    .leftJoin(properties, eq(transactions.propertyId, properties.id))
    .leftJoin(user, eq(transactions.recordedById, user.id))
    .where(eq(transactions.id, id))
    .limit(1);

  if (!row) {
    notFound();
  }

  const reference = `TXN-${row.id.slice(0, 8).toUpperCase()}`;
  const location =
    [row.neighborhood, row.town, row.county].filter(Boolean).join(", ") ||
    row.address ||
    "—";

  const rows: { label: string; value: string }[] = [
    { label: "Reference", value: reference },
    { label: "Transaction type", value: row.status },
    {
      label: row.status === "RENTED" ? "Tenant" : "Buyer",
      value: row.buyerName,
    },
    { label: "Phone", value: row.buyerPhone ?? "—" },
    { label: "Email", value: row.buyerEmail ?? "—" },
    { label: "Amount", value: formatMoney(row.amount, row.currency) },
    { label: "Transaction date", value: formatDate(row.transactionDate) },
  ];

  if (row.status === "RENTED") {
    rows.push({
      label: "Lease end date",
      value: row.rentalExpiresAt ? formatDate(row.rentalExpiresAt) : "—",
    });
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <TransactionPrintToolbar />

      <div className="print-receipt rounded-xl border border-border bg-card p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <BrandMark />
            <div>
              <p className="text-base font-semibold text-foreground">
                Bright Light Homes &amp; Properties
              </p>
              <p className="text-xs text-muted-foreground">
                Transaction receipt
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{reference}</p>
            <p>Generated {formatDateTime(new Date())}</p>
          </div>
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          {row.status === "RENTED"
            ? "Rental transaction"
            : "Sale transaction"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {row.propertyTitle ?? "—"}
        </p>

        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {rows.map((item) => (
            <div key={item.label}>
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                {item.label}
              </dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 border-t border-border pt-6">
          <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
            Property
          </h2>
          <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted-foreground">Title</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {row.propertyTitle ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Type</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {row.propertyType ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Location</dt>
              <dd className="mt-0.5 text-sm font-medium text-foreground">
                {location}
              </dd>
            </div>
            {row.address ? (
              <div>
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="mt-0.5 text-sm font-medium text-foreground">
                  {row.address}
                </dd>
              </div>
            ) : null}
            {row.mapUrl ? (
              <div>
                <dt className="text-xs text-muted-foreground">Map</dt>
                <dd className="mt-0.5 text-sm">
                  <a
                    href={row.mapUrl}
                    className="text-foreground underline underline-offset-4"
                  >
                    View on Google Maps
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        {row.notes ? (
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-xs uppercase tracking-wide text-muted-foreground">
              Notes
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
              {row.notes}
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex items-end justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground">
          <div>
            <p>
              Recorded by{" "}
              <span className="font-medium text-foreground">
                {row.recordedByName ?? "—"}
              </span>
            </p>
            <p className="mt-1">Recorded {formatDateTime(row.createdAt)}</p>
          </div>
          <p className="text-right">
            This document is system generated by Bright Light CRM.
          </p>
        </div>
      </div>
    </main>
  );
}
