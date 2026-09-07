import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { GitBranch } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeadsByStage, getLeadCampaigns } from "@/services/analyticsService";
import type { DateRangeValue } from "./DateRangeDropdown";

export function LeadsByStageCard({ range, branchId }: { range: DateRangeValue; branchId?: string }) {
  const [campaignId, setCampaignId] = useState<string>("all");

  const { data: campaigns = [] } = useQuery<string[]>({
    queryKey: ["lead-campaigns"],
    queryFn: getLeadCampaigns,
    staleTime: 1000 * 60 * 5,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leads-by-stage", branchId, campaignId, range.startDate, range.endDate],
    queryFn: () =>
      getLeadsByStage({
        branchId,
        campaignId: campaignId !== "all" ? campaignId : undefined,
        startDate: range.startDate,
        endDate: range.endDate,
      }),
  });

  const stages = data?.stages ?? [];

  return (
    <div className="h-full">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
        <h3 className="text-lg sm:text-xl font-medium font-poppins text-card-foreground flex items-center gap-2">
          <GitBranch strokeWidth={1} className="h-5.5 w-5.5 text-[hsl(var(--chart-5))]" />
          Leads by Stage
        </h3>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger className="h-9 w-[140px] rounded-[10px] text-xs border-[hsl(var(--chart-5))]/20 bg-[hsl(var(--chart-5))]/5 text-[hsl(var(--chart-5))] focus:outline-none focus:ring-0 focus:ring-offset-0">
              <SelectValue placeholder="Campaign" />
            </SelectTrigger>
            <SelectContent className="rounded-[10px]">
              <SelectItem value="all" className="rounded-[10px] focus:bg-[hsl(var(--chart-5))]/10 focus:text-[hsl(var(--chart-5))]">All Campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c} value={c} className="rounded-[10px] focus:bg-[hsl(var(--chart-5))]/10 focus:text-[hsl(var(--chart-5))]">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stages.filter((s) => s.id !== "other").map((stage) => {
              const params = new URLSearchParams({ status: stage.id });
              if (branchId) params.set("branch", branchId);
              return (
                <Link
                  key={stage.id}
                  to={`/leads?${params.toString()}`}
                  className="rounded-xl bg-muted/30 p-4 flex flex-col gap-1.5 hover:bg-muted/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-[3px] shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-xs text-muted-foreground font-poppins truncate" style={{ color: stage.color }}>{stage.label}</span>
                  </div>
                  <span className="text-xl font-medium text-black font-poppins">{stage.count}</span>
                </Link>
              );
            })}
            {stages.some((s) => s.id === "other") && (
              <Link
                to={`/leads${branchId ? `?branch=${branchId}` : ""}`}
                className="col-span-2 rounded-xl bg-muted/30 p-3 flex items-center justify-between hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-[10px] bg-muted-foreground/30 shrink-0" />
                  <span className="text-xs font-poppins text-muted-foreground/80 ">Other</span>
                </div>
                <span className="text-lg font-medium text-black font-poppins">
                  {stages.find((s) => s.id === "other")?.count.toLocaleString()}
                </span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
