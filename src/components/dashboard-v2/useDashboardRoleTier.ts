import { useQuery } from "@tanstack/react-query";
import { getUserInfo, isManager, isBranchManager } from "@/lib/utils";
import { getSubordinates } from "@/services/salesTargetService";

export type DashboardTier = "full" | "teamLead" | "rep";

/**
 * Dashboard II shows the same data-safe widgets to everyone (every backing endpoint
 * already scopes results to the caller's reporting hierarchy via getVisibleUserIds on
 * the backend), but a few widgets only make sense once you actually manage other
 * people. This resolves which tier the current user falls into, purely client-side:
 *  - "full": admin / org admin / manager / branch manager — sees every widget.
 *  - "teamLead": has at least one subordinate, but isn't a manager-type role.
 *  - "rep": an individual contributor with nobody reporting to them.
 */
export function useDashboardRoleTier(): { tier: DashboardTier; isLoading: boolean } {
  const user = getUserInfo();
  const isFullTier = isManager(user) || isBranchManager(user);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-v2-subordinates"],
    queryFn: getSubordinates,
    enabled: !isFullTier,
    staleTime: 1000 * 60 * 5,
  });

  if (isFullTier) return { tier: "full", isLoading: false };
  if (isLoading) return { tier: "rep", isLoading: true };

  const hasReports = (data?.subordinates?.length ?? 0) > 0;
  return { tier: hasReports ? "teamLead" : "rep", isLoading: false };
}
