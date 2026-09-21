import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Edit2, Trash2, ShieldAlert, BarChart, Settings } from "lucide-react"
import { toast } from "sonner"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { whatsAppAccountService, WhatsAppAccount } from "@/services/whatsAppAccountService"
import { AddWhatsAppAccountDialog } from "@/components/WhatsApp/AddWhatsAppAccountDialog"
import { WhatsAppAssignmentRuleDialog } from "@/components/WhatsApp/WhatsAppAssignmentRuleDialog"

export default function WhatsAppAccountsPage() {
  const queryClient = useQueryClient()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [accountToEdit, setAccountToEdit] = useState<WhatsAppAccount | null>(null)
  
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false)
  const [ruleAccountContext, setRuleAccountContext] = useState<WhatsAppAccount | null>(null)

  const { data: report, isLoading } = useQuery({
    queryKey: ['whatsapp-accounts', 'report'],
    queryFn: whatsAppAccountService.getWhatsAppIntegrationReport
  })

  const { data: accounts = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['whatsapp-accounts'],
    queryFn: whatsAppAccountService.getWhatsAppAccounts
  })

  const deleteMutation = useMutation({
    mutationFn: whatsAppAccountService.deleteWhatsAppAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-accounts"] })
      toast.success("Account deleted successfully")
    },
    onError: () => {
      toast.error("Failed to delete account")
    }
  })

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this WhatsApp account? Campaigns using this account might be affected.")) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading || isLoadingAccounts) {
    return <div className="p-8 text-center text-muted-foreground">Loading WhatsApp accounts...</div>
  }

  const summary = report?.summary

  return (
    <div className="container py-8 max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Accounts</h1>
          <p className="text-muted-foreground">Manage your WhatsApp numbers, assign rules, and view performance.</p>
        </div>
        <Button onClick={() => { setAccountToEdit(null); setIsAddDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Account
        </Button>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Numbers</CardTitle>
              <ShieldAlert className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalNumbers}</div>
              <p className="text-xs text-muted-foreground">{summary.activeNumbers} active, {summary.inactiveNumbers} inactive</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalMessages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(summary.deliveryRate)}%</div>
              <p className="text-xs text-muted-foreground">{summary.totalDelivered} delivered</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaigns</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalCampaigns}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            All WhatsApp numbers connected to your organisation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No WhatsApp accounts found. Add one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Usage (Msgs/Cmp)</TableHead>
                  <TableHead>Routing</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => {
                  const ruleCount = account.assignmentRules?.length || 0
                  return (
                    <TableRow key={account.id}>
                      <TableCell>
                        <div className="font-medium">{account.displayName || account.phoneNumber}</div>
                        <div className="text-xs text-muted-foreground">{account.phoneNumber} {account.isDefault ? '(Default)' : ''}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {account.provider}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                          {account.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{account._count?.messages || 0} / {account._count?.campaigns || 0}</div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 flex items-center gap-1"
                          onClick={() => {
                            setRuleAccountContext(account)
                            setIsRuleDialogOpen(true)
                          }}
                        >
                          <Settings className="h-3 w-3" />
                          {ruleCount > 0 ? `${ruleCount} Rule(s)` : 'Add Rule'}
                        </Button>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => { setAccountToEdit(account); setIsAddDialogOpen(true); }}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(account.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AddWhatsAppAccountDialog 
        open={isAddDialogOpen} 
        onOpenChange={setIsAddDialogOpen} 
        accountToEdit={accountToEdit} 
      />

      {ruleAccountContext && (
        <WhatsAppAssignmentRuleDialog
          open={isRuleDialogOpen}
          onOpenChange={(open) => {
            setIsRuleDialogOpen(open)
            if (!open) setTimeout(() => setRuleAccountContext(null), 200)
          }}
          whatsappAccountId={ruleAccountContext.id}
          ruleToEdit={ruleAccountContext.assignmentRules?.[0] || null} // Basic support for editing first rule
        />
      )}
    </div>
  )
}
