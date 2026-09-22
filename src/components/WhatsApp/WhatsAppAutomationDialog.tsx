import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import type { AxiosError } from "axios"
import { Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { createWorkflow, updateWorkflow, type Workflow } from "@/services/workflowService"
import { whatsAppAccountService } from "@/services/whatsAppAccountService"

interface AutomationFormValues {
  name: string
  whatsappAccountId: string // "all" for every connected number
  triggerMode: "any" | "keyword"
  keywords: string
  message: string
  escalate: boolean
  isActive: boolean
}

const defaultValues: AutomationFormValues = {
  name: "",
  whatsappAccountId: "all",
  triggerMode: "keyword",
  keywords: "",
  message: "",
  escalate: false,
  isActive: true,
}

function workflowToFormValues(workflow: Workflow): AutomationFormValues {
  const conditions = workflow.conditions || []
  const accountCondition = conditions.find((c) => c.field === "whatsappAccountId")
  const keywordCondition = conditions.find((c) => c.field === "body")
  const replyAction = (workflow.actions || []).find((a) => a.type === "send_whatsapp_reply")
  const escalateAction = (workflow.actions || []).find((a) => a.type === "escalate_to_agent")

  return {
    name: workflow.name,
    whatsappAccountId: accountCondition ? String(accountCondition.value) : "all",
    triggerMode: keywordCondition ? "keyword" : "any",
    keywords: keywordCondition && Array.isArray(keywordCondition.value) ? keywordCondition.value.join(", ") : "",
    message: replyAction ? String(replyAction.config?.message || "") : "",
    escalate: !!escalateAction,
    isActive: workflow.isActive,
  }
}

interface WhatsAppAutomationDialogProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  automationToEdit?: Workflow | null
}

export function WhatsAppAutomationDialog({ children, open, onOpenChange, automationToEdit }: WhatsAppAutomationDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const finalOpen = isControlled ? open : internalOpen
  const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen

  const queryClient = useQueryClient()

  const { data: accounts = [] } = useQuery({
    queryKey: ["whatsapp-accounts"],
    queryFn: whatsAppAccountService.getWhatsAppAccounts,
  })

  const form = useForm<AutomationFormValues>({ defaultValues })

  useEffect(() => {
    if (automationToEdit) {
      form.reset(workflowToFormValues(automationToEdit))
    } else {
      form.reset(defaultValues)
    }
  }, [automationToEdit, form, finalOpen])

  const selectedAccountId = form.watch("whatsappAccountId")
  const escalate = form.watch("escalate")
  const triggerMode = form.watch("triggerMode")

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId)
  const hasAssignmentRule =
    selectedAccountId === "all"
      ? accounts.some((a) => (a.assignmentRules?.length || 0) > 0)
      : (selectedAccount?.assignmentRules?.length || 0) > 0

  const mutation = useMutation({
    mutationFn: (values: AutomationFormValues) => {
      const conditions: NonNullable<Workflow["conditions"]> = []
      if (values.whatsappAccountId !== "all") {
        conditions.push({ field: "whatsappAccountId", operator: "equals", value: values.whatsappAccountId })
      }
      if (values.triggerMode === "keyword") {
        const keywords = values.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
        if (keywords.length > 0) {
          conditions.push({ field: "body", operator: "contains_any", value: keywords })
        }
      }

      const actions: NonNullable<Workflow["actions"]> = [
        { type: "send_whatsapp_reply", config: { message: values.message } },
      ]
      if (values.escalate) {
        actions.push({ type: "escalate_to_agent", config: {} })
      }

      const payload = {
        name: values.name,
        triggerEntity: "WhatsAppMessage",
        triggerEvent: "received",
        isActive: values.isActive,
        conditions,
        actions,
      }

      if (automationToEdit?.id) {
        return updateWorkflow(automationToEdit.id, payload)
      }
      return createWorkflow(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-automations"] })
      toast.success(`Automation ${automationToEdit ? "updated" : "created"} successfully`)
      finalOnOpenChange?.(false)
      form.reset(defaultValues)
    },
    onError: (error: AxiosError<{ message: string }>) => {
      toast.error(error.response?.data?.message || "Failed to save automation")
    },
  })

  function onSubmit(values: AutomationFormValues) {
    if (!values.name.trim()) {
      toast.error("Name is required")
      return
    }
    if (!values.message.trim()) {
      toast.error("Reply message is required")
      return
    }
    if (values.triggerMode === "keyword" && !values.keywords.trim()) {
      toast.error("Add at least one keyword, or switch to \"Any incoming message\"")
      return
    }
    mutation.mutate(values)
  }

  return (
    <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{automationToEdit ? "Edit Automation" : "Create WhatsApp Automation"}</DialogTitle>
          <DialogDescription>
            Auto-reply to incoming WhatsApp messages on a keyword match, then optionally hand the conversation
            off to the number's assigned agent.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Automation Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Pricing FAQ Auto-Reply" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsappAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>WhatsApp Number</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select number" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="all">All Numbers</SelectItem>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.displayName || account.phoneNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="triggerMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trigger</FormLabel>
                  <Select value={field.value} onValueChange={(val) => field.onChange(val as "any" | "keyword")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select trigger" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="keyword">Message contains keyword(s)</SelectItem>
                      <SelectItem value="any">Any incoming message</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {triggerMode === "keyword" && (
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords</FormLabel>
                    <FormControl>
                      <Input placeholder="price, cost, pricing" {...field} />
                    </FormControl>
                    <FormDescription>Comma-separated. Matches if the message contains any of these (case-insensitive).</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="message"
              rules={{ required: "Reply message is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reply Message</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Hi {{firstName}}, thanks for reaching out..." className="h-24 resize-none" {...field} />
                  </FormControl>
                  <FormDescription>Use {"{{fieldName}}"} to insert values from the conversation.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Per Meta's WhatsApp policy, automated replies must serve a concrete business task (e.g. pricing,
                support, booking) — not open-ended conversation.
              </span>
            </div>

            <FormField
              control={form.control}
              name="escalate"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Escalate to Assigned Agent</FormLabel>
                    <FormDescription>
                      After replying, hand the conversation off to this number's assigned agent.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {escalate && !hasAssignmentRule && (
              <p className="text-xs text-destructive">
                No agent is assigned to {selectedAccountId === "all" ? "any number yet" : "this number yet"} —
                set one up on the WhatsApp Accounts settings page first, or the handoff will be skipped.
              </p>
            )}

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active</FormLabel>
                    <FormDescription>Enable or disable this automation.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => finalOnOpenChange?.(false)} disabled={mutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Automation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
