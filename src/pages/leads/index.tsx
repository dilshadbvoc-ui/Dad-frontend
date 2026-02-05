import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getLeads, type Lead } from "@/services/leadService"
import { getSalesForecast } from "@/services/analyticsService"
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
    X,
    BadgeDollarSign
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

    const { data, isLoading, isError } = useQuery({
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

    // Fetch pipeline forecast
    const { data: forecast, isLoading: forecastLoading } = useQuery({
        queryKey: ['forecast'],
        queryFn: getSalesForecast
    })


    const leads = data?.leads || []
    const totalLeads = data?.total || leads.length
    const pendingFollowUps = pendingData?.count ?? 0
    const totalPipeline = forecast?.totalPipeline || 0

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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                        Leads
                    </h1>
                    <p className="text-indigo-300/70 mt-1">Manage and track your sales leads</p>
                </div>
                <div className="flex gap-2">
                    {/* Filter Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className={`rounded-xl border-indigo-900/50 text-indigo-300 hover:text-white hover:bg-white/5 ${hasActiveFilters ? 'border-indigo-500 text-indigo-400' : ''}`}>
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                                {hasActiveFilters && <span className="ml-1 h-2 w-2 rounded-full bg-indigo-500"></span>}
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
                    <Button variant="outline" size="sm" className="rounded-xl border-indigo-900/50 text-indigo-300 hover:text-white hover:bg-white/5" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>

                    <Link to="/leads/new">
                        <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl">
                            <Plus className="h-4 w-4 mr-2" />
                            New Lead
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="p-4 transition-all hover:shadow-indigo-900/20 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-indigo-300/70">Total Leads</p>
                            <p className="text-2xl font-bold text-white">{isLoading ? "..." : totalLeads}</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-indigo-400" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 transition-all hover:shadow-indigo-900/20 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-indigo-300/70">New Leads</p>
                            <p className="text-2xl font-bold text-white">{isLoading ? "..." : newLeads}</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-indigo-400" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 transition-all hover:shadow-indigo-900/20 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-indigo-300/70">Qualified</p>
                            <p className="text-2xl font-bold text-white">{isLoading ? "..." : qualifiedLeads}</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <Target className="h-5 w-5 text-indigo-400" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 transition-all hover:shadow-indigo-900/20 hover:-translate-y-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-indigo-300/70">Follow-ups</p>
                            <p className="text-2xl font-bold text-white">{isLoading ? "..." : pendingFollowUps}</p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-indigo-400" />
                        </div>
                    </div>
                </Card>
                <Card className="p-4 transition-all hover:shadow-indigo-900/20 hover:-translate-y-1 border-indigo-500/30 bg-indigo-500/5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-indigo-300/70">Total Pipeline</p>
                            <p className="text-2xl font-bold text-white">
                                {forecastLoading ? "..." : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact' }).format(totalPipeline)}
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <BadgeDollarSign className="h-5 w-5 text-emerald-400" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Data Table */}
            <Card className="rounded-xl shadow-sm overflow-hidden">
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                                <p className="text-sm text-indigo-300/70">Loading leads...</p>
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
