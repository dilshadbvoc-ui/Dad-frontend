import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { Activity, Loader2 } from "lucide-react";
import { getAssetUrl } from "@/lib/utils";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "logged in",
  LOGIN_FAILED: "failed login attempt",
  CREATE: "created",
  CREATE_LEAD: "created lead",
  CREATE_CONTACT: "created contact",
  CREATE_ACCOUNT: "created account",
  UPDATE: "updated",
  DELETE: "deleted",
  EXPORT: "exported data from",
  LEAD_STATUS_CHANGE: "changed status of",
  BULK_IMPORT_COMPLETED: "completed bulk import for",
};

function humanizeAction(action: string) {
  return ACTION_LABELS[action] || action.toLowerCase().replace(/_/g, " ");
}

interface AuditLog {
  id: string;
  action: string;
  entity?: string;
  createdAt: string;
  actor?: { firstName?: string; lastName?: string; profileImage?: string };
}

// This hits the same /audit-logs endpoint already used elsewhere, which the backend
// scopes to the caller's visible-user hierarchy — so for an individual contributor
// this naturally becomes "my" activity feed with no extra filtering needed here.
export function MyRecentActivity() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-v2-recent-activity"],
    queryFn: async () => {
      const res = await api.get("/audit-logs", { params: { limit: 15 } });
      return (res.data?.logs ?? []) as AuditLog[];
    },
    staleTime: 30000,
  });

  const logs = Array.isArray(data) ? data.filter((l) => l && l.id) : [];

  return (
    <div className="h-full">
      <h3 className="text-lg font-medium font-poppins text-black flex items-center gap-2 mb-3">
        <Activity className="h-5 w-5 text-[hsl(var(--chart-5))]" />
        My Recent Activity
      </h3>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : isError ? (
        <div className="h-[160px] flex items-center justify-center text-sm font-poppins text-muted-foreground">
          Unable to load recent activity
        </div>
      ) : logs.length === 0 ? (
        <div className="h-[160px] flex items-center justify-center text-sm font-poppins text-muted-foreground">
          No recent activity yet
        </div>
      ) : (
        <ScrollArea className="h-[280px] pr-3">
          <div className="space-y-3">
            {logs.map((log) => {
              const actorName = log.actor
                ? `${log.actor.firstName || ""} ${log.actor.lastName || ""}`.trim() || "Unknown User"
                : "System";
              const initials = log.actor?.firstName?.[0] || log.actor?.lastName?.[0] || "?";

              return (
                <div key={log.id} className="flex items-start gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
                  <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                    <AvatarImage src={getAssetUrl(log.actor?.profileImage)} />
                    <AvatarFallback className="text-[11px] font-poppins bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-poppins leading-snug">
                      <span className="text-foreground font-medium">{actorName}</span>
                      <span className="text-muted-foreground"> {humanizeAction(log.action)} </span>
                      {log.entity && log.entity !== "Security" && (
                        <span className="text-foreground font-medium">{log.entity}</span>
                      )}
                    </p>
                    <p className="text-[11px] font-poppins text-muted-foreground mt-0.5">
                      {(() => {
                        try {
                          return formatDistanceToNow(new Date(log.createdAt), { addSuffix: true });
                        } catch {
                          return "Recently";
                        }
                      })()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
