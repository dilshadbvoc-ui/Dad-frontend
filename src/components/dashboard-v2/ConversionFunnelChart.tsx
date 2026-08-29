import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeadsByStage } from "@/services/analyticsService";

export function ConversionFunnelChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["conversion-funnel"],
    queryFn: () => getLeadsByStage(),
  });

  const stages = (data?.stages ?? []).filter((s) => s.id !== "lost");
  const maxCount = Math.max(1, ...stages.map((s) => s.count));

  return (
    <Card className="rounded-[0.8rem] md:rounded-[2rem] bg-card shadow-sm border-0 overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-9 rounded-lg" />
            ))}
          </div>
        ) : stages.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
            No pipeline data yet
          </div>
        ) : (
          <div className="space-y-2.5">
            {stages.map((stage) => {
              const widthPct = Math.max(6, (stage.count / maxCount) * 100);
              return (
                <div key={stage.id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{stage.label}</span>
                  <div className="flex-1 h-8 rounded-lg bg-muted/30 relative overflow-hidden">
                    <div
                      className="h-full rounded-lg flex items-center justify-end px-2 transition-all"
                      style={{ width: `${widthPct}%`, backgroundColor: stage.color }}
                    >
                      <span className="text-xs font-bold text-white drop-shadow-sm">{stage.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
