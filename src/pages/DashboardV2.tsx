import { CallOverviewCard } from "@/components/dashboard-v2/CallOverviewCard";
import { LeadsByStageCard } from "@/components/dashboard-v2/LeadsByStageCard";
import { ToolsSection } from "@/components/dashboard-v2/ToolsSection";
import { QuickAccessSection } from "@/components/dashboard-v2/QuickAccessSection";
import { LeadSourceDonutChart } from "@/components/dashboard-v2/LeadSourceDonutChart";
import { CallActivityTrendChart } from "@/components/dashboard-v2/CallActivityTrendChart";
import { ConversionFunnelChart } from "@/components/dashboard-v2/ConversionFunnelChart";
import { TaskFollowUpStatusChart } from "@/components/dashboard-v2/TaskFollowUpStatusChart";
import { OpportunityPipelineChart } from "@/components/dashboard-v2/OpportunityPipelineChart";
import { BranchPerformanceChart } from "@/components/dashboard-v2/BranchPerformanceChart";

export default function DashboardV2() {
  return (
    <div className="space-y-4 sm:space-y-8 pt-3 sm:p-8 animate-in fade-in duration-500 pb-20 sm:pb-8">
      <div>
        <h1 className="text-xl sm:text-4xl font-extrabold tracking-tight text-foreground">Dashboard II</h1>
        <p className="text-muted-foreground mt-0.5 text-xs sm:text-base opacity-80">
          A fresh take on your performance overview.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CallOverviewCard />
        <LeadsByStageCard />
      </div>

      <div className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-foreground">Analytics &amp; Trends</h2>
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
