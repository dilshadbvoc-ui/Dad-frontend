import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeadsByStage } from "@/services/analyticsService";

const MAX_WIDTH_PCT = 100;
const MIN_WIDTH_PCT = 22;

export function ConversionFunnelChart() {
  const { data, isLoading } = useQuery({
    queryKey: ["conversion-funnel"],
    queryFn: () => getLeadsByStage(),
  });

  const stages = data?.stages ?? [];
  const step = stages.length > 1 ? (MAX_WIDTH_PCT - MIN_WIDTH_PCT) / (stages.length - 1) : 0;

  return (
    <Card className="rounded-[0.8rem] md:rounded-[2rem] bg-card shadow-sm border-0 overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <Filter className="h-5 w-5 text-[hsl(var(--chart-5))]" />
          Conversion Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[260px] w-full rounded-2xl" />
        ) : stages.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
            No pipeline data yet
          </div>
        ) : (
          <div className="flex gap-4">
            <div className="flex flex-col gap-2 shrink-0">
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-1.5 h-[22px]">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{stage.label}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              {stages.map((stage, index) => (
                <div
                  key={stage.id}
                  className="h-[22px] rounded-sm"
                  style={{ width: `${MAX_WIDTH_PCT - step * index}%`, backgroundColor: stage.color }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2 shrink-0 items-end">
              {stages.map((stage) => (
                <span key={stage.id} className="h-[22px] flex items-center text-xs font-semibold text-foreground">
                  {stage.count.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
