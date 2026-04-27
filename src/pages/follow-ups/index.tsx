import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams, useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getFollowUps } from "@/services/followUpService"
import { Calendar, Clock, ListFilter, ArrowUpDown } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isToday } from "date-fns"

export default function FollowUpsPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const filterParam = searchParams.get('filter') // overdue, today, upcoming

    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [sortBy, setSortBy] = useState<string>("dueDate-asc")

    const { data, isLoading, isError } = useQuery({
        queryKey: ['follow-ups', searchQuery, statusFilter],
        queryFn: () => getFollowUps({
            search: searchQuery || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            limit: 1000
        }),
    })

    const followUps = data?.tasks || []
    const activeCount = followUps.filter((task: any) => task.status !== 'completed').length

    const filteredFollowUps = useMemo(() => {
        let result = filterParam ? followUps.filter((task: any) => {
            const dueDate = new Date(task.dueDate)
            dueDate.setHours(0, 0, 0, 0)

            switch (filterParam) {
                case 'overdue':
                    return new Date(task.dueDate) < new Date() && task.status !== 'completed'
                case 'today':
                    return isToday(new Date(task.dueDate)) && task.status !== 'completed'
                case 'upcoming':
                    return new Date(task.dueDate) > new Date() && !isToday(new Date(task.dueDate)) && task.status !== 'completed'
                default:
                    return true
            }
        }) : (statusFilter === 'all' ? followUps.filter((task: any) => task.status !== 'completed') : [...followUps])

        // Apply Sorting
        const [field, direction] = sortBy.split('-')
        result.sort((a: any, b: any) => {
            let valA = a[field]
            let valB = b[field]

            // Handle date objects
            if (field === 'dueDate') {
                valA = new Date(valA).getTime()
                valB = new Date(valB).getTime()
            }

            if (valA < valB) return direction === 'asc' ? -1 : 1
            if (valA > valB) return direction === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [followUps, filterParam, today, sortBy, statusFilter])

    const overdueCount = followUps.filter((task: any) => {
        return new Date(task.dueDate) < new Date() && task.status !== 'completed'
    }).length
    
    const todayCount = followUps.filter((task: any) => {
        return isToday(new Date(task.dueDate)) && task.status !== 'completed'
    }).length

    const upcomingCount = followUps.filter((task: any) => {
        return new Date(task.dueDate) > new Date() && !isToday(new Date(task.dueDate)) && task.status !== 'completed'
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
                <Card 
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 active:scale-95",
                        !filterParam && "ring-2 ring-primary bg-primary/5"
                    )}
                    onClick={() => navigate('/follow-ups')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Follow-ups</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeCount}</div>
                        <p className="text-xs text-muted-foreground">All pending follow-ups</p>
                    </CardContent>
                </Card>

                <Card 
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 active:scale-95 border-red-200 bg-red-50/50",
                        filterParam === 'overdue' && "ring-2 ring-red-500 bg-red-100/50"
                    )}
                    onClick={() => navigate('/follow-ups?filter=overdue')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-red-700">Overdue</CardTitle>
                        <Clock className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-700">{overdueCount}</div>
                        <p className="text-xs text-red-600">Past due date</p>
                    </CardContent>
                </Card>

                <Card 
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 active:scale-95 border-orange-200 bg-orange-50/50",
                        filterParam === 'today' && "ring-2 ring-orange-500 bg-orange-100/50"
                    )}
                    onClick={() => navigate('/follow-ups?filter=today')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700">Today</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-700">{todayCount}</div>
                        <p className="text-xs text-orange-600">Due today</p>
                    </CardContent>
                </Card>

                <Card 
                    className={cn(
                        "cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 active:scale-95 border-blue-200 bg-blue-50/50",
                        filterParam === 'upcoming' && "ring-2 ring-blue-500 bg-blue-100/50"
                    )}
                    onClick={() => navigate('/follow-ups?filter=upcoming')}
                >
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

            {/* Filters and Sorting */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <ListFilter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Sort & Filter</span>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger className="w-full sm:w-[180px] h-9 shadow-sm">
                            <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="dueDate-asc">Due Date (Earliest)</SelectItem>
                            <SelectItem value="dueDate-desc">Due Date (Latest)</SelectItem>
                            <SelectItem value="priority-desc">Priority (High to Low)</SelectItem>
                            <SelectItem value="status-asc">Status (A-Z)</SelectItem>
                            <SelectItem value="subject-asc">Subject (A-Z)</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[150px] h-9 shadow-sm">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="deferred">Deferred</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
                </div>
            ) : (
                <DataTable
                    columns={columns}
                    data={filteredFollowUps}
                    searchKeys={["subject", "description", "status", "priority"]}
                    initialPageSize={100}
                />
            )}
        </div>
    )
}
