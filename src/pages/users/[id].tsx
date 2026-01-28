import { useNavigate, useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { getUserById, getUserStats } from "@/services/userService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Mail, Briefcase, BarChart3, Users, CheckCircle2, XCircle, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getLeads } from "@/services/leadService"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "@/pages/leads/columns"

export default function UserProfilePage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const { data: user, isLoading: userLoading } = useQuery({
        queryKey: ['user', id],
        queryFn: () => getUserById(id!)
    })

    const { data: statsData, isLoading: statsLoading } = useQuery({
        queryKey: ['user-stats', id],
        queryFn: () => getUserStats(id!)
    })

    const { data: leadsData, isLoading: leadsLoading } = useQuery({
        queryKey: ['user-leads', id],
        queryFn: () => getLeads({ assignedTo: id }),
        enabled: !!id
    })

    const stats = statsData?.stats;
    const leads = leadsData?.leads || [];

    if (userLoading || statsLoading || leadsLoading) {
        return <div className="p-8 space-y-4"><Skeleton className="h-12 w-1/3" /><Skeleton className="h-64 w-full" /></div>
    }

    if (!user) return <div className="p-8">User not found</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3">
                        {user.firstName} {user.lastName}
                        <Badge variant="outline">{user.role}</Badge>
                    </h1>
                    <div className="flex items-center gap-4 text-muted-foreground mt-1">
                        <div className="flex items-center gap-1"><Mail className="h-4 w-4" /> {user.email}</div>
                        {user.position && <div className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {user.position}</div>}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.totalLeads || 0}</div>
                        <p className="text-xs text-muted-foreground">Currently owned</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
                        <p className="text-xs text-muted-foreground">Leads converted</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Won Leads</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats?.convertedLeads || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lost Leads</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats?.lostLeads || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Sales Performance</CardTitle>
                    <CardDescription>Estimated revenue from closed deals</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-8 w-8 text-green-600" />
                        <span className="text-4xl font-bold">${stats?.totalSalesValue?.toLocaleString() || 0}</span>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Assigned Leads
                </h2>
                <Card>
                    <CardContent className="p-0">
                        <DataTable columns={columns} data={leads} searchKey="email" />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
