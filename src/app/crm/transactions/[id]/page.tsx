import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { ArrowLeftIcon, PrinterIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, propertyImages, transactions, user } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata = {
  title: "Transaction",
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
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "long" }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function TransactionDetailPage({
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
      propertyId: properties.id,
      propertyTitle: properties.title,
      propertyType: properties.propertyType,
      propertyPurpose: properties.purpose,
      buyingPrice: properties.buyingPrice,
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

  const images = row.propertyId
    ? await db
        .select({
          id: propertyImages.id,
          url: propertyImages.url,
          alt: propertyImages.alt,
        })
        .from(propertyImages)
        .where(eq(propertyImages.propertyId, row.propertyId))
        .orderBy(desc(propertyImages.isCover), asc(propertyImages.sortOrder))
    : [];

  const profit =
    row.status === "SOLD" && row.buyingPrice != null
      ? row.amount - row.buyingPrice
      : null;

  const location =
    [row.neighborhood, row.town, row.county].filter(Boolean).join(", ") ||
    row.address ||
    "—";

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/crm/transactions">
            <ArrowLeftIcon className="size-4" />
            Back to transactions
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {row.propertyId ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/crm/properties/${row.propertyId}`}>
                View property
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="outline" size="sm">
            <Link
              href={`/crm/transactions/${row.id}/print`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <PrinterIcon className="size-4" />
              Print
            </Link>
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{row.buyerName}</h1>
        <Badge variant={row.status === "SOLD" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {row.propertyTitle ?? "—"} · {formatDate(row.transactionDate)}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transaction details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Type</dt>
                <dd>{row.status === "SOLD" ? "Sale" : "Rental"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">
                  {row.status === "RENTED" ? "Tenant" : "Buyer"}
                </dt>
                <dd>{row.buyerName}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Phone</dt>
                <dd>{row.buyerPhone ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Email</dt>
                <dd>{row.buyerEmail ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Selling price</dt>
                <dd className="font-medium">
                  {formatMoney(row.amount, row.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Buying price</dt>
                <dd>
                  {row.status === "SOLD" && row.buyingPrice != null
                    ? formatMoney(row.buyingPrice, row.currency)
                    : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Profit</dt>
                <dd
                  className={
                    profit == null
                      ? ""
                      : profit >= 0
                        ? "font-medium text-emerald-400"
                        : "font-medium text-red-400"
                  }
                >
                  {profit == null ? "—" : formatMoney(profit, row.currency)}
                </dd>
              </div>
              {row.status === "RENTED" ? (
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-muted-foreground">Lease ends</dt>
                  <dd>
                    {row.rentalExpiresAt
                      ? formatDate(row.rentalExpiresAt)
                      : "—"}
                  </dd>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Recorded by</dt>
                <dd>{row.recordedByName ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted-foreground">Recorded on</dt>
                <dd>{formatDateTime(row.createdAt)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Property</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Title</dt>
                <dd className="mt-0.5 font-medium">
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
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Type / purpose</dt>
                <dd className="mt-0.5">
                  {row.propertyType ?? "—"} · {row.propertyPurpose ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Location</dt>
                <dd className="mt-0.5">{location}</dd>
              </div>
              {row.mapUrl ? (
                <div>
                  <a
                    href={row.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand hover:underline"
                  >
                    View on Google Maps
                  </a>
                </div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      </div>

      {row.notes ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {row.notes}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Property images</CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No images for this property.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image) => (
                <a
                  key={image.id}
                  href={image.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden rounded-lg border border-border"
                >
                  <img
                    src={image.url}
                    alt={image.alt ?? row.propertyTitle ?? "Property image"}
                    className="h-40 w-full object-cover transition hover:scale-105"
                  />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
