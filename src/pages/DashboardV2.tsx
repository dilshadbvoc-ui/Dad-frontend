import { useState } from "react";
import { LineChart } from "lucide-react";
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
import { DateRangeDropdown, type DateRangeValue } from "@/components/dashboard-v2/DateRangeDropdown";

export default function DashboardV2() {
  const [range, setRange] = useState<DateRangeValue>({ period: "week" });

  return (
    <div className="space-y-4 sm:space-y-8 pt-3 sm:p-8 animate-in fade-in duration-500 pb-20 sm:pb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Dashboard <span aria-hidden>👋</span>
          </h1>
          <p className="text-muted-foreground mt-0.5 text-xs sm:text-base opacity-80">
            Here's what's happening with your CRM today.
          </p>
        </div>
        <DateRangeDropdown value={range} onChange={setRange} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CallOverviewCard range={range} />
        <LeadsByStageCard />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <UserTrendsQuickPanel range={range} />
        <UserRankingCard />
      </div>

      <div className="space-y-3">
        <SectionHeading icon={<LineChart className="h-4 w-4 text-[hsl(var(--chart-5))]" />}>
          Analytics &amp; Trends
        </SectionHeading>
        <div className="grid gap-4 lg:grid-cols-2">
          <CallActivityTrendChart />
          <LeadSourceDonutChart />
          <ConversionFunnelChart />
          <OpportunityPipelineChart />
          <TaskFollowUpStatusChart />
          <BranchPerformanceChart />
        </div>
      </div>

      <ToolsSection />

      <QuickAccessSection />
    </div>
  );
}
