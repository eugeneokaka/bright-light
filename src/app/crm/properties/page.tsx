import Link from "next/link";
import { Suspense } from "react";
import { headers } from "next/headers";
import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  type SQL,
} from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { properties, propertyImages } from "@/db/schema";
import { canManageProperties, canManageTransactions } from "@/lib/permissions";
import {
  PROPERTY_PURPOSES,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
} from "@/lib/validations/property";
import { PropertyFilters } from "@/components/crm/property-filters";
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
  title: "Properties",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function numericParam(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 0,
  }).format(price);
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "DRAFT":
      return "secondary";
    case "SOLD":
    case "RENTED":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const canCreate = canManageProperties(session?.user.role);
  const canSell = canManageTransactions(session?.user.role);

  const params = await searchParams;
  const keyword = first(params.keyword)?.trim();
  const county = first(params.county)?.trim();
  const town = first(params.town)?.trim();
  const type = first(params.type)?.trim();
  const purpose = first(params.purpose)?.trim();
  const status = first(params.status)?.trim();
  const featured = first(params.featured)?.trim();
  const minPrice = numericParam(first(params.minPrice));
  const maxPrice = numericParam(first(params.maxPrice));
  const bedrooms = numericParam(first(params.bedrooms));
  const bathrooms = numericParam(first(params.bathrooms));

  const conditions: (SQL | undefined)[] = [];

  if (keyword) {
    const like = `%${keyword}%`;
    conditions.push(
      or(
        ilike(properties.title, like),
        ilike(properties.town, like),
        ilike(properties.county, like),
        ilike(properties.neighborhood, like),
        ilike(properties.address, like),
      ),
    );
  }
  if (county) conditions.push(eq(properties.county, county));
  if (town) conditions.push(eq(properties.town, town));
  if (type) {
    conditions.push(
      eq(properties.propertyType, type as (typeof PROPERTY_TYPES)[number]),
    );
  }
  if (purpose) {
    conditions.push(
      eq(properties.purpose, purpose as (typeof PROPERTY_PURPOSES)[number]),
    );
  }
  if (status) {
    conditions.push(
      eq(properties.status, status as (typeof PROPERTY_STATUSES)[number]),
    );
  }
  if (featured === "yes") conditions.push(eq(properties.featured, true));
  if (featured === "no") conditions.push(eq(properties.featured, false));
  if (minPrice !== undefined) conditions.push(gte(properties.price, minPrice));
  if (maxPrice !== undefined) conditions.push(lte(properties.price, maxPrice));
  if (bedrooms !== undefined) {
    conditions.push(gte(properties.bedrooms, bedrooms));
  }
  if (bathrooms !== undefined) {
    conditions.push(gte(properties.bathrooms, bathrooms));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const hasFilters = conditions.length > 0;

  const [rows, countyRows, townRows] = await Promise.all([
    db
      .select()
      .from(properties)
      .where(where)
      .orderBy(desc(properties.createdAt))
      .limit(200),
    db.selectDistinct({ county: properties.county }).from(properties),
    county
      ? db
          .selectDistinct({ town: properties.town })
          .from(properties)
          .where(eq(properties.county, county))
      : db.selectDistinct({ town: properties.town }).from(properties),
  ]);

  const counties = countyRows
    .map((row) => row.county)
    .filter((value): value is string => Boolean(value))
    .sort();
  const towns = townRows
    .map((row) => row.town)
    .filter((value): value is string => Boolean(value))
    .sort();

  const propertyIds = rows.map((row) => row.id);

  const images = propertyIds.length
    ? await db
        .select({
          propertyId: propertyImages.propertyId,
          url: propertyImages.url,
          isCover: propertyImages.isCover,
          sortOrder: propertyImages.sortOrder,
        })
        .from(propertyImages)
        .where(inArray(propertyImages.propertyId, propertyIds))
        .orderBy(desc(propertyImages.isCover), propertyImages.sortOrder)
    : [];

  const coverByProperty = new Map<string, string>();
  for (const image of images) {
    if (!coverByProperty.has(image.propertyId)) {
      coverByProperty.set(image.propertyId, image.url);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Properties</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {rows.length} listing{rows.length === 1 ? "" : "s"}
            {hasFilters ? " matching your filters" : ""}
          </p>
        </div>
        {canCreate ? (
          <Button asChild>
            <Link href="/crm/properties/new">New listing</Link>
          </Button>
        ) : null}
      </div>

      <Suspense fallback={null}>
        <PropertyFilters counties={counties} towns={towns} />
      </Suspense>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "No properties match your filters."
              : "No properties have been published yet."}
          </p>
        </div>
      ) : (
        <Card className="mt-8 overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Beds</TableHead>
                <TableHead>Baths</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((property) => {
                const coverImage = coverByProperty.get(property.id);

                return (
                  <TableRow key={property.id}>
                    <TableCell>
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt={property.title}
                          className="h-10 w-16 rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-16 items-center justify-center rounded-md border border-border bg-muted/30 text-[10px] text-muted-foreground">
                          No image
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <span className="inline-flex items-center gap-2">
                        {property.title}
                        {property.featured ? (
                          <Badge variant="outline">Featured</Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {property.propertyType}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {property.purpose}
                    </TableCell>
                    <TableCell>{formatPrice(property.price)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {property.status === "SOLD" &&
                      property.buyingPrice != null
                        ? formatPrice(property.price - property.buyingPrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {[property.town, property.county]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {property.bedrooms ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {property.bathrooms ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(property.status)}>
                        {property.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {canSell ? (
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/crm/transactions/new?propertyId=${property.id}`}
                          >
                            Sell
                          </Link>
                        </Button>
                      ) : (
                        "—"
                      )}
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
