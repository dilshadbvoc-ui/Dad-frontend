import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GitBranch, Building2, Megaphone } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getLeadsByStage, getLeadCampaigns } from "@/services/analyticsService";
import { getBranches } from "@/services/settingsService";

interface Branch {
  id: string;
  name: string;
}

export function LeadsByStageCard() {
  const [branchId, setBranchId] = useState<string>("all");
  const [campaignId, setCampaignId] = useState<string>("all");

  const { data: branches = [] } = useQuery<Branch[]>({
    queryKey: ["branches", "list"],
    queryFn: getBranches,
    staleTime: 1000 * 60 * 5,
  });

  const { data: campaigns = [] } = useQuery<string[]>({
    queryKey: ["lead-campaigns"],
    queryFn: getLeadCampaigns,
    staleTime: 1000 * 60 * 5,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["leads-by-stage", branchId, campaignId],
    queryFn: () =>
      getLeadsByStage({
        branchId: branchId !== "all" ? branchId : undefined,
        campaignId: campaignId !== "all" ? campaignId : undefined,
      }),
  });

  const stages = data?.stages ?? [];

  return (
    <Card className="rounded-[0.8rem] md:rounded-[2rem] bg-card shadow-sm border-0 overflow-hidden h-full">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
        <CardTitle className="text-lg sm:text-xl font-bold text-card-foreground flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-primary" />
          Leads by Stage
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Branch" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={campaignId} onValueChange={setCampaignId}>
            <SelectTrigger className="h-9 w-[140px] rounded-xl text-xs">
              <div className="flex items-center gap-1.5">
                <Megaphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Campaign" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Campaigns</SelectItem>
              {campaigns.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stages.map((stage) => (
              <div key={stage.id} className="rounded-xl bg-muted/30 p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs text-muted-foreground truncate">{stage.label}</span>
                </div>
                <span className="text-xl font-extrabold text-foreground">{stage.count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
