import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getDashboardStats, getSalesForecast } from "@/services/analyticsService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRangeValue } from "./DateRangeDropdown";

interface DashboardStatsData {
  activeOpportunities: number;
  pendingFollowUps: number;
  opportunities: {
    won: number;
    lost: number;
  };
  revenueThisMonth: number;
  winRate: number;
  trends: {
    revenue: number;
  };
}

interface SalesForecastData {
  totalPipeline: number;
}

function TrendBadge({ changePct }: { changePct: number }) {
  if (changePct === 0) return null;
  const isUp = changePct > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${
        isUp ? "text-emerald-600" : "text-destructive"
      }`}
    >
      {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(changePct)}%
    </span>
  );
}

export function QuickStatsBar({ range }: { range: DateRangeValue }) {
  const { formatCurrencyCompact } = useCurrency();

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStatsData>({
    queryKey: ["dashboard-v2-stats", range.startDate, range.endDate],
    queryFn: () => getDashboardStats(undefined, undefined, range.startDate, range.endDate),
  });

  const { data: forecast, isLoading: forecastLoading } = useQuery<SalesForecastData>({
    queryKey: ["dashboard-v2-forecast", range.startDate, range.endDate],
    queryFn: () => getSalesForecast(undefined, undefined, range.startDate, range.endDate),
  });

  const isLoading = statsLoading || forecastLoading;
  const won = stats?.opportunities?.won || 0;
  const lost = stats?.opportunities?.lost || 0;
  const winRate = stats?.winRate ?? 0;

  const tiles = [
    {
      label: "Exp. Revenue",
      value: formatCurrencyCompact(forecast?.totalPipeline || 0),
      to: "/opportunities",
      accent: "bg-[hsl(var(--chart-1))]",
    },
    {
      label: "Pipeline",
      value: stats?.activeOpportunities || 0,
      to: "/opportunities",
      accent: "bg-[hsl(var(--chart-2))]",
    },
    {
      label: "Follow-ups",
      value: stats?.pendingFollowUps || 0,
      to: "/follow-ups",
      accent: "bg-[hsl(var(--chart-3))]",
    },
    {
      label: "Won",
      value: won,
      to: "/opportunities?stage=closed_won",
      accent: "bg-emerald-500",
    },
    {
      label: "Lost Deals",
      value: lost,
      to: "/opportunities?stage=closed_lost",
      accent: "bg-destructive",
    },
    {
      label: "Revenue",
      value: formatCurrencyCompact(stats?.revenueThisMonth || 0),
      to: "/reports/sales-book",
      accent: "bg-[hsl(var(--chart-4))]",
      trend: stats?.trends?.revenue,
    },
  ];

  return (
    <div className="rounded-[10px] bg-card border border-border overflow-hidden">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-border">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            to={tile.to}
            className="group relative flex flex-col items-center justify-center gap-1 px-4 py-4 overflow-hidden hover:bg-[hsl(var(--chart-5))]/5 transition-colors"
          >
            <span className={`absolute top-0 left-0 right-0 h-0.5 ${tile.accent} opacity-70`} />
            <span className="text-xs font-poppins text-muted-foreground group-hover:text-[hsl(var(--chart-5))] transition-colors">
              {tile.label}
            </span>
            {isLoading ? (
              <Skeleton className="h-7 w-16 rounded-md" />
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-medium font-poppins text-black">
                  {tile.value}
                </span>
                {typeof tile.trend === "number" && <TrendBadge changePct={tile.trend} />}
              </div>
            )}
          </Link>
        ))}
      </div>

      {!isLoading && (won > 0 || lost > 0) && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-muted/20">
          <span className="text-[11px] font-poppins text-muted-foreground shrink-0">Win Rate (this month)</span>
          <div className="flex-1 h-1.5 rounded-full bg-destructive/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${winRate}%` }}
            />
          </div>
          <span className="text-[11px] font-semibold font-poppins text-emerald-600 shrink-0">
            {winRate}%
          </span>
        </div>
      )}
    </div>
  );
}
