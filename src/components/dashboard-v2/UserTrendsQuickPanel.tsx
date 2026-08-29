import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Sparkles, ArrowUpRight, ArrowDownRight, Minus, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserTrendsSummary } from "@/services/analyticsService";
import { DateRangeDropdown, type DateRangeValue } from "./DateRangeDropdown";

function TrendBadge({ changePct }: { changePct: number }) {
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

export function UserTrendsQuickPanel() {
  const [range, setRange] = useState<DateRangeValue>({ period: "week" });

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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          User Trends
        </CardTitle>
        <DateRangeDropdown value={range} onChange={setRange} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {data.map((tile) => (
                <div key={tile.key} className="rounded-xl bg-muted/30 p-3 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground truncate">{tile.label}</span>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xl font-extrabold text-foreground">{tile.current}</span>
                    <TrendBadge changePct={tile.changePct} />
                  </div>
                  <span className="text-[11px] text-muted-foreground/70">vs {tile.previous} last period</span>
                </div>
              ))}
            </div>
            <Link
              to="/trends/user"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-4"
            >
              View Full Trend
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
