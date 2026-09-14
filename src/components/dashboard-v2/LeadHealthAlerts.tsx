import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { UserX, MoonStar, ArrowRight } from "lucide-react";
import { getLeadHealth } from "@/services/analyticsService";
import { Skeleton } from "@/components/ui/skeleton";
import { withDashboardFilters } from "./dashboardLinks";
import type { DateRangeValue } from "./DateRangeDropdown";

export function LeadHealthAlerts({ range, branchId }: { range: DateRangeValue; branchId?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["lead-health", range.startDate, range.endDate, branchId],
    queryFn: () =>
      getLeadHealth({
        branchId,
        startDate: range.period !== "allTime" ? range.startDate : undefined,
        endDate: range.period !== "allTime" ? range.endDate : undefined,
      }),
  });

  const tiles = [
    {
      key: "unattended",
      label: "Unattended Leads",
      description: "Assigned but never contacted",
      value: data?.unattendedLeads ?? 0,
      icon: UserX,
      to: withDashboardFilters("/leads/unattended", { range, branchId }),
    },
    {
      key: "no-activity",
      label: "No Activity Leads",
      description: "No update in 30+ days",
      value: data?.noActivityLeads ?? 0,
      icon: MoonStar,
      to: withDashboardFilters("/leads/no-activity", { range, branchId }),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tiles.map((tile) => {
        // A "0" isn't a problem — don't dress it up in the same amber alert
        // styling used for an actual backlog, or it reads as a warning either way.
        const isClear = !isLoading && tile.value === 0;
        return (
          <Link
            key={tile.key}
            to={tile.to}
            className={
              isClear
                ? "group flex items-center gap-4 rounded-[10px] border border-border bg-card hover:bg-muted/40 px-4 py-3.5 transition-colors"
                : "group flex items-center gap-4 rounded-[10px] border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-4 py-3.5 transition-colors"
            }
          >
            <div className={`h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0 ${isClear ? "bg-muted" : "bg-amber-500/15"}`}>
              <tile.icon className={`h-5 w-5 ${isClear ? "text-muted-foreground" : "text-amber-600"}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">{tile.label}</span>
                {isLoading ? (
                  <Skeleton className="h-5 w-8 rounded-md" />
                ) : (
                  <span className={`text-sm font-extrabold ${isClear ? "text-muted-foreground" : "text-amber-600"}`}>{tile.value.toLocaleString()}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{tile.description}</p>
            </div>
            <ArrowRight className={`h-4 w-4 text-muted-foreground shrink-0 transition-all group-hover:translate-x-0.5 ${isClear ? "" : "group-hover:text-amber-600"}`} />
          </Link>
        );
      })}
    </div>
  );
}
