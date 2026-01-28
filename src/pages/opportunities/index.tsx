import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getOpportunities } from "@/services/opportunityService"
import { Button } from "@/components/ui/button"


import {
    Target,
    Filter,
    Download
} from "lucide-react"

import { useState } from "react"
import { CreateOpportunityDialog } from "@/components/CreateOpportunityDialog"

export default function OpportunitiesPage() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const { data, isLoading, isError } = useQuery({
        queryKey: ['opportunities'],
        queryFn: () => getOpportunities(),
        refetchInterval: 5000,
    })

    const opportunities = data?.opportunities || []

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
                    <Button variant="outline" size="sm" className="rounded-xl">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl">
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
                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <DataTable columns={columns} data={opportunities} searchKey="name" />
                </div>
            )}

            <CreateOpportunityDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
        </div>
    )
}
