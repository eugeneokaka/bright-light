import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { ArrowLeftIcon } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import {
  properties,
  propertyImages,
  transactions,
  user,
} from "@/db/schema";
import { canManageTransactions } from "@/lib/permissions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata = {
  title: "Property",
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
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(date);
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "SOLD":
    case "RENTED":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function PropertyDetailPage({
  params,
}: {
  params: PageParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const [property] = await db
    .select({
      id: properties.id,
      title: properties.title,
      description: properties.description,
      propertyType: properties.propertyType,
      purpose: properties.purpose,
      price: properties.price,
      buyingPrice: properties.buyingPrice,
      currency: properties.currency,
      county: properties.county,
      town: properties.town,
      neighborhood: properties.neighborhood,
      address: properties.address,
      mapUrl: properties.mapUrl,
      bedrooms: properties.bedrooms,
      bathrooms: properties.bathrooms,
      size: properties.size,
      sizeUnit: properties.sizeUnit,
      parking: properties.parking,
      amenities: properties.amenities,
      featured: properties.featured,
      status: properties.status,
      createdAt: properties.createdAt,
      agentName: user.name,
    })
    .from(properties)
    .leftJoin(user, eq(properties.agentId, user.id))
    .where(eq(properties.id, id))
    .limit(1);

  if (!property) {
    notFound();
  }

  const [images, transactionRows] = await Promise.all([
    db
      .select({
        id: propertyImages.id,
        url: propertyImages.url,
        alt: propertyImages.alt,
      })
      .from(propertyImages)
      .where(eq(propertyImages.propertyId, id))
      .orderBy(desc(propertyImages.isCover), asc(propertyImages.sortOrder)),
    db
      .select({
        id: transactions.id,
        status: transactions.status,
        buyerName: transactions.buyerName,
        amount: transactions.amount,
        currency: transactions.currency,
        transactionDate: transactions.transactionDate,
      })
      .from(transactions)
      .where(eq(transactions.propertyId, id))
      .orderBy(desc(transactions.transactionDate)),
  ]);

  const location =
    [property.neighborhood, property.town, property.county]
      .filter(Boolean)
      .join(", ") ||
    property.address ||
    "—";

  const canSell = canManageTransactions(session.user.role);

  const facts: { label: string; value: string }[] = [
    { label: "Type", value: property.propertyType },
    { label: "Purpose", value: property.purpose },
    { label: "Bedrooms", value: property.bedrooms?.toString() ?? "—" },
    { label: "Bathrooms", value: property.bathrooms?.toString() ?? "—" },
    { label: "Parking", value: property.parking?.toString() ?? "—" },
    {
      label: "Size",
      value: property.size
        ? `${property.size}${property.sizeUnit ? ` ${property.sizeUnit}` : ""}`
        : "—",
    },
    { label: "Agent", value: property.agentName ?? "—" },
    { label: "Listed", value: formatDate(property.createdAt) },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/crm/properties">
            <ArrowLeftIcon className="size-4" />
            Back to properties
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {property.mapUrl ? (
            <Button asChild variant="outline" size="sm">
              <a
                href={property.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on map
              </a>
            </Button>
          ) : null}
          {canSell ? (
            <Button asChild size="sm">
              <Link href={`/crm/transactions/new?propertyId=${property.id}`}>
                Sell / rent
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">{property.title}</h1>
        {property.featured ? <Badge variant="outline">Featured</Badge> : null}
        <Badge variant={statusVariant(property.status)}>
          {property.status}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{location}</p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Price</p>
          <p className="mt-1 font-semibold text-foreground">
            {formatMoney(property.price, property.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Buying price</p>
          <p className="mt-1 font-semibold text-foreground">
            {property.buyingPrice != null
              ? formatMoney(property.buyingPrice, property.currency)
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Potential profit</p>
          <p className="mt-1 font-semibold text-foreground">
            {property.buyingPrice != null
              ? formatMoney(
                  property.price - property.buyingPrice,
                  property.currency,
                )
              : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="mt-1 font-semibold text-foreground">
            {transactionRows.length}
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Images</CardTitle>
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
                    alt={image.alt ?? property.title}
                    className="h-40 w-full object-cover transition hover:scale-105"
                  />
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-muted-foreground">{fact.label}</dt>
                  <dd className="mt-0.5">{fact.value}</dd>
                </div>
              ))}
            </dl>

            {property.amenities && property.amenities.length > 0 ? (
              <div className="mt-4">
                <p className="text-muted-foreground">Amenities</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {property.amenities.map((amenity) => (
                    <Badge key={amenity} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : null}

            {property.address ? (
              <div className="mt-4 text-sm">
                <p className="text-muted-foreground">Address</p>
                <p className="mt-0.5">{property.address}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {property.description ?? "No description provided."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 overflow-hidden py-0">
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <CardTitle>Transactions</CardTitle>
          {canSell ? (
            <Button asChild variant="outline" size="sm">
              <Link href={`/crm/transactions/new?propertyId=${property.id}`}>
                Record transaction
              </Link>
            </Button>
          ) : null}
        </div>

        {transactionRows.length === 0 ? (
          <p className="px-6 pb-6 text-sm text-muted-foreground">
            No transactions recorded for this property yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Buyer / Tenant</TableHead>
                <TableHead>Selling price</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionRows.map((transaction) => {
                const profit =
                  transaction.status === "SOLD" && property.buyingPrice != null
                    ? transaction.amount - property.buyingPrice
                    : null;

                return (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-muted-foreground">
                      {formatDate(transaction.transactionDate)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          transaction.status === "SOLD" ? "default" : "secondary"
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {transaction.buyerName}
                    </TableCell>
                    <TableCell>
                      {formatMoney(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell>
                      {profit == null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span
                          className={
                            profit >= 0 ? "text-emerald-400" : "text-red-400"
                          }
                        >
                          {formatMoney(profit, transaction.currency)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/crm/transactions/${transaction.id}`}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </main>
  );
}
