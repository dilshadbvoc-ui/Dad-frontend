import { useState } from "react"
import { format } from "date-fns"
import { differenceInDays } from "date-fns"
import {
  MoreHorizontal, Eye, Pencil, Trash2, DollarSign, Calendar,
  AlertCircle, CheckCircle2, CreditCard, Clock, TrendingUp
} from "lucide-react"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"

import { ViewOpportunityDialog } from "@/components/ViewOpportunityDialog"
import { EditOpportunityDialog } from "@/components/EditOpportunityDialog"
import { CloseWonDialog } from "@/components/CloseWonDialog"
import { CloseLostDialog } from "@/components/CloseLostDialog"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"

import { type Opportunity, updateOpportunity, deleteOpportunity } from "@/services/opportunityService"
import { useMutation } from "@tanstack/react-query"
import { api } from "@/services/api"
import { getAssetUrl, isOrgAdmin, getUserInfo, cn } from "@/lib/utils"
import { useCurrency } from "@/contexts/CurrencyContext"
import { useOpportunityLeadStatuses } from "@/hooks/useLeadStatuses"

const STAGES = [
  { id: "expected", label: "Expected" },
  { id: "closed_won", label: "Closed Won" },
  { id: "closed_lost", label: "Closed Lost" },
]

interface Props {
  opportunity: Opportunity
}

