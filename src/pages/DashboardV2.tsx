import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LineChart } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getBranches } from "@/services/settingsService";
import { CallOverviewCard } from "@/components/dashboard-v2/CallOverviewCard";
import { SectionHeading } from "@/components/dashboard-v2/SectionHeading";
import { LeadsByStageCard } from "@/components/dashboard-v2/LeadsByStageCard";
import { ToolsSection } from "@/components/dashboard-v2/ToolsSection";
import { QuickAccessSection } from "@/components/dashboard-v2/QuickAccessSection";
import { LeadSourceDonutChart } from "@/components/dashboard-v2/LeadSourceDonutChart";
import { CallActivityTrendChart } from "@/components/dashboard-v2/CallActivityTrendChart";
import { ConversionFunnelChart } from "@/components/dashboard-v2/ConversionFunnelChart";
import { TaskFollowUpStatusChart } from "@/components/dashboard-v2/TaskFollowUpStatusChart";
import { OpportunityPipelineChart } from "@/components/dashboard-v2/OpportunityPipelineChart";
import { BranchPerformanceChart } from "@/components/dashboard-v2/BranchPerformanceChart";
import { UserTrendsQuickPanel } from "@/components/dashboard-v2/UserTrendsQuickPanel";
import { UserRankingCard } from "@/components/dashboard-v2/UserRankingCard";
import { QuickStatsBar } from "@/components/dashboard-v2/QuickStatsBar";
import { LeadHealthAlerts } from "@/components/dashboard-v2/LeadHealthAlerts";
import { MyTargetProgress } from "@/components/dashboard-v2/MyTargetProgress";
import { TeamTargetsCard } from "@/components/dashboard-v2/TeamTargetsCard";
import { MyRecentActivity } from "@/components/dashboard-v2/MyRecentActivity";
import { useDashboardRoleTier } from "@/components/dashboard-v2/useDashboardRoleTier";
import { DateRangeDropdown, getDefaultDateRange, type DateRangeValue } from "@/components/dashboard-v2/DateRangeDropdown";

interface Branch {
  id: string;
  name: string;
}

export default function DashboardV2() {
  const [range, setRange] = useState<DateRangeValue>(getDefaultDateRange());
  const [branchId, setBranchId] = useState<string>("all");
  const { tier } = useDashboardRoleTier();

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["branches", "list"],
    queryFn: getBranches,
    staleTime: 1000 * 60 * 5,
  });

  const selectedBranchId = branchId !== "all" ? branchId : undefined;

  return (
    <div className="bg-white space-y-4 sm:space-y-8 animate-in fade-in duration-500 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-medium font-poppins tracking-tight text-foreground flex items-center gap-2">
            Dashboard <span aria-hidden>👋</span>
          </h1>
          <p className="text-gray-600 tracking-tight font-poppins mt-0.5 text-[12px] sm:text-[14px] opacity-80">
            Here's what's happening with your CRM today.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="h-9 w-[140px] rounded-[10px] text-xs border-[hsl(var(--chart-5))]/20 bg-[hsl(var(--chart-5))]/5 text-[hsl(var(--chart-5))] focus:outline-none focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent className="rounded-[10px]">
              <SelectItem value="all" className="rounded-[10px] focus:bg-[hsl(var(--chart-5))]/10 focus:text-[hsl(var(--chart-5))]">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id} className="rounded-[10px] focus:bg-[hsl(var(--chart-5))]/10 focus:text-[hsl(var(--chart-5))]">{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangeDropdown
            value={range}
            onChange={setRange}
            variant="accent"
            presets={['thisMonth', 'lastMonth', 'custom']}
          />
        </div>
      </div>

      <QuickStatsBar range={range} branchId={selectedBranchId} />

      <LeadHealthAlerts range={range} branchId={selectedBranchId} />

      <div className="bg-card overflow-hidden">
        <div className="grid lg:grid-cols-[auto_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
          <div className="p-4 sm:p-1 w-fit lg:pr-8 lg:pb-5">
            <CallOverviewCard range={range} branchId={selectedBranchId} />
          </div>
          <div className="p-4 sm:p-1 lg:pl-4 lg:pb-5">
            <LeadsByStageCard range={range} branchId={selectedBranchId} />
          </div>
        </div>
        <div className="border-t border-border" />
        <div className="grid lg:grid-cols-[auto_auto_1fr] divide-y lg:divide-y-0 divide-border">
          <div className="p-4 sm:p-1 w-fit lg:pr-8 lg:pt-4 lg:pb-5">
            <UserTrendsQuickPanel range={range} branchId={selectedBranchId} />
          </div>
          <div className="hidden lg:block w-px bg-border my-6" />
          <div className="p-4 sm:p-1 lg:pl-4 lg:pt-5 lg:pb-5">
            {tier === "rep" ? <MyRecentActivity /> : <UserRankingCard range={range} branchId={selectedBranchId} />}
          </div>
        </div>
      </div>

      {tier !== "full" && (
        <div className="rounded-[10px] bg-card border border-border overflow-hidden p-4 sm:p-6">
          {tier === "teamLead" ? <TeamTargetsCard /> : <MyTargetProgress />}
        </div>
      )}

      <QuickAccessSection />

      <div className="space-y-3 mt-12">
        <SectionHeading  icon={<LineChart strokeWidth={1} className="h-5.5 w-5.5 text-[hsl(var(--chart-5))]" />}>
          Analytics &amp; Trends
        </SectionHeading>
        <div className="grid gap-4 lg:grid-cols-2">
          <CallActivityTrendChart range={range} branchId={selectedBranchId} />
          <LeadSourceDonutChart branchId={selectedBranchId} />
          <ConversionFunnelChart branchId={selectedBranchId} />
          <OpportunityPipelineChart branchId={selectedBranchId} />
          <TaskFollowUpStatusChart branchId={selectedBranchId} />
          {/* Branch Performance is a cross-branch comparison by design — scoping it
              to one branch would defeat its purpose, so it stays unfiltered. */}
          {tier === "full" && <BranchPerformanceChart />}
        </div>
      </div>

      <ToolsSection tier={tier} />
    </div>
  );
}
