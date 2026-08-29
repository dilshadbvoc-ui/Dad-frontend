import { CallOverviewCard } from "@/components/dashboard-v2/CallOverviewCard";
import { LeadsByStageCard } from "@/components/dashboard-v2/LeadsByStageCard";
import { ToolsSection } from "@/components/dashboard-v2/ToolsSection";
import { QuickAccessSection } from "@/components/dashboard-v2/QuickAccessSection";

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

      <ToolsSection />

      <QuickAccessSection />
    </div>
  );
}
