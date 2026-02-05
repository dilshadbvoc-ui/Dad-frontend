import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getAccounts } from "@/services/accountService"
import { Button } from "@/components/ui/button"

import { Link } from "react-router-dom"
import {
    Plus,
    Filter,
    Download
} from "lucide-react"

export default function AccountsPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['accounts'],
        queryFn: () => getAccounts(),
        refetchInterval: 5000,
    })

    const accounts = data?.accounts || []

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center flex-1">
                <div className="text-red-500 mb-4">Error loading accounts. Please try again.</div>
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
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Accounts</h1>
                    <p className="text-indigo-300/70 mt-1">Manage your business accounts and customers.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-xl border-indigo-900/50 text-indigo-300 hover:text-white hover:bg-white/5">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl border-indigo-900/50 text-indigo-300 hover:text-white hover:bg-white/5">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                    <Link to="/accounts/new">
                        <Button size="sm" className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 rounded-xl">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Account
                        </Button>
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-12">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-10 w-10 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
                        <p className="text-sm text-indigo-300/70">Loading accounts...</p>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-indigo-900/50 bg-[#1e1b4b] text-white shadow-lg shadow-indigo-950/20 overflow-hidden">
                    <DataTable columns={columns} data={accounts} searchKey="name" />
                </div>
            )}
        </div>
    )
}
