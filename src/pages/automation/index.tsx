import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { getWorkflows, updateWorkflow, deleteWorkflow, type Workflow } from "@/services/workflowService"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Plus,
    Search,
    MoreVertical,
    Edit,
    Trash2,
    Zap,
    TrendingUp,
    Mail
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AutomationPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['workflows', searchQuery],
        queryFn: () => getWorkflows({}),
    })

    const workflows = data?.workflows || []

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => updateWorkflow(id, { isActive }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    })

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteWorkflow(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workflows'] }),
    })

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this automation?")) return
        deleteMutation.mutate(id)
    }

    const handleToggle = (id: string, currentStatus: boolean) => {
        toggleMutation.mutate({ id, isActive: !currentStatus })
    }

    const activeWorkflowsCount = workflows.filter((w: Workflow) => w.isActive).length
    const totalExecutions = workflows.reduce((acc: number, curr: Workflow) => acc + (curr.executionCount || 0), 0)


    return (
        <div className="space-y-6">
            {/* Header */}
            < div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" >
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Automation
                    </h1>
                    <p className="text-gray-500 mt-1">Automate your sales and marketing processes</p>
                </div>
                <div className="flex gap-2">
                    <Link to="/automation/new">
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Automation
                        </Button>
                    </Link>
                </div>
            </div >

            {/* Stats */}
            < div className="grid gap-4 md:grid-cols-4" >
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/50 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activeWorkflowsCount}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">Active Automations</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/50 border-green-200 dark:border-green-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalExecutions}</p>
                            <p className="text-xs text-green-600 dark:text-green-400">Total Executions</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/50 border-purple-200 dark:border-purple-800 opacity-70">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">-</p>
                            <p className="text-xs text-purple-600 dark:text-purple-400">Emails Sent</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/50 dark:to-orange-900/50 border-orange-200 dark:border-orange-800 opacity-70">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">-</p>
                            <p className="text-xs text-orange-600 dark:text-orange-400">Avg. Conversion</p>
                        </div>
                    </CardContent>
                </Card>
            </div >

            {/* Workflows List */}
            < Card >
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Event Triggers</CardTitle>
                            <CardDescription>Automated actions triggered by CRM events</CardDescription>
                        </div>
                        <Link to="/automation/new">
                            <Button size="sm">
                                <Plus className="h-4 w-4 mr-2" />
                                New Trigger
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search workflows..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                    ) : workflows.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Zap className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No active triggers found.</p>
                            <Link to="/automation/new">
                                <Button variant="link">Create your first trigger</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {workflows.map((trigger: Workflow) => (
                                <div
                                    key={trigger.id}
                                    className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${trigger.isActive
                                            ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                                            : 'bg-gray-300 dark:bg-gray-700'
                                            }`}>
                                            <Zap className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold">{trigger.name}</p>
                                                <Badge variant={trigger.isActive ? 'default' : 'secondary'}>
                                                    {trigger.isActive ? 'Active' : 'Paused'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                                <Badge variant="outline" className="text-xs">
                                                    {trigger.triggerEntity}.{trigger.triggerEvent}
                                                </Badge>
                                                <span>{trigger.actions?.length || 0} actions</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <p className="text-sm font-medium">{trigger.executionCount?.toLocaleString() || 0}</p>
                                            <p className="text-xs text-gray-500">executions</p>
                                        </div>
                                        <Switch
                                            checked={trigger.isActive}
                                            onCheckedChange={() => handleToggle(trigger.id, trigger.isActive)}
                                        />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <Link to={`/automation/${trigger.id}`}>
                                                    <DropdownMenuItem>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                </Link>
                                                <DropdownMenuItem
                                                    className="text-red-600 cursor-pointer"
                                                    onClick={() => handleDelete(trigger.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card >
        </div >
    )
}
