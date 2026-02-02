import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getOpportunities } from "@/services/opportunityService"
import { Button } from "@/components/ui/button"
import { KanbanBoard } from "./KanbanBoard"

import {
    Target,
    Filter,
    Download,
    LayoutList,
    LayoutGrid,
    Users,
    User
} from "lucide-react"

import { useState } from "react"
import { CreateOpportunityDialog } from "@/components/CreateOpportunityDialog"

export default function OpportunitiesPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [viewMode, setViewMode] = useState<'list' | 'board'>('board') // Default to board for better UX
    const [filterMode, setFilterMode] = useState<'all' | 'mine'>('all')

    // Get current user (simple implementation)
    const userInfo = localStorage.getItem('userInfo');
    const currentUser = userInfo ? JSON.parse(userInfo) : null;

    const { data, isLoading, isError } = useQuery({
        queryKey: ['opportunities'],
        queryFn: () => getOpportunities(),
        refetchInterval: 5000,
    })

    const allOpportunities = data?.opportunities || []

    const filteredOpportunities = filterMode === 'mine' && currentUser
        ? allOpportunities.filter((opp: any) => opp.owner?.id === currentUser.id || opp.ownerId === currentUser.id)
        : allOpportunities;

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center flex-1">
                <div className="text-red-500 mb-4">Error loading opportunities. Please try again.</div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Opportunities</h1>
                    <p className="text-gray-500 mt-1">Track your deals and sales pipeline.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterMode('all')}
                            className={`rounded-lg h-8 px-2 text-xs font-medium ${filterMode === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}
                        >
                            <Users className="h-3.5 w-3.5 mr-1.5" />
                            Team
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterMode('mine')}
                            className={`rounded-lg h-8 px-2 text-xs font-medium ${filterMode === 'mine' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100' : 'text-gray-500'}`}
                        >
                            <User className="h-3.5 w-3.5 mr-1.5" />
                            My Deals
                        </Button>
                    </div>

                    <div className="hidden md:flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`rounded-lg h-8 px-2 ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('board')}
                            className={`rounded-lg h-8 px-2 ${viewMode === 'board' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'text-gray-500'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button variant="outline" size="sm" className="rounded-xl hidden sm:flex">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl hidden sm:flex">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button size="sm" onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 rounded-xl">
                        <Target className="mr-2 h-4 w-4" />
                        Create Opportunity
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
                        <p className="text-sm text-gray-500">Loading opportunities...</p>
                    </div>
                </div>
            ) : (
                <div className={viewMode === 'list' ? "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden" : ""}>
                    {viewMode === 'list' ? (
                        <DataTable columns={columns} data={filteredOpportunities} searchKey="name" />
                    ) : (
                        <KanbanBoard opportunities={filteredOpportunities} />
                    )}
                </div>
            )}

            <CreateOpportunityDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
    )
}
