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
        <DateRangeDropdown value={range} onChange={setRange} />
      </div>

      <div className="bg-card overflow-hidden">
        <div className="grid lg:grid-cols-[auto_1fr] divide-y lg:divide-y-0 lg:divide-x divide-border">
          <div className="p-4 sm:p-1 w-fit lg:pr-8 lg:pb-5">
            <CallOverviewCard range={range} />
          </div>
          <div className="p-4 sm:p-1 lg:pl-4 lg:pb-5">
            <LeadsByStageCard />
          </div>
        </div>
        <div className="border-t border-border" />
        <div className="grid lg:grid-cols-[auto_auto_1fr] divide-y lg:divide-y-0 divide-border">
          <div className="p-4 sm:p-1 w-fit lg:pr-8 lg:pt-4 lg:pb-5">
            <UserTrendsQuickPanel range={range} />
          </div>
          <div className="hidden lg:block w-px bg-border my-6" />
          <div className="p-4 sm:p-1 lg:pl-4 lg:pt-5 lg:pb-5">
            <UserRankingCard />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <SectionHeading  icon={<LineChart strokeWidth={1} className="h-5.5 w-5.5 text-[hsl(var(--chart-5))]" />}>
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
