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
                    <Button variant="ghost" size="icon" onClick={() => navigate('/super-admin')} className="text-indigo-300 hover:text-white hover:bg-indigo-800">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-white">{org.name}</h1>
                            <Badge variant={org.status === 'active' ? 'default' : 'secondary'} className={org.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : ''}>
                                {org.status}
                            </Badge>
                            <Badge variant={org.subscription?.status === 'active' ? 'default' : 'outline'} className={org.subscription?.status === 'active' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'text-indigo-300/70 border-indigo-700'}>
                                {org.subscription?.status || 'No subscription'}
                            </Badge>
                        </div>
                        <p className="text-indigo-300/70 mt-1">{org.slug}</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card className="bg-gradient-to-br from-indigo-900/60 to-indigo-800/40 border-indigo-700">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-blue-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.userCount} / {org.userLimit}</p>
                                <p className="text-sm text-indigo-300/70">Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[#1e1b4b] border-indigo-900/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Target className="h-8 w-8 text-green-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.leadCount}</p>
                                <p className="text-sm text-indigo-300/70">Leads</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[#1e1b4b] border-indigo-900/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <UserCheck className="h-8 w-8 text-purple-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.contactCount}</p>
                                <p className="text-sm text-indigo-300/70">Contacts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[#1e1b4b] border-indigo-900/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Building className="h-8 w-8 text-orange-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.accountCount}</p>
                                <p className="text-sm text-indigo-300/70">Accounts</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[#1e1b4b] border-indigo-900/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Briefcase className="h-8 w-8 text-cyan-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{stats.opportunityCount}</p>
                                <p className="text-sm text-indigo-300/70">Opportunities</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-900/40 to-emerald-800/30 border-green-700/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="h-8 w-8 text-green-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    ₹{stats.totalRevenue.toLocaleString('en-IN')}
                                </p>
                                <p className="text-sm text-green-300/70">Total Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Organisation Info */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1 bg-[#1e1b4b] border-indigo-900/50">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Organisation Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {org.contactEmail && (
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-indigo-400" />
                                <span className="text-sm text-indigo-200">{org.contactEmail}</span>
                            </div>
                        )}
                        {org.contactPhone && (
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-indigo-400" />
                                <span className="text-sm text-indigo-200">{org.contactPhone}</span>
                            </div>
                        )}
                        {org.address && (
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-indigo-400" />
                                <span className="text-sm text-indigo-200">{org.address}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-indigo-400" />
                            <span className="text-sm text-indigo-200">Created: {new Date(org.createdAt).toLocaleDateString()}</span>
                        </div>
                        {org.subscription?.plan && (
                            <div className="pt-4 border-t border-indigo-800">
                                <p className="text-sm font-medium text-indigo-300">Subscription Plan</p>
                                <p className="text-lg font-bold text-indigo-400">{org.subscription.plan.name}</p>
                                <p className="text-sm text-indigo-300/70">₹{org.subscription.plan.price}/period</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card className="md:col-span-2 bg-[#1e1b4b] border-indigo-900/50">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Users ({users.length})</CardTitle>
                        <CardDescription className="text-indigo-300/70">All users in this organisation</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-indigo-800 hover:bg-indigo-900/30">
                                    <TableHead className="text-indigo-300">User ID</TableHead>
                                    <TableHead className="text-indigo-300">Name</TableHead>
                                    <TableHead className="text-indigo-300">Email</TableHead>
                                    <TableHead className="text-indigo-300">Role</TableHead>
                                    <TableHead className="text-indigo-300">Position</TableHead>
                                    <TableHead className="text-indigo-300">Joined</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} className="border-indigo-800/50 hover:bg-indigo-900/20">
                                        <TableCell className="font-mono text-sm text-indigo-200">
                                            {user.userId || '-'}
                                        </TableCell>
                                        <TableCell className="font-medium text-white">
                                            {user.firstName} {user.lastName}
                                        </TableCell>
                                        <TableCell className="text-indigo-300/70">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className={user.role === 'admin' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'text-indigo-300/70 border-indigo-700'}>
                                                {user.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-indigo-200">{user.position || '-'}</TableCell>
                                        <TableCell className="text-indigo-300/70">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {users.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-indigo-300/70 py-8">
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
