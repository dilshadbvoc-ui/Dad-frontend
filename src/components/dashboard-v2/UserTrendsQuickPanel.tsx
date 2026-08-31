import { Fragment } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserTrendsSummary } from "@/services/analyticsService";
import type { DateRangeValue } from "./DateRangeDropdown";

function TrendIndicator({ changePct }: { changePct: number }) {
  if (changePct > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-poppins font-semibold text-emerald-600 dark:text-emerald-400">
        <ArrowUpRight className="h-3.5 w-3.5" /> {changePct}%
      </span>
    );
  }
  if (changePct < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-poppins font-semibold text-[#FF0000]">
        <ArrowDownRight className="h-3.5 w-3.5" /> {Math.abs(changePct)}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-poppins font-semibold text-muted-foreground">
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
    <div className="h-full">
      <h3 className="text-xl font-medium font-poppins flex items-center gap-2 mb-6">
        <Sparkles strokeWidth={1} className="h-5.5 w-5.5 text-[hsl(var(--chart-5))]" />
        User Trends
      </h3>
      <div>
        {isLoading ? (
          <div className="flex flex-wrap gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-32 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-y-5">
            {data.map((tile, i) => {
              const col = i % 3;
              const isRowStart = col === 0;
              const isNewRow = isRowStart && i > 0;
              return (
                <Fragment key={tile.key}>
                  {isNewRow && <div className="col-span-3 border-t border-border mb-0" />}
                  <div
                    className={`flex flex-col gap-1.5 min-w-50 ${
                      col === 0
                        ? "pl-0 pr-6"
                        : col === 1
                        ? "pl-6 pr-6 border-l border-border"
                        : "pl-6 border-l border-border"
                    }`}
                  >
                    <span className="text-xs text-black font-poppins">{tile.label}</span>
                    <span className="text-3xl font-medium text-black font-poppins">{tile.current}</span>
                    <div className="flex w-full justify-end items-end gap-1.5">
                      <TrendIndicator changePct={tile.changePct} />
                    </div>
                    <span className="text-[12px] font-poppins text-muted-foreground">vs last period</span>
                  </div>
                </Fragment>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
