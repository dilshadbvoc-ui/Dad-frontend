import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getFollowUps } from "@/services/followUpService"
import { Calendar, Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function FollowUpsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const { data, isLoading, isError } = useQuery({
        queryKey: ['follow-ups', searchQuery, statusFilter],
        queryFn: () => getFollowUps({ 
            search: searchQuery || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined
        }),
    })

    const followUps = data?.tasks || []
    const totalCount = data?.totalTasks || 0

    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const overdueCount = followUps.filter((task: any) => {
        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate < today && task.status !== 'completed'
    }).length

    const todayCount = followUps.filter((task: any) => {
        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate.getTime() === today.getTime() && task.status !== 'completed'
    }).length

    const upcomingCount = followUps.filter((task: any) => {
        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)
        return dueDate > today && task.status !== 'completed'
    }).length

    if (isError) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-red-500">Error loading follow-ups. Please try again.</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Follow-ups</h1>
                    <p className="text-muted-foreground mt-1">Track and manage all your follow-up tasks and your team's.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Follow-ups</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCount}</div>
                        <p className="text-xs text-muted-foreground">All scheduled follow-ups</p>
                    </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Overdue</CardTitle>
                        <Clock className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{overdueCount}</div>
                        <p className="text-xs text-red-600">Past due date</p>
                    </CardContent>
                </Card>

                <Card className="border-orange-200 bg-orange-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700">Today</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{todayCount}</div>
                        <p className="text-xs text-orange-600">Due today</p>
                    </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700">Upcoming</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-700">{upcomingCount}</div>
                        <p className="text-xs text-blue-600">Future follow-ups</p>
                    </CardContent>
                </Card>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
            ) : (
                <DataTable 
                    columns={columns} 
                    data={followUps} 
                    searchKey="subject"
                />
            )}
        </div>
    )
}
