import { useQuery } from "@tanstack/react-query";
import { DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { getOpportunityPipelineValue } from "@/services/analyticsService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { PIPELINE_BUCKET_COLORS } from "./chartColors";

export function OpportunityPipelineChart() {
  const { formatCurrencyCompact, formatCurrency } = useCurrency();
  const { data = [], isLoading } = useQuery({
    queryKey: ["opportunity-pipeline-value"],
    queryFn: () => getOpportunityPipelineValue(),
  });

  const hasData = data.some((d) => d.count > 0);

  return (
    <Card className="rounded-[10px] md:rounded-[20px] bg-card border border-border overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-[hsl(var(--chart-5))]" />
          Opportunity Pipeline Value
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        ) : !hasData ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No opportunities yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
            <BarChart data={data} margin={{ top: 20, right: 16, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatCurrencyCompact(v)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value?: number, _name?, item?: { payload?: { count?: number } }) => [
                  formatCurrency(value ?? 0),
                  `${item?.payload?.count ?? 0} deals`,
                ]}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.id} fill={PIPELINE_BUCKET_COLORS[entry.id] || "hsl(var(--chart-3))"} />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  fontSize={11}
                  fill="hsl(var(--foreground))"
                  formatter={(v: React.ReactNode) => formatCurrencyCompact(typeof v === "number" ? v : 0)}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
