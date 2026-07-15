import { useParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Loader2, ArrowLeft, User, Calendar, DollarSign, Target, Package, RefreshCw, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useState } from "react"
import { useCurrency } from "@/contexts/CurrencyContext"
import { getAssetUrl } from "@/lib/utils"
import { EMISchedulePanel } from "@/components/EMISchedulePanel"
import TimelineFeed from "@/components/shared/TimelineFeed"
import { useOpportunityLeadStatuses } from "@/hooks/useLeadStatuses"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { formatCurrency } = useCurrency()
  const queryClient = useQueryClient()
  const { statuses: leadStatuses } = useOpportunityLeadStatuses()
  const [noteText, setNoteText] = useState("")
  const [isAddingNote, setIsAddingNote] = useState(false)

  const { data: opportunity, isLoading, isError } = useQuery({
    queryKey: ["opportunity", id],
    queryFn: async () => {
      const response = await api.get(`/opportunities/${id}`)
      return response.data
    },
    enabled: !!id,
  })

  const syncMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/opportunities/${id}`, { amount: productTotal })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["opportunity", id] })
      queryClient.invalidateQueries({ queryKey: ["opportunities"] })
      toast.success("Opportunity amount synced with products")
    },
    onError: () => toast.error("Failed to sync amount"),
  })

  const handleAddNote = async () => {
    if (!noteText.trim()) return
    setIsAddingNote(true)
    try {
      await api.post("/interactions", {
        opportunity: id,
        onModel: "Opportunity",
        relatedTo: id,
        type: "note",
        description: noteText,
        date: new Date().toISOString(),
        subject: "Note",
      })
      setNoteText("")
      toast.success("Note added successfully")
      queryClient.invalidateQueries({ queryKey: ["timeline", "opportunity", id] })
    } catch {
      toast.error("Failed to add note")
    } finally {
      setIsAddingNote(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isError || !opportunity) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive font-medium">Could not load opportunity details.</p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    )
  }

  const productTotal =
    opportunity.account?.accountProducts?.reduce(
      (sum: number, ap: any) => sum + ap.product.basePrice * ap.quantity,
      0
    ) || 0

  const isAmountDifferent = Math.abs(productTotal - opportunity.amount) > 0.01

  const getReadableId = () => {
    if (!opportunity.createdAt) return opportunity.id.slice(0, 8).toUpperCase()
    const date = new Date(opportunity.createdAt)
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const shortId = opportunity.id.slice(0, 6).toUpperCase()
    return `OPP-${year}${month}${day}-${shortId}`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold truncate">{opportunity.name}</h1>
          <p className="text-sm text-muted-foreground font-mono">{getReadableId()}</p>
        </div>
        <Badge variant="secondary" className="capitalize shrink-0">
          {opportunity.stage?.replace("_", " ")}
        </Badge>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="timeline">Timeline &amp; Files</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6 mt-6">
          {/* Stage & Probability */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-muted-foreground">Stage</span>
              <Badge variant="secondary" className="mt-1 capitalize w-fit">
                {opportunity.stage?.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-muted-foreground">Probability</span>
              <span className="text-lg font-bold flex items-center mt-1">
                <Target className="w-4 h-4 mr-1 text-blue-500" />
                {opportunity.probability}%
              </span>
            </div>
          </div>

          {/* Value & Close Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-muted-foreground">Value</span>
              </div>
              <span className="text-2xl font-bold">{formatCurrency(opportunity.amount)}</span>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-muted-foreground">Close Date</span>
              </div>
              <span className="text-lg font-medium">
                {opportunity.closeDate
                  ? new Date(opportunity.closeDate).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>

          {/* Owner */}
          {opportunity.owner && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-muted-foreground">Opportunity Owner</span>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={getAssetUrl(opportunity.owner.profileImage)}
                    onError={(e: any) => (e.currentTarget.style.display = "none")}
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                    {opportunity.owner.firstName?.[0]}
                    {opportunity.owner.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">
                    {opportunity.owner.firstName} {opportunity.owner.lastName}
                  </div>
                  {opportunity.owner.email && (
                    <div className="text-xs text-muted-foreground">{opportunity.owner.email}</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Linked Lead */}
          {opportunity.lead && (
            <div
              className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg border border-green-200 dark:border-green-800 cursor-pointer hover:shadow-md transition-all group"
              onClick={() => navigate(`/leads/${opportunity.lead.id}`)}
            >
              <div
                className="flex items-center justify-between mb-3"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-muted-foreground">Linked Lead</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground">Status:</span>
                  <Select
                    value={opportunity.leadStatus || opportunity.lead?.status || ""}
                    onValueChange={async (newStatus) => {
                      try {
                        await api.put(`/opportunities/${opportunity.id}`, { leadStatus: newStatus })
                        queryClient.invalidateQueries({ queryKey: ["opportunity", id] })
                        queryClient.invalidateQueries({ queryKey: ["opportunities"] })
                        toast.success("Lead status updated successfully")
                      } catch {
                        toast.error("Failed to update lead status")
                      }
                    }}
                  >
                    <SelectTrigger className="h-7 text-xs px-2 rounded bg-white text-emerald-600 border border-green-200 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {leadStatuses.map((ls) => (
                        <SelectItem key={ls.id} value={ls.id} className="text-xs capitalize">
                          {ls.label || ls.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <ExternalLink className="w-3 h-3 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="font-semibold">
                {opportunity.lead.firstName} {opportunity.lead.lastName}
                {!opportunity.lead.assignedTo && (
                  <span className="text-muted-foreground font-normal"> (Unassigned)</span>
                )}
              </div>
              {opportunity.lead.assignedTo && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Owner: {opportunity.lead.assignedTo.firstName}{" "}
                  {opportunity.lead.assignedTo.lastName}
                </div>
              )}
            </div>
          )}

          {/* Associated Products */}
          {opportunity.account?.accountProducts?.length > 0 && (
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  Associated Products
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {opportunity.account.accountProducts.map((ap: any) => (
                  <div
                    key={ap.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm">{ap.product.name}</div>
                      {ap.product.sku && (
                        <div className="text-xs text-muted-foreground">SKU: {ap.product.sku}</div>
                      )}
                      {ap.notes && (
                        <div className="text-xs text-muted-foreground mt-1 italic">{ap.notes}</div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-sm font-semibold">
                        {formatCurrency(ap.product.basePrice * ap.quantity)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ap.quantity} × {formatCurrency(ap.product.basePrice)}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {ap.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">Total Product Value:</span>
                    {isAmountDifferent && (
                      <span className="text-[10px] text-amber-600 font-semibold animate-pulse">
                        Differs from Opportunity Amount
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(productTotal)}
                    </span>
                    {isAmountDifferent && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 gap-1.5 text-xs bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
                        disabled={syncMutation.isPending}
                        onClick={() => syncMutation.mutate()}
                      >
                        {syncMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                        Sync
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* EMI Schedule */}
          <EMISchedulePanel
            opportunityId={opportunity.id}
            paymentStatus={opportunity.paymentStatus}
            opportunityAmount={opportunity.amount}
          />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4 mt-6">
          <div className="flex flex-col gap-2 p-3 bg-muted/40 rounded-lg border border-border/50">
            <Textarea
              placeholder="Add a note to this deal..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[60px] text-xs"
            />
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={isAddingNote || !noteText.trim()}
              className="self-end text-xs h-8"
            >
              {isAddingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Add Note
            </Button>
          </div>
          <TimelineFeed type="opportunity" id={opportunity.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
