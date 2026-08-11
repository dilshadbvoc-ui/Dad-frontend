import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { bulkLeadAction } from "@/services/leadService"
import { toast } from "sonner"
import { Loader2, MessageCircle } from "lucide-react"

interface BulkSendWhatsAppDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedLeads: string[]
  onSuccess: () => void
}

export function BulkSendWhatsAppDialog({
  open,
  onOpenChange,
  selectedLeads,
  onSuccess,
}: BulkSendWhatsAppDialogProps) {
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setMessage("")
    }
  }, [open])

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message")
      return
    }

    setLoading(true)
    try {
      const result = await bulkLeadAction("send-whatsapp", selectedLeads, { message })
      toast.success(result?.message || `WhatsApp messages sending initiated for ${selectedLeads.length} leads`)
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Bulk WhatsApp send failed:", error)
      toast.error(error.response?.data?.message || error.message || "Failed to send WhatsApp messages")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] p-4 sm:p-6 rounded-xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Send WhatsApp Message
          </DialogTitle>
          <DialogDescription>
            Send a WhatsApp message to {selectedLeads.length} selected lead{selectedLeads.length === 1 ? "" : "s"} with a phone number on file.
            Use <code>{"{firstName}"}</code>, <code>{"{lastName}"}</code>, or <code>{"{fullName}"}</code> to personalize.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="bulk-whatsapp-message">Message</Label>
            <Textarea
              id="bulk-whatsapp-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
          <Button onClick={handleSend} disabled={loading || !message.trim()} className="bg-primary text-primary-foreground">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Message
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
