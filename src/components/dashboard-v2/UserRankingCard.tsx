import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserCallAnalytics } from "@/services/callService";

const PERIODS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last 7 Days" },
  { value: "month", label: "This Month" },
];

const RANK_STYLES = [
  "bg-warning/20 text-warning",
  "bg-muted text-muted-foreground",
  "bg-orange-500/20 text-orange-600",
];

export function UserRankingCard() {
  const [period, setPeriod] = useState("week");

  const { data, isLoading } = useQuery({
    queryKey: ["user-call-ranking", period],
    queryFn: () => getUserCallAnalytics(period, "all"),
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
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="h-9 w-[130px] rounded-xl text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.agentName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.branch}</p>
                    </div>
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
