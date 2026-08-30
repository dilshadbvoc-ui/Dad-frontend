import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { getTeamTargets } from "@/services/salesTargetService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamTargetsCard() {
  const { formatCurrencyCompact } = useCurrency();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-v2-team-targets"],
    queryFn: getTeamTargets,
  });

  const targets = [...(data?.targets ?? [])]
    .filter((t) => t.status === "active")
    .sort((a, b) => {
      const pctA = a.targetValue > 0 ? a.achievedValue / a.targetValue : 0;
      const pctB = b.targetValue > 0 ? b.achievedValue / b.targetValue : 0;
      return pctB - pctA;
    })
    .slice(0, 8);

  return (
    <div className="h-full">
      <h3 className="text-lg font-medium font-poppins text-black flex items-center gap-2 mb-3">
        <Target className="h-5 w-5 text-[hsl(var(--chart-5))]" />
        Team Targets
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 rounded-lg" />
          ))}
        </div>
      ) : targets.length === 0 ? (
        <div className="h-[160px] flex items-center justify-center text-sm font-poppins text-muted-foreground">
          No active targets for your team
        </div>
      ) : (
        <div className="space-y-3">
          {targets.map((t) => {
            const pct = t.targetValue > 0 ? Math.round((t.achievedValue / t.targetValue) * 100) : 0;
            const format = (v: number) => (t.metric === "revenue" ? formatCurrencyCompact(v) : v.toLocaleString());
            return (
              <div key={t.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium font-poppins text-foreground truncate">
                    {t.assignedTo.firstName} {t.assignedTo.lastName}
                  </p>
                  <p className="text-[11px] font-poppins text-muted-foreground capitalize">{t.period}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold font-poppins text-[hsl(var(--chart-5))]">{pct}%</p>
                  <p className="text-[11px] font-poppins text-muted-foreground">
                    {format(t.achievedValue)} / {format(t.targetValue)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
