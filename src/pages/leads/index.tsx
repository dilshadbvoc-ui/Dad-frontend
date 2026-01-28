import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getLeads } from "@/services/leadService"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import {
    Plus,
    Download,
    Filter,
    Users,
    TrendingUp,
    Target,
    Clock,
    X
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/services/api"

export default function LeadsPage() {
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [sourceFilter, setSourceFilter] = useState<string | null>(null)

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ['leads', statusFilter, sourceFilter],
        queryFn: () => getLeads({
            status: statusFilter || undefined,
            source: sourceFilter || undefined
        }),
    })

    // Fetch pending follow-ups count
    const { data: pendingData } = useQuery({
        queryKey: ['pending-followups'],
        queryFn: async () => {
            const response = await api.get('/leads/pending-follow-ups')
            return response.data
        },
    })

    interface Lead {
        id: string;
        status: string;
        firstName: string;
        lastName: string;
        email: string;
        company: string;
        source?: string;
    }

    const leads = data?.leads || []
    const totalLeads = data?.total || leads.length
    const pendingFollowUps = pendingData?.count ?? 0

    const newLeads = leads.filter((l: Lead) => l.status === 'new').length
    const qualifiedLeads = leads.filter((l: Lead) => l.status === 'qualified').length

    const handleExport = async () => {
        try {
            const response = await api.get('/reports/export?type=leads', {
                responseType: 'blob'
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `leads-export-${new Date().toISOString().split('T')[0]}.xlsx`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Export failed:', error)
        }
    }

    const clearFilters = () => {
        setStatusFilter(null)
        setSourceFilter(null)
    }

    const hasActiveFilters = statusFilter || sourceFilter

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center flex-1">
                <div className="h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                    <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Error Loading Leads</h3>
                <p className="text-gray-500 mb-4">Please check your connection and try again.</p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                        Leads
                    </h1>
                    <p className="text-gray-500 mt-1">Manage and track your sales leads</p>
                </div>
                <div className="flex gap-2">
                    {/* Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className={`rounded-xl ${hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}`}>
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                                {hasActiveFilters && <span className="ml-1 h-2 w-2 rounded-full bg-blue-500"></span>}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusFilter('new')}>
                                New {statusFilter === 'new' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('contacted')}>
                                Contacted {statusFilter === 'contacted' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('qualified')}>
                                Qualified {statusFilter === 'qualified' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('nurturing')}>
                                Nurturing {statusFilter === 'nurturing' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('converted')}>
                                Converted {statusFilter === 'converted' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('lost')}>
                                Lost {statusFilter === 'lost' && '✓'}
                            </DropdownMenuItem>
                            {hasActiveFilters && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={clearFilters} className="text-red-500">
                                        <X className="h-4 w-4 mr-2" />
                                        Clear Filters
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Export Button */}
                    <Button variant="outline" size="sm" className="rounded-xl" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>

                    <Link to="/leads/new">
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 rounded-xl">
                            <Plus className="h-4 w-4 mr-2" />
                            New Lead
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800 rounded-xl overflow-hidden p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Total</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{isLoading ? "..." : totalLeads}</p>
                        </div>
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 opacity-50" />
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800 rounded-xl overflow-hidden p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-green-600 dark:text-green-400">New</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{isLoading ? "..." : newLeads}</p>
                        </div>
                        <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400 opacity-50" />
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Qualified</p>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{isLoading ? "..." : qualifiedLeads}</p>
                        </div>
                        <Target className="h-5 w-5 text-purple-600 dark:text-purple-400 opacity-50" />
                    </div>
                </Card>
                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden p-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-orange-600 dark:text-orange-400">Todo</p>
                            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{isLoading ? "..." : pendingFollowUps}</p>
                        </div>
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400 opacity-50" />
                    </div>
                </Card>
            </div>

            {/* Data Table */}
            <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                                <p className="text-sm text-gray-500">Loading leads...</p>
                            </div>
                        </div>
                    ) : (
                        <DataTable
                            columns={columns}
                            data={leads}
                            searchKey="email"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
