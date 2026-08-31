import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { getCallActivityTrend } from "@/services/analyticsService";
import { DateRangeDropdown, type DateRangeValue } from "./DateRangeDropdown";

function formatDay(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function CallActivityTrendChart() {
  const [range, setRange] = useState<DateRangeValue>({ period: "week" });

  const { data = [], isLoading } = useQuery({
    queryKey: ["call-activity-trend", range.period, range.startDate, range.endDate],
    queryFn: () =>
      getCallActivityTrend({
        period: range.period,
        startDate: range.period === "custom" ? range.startDate : undefined,
        endDate: range.period === "custom" ? range.endDate : undefined,
      }),
  });

  const chartData = data.map((d) => ({ ...d, label: formatDay(d.date) }));

  return (
    <Card className="rounded-[10px] md:rounded-[20px] bg-card border border-border overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium font-poppins text-black flex items-center gap-2">
          Call Activity Trend
        </CardTitle>
        <DateRangeDropdown value={range} onChange={setRange} variant="accent" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[280px] w-full rounded-2xl" />
        ) : chartData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No call activity in this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300} minWidth={1} minHeight={1}>
            <AreaChart data={chartData} margin={{ top: 0, right: 16, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorConnected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="label" tick={{ fontFamily: "Poppins, sans-serif", fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontFamily: "Poppins, sans-serif", fontSize: 12, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", fontFamily: "Poppins, sans-serif" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend verticalAlign="top" align="left" height={32} wrapperStyle={{ fontSize: 12, fontFamily: "Poppins, sans-serif" }} />
              <Area type="monotone" dataKey="connected" name="Connected" stroke="hsl(var(--chart-1))" strokeWidth={2} fillOpacity={1} fill="url(#colorConnected)" />
              <Area type="monotone" dataKey="total" name="Total Calls" stroke="hsl(var(--chart-5))" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
