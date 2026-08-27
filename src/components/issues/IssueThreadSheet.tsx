import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Paperclip, Send, Loader2, ShieldCheck, X, FileX, Lock, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import type { Issue, IssueAttachment, IssueStatus } from "@/services/issueService"
import { uploadIssueAttachment } from "@/services/issueService"
import { VoiceRecorder } from "./VoiceRecorder"
import { isCoarsePointer } from "@/utils/pointerUtils"
import { VoiceMessageBubble } from "./VoiceMessageBubble"

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

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "?"
}

// Once an issue has been closed for a day, the retention cleanup replaces the real
// file with a { name, removed: true } placeholder — render that as a dead chip
// instead of a link that would 404.
function AttachmentChip({ attachment }: { attachment: IssueAttachment }) {
  if (attachment.removed || !attachment.url) {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-dashed border-border text-muted-foreground">
        <FileX className="h-3 w-3" /> {attachment.name} <span className="text-muted-foreground/70">(removed)</span>
      </span>
    )
  }
  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
    >
      <Paperclip className="h-3 w-3" /> {attachment.name}
    </a>
  )
}

function AttachmentList({ attachments, isMine }: { attachments: IssueAttachment[]; isMine: boolean }) {
  return (
    <div className={`mt-1.5 flex flex-wrap gap-1.5 ${isMine ? "justify-end" : ""}`}>
      {attachments.map((a, i) =>
        a.type === "voice" && !a.removed ? (
          <VoiceMessageBubble key={a.documentId || i} attachment={a} isMine={isMine} />
        ) : (
          <AttachmentChip key={a.documentId || i} attachment={a} />
        )
      )}
    </div>
  )
}

interface IssueThreadSheetProps {
  issue: Issue | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onReply: (message: string, attachments?: IssueAttachment[]) => Promise<void>
  isReplying?: boolean
  /** Only the super admin view passes this — lets the admin change status inline. */
  canChangeStatus?: boolean
  onStatusChange?: (status: IssueStatus) => void
  isChangingStatus?: boolean
  /**
   * Whether the person currently viewing this thread IS the super admin.
   * Bubble alignment/color is relative to the viewer, not hardcoded to "admin
   * = right" — otherwise the reporter sees their own messages on the left
   * (as if from someone else) and the admin's on the right (as if their own).
   */
  viewerIsAdmin: boolean
  /** Permanently deletes one reply for everyone. Shown on the viewer's own messages, and on every message for the super admin. */
  onDeleteReply?: (replyId: string) => void | Promise<void>
}

