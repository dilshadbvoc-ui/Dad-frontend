import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { ArrowLeft, Edit2, GitBranch, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { whatsAppFlowService } from "@/services/whatsAppFlowService"

export default function WhatsAppFlowsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newFlowName, setNewFlowName] = useState("")

  const { data: flows = [], isLoading } = useQuery({
    queryKey: ["whatsapp-flows"],
    queryFn: whatsAppFlowService.getFlows,
  })

  const createMutation = useMutation({
    mutationFn: () => whatsAppFlowService.createFlow({ name: newFlowName }),
    onSuccess: (flow) => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-flows"] })
      toast.success("Flow created")
      setIsCreateOpen(false)
      setNewFlowName("")
      navigate(`/marketing/whatsapp/flows/${flow.id}`)
    },
    onError: () => toast.error("Failed to create flow"),
  })

  const deleteMutation = useMutation({
    mutationFn: whatsAppFlowService.deleteFlow,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-flows"] })
      toast.success("Flow deleted")
    },
    onError: () => toast.error("Failed to delete flow"),
  })

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
            WhatsApp Flows
          </h1>
          <p className="text-gray-500 mt-1">Build multi-step conversations with buttons, menus, and agent handoff.</p>
        </div>
        <Button
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25 rounded-xl"
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus className="h-4 w-4 mr-2" /> New Flow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> Flows
          </CardTitle>
          <CardDescription>Visual multi-step WhatsApp conversations, separate from simple keyword automations.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center text-muted-foreground">Loading flows...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Sessions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flows.length > 0 ? (
                  flows.map((flow) => (
                    <TableRow key={flow.id} className="cursor-pointer" onClick={() => navigate(`/marketing/whatsapp/flows/${flow.id}`)}>
                      <TableCell>
                        <Badge variant={flow.isActive ? "default" : "secondary"} className={flow.isActive ? "bg-green-600" : ""}>
                          {flow.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{flow.name}</TableCell>
                      <TableCell>{flow.whatsappAccount?.displayName || flow.whatsappAccount?.phoneNumber || "All Numbers"}</TableCell>
                      <TableCell className="capitalize">
                        {flow.triggerType === "keyword" ? `Keyword: ${flow.triggerKeywords.join(", ")}` : flow.triggerType.replace("_", " ")}
                      </TableCell>
                      <TableCell>{flow._count?.sessions ?? 0}</TableCell>
                      <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/marketing/whatsapp/flows/${flow.id}`)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500"
                          onClick={() => {
                            if (window.confirm("Delete this flow?")) deleteMutation.mutate(flow.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No flows yet. Create one to build a multi-step WhatsApp conversation.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Create WhatsApp Flow</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="flow-name">Name</Label>
            <Input
              id="flow-name"
              placeholder="e.g. New Lead Welcome Flow"
              value={newFlowName}
              onChange={(e) => setNewFlowName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={!newFlowName.trim() || createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create & Edit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
