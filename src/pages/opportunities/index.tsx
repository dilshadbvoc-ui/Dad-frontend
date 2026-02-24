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
        <div className="h-full flex flex-col bg-background/50">
            <div className="flex-none p-6 pb-2">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-foreground">Opportunities</h1>
                    <p className="text-muted-foreground mt-1">Track your deals and sales pipeline.</p>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex gap-2">
                        <div className="flex bg-muted p-1 rounded-xl mr-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilterMode('all')}
                                className={`rounded-lg h-8 px-2 text-xs font-medium transition-all ${filterMode === 'all' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <Users className="h-3.5 w-3.5 mr-1.5" />
                                Team
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setFilterMode('mine')}
                                className={`rounded-lg h-8 px-2 text-xs font-medium transition-all ${filterMode === 'mine' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <User className="h-3.5 w-3.5 mr-1.5" />
                                My Deals
                            </Button>
                        </div>

                        <div className="hidden md:flex bg-muted p-1 rounded-xl mr-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('list')}
                                className={`rounded-lg h-8 px-2 transition-all ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LayoutList className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setViewMode('board')}
                                className={`rounded-lg h-8 px-2 transition-all ${viewMode === 'board' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="rounded-xl hidden sm:flex">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl hidden sm:flex">
                            <Download className="h-4 w-4 mr-2" />
                            Export
                        </Button>
                        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-xl">
                            <Target className="mr-2 h-4 w-4" />
                            Create Opportunity
                        </Button>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="flex-1 flex items-center justify-center p-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                        <p className="text-sm text-muted-foreground">Loading opportunities...</p>
                    </div>
                </div>
            ) : (
                <div className={`flex-1 min-h-0 p-6 pt-2 ${viewMode === 'list' ? 'overflow-auto' : 'overflow-hidden'}`}>
                    <div className={viewMode === 'list' ? "rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden" : "h-full"}>
                        {viewMode === 'list' ? (
                            <DataTable columns={columns} data={filteredOpportunities} searchKey="name" />
                        ) : (
                            <KanbanBoard opportunities={filteredOpportunities} />
                        )}
                    </div>
                </div>
            )}
            <CreateOpportunityDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
    )
}
