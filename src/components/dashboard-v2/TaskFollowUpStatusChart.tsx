import { useQuery } from "@tanstack/react-query";
import { ListChecks } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getTaskFollowUpCompletion } from "@/services/analyticsService";
import { RadialGauge } from "./RadialGauge";
import { STATUS_COLORS } from "./chartColors";

const STATUS_ORDER = ["not_started", "in_progress", "completed", "deferred"];

export function TaskFollowUpStatusChart() {
  const { data = [], isLoading } = useQuery({
    queryKey: ["task-followup-completion"],
    queryFn: () => getTaskFollowUpCompletion(),
  });

  const rows = [...data].sort(
    (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
  );
  const total = rows.reduce((sum, r) => sum + r.total, 0);
  const completed = rows.find((r) => r.status === "completed")?.total ?? 0;
  const completionPct = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Card className="rounded-[10px] md:rounded-[20px] bg-card border border-border overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium font-poppins text-black flex items-center gap-2">
          <ListChecks className="h-5 w-5 text-[hsl(var(--chart-5))]" />
          Tasks &amp; Follow-ups by Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[220px] w-full rounded-2xl" />
        ) : total === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">
            No tasks or follow-ups yet
          </div>
        ) : (
          <div className="flex items-center gap-6 flex-wrap sm:flex-nowrap">
            <RadialGauge percent={completionPct} valueText={total.toLocaleString()} label="Total" />
            <div className="flex-1 min-w-[180px] space-y-3">
              {rows.map((row) => {
                const share = total > 0 ? (row.total / total) * 100 : 0;
                const color = STATUS_COLORS[row.status] || "hsl(var(--muted-foreground))";
                return (
                  <div key={row.status} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                    <span className="text-xs font-poppins text-muted-foreground w-20 shrink-0 truncate">{row.label}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: color }} />
                    </div>
                    <span className="text-xs font-semibold font-poppins text-foreground w-10 text-right shrink-0">{row.total}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