export function OpportunityMobileCard({ opportunity: opp }: Props) {
  const { formatCurrency } = useCurrency()
  const queryClient = useQueryClient()
  const { statuses: leadStatuses } = useOpportunityLeadStatuses()
  const user = getUserInfo()
  const canDelete = isOrgAdmin(user)

  const [showView, setShowView] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showCloseWon, setShowCloseWon] = useState(false)
  const [showCloseLost, setShowCloseLost] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const daysInStage = differenceInDays(new Date(), new Date(opp.updatedAt))
  const isStagnant = daysInStage > 30
  const isWarning = daysInStage > 14 && daysInStage <= 30
  const isTerminal = opp.stage === "closed_won" || opp.stage === "closed_lost"

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOpportunity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast.success("Opportunity deleted")
      setShowDelete(false)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to delete"),
  })

  const handleMoveStage = async (stageId: string) => {
    if (isTerminal) {
      toast.error(`Cannot move a ${opp.stage === "closed_won" ? "Won" : "Lost"} opportunity`)
      return
    }
    if (stageId === "closed_won") { setShowCloseWon(true); return }
    if (stageId === "closed_lost") { setShowCloseLost(true); return }
    try {
      const actualStage = stageId === "expected" ? "prospecting" : stageId
      await updateOpportunity(opp.id, { stage: actualStage as Opportunity["stage"] })
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast.success(`Moved to ${STAGES.find(s => s.id === stageId)?.label}`)
    } catch {
      toast.error("Failed to move stage")
    }
  }

  // Stage display label
  const isExpected = ["prospecting", "qualification", "proposal", "negotiation", "pre_qualified_lead", "qualified_lead", "expected"].includes(opp.stage)
  let stageLabel = isExpected ? "Expected" : opp.stage.replace(/_/g, " ")
  if (opp.stage === "closed_won") {
    if (opp.paymentStatus === "paid") stageLabel += " · Paid"
    else if (opp.paymentStatus === "partial") stageLabel += opp.emiSchedule ? " · EMI" : " · Partial"
  }
  let stageBadgeClass = "bg-blue-500/10 text-blue-600 border-blue-500/20"
  if (opp.stage === "closed_won") stageBadgeClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
  if (opp.stage === "closed_lost") stageBadgeClass = "bg-red-500/10 text-red-600 border-red-500/20"

  return (
    <>
      <Card className={cn(
        "border-border/60 bg-card shadow-sm overflow-hidden rounded-xl transition-all",
        isStagnant && "border-l-4 border-l-destructive",
        isWarning && !isStagnant && "border-l-4 border-l-yellow-500"
      )}>
        <CardContent className="p-0">
          <div className="p-4 space-y-3">

            {/* Row 1: Name + menu */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                {opp.account && (
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide truncate mb-0.5">
                    {opp.account.name}
                  </p>
                )}
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                  {opp.name}
                </h3>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Payment status icons */}
                {opp.paymentStatus === "paid" && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
                )}
                {opp.paymentStatus === "partial" && (
                  opp.emiSchedule
                    ? <CreditCard className="h-4 w-4 text-amber-500" />
                    : <Clock className="h-4 w-4 text-sky-500" />
                )}
                {/* Stagnant/warning alert */}
                {(isStagnant || isWarning) && (
                  <div className={cn(
                    "p-0.5 rounded-full",
                    isStagnant ? "text-destructive bg-destructive/10" : "text-yellow-500 bg-yellow-500/10"
                  )}>
                    <AlertCircle className="h-3.5 w-3.5" />
                  </div>
                )}
                {/* Actions menu — always visible on mobile (no opacity-0) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border/60 shrink-0">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 rounded-xl">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="h-10 text-sm gap-2" onClick={() => setShowView(true)}>
                      <Eye className="h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="h-10 text-sm gap-2" onClick={() => setShowEdit(true)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </DropdownMenuItem>

                    {!isTerminal && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger className="h-10 text-sm">Move to Stage</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent className="rounded-xl">
                              {STAGES.map(s => (
                                <DropdownMenuItem
                                  key={s.id}
                                  className="h-10 text-sm"
                                  disabled={s.id === "expected" && isExpected}
                                  onClick={() => handleMoveStage(s.id)}
                                >
                                  {s.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                      </>
                    )}

                    {opp.stage === "closed_won" && opp.paymentStatus !== "paid" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="h-10 text-sm text-emerald-600 focus:text-emerald-600 focus:bg-emerald-500/10 gap-2"
                          onClick={() => setShowCloseWon(true)}
                        >
                          <DollarSign className="h-4 w-4" /> Record Payment / EMI
                        </DropdownMenuItem>
                      </>
                    )}

                    {canDelete && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="h-10 text-sm text-destructive focus:text-destructive focus:bg-destructive/10 gap-2"
                          onClick={() => setShowDelete(true)}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Row 2: Stage + Source badges */}
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge className={cn("text-[10px] h-5 px-2 font-semibold border capitalize", stageBadgeClass)}>
                {stageLabel}
              </Badge>
              {opp.leadSource && (
                <Badge variant="outline" className="text-[10px] h-5 px-1.5 font-normal border-border text-muted-foreground capitalize">
                  {opp.leadSource.replace(/_/g, " ")}
                </Badge>
              )}
            </div>

            {/* Row 3: Lead Status inline select */}
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 border border-border/30 px-3 py-2" onClick={e => e.stopPropagation()}>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider shrink-0">Lead Status</span>
              <Select
                value={opp.leadStatus || opp.lead?.status || ""}
                onValueChange={async (val) => {
                  try {
                    await api.put(`/opportunities/${opp.id}`, { leadStatus: val })
                    queryClient.invalidateQueries({ queryKey: ["opportunities"] })
                    toast.success("Lead status updated")
                  } catch {
                    toast.error("Failed to update lead status")
                  }
                }}
              >
                <SelectTrigger className="h-7 text-[11px] font-semibold px-2 rounded bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-1 min-w-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {leadStatuses.map(ls => (
                    <SelectItem key={ls.id} value={ls.id} className="text-xs capitalize">
                      {ls.label || ls.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Row 4: Value + probability + close date + owner */}
            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <div className="space-y-0.5">
                {opp.amount > 0 && (
                  <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    {formatCurrency(opp.amount)}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {opp.closeDate ? format(new Date(opp.closeDate), "MMM d, yyyy") : "No close date"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                  <TrendingUp className="h-3 w-3" />
                  {opp.probability}%
                </div>
                {opp.owner && (
                  <Avatar className="h-7 w-7 border border-background shadow-sm">
                    <AvatarImage
                      src={getAssetUrl(opp.owner.profileImage)}
                      onError={e => { e.currentTarget.style.display = "none" }}
                    />
                    <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                      {opp.owner.firstName?.[0]}{opp.owner.lastName?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>

            {/* Stagnant notice */}
            {isStagnant && (
              <p className="text-[10px] text-destructive font-semibold flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> No activity for {daysInStage} days
              </p>
            )}
            {!isStagnant && isWarning && (
              <p className="text-[10px] text-yellow-600 font-semibold flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {daysInStage} days without activity
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {showView && <ViewOpportunityDialog open={showView} onOpenChange={setShowView} opportunity={opp} />}
      {showEdit && <EditOpportunityDialog open={showEdit} onOpenChange={setShowEdit} opportunity={opp} />}
      {showCloseWon && (
        <CloseWonDialog
          open={showCloseWon}
          onOpenChange={setShowCloseWon}
          opportunityId={opp.id}
          opportunityName={opp.name}
          amount={opp.amount}
          onSuccess={() => {}}
        />
      )}
      {showCloseLost && (
        <CloseLostDialog
          open={showCloseLost}
          onOpenChange={setShowCloseLost}
          opportunityId={opp.id}
          opportunityName={opp.name}
        />
      )}
      {showDelete && (
        <DeleteConfirmationDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          onConfirm={() => deleteMutation.mutate(opp.id)}
          title="Delete Opportunity"
          description={`Are you sure you want to delete "${opp.name}"? This action cannot be undone.`}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </>
  )
}
