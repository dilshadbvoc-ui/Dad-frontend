import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    ArrowLeft,
    Building,
    Users,
    Target,
    Phone,
    Mail,
    MapPin,
    Calendar,
    TrendingUp,
    UserCheck,
    Briefcase
} from 'lucide-react'

interface OrgDetails {
    organisation: {
        id: string
        name: string
        slug: string
        contactEmail?: string
        contactPhone?: string
        address?: string
        status: string
        userLimit: number
        subscription: {
            status: string
            startDate?: string
            endDate?: string
            plan?: { name: string; price: number }
        }
        createdAt: string
    }
    users: Array<{
        id: string
        firstName: string
        lastName: string
        email: string
        role: string
        position?: string
        userId?: string
        createdAt: string
    }>
    stats: {
        userCount: number
        leadCount: number
        contactCount: number
        accountCount: number
        opportunityCount: number
        totalRevenue: number
    }
}

export default function OrganisationDetailPage() {
    const { id } = useParams()
    const navigate = useNavigate()

    const { data, isLoading, error } = useQuery<OrgDetails>({
        queryKey: ['organisation', id],
        queryFn: async () => {
            const userInfo = localStorage.getItem('userInfo')
            const token = userInfo ? JSON.parse(userInfo).token : null
            const res = await api.get(`/organisation/${id}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            })
            return res.data
        },
        enabled: !!id
    })

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-64" />
                <div className="grid gap-4 md:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
                </div>
                <Skeleton className="h-96" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">Failed to load organisation details</p>
                <Button variant="outline" onClick={() => navigate('/super-admin')} className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Super Admin
                </Button>
            </div>
        )
    }

    const { organisation: org, users, stats } = data

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/super-admin')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold">{org.name}</h1>
                            <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>
                                {org.status}
                            </Badge>
                            <Badge variant={org.subscription?.status === 'active' ? 'default' : 'outline'}>
                                {org.subscription?.status || 'No subscription'}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1">{org.slug}</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.userCount} / {org.userLimit}</p>
                                <p className="text-sm text-muted-foreground">Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Target className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.leadCount}</p>
                                <p className="text-sm text-muted-foreground">Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <UserCheck className="h-8 w-8 text-purple-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.contactCount}</p>
                                <p className="text-sm text-muted-foreground">Contacts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Building className="h-8 w-8 text-orange-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.accountCount}</p>
                                <p className="text-sm text-muted-foreground">Accounts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Briefcase className="h-8 w-8 text-cyan-600" />
                            <div>
                                <p className="text-2xl font-bold">{stats.opportunityCount}</p>
                                <p className="text-sm text-muted-foreground">Opportunities</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-green-600" />
                            <div>
                                <p className="text-2xl font-bold">
                                    ₹{stats.totalRevenue.toLocaleString('en-IN')}
                                </p>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Organisation Info */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Organisation Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {org.contactEmail && (
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{org.contactEmail}</span>
                            </div>
                        )}
                        {org.contactPhone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{org.contactPhone}</span>
                            </div>
                        )}
                        {org.address && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{org.address}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                        </div>
                        {org.subscription?.plan && (
                            <div className="pt-4 border-t">
                                <p className="text-sm font-medium">Subscription Plan</p>
                                <p className="text-lg font-bold text-primary">{org.subscription.plan.name}</p>
                                <p className="text-sm text-muted-foreground">₹{org.subscription.plan.price}/period</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Users ({users.length})</CardTitle>
                        <CardDescription>All users in this organisation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Position</TableHead>
                                    <TableHead>Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-mono text-sm">
                                            {user.userId || '-'}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {user.firstName} {user.lastName}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{user.position || '-'}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
