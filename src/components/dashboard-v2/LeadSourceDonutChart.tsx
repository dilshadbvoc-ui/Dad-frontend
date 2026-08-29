import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PieChart as PieChartIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeadSourceAnalytics } from "@/services/analyticsService";
import { CHART_COLORS, LEAD_SOURCE_COLORS } from "./chartColors";

const SOURCE_LABELS: Record<string, string> = {
  website: "Website",
  referral: "Referral",
  social: "Social",
  paid_ad: "Paid Ad",
  import: "Import",
  api: "API",
  manual: "Manual",
  whatsapp: "WhatsApp",
  meta_leadgen: "Meta Lead Ads",
  cold_call: "Cold Call",
};

export function LeadSourceDonutChart({ branchId }: { branchId?: string }) {
  const { data: raw, isLoading } = useQuery({
    queryKey: ["lead-source-analytics-v2", branchId],
    queryFn: () => getLeadSourceAnalytics(branchId),
  });

  const data = useMemo(() => {
    const items = (Array.isArray(raw) ? raw : [])
      .map((item: { source?: string; count?: number }) => ({
        id: item.source || "unknown",
        name: SOURCE_LABELS[item.source || ""] || item.source || "Unknown",
        value: Number(item.count || 0),
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    const maxSlices = Object.keys(LEAD_SOURCE_COLORS).length;
    if (items.length <= maxSlices) return items;
    const top = items.slice(0, maxSlices - 1);
    const other = items.slice(maxSlices - 1).reduce((sum, i) => sum + i.value, 0);
    return [...top, { id: "Other", name: "Other", value: other }];
  }, [raw]);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="rounded-[10px] md:rounded-[20px] bg-card border border-border overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-[hsl(var(--chart-5))]" />
          Lead Source Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        ) : data.length === 0 ? (
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            No lead source data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                label={({ value }) => `${Math.round((value / total) * 100)}%`}
                labelLine={false}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.id} fill={LEAD_SOURCE_COLORS[entry.id] || CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value?: number, name?: string) => [`${value ?? 0} leads`, name ?? ""]}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
