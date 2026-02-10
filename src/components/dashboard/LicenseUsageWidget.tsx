import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function LicenseUsageWidget() {
    const { data: org, isLoading } = useQuery({
        queryKey: ['organisation-details'],
        queryFn: async () => {
            const res = await api.get('/organisation')
            return res.data
        }
    })

    const userLimit = org?.userLimit || 5
    const userCount = org?.userCount || 0
    const usagePercent = Math.min(100, Math.round((userCount / userLimit) * 100))

    return (
        <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1">
            <div className="flex flex-col items-center justify-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-bold text-muted-foreground">License Usage</h3>
                <div className="text-2xl font-extrabold text-card-foreground">
                    {isLoading ? <Skeleton className="h-8 w-16" /> : `${userCount} / ${userLimit}`}
                </div>
                <div className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {usagePercent}% Used
                </div>
            </div>
        </div>
    )
}
