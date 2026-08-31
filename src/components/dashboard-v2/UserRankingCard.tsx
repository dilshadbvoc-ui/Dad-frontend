import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Award, Shuffle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserCallAnalytics } from "@/services/callService";

const RANK_STYLES = [
  "bg-warning/20 text-warning",
  "bg-muted text-muted-foreground",
  "bg-orange-500/20 text-orange-600",
];

export function UserRankingCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["user-call-ranking", "week"],
    queryFn: () => getUserCallAnalytics("week", "all"),
  });

  const ranked = [...(data?.reportData ?? [])]
    .sort((a, b) => b.connectedCalls - a.connectedCalls)
    .slice(0, 8);

  return (
    <div className="h-full">
      <div className="flex flex-row items-center justify-between mb-6">
        <h3 className="text-xl font-medium font-poppins flex items-center gap-2">
          <Award strokeWidth={1} className="h-5.5 w-5.5 text-[hsl(var(--chart-5))]" />
          User Ranking
        </h3>
        <Link
          to="/reports/call-analytics"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[hsl(var(--chart-5))] bg-[hsl(var(--chart-5))]/5 border border-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/10 rounded-[10px] px-3 py-1.5 transition-colors"
        >
          <Shuffle className="h-3.5 w-3.5" />
          View All
        </Link>
      </div>
      <div>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : ranked.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-sm text-muted-foreground">
            No call activity in this range
          </div>
        ) : (
          <div className="space-y-3">
            {ranked.map((u, index) => {
              const rate = u.totalCalls > 0 ? Math.round((u.connectedCalls / u.totalCalls) * 100) : 0;
              return (
                <div key={u.userId} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                        RANK_STYLES[index] || "text-muted-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{u.agentName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium font-poppins mb-1 text-[hsl(var(--chart-5))]">{u.connectedCalls} connected</p>
                    <p className="text-xs font-poppins text-muted-foreground">{rate}% of {u.totalCalls} calls</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
