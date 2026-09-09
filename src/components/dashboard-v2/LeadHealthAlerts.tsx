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

  const hasAny = (data?.unattendedLeads ?? 0) > 0 || (data?.noActivityLeads ?? 0) > 0;
  if (!isLoading && !hasAny) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {tiles.map((tile) => (
        <Link
          key={tile.key}
          to={tile.to}
          className="group flex items-center gap-4 rounded-[10px] border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 px-4 py-3.5 transition-colors"
        >
          <div className="h-10 w-10 rounded-[10px] bg-amber-500/15 flex items-center justify-center shrink-0">
            <tile.icon className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">{tile.label}</span>
              {isLoading ? (
                <Skeleton className="h-5 w-8 rounded-md" />
              ) : (
                <span className="text-sm font-extrabold text-amber-600">{tile.value.toLocaleString()}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{tile.description}</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
        </Link>
      ))}
    </div>
  );
}
