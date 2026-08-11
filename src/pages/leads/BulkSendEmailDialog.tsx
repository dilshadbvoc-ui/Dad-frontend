import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { bulkLeadAction } from "@/services/leadService"
import { toast } from "sonner"
import { Loader2, Mail } from "lucide-react"

interface BulkSendEmailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedLeads: string[]
  onSuccess: () => void
}

export function BulkSendEmailDialog({
  open,
  onOpenChange,
  selectedLeads,
  onSuccess,
}: BulkSendEmailDialogProps) {
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setSubject("")
      setContent("")
    }
  }, [open])

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Please enter both a subject and message content")
      return
    }

    setLoading(true)
    try {
      const result = await bulkLeadAction("send-email", selectedLeads, { subject, content })
      toast.success(result?.message || `Email sending initiated for ${selectedLeads.length} leads`)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Bulk email send failed:", error)
      toast.error(error.response?.data?.message || error.message || "Failed to send emails")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] p-4 sm:p-6 rounded-xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Send Email
          </DialogTitle>
          <DialogDescription>
            Send an email to {selectedLeads.length} selected lead{selectedLeads.length === 1 ? "" : "s"} with an email address on file.
            Use <code>{"{firstName}"}</code>, <code>{"{lastName}"}</code>, or <code>{"{fullName}"}</code> to personalize.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="bulk-email-subject">Subject</Label>
            <Input
              id="bulk-email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject line..."
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bulk-email-content">Message</Label>
            <Textarea
              id="bulk-email-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Hi {firstName}, ..."
              rows={6}
              required
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={loading || !subject.trim() || !content.trim()} className="bg-primary text-primary-foreground">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
