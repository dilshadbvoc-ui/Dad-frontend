import { useQuery } from "@tanstack/react-query";
import { Building2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { getBranchPerformance } from "@/services/analyticsService";

export function BranchPerformanceChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["branch-performance"],
    queryFn: getBranchPerformance,
  });

  if (!isLoading && data.length < 2) {
    return null;
  }

  return (
    <Card className="rounded-[0.8rem] md:rounded-[2rem] bg-card border border-border overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[hsl(var(--chart-5))]" />
          Branch Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        ) : (
          <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
            <BarChart data={data} margin={{ top: 20, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="totalLeads" name="Total Leads" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="totalLeads" position="top" fontSize={11} fill="hsl(var(--foreground))" />
              </Bar>
              <Bar dataKey="convertedLeads" name="Converted" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="convertedLeads" position="top" fontSize={11} fill="hsl(var(--foreground))" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
