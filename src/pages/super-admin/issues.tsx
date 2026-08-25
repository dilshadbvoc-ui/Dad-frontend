import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getAllIssuesForAdmin,
  getIssueById,
  addIssueReply,
  updateIssueStatus,
  type Issue,
  type IssueStatus,
  type IssueAttachment,
} from "@/services/issueService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IssueThreadSheet } from "@/components/issues/IssueThreadSheet"
import { ArrowLeft, Bug, MessageSquare, Building2, ShieldCheck } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { getUserInfo, isSuperAdmin as checkIsSuperAdmin } from "@/lib/utils"

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  feature_request: "Feature Request",
  question: "Question",
  other: "Other",
}

const STATUS_STYLES: Record<string, string> = {
  open: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  in_progress: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  resolved: "bg-green-500/15 text-green-700 dark:text-green-300",
  closed: "bg-muted text-muted-foreground",
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-amber-600 dark:text-amber-400",
  high: "text-orange-600 dark:text-orange-400",
  critical: "text-destructive",
}

export default function SuperAdminIssuesPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [user] = useState(() => getUserInfo())
  const hasAccess = checkIsSuperAdmin(user)

  const [statusFilter, setStatusFilter] = useState<IssueStatus | "all">("all")
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["issues", "admin", "all", statusFilter],
    queryFn: () => getAllIssuesForAdmin(statusFilter === "all" ? undefined : statusFilter),
    enabled: hasAccess,
  })

  const { data: selectedIssue } = useQuery({
    queryKey: ["issues", selectedIssueId],
    queryFn: () => getIssueById(selectedIssueId as string),
    enabled: !!selectedIssueId,
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, message, attachments }: { id: string; message: string; attachments?: IssueAttachment[] }) =>
      addIssueReply(id, message, attachments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", "admin", "all"] })
      queryClient.invalidateQueries({ queryKey: ["issues", selectedIssueId] })
    },
    onError: () => toast.error("Failed to send reply"),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: IssueStatus }) => updateIssueStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", "admin", "all"] })
      queryClient.invalidateQueries({ queryKey: ["issues", selectedIssueId] })
      toast.success("Status updated")
    },
    onError: () => toast.error("Failed to update status"),
  })

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen p-6">
        <Card className="w-96">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <ShieldCheck className="h-14 w-14 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-sm text-muted-foreground text-center">
              Only the platform super admin can view reported issues.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/super-admin')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Bug className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Reported Issues
          </h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Bugs, questions, and feature requests from every organisation.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as IssueStatus | "all")}>
          <SelectTrigger className="w-45 h-9 rounded-full bg-background">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        {!isLoading && (
          <span className="text-xs text-muted-foreground">{issues.length} issue{issues.length === 1 ? '' : 's'}</span>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>Click any issue to view the full conversation and reply.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bug className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No issues match this filter</p>
            </div>
          ) : (
            <div className="space-y-3">
              {issues.map((issue: Issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => setSelectedIssueId(issue.id)}
                  className="w-full text-left flex items-center justify-between gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{issue.title}</p>
                      <Badge className={STATUS_STYLES[issue.status]}>{issue.status.replace("_", " ")}</Badge>
                      <span className={`text-xs font-semibold ${PRIORITY_STYLES[issue.priority]}`}>{issue.priority}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{TYPE_LABELS[issue.issueType] || issue.issueType}</span>
                      <span className="inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {issue.organisation?.name || "Unknown org"}
                      </span>
                      <span>
                        by {issue.reportedBy.firstName} {issue.reportedBy.lastName}
                      </span>
                      <span>• {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}</span>
                      {!!issue._count?.replies && (
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {issue._count.replies}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <IssueThreadSheet
        issue={selectedIssue || null}
        open={!!selectedIssueId}
        onOpenChange={(open) => { if (!open) setSelectedIssueId(null) }}
        isReplying={replyMutation.isPending}
        onReply={async (message, attachments) => {
          if (!selectedIssueId) return
          await replyMutation.mutateAsync({ id: selectedIssueId, message, attachments })
        }}
        canChangeStatus
        isChangingStatus={statusMutation.isPending}
        onStatusChange={(status) => {
          if (!selectedIssueId) return
          statusMutation.mutate({ id: selectedIssueId, status })
        }}
      />
    </div>
  )
}
