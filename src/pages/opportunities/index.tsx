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
        ? allOpportunities.filter((opp: { owner?: { id: string }, ownerId?: string }) => opp.owner?.id === currentUser.id || opp.ownerId === currentUser.id)
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Opportunities</h1>
                    <p className="text-indigo-300/70 mt-1">Track your deals and sales pipeline.</p>
                </div>
                <div className="flex gap-2">
                    <div className="flex bg-[#1e1b4b] border border-indigo-900/50 p-1 rounded-xl mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterMode('all')}
                            className={`rounded-lg h-8 px-2 text-xs font-medium transition-all ${filterMode === 'all' ? 'bg-indigo-500/20 text-indigo-100' : 'text-indigo-300/60 hover:text-indigo-200'}`}
                        >
                            <Users className="h-3.5 w-3.5 mr-1.5" />
                            Team
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFilterMode('mine')}
                            className={`rounded-lg h-8 px-2 text-xs font-medium transition-all ${filterMode === 'mine' ? 'bg-indigo-500/20 text-indigo-100' : 'text-indigo-300/60 hover:text-indigo-200'}`}
                        >
                            <User className="h-3.5 w-3.5 mr-1.5" />
                            My Deals
                        </Button>
                    </div>

                    <div className="hidden md:flex bg-[#1e1b4b] border border-indigo-900/50 p-1 rounded-xl mr-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={`rounded-lg h-8 px-2 transition-all ${viewMode === 'list' ? 'bg-indigo-500/20 text-indigo-100' : 'text-indigo-300/60 hover:text-indigo-200'}`}
                        >
                            <LayoutList className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('board')}
                            className={`rounded-lg h-8 px-2 transition-all ${viewMode === 'board' ? 'bg-indigo-500/20 text-indigo-100' : 'text-indigo-300/60 hover:text-indigo-200'}`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>

                    <Button variant="outline" size="sm" className="rounded-xl hidden sm:flex border-indigo-900/50 text-indigo-300 hover:text-white hover:bg-white/5">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl hidden sm:flex border-indigo-900/50 text-indigo-300 hover:text-white hover:bg-white/5">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Button size="sm" onClick={() => setIsCreateOpen(true)} className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl">
                        <Target className="mr-2 h-4 w-4" />
                        Create Opportunity
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                        <p className="text-sm text-indigo-300/70">Loading opportunities...</p>
                    </div>
                </div>
            ) : (
                <div className={viewMode === 'list' ? "rounded-xl border border-indigo-900/50 bg-[#1e1b4b] text-white shadow-lg shadow-indigo-950/20 overflow-hidden" : ""}>
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
