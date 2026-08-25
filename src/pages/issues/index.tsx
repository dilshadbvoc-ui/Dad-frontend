import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  createIssue,
  getMyIssues,
  getIssueById,
  addIssueReply,
  uploadIssueAttachment,
  type Issue,
  type IssueType,
  type IssuePriority,
  type IssueAttachment,
} from "@/services/issueService"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { IssueThreadSheet } from "@/components/issues/IssueThreadSheet"
import { Bug, Plus, MessageSquare, Paperclip, Loader2, X, Clock3, CheckCircle2, Inbox } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"

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

const EMPTY_FORM = {
  title: "",
  description: "",
  issueType: "bug" as IssueType,
  priority: "medium" as IssuePriority,
}

export default function IssuesPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [attachment, setAttachment] = useState<IssueAttachment | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)

  const { data: issues = [], isLoading } = useQuery({
    queryKey: ["issues", "mine"],
    queryFn: getMyIssues,
  })

  const { data: selectedIssue } = useQuery({
    queryKey: ["issues", selectedIssueId],
    queryFn: () => getIssueById(selectedIssueId as string),
    enabled: !!selectedIssueId,
  })

  const createMutation = useMutation({
    mutationFn: createIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", "mine"] })
      setIsDialogOpen(false)
      setForm(EMPTY_FORM)
      setAttachment(null)
      toast.success("Issue reported — thanks for the heads up!")
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || "Failed to report issue")
    },
  })

  const replyMutation = useMutation({
    mutationFn: ({ id, message, attachments }: { id: string; message: string; attachments?: IssueAttachment[] }) =>
      addIssueReply(id, message, attachments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues", "mine"] })
      queryClient.invalidateQueries({ queryKey: ["issues", selectedIssueId] })
    },
    onError: () => toast.error("Failed to send reply"),
  })

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setIsUploading(true)
    try {
      const uploaded = await uploadIssueAttachment(file)
      setAttachment(uploaded)
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error.message || "Failed to upload attachment")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = () => {
    if (!form.title.trim() || !form.description.trim()) return
    createMutation.mutate({
      ...form,
      attachments: attachment ? [attachment] : undefined,
    })
  }

  const openCount = issues.filter((i) => i.status === "open" || i.status === "in_progress").length
  const resolvedCount = issues.filter((i) => i.status === "resolved" || i.status === "closed").length

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
            <Bug className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
            Report an Issue
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Found a bug or have a suggestion? Let us know and track the conversation here.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setForm(EMPTY_FORM); setAttachment(null) } }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20 rounded-xl shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report an Issue</DialogTitle>
              <DialogDescription>
                Tell us what happened. Our team will follow up right here.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Leads page won't load on mobile"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="issueType">Type</Label>
                  <Select value={form.issueType} onValueChange={(v) => setForm({ ...form, issueType: v as IssueType })}>
                    <SelectTrigger id="issueType"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="feature_request">Feature Request</SelectItem>
                      <SelectItem value="question">Question</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v as IssuePriority })}>
                    <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What happened? Steps to reproduce, what you expected, etc."
                  rows={5}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Attachment (optional)</Label>
                {attachment ? (
                  <div className="flex items-center gap-2 text-sm bg-muted/60 rounded-lg px-3 py-2 w-fit">
                    <Paperclip className="h-3.5 w-3.5" />
                    <span className="truncate max-w-[240px]">{attachment.name}</span>
                    <button type="button" onClick={() => setAttachment(null)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer w-fit">
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                    <span className="inline-flex items-center gap-2 text-sm border border-dashed border-border rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                      {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                      {isUploading ? "Uploading..." : "Attach a screenshot or file"}
                    </span>
                  </label>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || isUploading || !form.title.trim() || !form.description.trim()}
              >
                {createMutation.isPending ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Inbox className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold">{issues.length}</div>
              <div className="text-xs text-muted-foreground">Total Reported</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Clock3 className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold">{openCount}</div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-green-500/5 to-green-500/10 col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-green-500/15 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4.5 w-4.5 text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold">{resolvedCount}</div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Reports</CardTitle>
          <CardDescription>Everything you've reported, and any replies from our team.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-12">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
          ) : issues.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bug className="h-12 w-12 mx-auto mb-4 opacity-40" />
              <p className="font-medium">No issues reported yet</p>
              <p className="text-sm mt-1">Hit "Report Issue" above if something's not working right.</p>
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
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{TYPE_LABELS[issue.issueType] || issue.issueType}</span>
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
      />
    </div>
  )
}
