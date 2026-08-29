import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
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
    <Card className="rounded-[0.8rem] md:rounded-[2rem] bg-card shadow-sm border-0 overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Call Activity Trend
        </CardTitle>
        <DateRangeDropdown value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        ) : chartData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No call activity in this range
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
            <LineChart data={chartData} margin={{ top: 10, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="total" name="Total Calls" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="connected" name="Connected" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
