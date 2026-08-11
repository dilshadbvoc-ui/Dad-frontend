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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createFollowUp } from "@/services/followUpService"
import { toast } from "sonner"
import { Loader2, CalendarClock } from "lucide-react"

interface BulkScheduleFollowUpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedLeads: string[]
  onSuccess: () => void
}

export function BulkScheduleFollowUpDialog({
  open,
  onOpenChange,
  selectedLeads,
  onSuccess,
}: BulkScheduleFollowUpDialogProps) {
  const [subject, setSubject] = useState("Follow up")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState("medium")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setSubject("Follow up")
      setDescription("")
      setPriority("medium")
      setDueDate("")
    }
  }, [open])

  const handleSchedule = async () => {
    if (!dueDate) {
      toast.error("Please select a due date & time")
      return
    }

    setLoading(true)
    try {
      const results = await Promise.allSettled(
        selectedLeads.map((leadId) =>
          createFollowUp({
            subject,
            description,
            priority: priority as any,
            dueDate: new Date(dueDate).toISOString(),
            status: "not_started",
            relatedTo: leadId,
            onModel: "Lead",
          } as any)
        )
      )

      const failures = results.filter((r) => r.status === "rejected").length
      const succeeded = selectedLeads.length - failures

      if (succeeded > 0) {
        toast.success(`Follow-up scheduled for ${succeeded} lead${succeeded === 1 ? "" : "s"}`)
      }
      if (failures > 0) {
        toast.error(`Failed to schedule follow-up for ${failures} lead${failures === 1 ? "" : "s"}`)
      }

      if (succeeded > 0) {
        onSuccess()
        onOpenChange(false)
      }
    } catch (error: any) {
      console.error("Bulk follow-up scheduling failed:", error)
      toast.error(error.message || "Failed to schedule follow-ups")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6 rounded-xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Schedule Follow-up
          </DialogTitle>
          <DialogDescription>
            Create a follow-up reminder for {selectedLeads.length} selected lead{selectedLeads.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="bulk-followup-subject">Subject</Label>
            <Input
              id="bulk-followup-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Follow up..."
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bulk-followup-description">Description</Label>
            <Textarea
              id="bulk-followup-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details about the follow-up..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-followup-priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bulk-followup-dueDate">Due Date & Time</Label>
              <Input
                id="bulk-followup-dueDate"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading || !dueDate} className="bg-primary text-primary-foreground">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Schedule Follow-up
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
