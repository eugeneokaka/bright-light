import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BadgeDollarSign,
  Building2,
  Handshake,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { leads, properties, transactions } from "@/db/schema";
import {
  canManageLeads,
  canManageProperties,
  canManageTransactions,
} from "@/lib/permissions";
import { AddNewMenu, type AddNewItem } from "@/components/crm/add-new-menu";
import {
  CategoryBarChart,
  DonutChart,
  ProfitBarChart,
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
  delta,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  delta: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <span className="flex size-9 items-center justify-center rounded-lg bg-brand/10 text-brand">
        <Icon className="size-4" />
      </span>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-400">
        <ArrowUpRight className="size-3.5" />
        {delta}
        <span className="font-normal text-muted-foreground">this month</span>
      </p>
    </div>
  );
}

function ChartCard({
  title,
  icon: Icon,
  description,
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  description?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/60 bg-card p-4 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Icon className="size-4 text-brand" />
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export default async function CrmPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/login");
  }

  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [propertyRows, leadRows, transactionRows] = await Promise.all([
    db
      .select({
        id: properties.id,
        price: properties.price,
        buyingPrice: properties.buyingPrice,
        status: properties.status,
        createdAt: properties.createdAt,
      })
      .from(properties),
    db
      .select({
        source: leads.source,
        status: leads.status,
        createdAt: leads.createdAt,
      })
      .from(leads),
    db
      .select({
        propertyId: transactions.propertyId,
        status: transactions.status,
        amount: transactions.amount,
        transactionDate: transactions.transactionDate,
        createdAt: transactions.createdAt,
      })
      .from(transactions),
  ]);

  const propertyCount = propertyRows.length;
  const leadCount = leadRows.length;
  const transactionCount = transactionRows.length;
  const totalRevenue = transactionRows.reduce((sum, t) => sum + t.amount, 0);

  const newProperties = propertyRows.filter(
    (row) => row.createdAt >= since30,
  ).length;
  const newLeads = leadRows.filter((row) => row.createdAt >= since30).length;
  const newTransactions = transactionRows.filter(
    (row) => row.createdAt >= since30,
  ).length;

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

  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthKey = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const revenueThisMonth = monthByKey.get(thisMonthKey)?.revenue ?? 0;
  const revenueLastMonth = monthByKey.get(lastMonthKey)?.revenue ?? 0;
  const revenueChange =
    revenueLastMonth > 0
      ? Math.round(
          ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100,
        )
      : null;

  const buyingPriceById = new Map(
    propertyRows.map((property) => [property.id, property.buyingPrice]),
  );

  function soldProfit(transaction: {
    status: string;
    amount: number;
    propertyId: string | null;
  }) {
    if (transaction.status !== "SOLD") return 0;
    const buyingPrice = transaction.propertyId
      ? buyingPriceById.get(transaction.propertyId)
      : null;
    if (buyingPrice == null) return 0;
    return transaction.amount - buyingPrice;
  }

  const realizedProfit = transactionRows.reduce(
    (sum, transaction) => sum + soldProfit(transaction),
    0,
  );
  const soldCount = transactionRows.filter((t) => t.status === "SOLD").length;

  const profitMonths = months.map((month) => ({ ...month, profit: 0 }));
  const profitByKey = new Map(profitMonths.map((month) => [month.key, month]));
  for (const transaction of transactionRows) {
    if (transaction.status !== "SOLD") continue;
    const buyingPrice = transaction.propertyId
      ? buyingPriceById.get(transaction.propertyId)
      : null;
    if (buyingPrice == null) continue;
    const date = transaction.transactionDate;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const month = profitByKey.get(key);
    if (month) month.profit += transaction.amount - buyingPrice;
  }
  const profitByMonth = profitMonths.map((month) => ({
    month: month.label,
    profit: month.profit,
  }));

  const profitThisMonth = profitByKey.get(thisMonthKey)?.profit ?? 0;
  const profitLastMonth = profitByKey.get(lastMonthKey)?.profit ?? 0;
  const profitChange =
    profitLastMonth > 0
      ? Math.round(((profitThisMonth - profitLastMonth) / profitLastMonth) * 100)
      : null;

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
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const addNewItems: AddNewItem[] = [];
  if (canManageProperties(session.user.role)) {
    addNewItems.push({ href: "/crm/properties/new", label: "New listing" });
  }
  if (canManageLeads(session.user.role)) {
    addNewItems.push({ href: "/crm/leads/new", label: "New lead" });
  }
  if (canManageTransactions(session.user.role)) {
    addNewItems.push({
      href: "/crm/transactions/new",
      label: "New transaction",
    });
  }
  if (session.user.role === "SUPER_ADMIN") {
    addNewItems.push({ href: "/crm/users/new", label: "Invite user" });
  }

  return (
    <main className="w-full flex-1 px-4 py-6 lg:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-r from-card via-card to-brand/10 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand">
              Welcome back,
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {session.user.name}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here&apos;s what&apos;s happening with your business today.
            </p>
          </div>
          <div className="w-full md:w-48">
            <AddNewMenu items={addNewItems} />
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Properties"
          value={propertyCount}
          icon={Building2}
          delta={`+${newProperties}`}
        />
        <StatCard
          label="Leads"
          value={leadCount}
          icon={Users}
          delta={`+${newLeads}`}
        />
        <StatCard
          label="Transactions"
          value={transactionCount}
          icon={Handshake}
          delta={`+${newTransactions}`}
        />
        <StatCard
          label="Revenue"
          value={compactKES(totalRevenue)}
          icon={BadgeDollarSign}
          delta={
            revenueChange === null
              ? compactKES(revenueThisMonth)
              : `${revenueChange >= 0 ? "+" : ""}${revenueChange}%`
          }
        />
        <StatCard
          label="Realized profit"
          value={compactKES(realizedProfit)}
          icon={TrendingUp}
          delta={
            profitChange === null
              ? `${soldCount} sold`
              : `${profitChange >= 0 ? "+" : ""}${profitChange}%`
          }
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard
          title="Revenue"
          icon={BadgeDollarSign}
          description="Transaction value over the last 6 months"
        >
          <RevenueChart data={revenueByMonth} />
        </ChartCard>

        <ChartCard
          title="Realized profit"
          icon={TrendingUp}
          description="Profit from sold properties only (green) vs losses (red)"
        >
          {soldCount === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No sold properties yet.
            </p>
          ) : (
            <ProfitBarChart data={profitByMonth} />
          )}
        </ChartCard>

        <ChartCard
          title="Transactions"
          icon={Handshake}
          description="Sold vs rented"
        >
          {transactionsByType.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No transactions recorded yet.
            </p>
          ) : (
            <DonutChart data={transactionsByType} />
          )}
        </ChartCard>

        <ChartCard
          title="Properties by status"
          icon={Building2}
          description="Current listings"
        >
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
          icon={Users}
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
    </main>
  );
}
