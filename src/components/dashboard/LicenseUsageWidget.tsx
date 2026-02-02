import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Loader2, Users } from "lucide-react"

export function LicenseUsageWidget() {
    const { data: org, isLoading } = useQuery({
        queryKey: ['organisation-details'],
        queryFn: async () => {
            const res = await api.get('/organisation') // Reusing existing endpoint
            return res.data
        }
    })

    if (isLoading) return <Card className="h-[200px] flex items-center justify-center"><Loader2 className="animate-spin" /></Card>

    // Endpoint now returns userCount (calculated from active users)
    const userLimit = org?.userLimit || 5
    const userCount = org?.userCount || 0

    const usagePercent = Math.min(100, Math.round((userCount / userLimit) * 100))

    return (
        <Card className="rounded-3xl bg-slate-900 text-white shadow-lg border-0">
            <CardHeader>
                <CardTitle className="text-lg font-medium text-slate-200 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    License Usage
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <p className="text-3xl font-bold">{userCount} <span className="text-lg text-slate-400 font-normal">/ {userLimit}</span></p>
                            <p className="text-xs text-slate-400 mt-1">Active Users</p>
                        </div>
                        <div className="text-right">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${usagePercent >= 90 ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'
                                }`}>
                                {usagePercent}% Used
                            </span>
                        </div>
                    </div>
                    <Progress value={usagePercent} className="h-2 bg-slate-800" indicatorClassName={
                        usagePercent >= 90 ? 'bg-red-500' : 'bg-blue-500'
                    } />
                    <p className="text-xs text-slate-500">
                        Map more users to improve collaboration.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}
