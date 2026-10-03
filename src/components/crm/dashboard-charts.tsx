"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function RevenueChart({
  data,
}: {
  data: { month: string; revenue: number }[];
}) {
  const config = {
    revenue: { label: "Revenue", color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.5} />
            <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value: number) =>
            value >= 1_000_000
              ? `${Math.round(value / 1_000_000)}M`
              : value >= 1_000
                ? `${Math.round(value / 1_000)}k`
                : `${value}`
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) =>
                `KES ${Number(value).toLocaleString("en-KE")}`
              }
            />
          }
        />
        <Area
          dataKey="revenue"
          type="natural"
          fill="url(#revenueFill)"
          stroke="var(--color-revenue)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}

export function DonutChart({
  data,
}: {
  data: { label: string; value: number }[];
}) {
  const config = data.reduce<ChartConfig>((acc, item, index) => {
    acc[item.label] = {
      label: item.label,
      color: CHART_COLORS[index % CHART_COLORS.length],
    };
    return acc;
  }, {});

  return (
    <ChartContainer config={config} className="mx-auto h-[240px] w-full">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={60}
          outerRadius={95}
          strokeWidth={2}
        >
          {data.map((item, index) => (
            <Cell
              key={item.label}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  );
}

export function CategoryBarChart({
  data,
  label = "Count",
}: {
  data: { label: string; value: number }[];
  label?: string;
}) {
  const config = {
    value: { label, color: "var(--chart-1)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 8, right: 16 }}
      >
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          dataKey="label"
          type="category"
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="value" radius={6}>
          {data.map((item, index) => (
            <Cell
              key={item.label}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export function ProfitBarChart({
  data,
}: {
  data: { month: string; profit: number }[];
}) {
  const config = {
    profit: { label: "Profit", color: "var(--chart-2)" },
  } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={48}
          tickFormatter={(value: number) =>
            Math.abs(value) >= 1_000_000
              ? `${(value / 1_000_000).toFixed(0)}M`
              : Math.abs(value) >= 1_000
                ? `${Math.round(value / 1_000)}k`
                : `${value}`
          }
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) =>
                `KES ${Number(value).toLocaleString("en-KE")}`
              }
            />
          }
        />
        <Bar dataKey="profit" radius={6}>
          {data.map((item) => (
            <Cell
              key={item.month}
              fill={item.profit >= 0 ? "var(--chart-2)" : "var(--chart-5)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
