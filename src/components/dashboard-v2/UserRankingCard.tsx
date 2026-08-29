import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Award, Shuffle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
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
    <Card className="rounded-[0.8rem] md:rounded-[2rem] bg-card shadow-sm border-0 overflow-hidden h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-bold text-card-foreground flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          User Ranking
        </CardTitle>
        <Link
          to="/reports/call-analytics"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 rounded-full px-3 py-1.5 transition-colors"
        >
          <Shuffle className="h-3.5 w-3.5" />
          View All
        </Link>
      </CardHeader>
      <CardContent>
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
                    <p className="text-sm font-bold text-primary">{u.connectedCalls} connected</p>
                    <p className="text-xs text-muted-foreground">{rate}% of {u.totalCalls} calls</p>
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
