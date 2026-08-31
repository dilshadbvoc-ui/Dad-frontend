import { useQuery } from "@tanstack/react-query";
import { Target } from "lucide-react";
import { getMyTargets } from "@/services/salesTargetService";
import { useCurrency } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

const PERIOD_LABELS: Record<string, string> = {
  monthly: "This Month",
  quarterly: "This Quarter",
  yearly: "This Year",
};

export function MyTargetProgress() {
  const { formatCurrency } = useCurrency();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-v2-my-targets"],
    queryFn: getMyTargets,
  });

  const targets = (data?.targets ?? []).filter((t) => t.status === "active");

  return (
    <div className="h-full">
      <h3 className="text-lg font-medium font-poppins text-black flex items-center gap-2 mb-4">
        <Target className="h-5 w-5 text-[hsl(var(--chart-5))]" />
        My Target
      </h3>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      ) : targets.length === 0 ? (
        <div className="h-[100px] flex items-center justify-center text-sm font-poppins text-muted-foreground">
          No target assigned yet
        </div>
      ) : (
        <div className="space-y-5">
          {targets.map((t) => {
            const pct = t.targetValue > 0 ? Math.round((t.achievedValue / t.targetValue) * 100) : 0;
            const barPct = Math.min(100, pct);
            const format = (v: number) => (t.metric === "revenue" ? formatCurrency(v) : v.toLocaleString());
            return (
              <div key={t.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-poppins text-muted-foreground">
                  <span>{PERIOD_LABELS[t.period] ?? t.period}{t.product ? ` · ${t.product.name}` : ""}</span>
                  <span className="font-semibold text-[hsl(var(--chart-5))]">{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[hsl(var(--chart-5))] transition-all"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-sm font-poppins">
                  <span className="font-semibold text-black">{format(t.achievedValue)}</span>
                  <span className="text-muted-foreground">of {format(t.targetValue)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
