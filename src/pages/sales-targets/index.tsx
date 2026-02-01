import { useState, useMemo } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
    getMyTargets,
    getTeamTargets,
    getSubordinates,
    assignTarget,
    deleteTarget,
    recalculateProgress,
    type SalesTarget,
    type Subordinate,
    type AssignTargetInput
} from "@/services/salesTargetService"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Plus,
    Target,
    TrendingUp,
    Trophy,
    Users,
    Calendar,
    MoreVertical,
    Trash2,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    User
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

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
const TargetNode = ({ node, level = 0, onDelete }: { node: TargetTreeNode; level?: number; onDelete: (id: string) => void }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children.length > 0;
    const achievementPercent = node.targetValue > 0
        ? Math.round((node.achievedValue / node.targetValue) * 100)
        : 0;

    return (
        <div className={`${level > 0 ? 'ml-8 border-l-2 border-dashed border-gray-200 dark:border-gray-700 pl-4' : ''}`}>
            <div className="p-4 rounded-xl border bg-white dark:bg-gray-900 hover:shadow-md transition-all mb-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        {hasChildren && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        )}
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${node.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                            <User className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="font-semibold">{node.assignedTo.firstName} {node.assignedTo.lastName}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                {node.autoDistributed && <Badge variant="outline" className="text-xs">Auto-distributed</Badge>}
                                <Badge variant={node.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
                                    {node.status}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="font-bold text-lg">₹{node.achievedValue.toLocaleString()} <span className="text-gray-400 font-normal">/</span> ₹{node.targetValue.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">{achievementPercent}% achieved</p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem className="text-red-600" onClick={() => onDelete(node.id)}>
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
                        <TargetNode key={child.id} node={child} level={level + 1} onDelete={onDelete} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function SalesTargetsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedSubordinate, setSelectedSubordinate] = useState("")
    const [targetValue, setTargetValue] = useState("")
    const [period, setPeriod] = useState<"monthly" | "quarterly" | "yearly">("monthly")
    const queryClient = useQueryClient()

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

    const myTargets = myTargetsData?.targets || []
    const teamTargets = teamTargetsData?.targets || []
    const subordinates = subordinatesData?.subordinates || []

    const targetTree = useMemo(() => {
        return buildTargetTree(teamTargetsData?.targets || []);
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
            period
        })
    }

    // Stats
    const totalTargetValue = myTargets.reduce((sum, t) => sum + t.targetValue, 0)
    const totalAchieved = myTargets.reduce((sum, t) => sum + t.achievedValue, 0)
    const completedCount = teamTargets.filter(t => t.status === 'completed').length
    const activeCount = teamTargets.filter(t => t.status === 'active').length

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                    Sales Targets
                                </h1>
                                <p className="text-gray-500">Manage hierarchical sales targets for your team</p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => recalcMutation.mutate()}
                                    disabled={recalcMutation.isPending}
                                >
                                    <RefreshCw className={`h-4 w-4 mr-2 ${recalcMutation.isPending ? 'animate-spin' : ''}`} />
                                    Recalculate
                                </Button>
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                            <Plus className="h-4 w-4 mr-2" />Assign Target
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent aria-describedby="assign-target-desc">
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
                                                    <Label>Target Amount (₹)</Label>
                                                    <Input
                                                        type="number"
                                                        value={targetValue}
                                                        onChange={(e) => setTargetValue(e.target.value)}
                                                        placeholder="e.g. 100000"
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
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                        <Target className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">₹{totalTargetValue.toLocaleString()}</p>
                                        <p className="text-xs text-blue-600">My Total Target</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">₹{totalAchieved.toLocaleString()}</p>
                                        <p className="text-xs text-green-600">My Achieved</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <Trophy className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{completedCount}</p>
                                        <p className="text-xs text-purple-600">Team Completed</p>
                                    </div>
                                </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{activeCount}</p>
                                        <p className="text-xs text-orange-600">Active Targets</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Tabs for My Targets and Team View */}
                        <Tabs defaultValue="my" className="w-full">
                            <TabsList>
                                <TabsTrigger value="my">My Targets</TabsTrigger>
                                <TabsTrigger value="team">Team Hierarchy</TabsTrigger>
                            </TabsList>

                            <TabsContent value="my">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>My Sales Targets</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingMy ? (
                                            <div className="flex justify-center p-12">
                                                <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                                            </div>
                                        ) : myTargets.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
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
                                                        <div key={target.id} className="p-4 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${target.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                                        {target.status === 'completed' ? <Trophy className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-semibold capitalize">{target.period} Target</p>
                                                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                            <Badge variant="outline">{target.period}</Badge>
                                                                            <Calendar className="h-3 w-3" />
                                                                            <span>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <p className="font-bold text-lg">₹{target.achievedValue.toLocaleString()} / ₹{target.targetValue.toLocaleString()}</p>
                                                                    <p className="text-sm text-gray-500">{percent}% achieved</p>
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
                            </TabsContent>

                            <TabsContent value="team">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Team Target Hierarchy</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {isLoadingTeam ? (
                                            <div className="flex justify-center p-12">
                                                <div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                                            </div>
                                        ) : targetTree.length === 0 ? (
                                            <div className="text-center py-12 text-gray-500">
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
                                                        onDelete={(id) => deleteMutation.mutate(id)}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}
