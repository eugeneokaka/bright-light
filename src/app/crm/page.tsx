import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  BadgeDollarSign,
  Building2,
  Handshake,
  TrendingUp,
  type LucideIcon,
  Users,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leads, properties, transactions } from "@/db/schema";
import {
  canManageLeads,
  canManageProperties,
  canManageTransactions,
} from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CategoryBarChart,
  DonutChart,
  RevenueChart,
} from "@/components/crm/dashboard-charts";

export const metadata = {
  title: "Dashboard",
};

function compactKES(amount: number) {
  if (amount >= 1_000_000) return `KES ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `KES ${(amount / 1_000).toFixed(0)}k`;
  return `KES ${amount}`;
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
}) {
  return (
    <Card className="transition-colors hover:ring-foreground/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription>{label}</CardDescription>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <CardTitle className="text-3xl">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? (
          <CardDescription>{description}</CardDescription>
        ) : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default async function CrmPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const [propertyRows, leadRows, transactionRows] = await Promise.all([
    db
      .select({
        id: properties.id,
        price: properties.price,
        buyingPrice: properties.buyingPrice,
        status: properties.status,
      })
      .from(properties),
    db
      .select({ source: leads.source, status: leads.status })
      .from(leads),
    db
      .select({
        status: transactions.status,
        amount: transactions.amount,
        transactionDate: transactions.transactionDate,
        propertyId: transactions.propertyId,
      })
      .from(transactions),
  ]);

  const propertyCount = propertyRows.length;
  const leadCount = leadRows.length;
  const transactionCount = transactionRows.length;

  const totalRevenue = transactionRows.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );

  const buyingPriceById = new Map(
    propertyRows.map((property) => [property.id, property.buyingPrice]),
  );

  const realizedProfit = transactionRows.reduce((sum, transaction) => {
    if (transaction.status !== "SOLD") return sum;
    const buyingPrice = buyingPriceById.get(transaction.propertyId);
    if (buyingPrice == null) return sum;
    return sum + (transaction.amount - buyingPrice);
  }, 0);

  const now = new Date();
  const months: { key: string; label: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
      label: date.toLocaleString("en-KE", { month: "short" }),
      revenue: 0,
    });
  }
  const monthByKey = new Map(months.map((month) => [month.key, month]));
  for (const transaction of transactionRows) {
    const date = transaction.transactionDate;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = monthByKey.get(key);
    if (month) month.revenue += transaction.amount;
  }
  const revenueByMonth = months.map((month) => ({
    month: month.label,
    revenue: month.revenue,
  }));

  const transactionsByType = [
    {
      label: "Sold",
      value: transactionRows.filter((t) => t.status === "SOLD").length,
    },
    {
      label: "Rented",
      value: transactionRows.filter((t) => t.status === "RENTED").length,
    },
  ].filter((item) => item.value > 0);

  const statusCounts = new Map<string, number>();
  for (const property of propertyRows) {
    statusCounts.set(
      property.status,
      (statusCounts.get(property.status) ?? 0) + 1,
    );
  }
  const propertiesByStatus = [...statusCounts.entries()]
    .map(([label, value]) => ({ label: label.replace(/_/g, " "), value }))
    .sort((a, b) => b.value - a.value);

  const sourceCounts = new Map<string, number>();
  for (const lead of leadRows) {
    sourceCounts.set(lead.source, (sourceCounts.get(lead.source) ?? 0) + 1);
  }
  const leadsBySource = [...sourceCounts.entries()]
    .map(([label, value]) => ({ label: label.replace(/_/g, " "), value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const canCreate = canManageProperties(session.user.role);
  const canRecordTransaction = canManageTransactions(session.user.role);
  const canManageLead = canManageLeads(session.user.role);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-semibold">
        Welcome, {session.user.name}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {session.user.role?.replace(/_/g, " ")} · Bright Light Homes &amp;
        Properties CRM
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Properties" value={propertyCount} icon={Building2} />
        <StatCard label="Leads" value={leadCount} icon={Users} />
        <StatCard
          label="Transactions"
          value={transactionCount}
          icon={Handshake}
        />
        <StatCard
          label="Revenue"
          value={compactKES(totalRevenue)}
          icon={BadgeDollarSign}
        />
        <StatCard
          label="Realized profit"
          value={compactKES(realizedProfit)}
          icon={TrendingUp}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Revenue"
          description="Transaction value over the last 6 months"
          className="lg:col-span-2"
        >
          <RevenueChart data={revenueByMonth} />
        </ChartCard>

        <ChartCard title="Transactions" description="Sold vs rented">
          {transactionsByType.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No transactions recorded yet.
            </p>
          ) : (
            <DonutChart data={transactionsByType} />
          )}
        </ChartCard>

        <ChartCard title="Properties by status">
          {propertiesByStatus.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No properties yet.
            </p>
          ) : (
            <CategoryBarChart data={propertiesByStatus} label="Properties" />
          )}
        </ChartCard>

        <ChartCard
          title="Leads by source"
          description="Top sources"
          className="lg:col-span-2"
        >
          {leadsBySource.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No leads yet.
            </p>
          ) : (
            <CategoryBarChart data={leadsBySource} label="Leads" />
          )}
        </ChartCard>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        {canCreate ? (
          <Button asChild>
            <Link href="/crm/properties/new">New listing</Link>
          </Button>
        ) : null}
        {canRecordTransaction ? (
          <Button asChild variant="outline">
            <Link href="/crm/transactions/new">New transaction</Link>
          </Button>
        ) : null}
        {canManageLead ? (
          <Button asChild variant="outline">
            <Link href="/crm/leads/new">New lead</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href="/crm/towers">View towers</Link>
        </Button>
      </div>
    </main>
  );
}
