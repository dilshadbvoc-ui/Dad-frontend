import { useQuery } from "@tanstack/react-query"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { getContacts } from "@/services/contactService"
import { Button } from "@/components/ui/button"
import { LoadingCard } from "@/components/ui/loading-spinner"

import { Link } from "react-router-dom"
import {
    Plus,
    Filter,
    Download
} from "lucide-react"

export default function ContactsPage() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['contacts'],
        queryFn: () => getContacts(),
        refetchInterval: 5000,
    })

    const contacts = (data?.contacts || []).filter((c: any) => c && typeof c === 'object');

    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center flex-1">
                <div className="text-red-500 mb-4">Error loading contacts. Please try again.</div>
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
                    <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
                    <p className="text-muted-foreground mt-1">Manage your contacts and people.</p>
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
                    <Link to="/contacts/new">
                        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 rounded-xl">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Contact
                        </Button>
                    </Link>
                </div>
            </div>

            {isLoading ? (
                <LoadingCard text="Loading contacts..." className="m-6" />
            ) : (
                <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <DataTable columns={columns} data={contacts} searchKey="firstName" />
                </div>
            )}
        </div>
    )
}
