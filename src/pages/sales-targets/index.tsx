import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getMyTargets,
  getTeamTargets,
  getSubordinates,
  assignTarget,
  deleteTarget,
  updateTarget,
  recalculateProgress,
  type SalesTarget,
  type Subordinate,
  type AssignTargetInput,
  type UpdateTargetInput
} from "@/services/salesTargetService"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  Target,
  Trophy,
  Users,
  Calendar,
  MoreVertical,
  Trash2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
  Pencil,
  Box
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"
import { useCurrency } from "@/contexts/CurrencyContext"
import { cn } from "@/lib/utils"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"
import * as XLSX from "xlsx"
import { Download } from "lucide-react"

// Tree Node interface for hierarchical display
interface TargetTreeNode extends SalesTarget {
  children: TargetTreeNode[];
}

// Build tree from flat targets list
const buildTargetTree = (targets: SalesTarget[]): TargetTreeNode[] => {
  const targetMap = new Map<string, TargetTreeNode>();
  const roots: TargetTreeNode[] = [];

  // Initialize map
  targets.forEach(target => {
    targetMap.set(target.id, { ...target, children: [] });
  });

  // Build hierarchy
  targets.forEach(target => {
    const node = targetMap.get(target.id)!;
    if (target.parentTarget && targetMap.has(target.parentTarget)) {
      const parent = targetMap.get(target.parentTarget)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

// Target Tree Node Component
const TargetNode = ({ node, level = 0, onDelete, onEdit }: { node: TargetTreeNode; level?: number; onDelete: (target: SalesTarget) => void; onEdit: (target: SalesTarget) => void }) => {
  const { formatCurrency } = useCurrency();
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const achievementPercent = node.targetValue > 0
    ? Math.round((node.achievedValue / node.targetValue) * 100)
    : 0;

  return (
    <div className={level > 0 ? 'ml-4 sm:ml-8 border-l-2 border-dashed border-border pl-3 sm:pl-4' : ''}>
      <div className="p-4 rounded-[10px] border border-border bg-card hover:shadow-md transition-all mb-3 text-card-foreground">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {hasChildren && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${node.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]'}`}>
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground truncate">{node.assignedTo.firstName} {node.assignedTo.lastName}</p>
              <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                {node.autoDistributed && <Badge variant="outline" className="text-xs">Auto-distributed</Badge>}
                <Badge variant={node.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                  {node.status}
                </Badge>
                {node.product && (
                  <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1">
                    <Box className="h-3 w-3" />
                    {node.product.name}
                  </Badge>
                )}
                {node.opportunityType && (
                  <Badge variant="outline" className="text-xs border-purple-200 bg-purple-50 text-purple-700">
                    {node.opportunityType.replace('_', ' ')}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
            <div className="text-left sm:text-right">
              <p className="font-bold text-base sm:text-lg text-foreground">
                {node.metric === 'units'
                  ? node.achievedValue.toLocaleString()
                  : formatCurrency(node.achievedValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                <span className="text-muted-foreground font-normal">/</span>
                {node.metric === 'units'
                  ? ` ${node.targetValue.toLocaleString()} units`
                  : ` ${formatCurrency(node.targetValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
              </p>
              <p className="text-sm text-muted-foreground">{achievementPercent}% achieved</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(node)}>
                  <Pencil className="h-4 w-4 mr-2" />Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onClick={() => onDelete(node)}>
                  <Trash2 className="h-4 w-4 mr-2" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Progress value={Math.min(achievementPercent, 100)} className="h-2" />
      </div>

      {hasChildren && expanded && (
        <div className="mt-2">
          {node.children.map(child => (
            <TargetNode key={child.id} node={child} level={level + 1} onDelete={onDelete} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function SalesTargetsPage() {
  const { formatCurrency } = useCurrency()
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my')
  const [deletingTarget, setDeletingTarget] = useState<SalesTarget | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSubordinate, setSelectedSubordinate] = useState("")
  const [targetValue, setTargetValue] = useState("")
  const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly")

  // New State for Enhanced Targeting
  const [metric, setMetric] = useState<'revenue' | 'units'>('revenue')
  const [scope, setScope] = useState<'INDIVIDUAL' | 'HIERARCHY'>('HIERARCHY')
  const [selectedProductId, setSelectedProductId] = useState<string>('ALL')
  const [opportunityType, setOpportunityType] = useState<'NEW_BUSINESS' | 'UPSALE' | 'ALL'>('ALL')

  // Edit State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<SalesTarget | null>(null)
  const [editValue, setEditValue] = useState("")

  const queryClient = useQueryClient()

  // Fetch Products for dropdown
  // Assuming we can use /api/products directly or need a service method.
  // Using inline fetch or similar approach to previous files
  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      // We need to import api here or use existing pattern. 
      // To avoid import issues, I will try to use the api imported in other files if available,
      // but index.tsx doesn't import 'api'.
      // I'll assume 'api' can be imported from @/services/api
      const { api } = await import('@/services/api')
      return (await api.get('/products?limit=1000')).data
    }
  })
  const products = Array.isArray(productsData) ? productsData : []

  const { data: myTargetsData, isLoading: isLoadingMy } = useQuery({
    queryKey: ['sales-targets', 'my'],
    queryFn: getMyTargets
  })

  const { data: teamTargetsData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['sales-targets', 'team'],
    queryFn: getTeamTargets
  })

  const { data: subordinatesData } = useQuery({
    queryKey: ['sales-targets', 'subordinates'],
    queryFn: getSubordinates
  })

  const myTargets = Array.isArray(myTargetsData?.targets) ? myTargetsData.targets : []
  const teamTargets = Array.isArray(teamTargetsData?.targets) ? teamTargetsData.targets : []
  const subordinates = Array.isArray(subordinatesData?.subordinates) ? subordinatesData.subordinates : []

  const targetTree = useMemo(() => {
    const targets = Array.isArray(teamTargetsData?.targets) ? teamTargetsData.targets : [];
    return buildTargetTree(targets);
  }, [teamTargetsData?.targets]);

  const [now] = useState<number>(() => Date.now()); // Fallback to current time, but useState initializer is only once per mount

  const assignMutation = useMutation({
    mutationFn: (data: AssignTargetInput) => assignTarget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] })
      setIsDialogOpen(false)
      setSelectedSubordinate("")
      setTargetValue("")
      toast.success("Target assigned successfully! Subordinates have been auto-distributed their targets.")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to assign target")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTarget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] })
      toast.success("Target deleted")
      setDeletingTarget(null)
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTargetInput }) => updateTarget(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] })
      setIsEditOpen(false)
      setEditingTarget(null)
      toast.success("Target updated successfully")
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update target")
    }
  })

  const recalcMutation = useMutation({
    mutationFn: recalculateProgress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-targets'] })
      toast.success("Progress recalculated from closed opportunities")
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSubordinate || !targetValue) return

    assignMutation.mutate({
      assignToUserId: selectedSubordinate,
      targetValue: parseFloat(targetValue),
      period,
      metric,
      scope,
      productId: selectedProductId === 'ALL' ? undefined : selectedProductId,
      opportunityType: opportunityType === 'ALL' ? undefined : opportunityType
    })
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTarget || !editValue) return

    updateMutation.mutate({
      id: editingTarget.id,
      data: {
        targetValue: parseFloat(editValue)
      }
    })
  }

  const openEditDialog = (target: SalesTarget) => {
    setEditingTarget(target)
    setEditValue(target.targetValue.toString())
    setIsEditOpen(true)
  }

  const flattenTree = (nodes: TargetTreeNode[], depth = 0): { target: TargetTreeNode; depth: number }[] =>
    nodes.flatMap(n => [{ target: n, depth }, ...flattenTree(n.children, depth + 1)])

  const handleExport = () => {
    const rows = activeTab === 'my'
      ? myTargets.map((t: SalesTarget) => ({
        'Period': t.period,
        'Metric': t.metric,
        'Target': t.targetValue,
        'Achieved': t.achievedValue,
        'Status': t.status,
        'Product': t.product?.name || '',
        'End Date': t.endDate ? new Date(t.endDate).toISOString().slice(0, 10) : '',
      }))
      : flattenTree(targetTree).map(({ target: t, depth }) => ({
        'Team Member': `${'— '.repeat(depth)}${t.assignedTo.firstName} ${t.assignedTo.lastName}`,
        'Period': t.period,
        'Metric': t.metric,
        'Target': t.targetValue,
        'Achieved': t.achievedValue,
        'Status': t.status,
        'Product': t.product?.name || '',
      }))

    if (rows.length === 0) return

    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sales Targets')
    XLSX.writeFile(workbook, `sales_targets_${activeTab}_${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  // Stats (Summing only revenue targets to prevent mixing metrics)
  const revenueTargets = myTargets.filter(t => t.metric !== 'units')
  const totalTargetValue = revenueTargets.reduce((sum, t) => sum + t.targetValue, 0)
  const totalAchieved = revenueTargets.reduce((sum, t) => sum + t.achievedValue, 0)
  const completedCount = teamTargets.filter(t => t.status === 'completed').length
  const activeCount = teamTargets.filter(t => t.status === 'active').length

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <Target className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight">
              Sales Targets
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage hierarchical sales targets for your team</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={handleExport}
            variant="outline"
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Export</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => recalcMutation.mutate()}
            disabled={recalcMutation.isPending}
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Recalculate</span>
          </Button>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90">
                      <Plus className="h-3.5 w-3.5" />Assign Target
                    </Button>
                  </DialogTrigger>
                  <DialogContent aria-describedby="assign-target-desc" className="max-h-[90vh] overflow-y-auto">
                    <form onSubmit={handleSubmit}>
                      <DialogHeader>
                        <DialogTitle>Assign Sales Target</DialogTitle>
                        <DialogDescription id="assign-target-desc">
                          Assign a sales target to a subordinate for a specific period.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label>Assign To</Label>
                          <Select value={selectedSubordinate} onValueChange={setSelectedSubordinate}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                            <SelectContent>
                              {subordinates.map((sub: Subordinate) => (
                                <SelectItem key={sub.id} value={sub.id}>
                                  {sub.firstName} {sub.lastName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {subordinates.length === 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              No direct reports found. You can only assign targets to your subordinates.
                            </p>
                          )}
                        </div>
                        <div>
                          <Label>Measure By</Label>
                          <Select value={metric} onValueChange={(v) => setMetric(v as 'revenue' | 'units')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="revenue">Revenue Amount</SelectItem>
                              <SelectItem value="units">Product Units (Qty)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Target Scope</Label>
                          <Select value={scope} onValueChange={(v) => setScope(v as 'INDIVIDUAL' | 'HIERARCHY')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HIERARCHY">Team Hierarchy (Rollup)</SelectItem>
                              <SelectItem value="INDIVIDUAL">Individual Only</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {scope === 'HIERARCHY'
                              ? "Target includes sales from the user + their team."
                              : "Target counts ONLY the user's personal sales."}
                          </p>
                        </div>

                        <div>
                          <Label>Product (Optional)</Label>
                          <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger>
                              <SelectValue placeholder="All Products (General Target)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">All Products (General Target)</SelectItem>
                              {products.map((product: { id: string; name: string }) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Opportunity Type (Optional)</Label>
                          <Select value={opportunityType} onValueChange={(v) => setOpportunityType(v as 'NEW_BUSINESS' | 'UPSALE' | 'ALL')}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">All Types</SelectItem>
                              <SelectItem value="NEW_BUSINESS">New Business</SelectItem>
                              <SelectItem value="UPSALE">Upsale</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>{metric === 'revenue' ? 'Target Amount' : 'Target Units (Qty)'}</Label>
                          <Input
                            type="number"
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                            placeholder={metric === 'revenue' ? "e.g. 100000" : "e.g. 50"}
                            required
                          />
                        </div>
                        <div>
                          <Label>Period</Label>
                          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                          <strong>Note:</strong> If the selected person has subordinates, the target will be automatically split equally among them.
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={assignMutation.isPending || !selectedSubordinate}>
                          {assignMutation.isPending ? "Assigning..." : "Assign Target"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogContent>
                    <form onSubmit={handleEditSubmit}>
                      <DialogHeader>
                        <DialogTitle>Edit Sales Target</DialogTitle>
                        <DialogDescription>
                          Update the target value. Period and assignee cannot be changed here.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div>
                          <Label>Target Amount</Label>
                          <Input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="e.g. 100000"
                            required
                          />
                        </div>
                        {editingTarget?.product && (
                          <div className="text-sm text-muted-foreground">
                            Product: <span className="font-medium text-foreground">{editingTarget.product.name}</span>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={updateMutation.isPending}>
                          {updateMutation.isPending ? "Updating..." : "Update Target"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Stats row */}
            <div className="rounded-[10px] bg-card border border-border overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 divide-x divide-border">
                {[
                  { label: "My Total Target", value: formatCurrency(totalTargetValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 }), accent: "bg-[hsl(var(--chart-5))]" },
                  { label: "My Achieved", value: formatCurrency(totalAchieved, { minimumFractionDigits: 0, maximumFractionDigits: 0 }), accent: "bg-[hsl(var(--chart-2))]" },
                  { label: "Team Completed", value: completedCount, accent: "bg-purple-500" },
                  { label: "Active Targets", value: activeCount, accent: "bg-amber-500" },
                ].map((tile) => (
                  <div key={tile.label} className="relative flex flex-col items-center justify-center gap-1 px-4 py-4">
                    <span className={`absolute top-0 left-0 right-0 h-0.5 ${tile.accent} opacity-70`} />
                    <span className="text-xs font-poppins text-muted-foreground text-center">{tile.label}</span>
                    <span className="text-lg sm:text-xl font-medium font-poppins text-black truncate max-w-full">{tile.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs for My Targets and Team View */}
            <div className="flex bg-muted/60 p-1 rounded-[10px] shrink-0 w-fit">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setActiveTab('my')}
                className={cn(
                  "rounded-[8px] h-8 px-3 text-xs font-semibold transition-all",
                  activeTab === 'my' ? "bg-white text-[hsl(var(--chart-5))] shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                My Targets
              </Button>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setActiveTab('team')}
                className={cn(
                  "rounded-[8px] h-8 px-3 text-xs font-semibold transition-all",
                  activeTab === 'team' ? "bg-white text-[hsl(var(--chart-5))] shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Team Hierarchy
              </Button>
            </div>

            {activeTab === 'my' && (
                <Card>
                  <CardHeader>
                    <CardTitle>My Sales Targets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMy ? (
                      <div className="flex justify-center p-12">
                        <div className="h-8 w-8 rounded-full border-4 border-[hsl(var(--chart-5))] border-t-transparent animate-spin" />
                      </div>
                    ) : myTargets.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No targets assigned to you yet</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myTargets.map((target: SalesTarget) => {
                          const percent = target.targetValue > 0
                            ? Math.round((target.achievedValue / target.targetValue) * 100)
                            : 0;
                          const daysLeft = Math.ceil((new Date(target.endDate).getTime() - now) / (1000 * 60 * 60 * 24));

                          return (
                            <div key={target.id} className="p-4 rounded-xl border hover:bg-muted/30 transition-colors">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${target.status === 'completed' ? 'bg-green-500/10 text-green-600' : 'bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]'}`}>
                                    {target.status === 'completed' ? <Trophy className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold capitalize text-foreground">{target.period} Target</p>
                                    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                                      <Badge variant="outline">{target.period}</Badge>
                                      <Calendar className="h-3 w-3" />
                                      <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
                                    </div>
                                    {target.product && (
                                      <Badge variant="outline" className="mt-1 text-xs border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1 w-fit">
                                        <Box className="h-3 w-3" />
                                        {target.product.name}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                  <div className="text-left sm:text-right">
                                    <p className="font-bold text-base sm:text-lg text-foreground">
                                      {target.metric === 'units'
                                        ? target.achievedValue.toLocaleString()
                                        : formatCurrency(target.achievedValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                      <span className="text-muted-foreground font-normal"> / </span>
                                      {target.metric === 'units'
                                        ? `${target.targetValue.toLocaleString()} units`
                                        : formatCurrency(target.targetValue, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-sm text-muted-foreground">{percent}% achieved</p>
                                  </div>
                                  {/* Note: Employees can't usually edit their own targets assigned by managers, blocking edit here for 'My Targets' view unless we want self-assigned targets logic. Assuming 'Team' view is where management happens. */}
                                </div>
                              </div>
                              <Progress value={Math.min(percent, 100)} className="h-2" />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
            )}

            {activeTab === 'team' && (
                <Card>
                  <CardHeader>
                    <CardTitle>Team Target Hierarchy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTeam ? (
                      <div className="flex justify-center p-12">
                        <div className="h-8 w-8 rounded-full border-4 border-[hsl(var(--chart-5))] border-t-transparent animate-spin" />
                      </div>
                    ) : targetTree.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No team targets yet</p>
                        <p className="text-sm mt-1">Assign targets to your subordinates to see the hierarchy</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {targetTree.map(node => (
                          <TargetNode
                            key={node.id}
                            node={node}
                            onDelete={(target) => setDeletingTarget(target)}
                            onEdit={openEditDialog}
                          />
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
            )}

      <DeleteConfirmationDialog
        open={!!deletingTarget}
        onOpenChange={(open) => { if (!open) setDeletingTarget(null) }}
        onConfirm={() => deletingTarget && deleteMutation.mutate(deletingTarget.id)}
        title="Delete Sales Target"
        description={`Are you sure you want to delete this target for ${deletingTarget?.assignedTo.firstName} ${deletingTarget?.assignedTo.lastName}? This action cannot be undone.`}
        confirmText="Delete Target"
        isDeleting={deleteMutation.isPending}
      />
    </div>
  )
}
