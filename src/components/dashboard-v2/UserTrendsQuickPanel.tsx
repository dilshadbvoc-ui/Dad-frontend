import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserTrendsSummary } from "@/services/analyticsService";
import type { DateRangeValue } from "./DateRangeDropdown";

function TrendIndicator({ changePct }: { changePct: number }) {
  if (changePct > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
        <ArrowUpRight className="h-3.5 w-3.5" /> {changePct}%
      </span>
    );
  }
  if (changePct < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-destructive">
        <ArrowDownRight className="h-3.5 w-3.5" /> {Math.abs(changePct)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-muted-foreground">
      <Minus className="h-3.5 w-3.5" /> 0%
    </span>
  );
}

export function UserTrendsQuickPanel({ range }: { range: DateRangeValue }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["user-trends-summary", range.period, range.startDate, range.endDate],
    queryFn: () =>
      getUserTrendsSummary({
        period: range.period,
        startDate: range.period === "custom" ? range.startDate : undefined,
        endDate: range.period === "custom" ? range.endDate : undefined,
      }),
  });

  return (
    <Card className="rounded-[0.8rem] md:rounded-[2rem] bg-card shadow-sm border-0 overflow-hidden h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          User Trends
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-wrap gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            {data.map((tile) => (
              <div key={tile.key} className="flex flex-col gap-1 min-w-[110px]">
                <span className="text-xs text-muted-foreground">{tile.label}</span>
                <span className="text-xl font-extrabold text-foreground">{tile.current}</span>
                <div className="flex items-center gap-1.5">
                  <TrendIndicator changePct={tile.changePct} />
                  <span className="text-[11px] text-muted-foreground">vs last period</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