export function IssueThreadSheet({
  issue,
  open,
  onOpenChange,
  onReply,
  isReplying,
  canChangeStatus,
  onStatusChange,
  isChangingStatus,
  viewerIsAdmin,
  onDeleteReply,
}: IssueThreadSheetProps) {
  const [message, setMessage] = useState("")
  const [pendingAttachment, setPendingAttachment] = useState<IssueAttachment | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isRecordingActive, setIsRecordingActive] = useState(false)

  if (!issue) return null

  // Mobile gets a single adaptive mic/send button instead of both shown at once —
  // the mic button hides and the Send button takes its place once there's content.
  const isMobileComposer = isCoarsePointer()
  const hasComposerContent = !!message.trim() || !!pendingAttachment

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setIsUploading(true)
    try {
      const attachment = await uploadIssueAttachment(file, issue.organisation?.id)
      setPendingAttachment(attachment)
    } catch (err: unknown) {
      const error = err as { message?: string }
      toast.error(error.message || "Failed to upload attachment")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSend = async () => {
    if (!message.trim() && !pendingAttachment) return
    await onReply(message.trim(), pendingAttachment ? [pendingAttachment] : undefined)
    setMessage("")
    setPendingAttachment(null)
  }

  const handleVoiceSend = async (attachment: IssueAttachment) => {
    await onReply("", [attachment])
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg md:max-w-xl p-0 flex flex-col gap-0">
        <SheetHeader className="p-5 pb-4 border-b border-border text-left space-y-2">
          <div className="flex items-start justify-between gap-3 pr-6">
            <SheetTitle className="text-base leading-snug">{issue.title}</SheetTitle>
          </div>
          <SheetDescription className="sr-only">Issue conversation thread</SheetDescription>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={STATUS_STYLES[issue.status]}>{issue.status.replace("_", " ")}</Badge>
            <Badge variant="outline" className="font-normal">{TYPE_LABELS[issue.issueType] || issue.issueType}</Badge>
            <span className={`text-xs font-semibold ${PRIORITY_STYLES[issue.priority]}`}>
              {issue.priority} priority
            </span>
            {issue.organisation && (
              <span className="text-xs text-muted-foreground">• {issue.organisation.name}</span>
            )}
          </div>
          {canChangeStatus && (
            <div className="pt-1">
              <Select
                value={issue.status}
                onValueChange={(v) => onStatusChange?.(v as IssueStatus)}
                disabled={isChangingStatus}
              >
                <SelectTrigger className="h-8 w-[160px] text-xs rounded-full">
                  <SelectValue placeholder="Change status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Original report, rendered as the first message. The reporter wrote it, so
              it's only ever "mine" when the reporter themselves is the viewer. */}
          {(() => {
            const originalIsMine = !viewerIsAdmin
            return (
              <div className={`flex gap-3 ${originalIsMine ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                    {initials(issue.reportedBy.firstName, issue.reportedBy.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 min-w-0 ${originalIsMine ? "flex flex-col items-end" : ""}`}>
                  <div className={`flex items-center gap-2 text-xs text-muted-foreground mb-1 ${originalIsMine ? "flex-row-reverse" : ""}`}>
                    <span className="font-semibold text-foreground">
                      {originalIsMine ? "You" : `${issue.reportedBy.firstName} ${issue.reportedBy.lastName}`}
                    </span>
                    <span>{formatDistanceToNow(new Date(issue.createdAt), { addSuffix: true })}</span>
                  </div>
                  <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words max-w-[85%] ${originalIsMine ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted/60"}`}>
                    {issue.description}
                  </div>
                  {issue.attachments && issue.attachments.length > 0 && (
                    <AttachmentList attachments={issue.attachments} isMine={originalIsMine} />
                  )}
                </div>
              </div>
            )
          })()}

          {/* Replies — alignment is relative to who's viewing, not hardcoded to the
              admin, so each side sees their own messages on the right like a normal chat. */}
          {(issue.replies || []).map((reply) => {
            const isMine = reply.isFromAdmin === viewerIsAdmin
            const canDelete = !!onDeleteReply && (isMine || viewerIsAdmin)
            const handleDelete = () => {
              if (window.confirm("Permanently delete this message for everyone? This cannot be undone.")) {
                onDeleteReply?.(reply.id)
              }
            }
            return (
              <div key={reply.id} className={`flex gap-3 ${isMine ? "flex-row-reverse" : ""}`}>
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className={`text-[10px] ${isMine ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"}`}>
                    {reply.isFromAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : initials(reply.author.firstName, reply.author.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex-1 min-w-0 group ${isMine ? "flex flex-col items-end" : ""}`}>
                  <div className={`flex items-center gap-2 text-xs text-muted-foreground mb-1 ${isMine ? "flex-row-reverse" : ""}`}>
                    <span className="font-semibold text-foreground">
                      {isMine ? "You" : reply.isFromAdmin ? "Pype CRM Support" : `${reply.author.firstName} ${reply.author.lastName}`}
                    </span>
                    <span>{formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}</span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        title="Delete for everyone"
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {reply.message && (
                    <div className={`rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words max-w-[85%] ${isMine ? "rounded-tr-sm bg-primary text-primary-foreground" : "rounded-tl-sm bg-muted/60"}`}>
                      {reply.message}
                    </div>
                  )}
                  {reply.attachments && reply.attachments.length > 0 && (
                    <AttachmentList attachments={reply.attachments} isMine={isMine} />
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-border p-4 space-y-2 shrink-0">
          {issue.status === "closed" ? (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
              <Lock className="h-3.5 w-3.5" />
              This issue is closed and no longer accepting replies.
            </div>
          ) : (
            <>
              {pendingAttachment && !isRecordingActive && (
                <div className="flex items-center gap-2 text-xs bg-muted/60 rounded-lg px-3 py-1.5 w-fit">
                  <Paperclip className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{pendingAttachment.name}</span>
                  <button type="button" onClick={() => setPendingAttachment(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex items-end gap-2">
                {!isRecordingActive && (
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="resize-none flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                  />
                )}
                <VoiceRecorder
                  onSend={handleVoiceSend}
                  onActiveChange={setIsRecordingActive}
                  disabled={isUploading || !!pendingAttachment}
                  organisationId={issue.organisation?.id}
                  hideIdleButton={isMobileComposer && hasComposerContent}
                />
                {!isRecordingActive && (
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <label className={`inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors ${isUploading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
                      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileChange} disabled={isUploading} />
                      {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    </label>
                    {(!isMobileComposer || hasComposerContent) && (
                      <Button type="button" size="icon" onClick={handleSend} disabled={isReplying || !hasComposerContent}>
                        {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
