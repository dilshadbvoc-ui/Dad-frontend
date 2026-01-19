import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getGoals, createGoal, deleteGoal, type Goal, type GoalInput } from "@/services/goalService"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Target, TrendingUp, Trophy, Calendar, MoreVertical, Trash2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function GoalsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['goals'],
        queryFn: getGoals
    })

    const goals = data?.goals || []

    const createMutation = useMutation({
        mutationFn: (data: GoalInput) => createGoal(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['goals'] }); setIsDialogOpen(false) }
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteGoal(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goals'] })
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        createMutation.mutate({
            name: formData.get('name') as string,
            type: formData.get('type') as Goal['type'],
            targetValue: parseFloat(formData.get('targetValue') as string),
            period: formData.get('period') as string,
        })
    }

    const activeGoals = goals.filter((g: Goal) => g.status === 'active').length
    const completedGoals = goals.filter((g: Goal) => g.status === 'completed').length
    const avgAchievement = goals.length > 0 ? Math.round(goals.reduce((sum: number, g: Goal) => sum + g.achievementPercent, 0) / goals.length) : 0

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div><h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Goals</h1><p className="text-gray-500">Set and track your sales targets</p></div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"><Plus className="h-4 w-4 mr-2" />New Goal</Button></DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleSubmit}>
                                        <DialogHeader><DialogTitle>Create New Goal</DialogTitle></DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div><Label>Goal Name</Label><Input name="name" required /></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>Type</Label><Select name="type" defaultValue="revenue"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="revenue">Revenue</SelectItem><SelectItem value="deals">Deals</SelectItem><SelectItem value="leads">Leads</SelectItem><SelectItem value="calls">Calls</SelectItem><SelectItem value="meetings">Meetings</SelectItem></SelectContent></Select></div>
                                                <div><Label>Target</Label><Input name="targetValue" type="number" required /></div>
                                            </div>
                                            <div><Label>Period</Label><Select name="period" defaultValue="monthly"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="quarterly">Quarterly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select></div>
                                        </div>
                                        <DialogFooter><Button type="submit">Create Goal</Button></DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {/* Stats */}
                        <div className="grid gap-4 md:grid-cols-4">
                            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center"><Target className="h-5 w-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{goals.length}</p><p className="text-xs text-blue-600">Total Goals</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-green-600" /></div><div><p className="text-2xl font-bold">{activeGoals}</p><p className="text-xs text-green-600">Active Goals</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center"><Trophy className="h-5 w-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{completedGoals}</p><p className="text-xs text-purple-600">Completed</p></div></CardContent></Card>
                            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50"><CardContent className="p-4 flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{avgAchievement}%</p><p className="text-xs text-orange-600">Avg. Achievement</p></div></CardContent></Card>
                        </div>

                        {/* Goals List */}
                        <Card>
                            <CardHeader><CardTitle>All Goals</CardTitle></CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center p-12"><div className="h-8 w-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>
                                ) : goals.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500"><Target className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No goals yet</p></div>
                                ) : (
                                    <div className="space-y-4">
                                        {goals.map((goal: Goal) => (
                                            <div key={goal.id} className="p-4 rounded-xl border hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${goal.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                                            {goal.status === 'completed' ? <Trophy className="h-5 w-5" /> : <Target className="h-5 w-5" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold">{goal.name}</p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                                <Badge variant="outline">{goal.type}</Badge>
                                                                <Calendar className="h-3 w-3" />
                                                                <span>{new Date(goal.endDate).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-right">
                                                            <p className="font-bold">{goal.currentValue} / {goal.targetValue}</p>
                                                            <p className="text-sm text-gray-500">{goal.achievementPercent}%</p>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem className="text-red-600" onClick={() => deleteMutation.mutate(goal.id)}><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                                <div className="w-full mt-2">
                                                    <Progress value={Math.min(goal.achievementPercent, 100)} className="h-2" indicatorClassName={goal.achievementPercent >= 100 ? 'bg-green-500' : 'bg-blue-500'} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
