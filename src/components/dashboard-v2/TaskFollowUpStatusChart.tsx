import { useQuery } from "@tanstack/react-query";
import { ListChecks } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LabelList } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { getTaskFollowUpCompletion } from "@/services/analyticsService";

const STATUS_ORDER = ["not_started", "in_progress", "completed", "deferred"];

export function TaskFollowUpStatusChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["task-followup-completion"],
    queryFn: () => getTaskFollowUpCompletion(),
  });

  const chartData = [...data].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );

  return (
    <Card className="rounded-[0.8rem] md:rounded-[2rem] bg-card shadow-sm border-0 overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-primary" />
          Tasks &amp; Follow-ups by Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        ) : chartData.length === 0 ? (
          <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
            No tasks or follow-ups yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280} minWidth={1} minHeight={1}>
            <BarChart data={chartData} margin={{ top: 20, right: 16, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="tasks" name="Tasks" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="tasks" position="top" fontSize={11} fill="hsl(var(--foreground))" />
              </Bar>
              <Bar dataKey="followUps" name="Follow-ups" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="followUps" position="top" fontSize={11} fill="hsl(var(--foreground))" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
