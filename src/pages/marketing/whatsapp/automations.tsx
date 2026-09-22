import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Bot, Edit2, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { getWorkflows, deleteWorkflow, type Workflow } from "@/services/workflowService"
import { whatsAppAccountService } from "@/services/whatsAppAccountService"
import { WhatsAppAutomationDialog } from "@/components/WhatsApp/WhatsAppAutomationDialog"

export default function WhatsAppAutomationsPage() {
  const queryClient = useQueryClient()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [automationToEdit, setAutomationToEdit] = useState<Workflow | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["whatsapp-automations"],
    queryFn: () => getWorkflows({ triggerEntity: "WhatsAppMessage" }),
  })

  const { data: accounts = [] } = useQuery({
    queryKey: ["whatsapp-accounts"],
    queryFn: whatsAppAccountService.getWhatsAppAccounts,
  })

  const automations: Workflow[] = data?.workflows || []

  const deleteMutation = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-automations"] })
      toast.success("Automation deleted")
    },
    onError: () => toast.error("Failed to delete automation"),
  })

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this automation?")) {
      deleteMutation.mutate(id)
    }
  }

  const accountLabel = (accountId?: string) => {
    if (!accountId) return "All Numbers"
    const account = accounts.find((a) => a.id === accountId)
    return account?.displayName || account?.phoneNumber || "Unknown number"
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/marketing/whatsapp">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-500 to-emerald-700 bg-clip-text text-transparent">
            WhatsApp Automations
          </h1>
          <p className="text-gray-500 mt-1">
            Auto-reply to keywords and hand off conversations to the assigned agent.
          </p>
        </div>
        <WhatsAppAutomationDialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open)
            if (!open) setAutomationToEdit(null)
          }}
        >
          <Button
            className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25 rounded-xl"
            onClick={() => {
              setAutomationToEdit(null)
              setIsCreateOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Automation
          </Button>
        </WhatsAppAutomationDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" /> Active Automations
          </CardTitle>
          <CardDescription>Rule-based keyword replies and agent escalation, per WhatsApp number.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading automations...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Escalates</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {automations.length > 0 ? (
                  automations.map((automation) => {
                    const accountCondition = automation.conditions?.find((c) => c.field === "whatsappAccountId")
                    const keywordCondition = automation.conditions?.find((c) => c.field === "body")
                    const escalates = (automation.actions || []).some((a) => a.type === "escalate_to_agent")

                    return (
                      <TableRow key={automation.id}>
                        <TableCell>
                          <Badge variant={automation.isActive ? "default" : "secondary"} className={automation.isActive ? "bg-green-600" : ""}>
                            {automation.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{automation.name}</TableCell>
                        <TableCell>{accountLabel(accountCondition ? String(accountCondition.value) : undefined)}</TableCell>
                        <TableCell>
                          {keywordCondition && Array.isArray(keywordCondition.value)
                            ? `Contains: ${keywordCondition.value.join(", ")}`
                            : "Any message"}
                        </TableCell>
                        <TableCell>{escalates ? "Yes" : "No"}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setAutomationToEdit(automation)
                              setIsCreateOpen(true)
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(automation.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No automations yet. Create one to auto-reply to incoming WhatsApp messages.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
