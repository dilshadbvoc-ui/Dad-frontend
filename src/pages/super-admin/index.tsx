import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Building,
    CreditCard,
    Shield,
    Search,
    MoreHorizontal
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { CreateOrganisationDialog } from '@/components/super-admin/CreateOrganisationDialog';
import { PlansManagement } from '@/components/super-admin/PlansManagement';

export default function SuperAdminDashboard() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState('');

    // Fetch Stats
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['super-admin-stats'],
        queryFn: async () => {
            const res = await api.get('/super-admin/stats');
            return res.data.overview;
        }
    });

    // Fetch Organisations
    const { data: organisations, isLoading: orgsLoading } = useQuery({
        queryKey: ['organisations'],
        queryFn: async () => {
            const res = await api.get('/super-admin/organisations');
            return res.data.organisations;
        }
    });

    // Suspend/Restore Mutation
    const toggleStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            // endpoint depends on action
            if (status === 'suspended') {
                // Restore
                await api.post(`/super-admin/organisations/${id}/restore`);
            } else {
                // Suspend
                await api.post(`/super-admin/organisations/${id}/suspend`);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organisations'] });
            toast.success('Organisation status updated');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Failed to update status');
        }
    });

    const filteredOrgs = organisations?.filter((org: any) =>
        org.name.toLowerCase().includes(search.toLowerCase()) ||
        org.slug.toLowerCase().includes(search.toLowerCase()) ||
        org.contactEmail?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 bg-[#0f172a] min-h-screen">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Super Admin Dashboard</h1>
                    <p className="text-slate-400 mt-1">Platform overview and management</p>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-[#1e1b4b] border border-indigo-900/50">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">Overview</TabsTrigger>
                    <TabsTrigger value="plans" className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-slate-400">License Plans</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-8">
                    {/* Actions Bar for Overview */}
                    <div className="flex justify-end">
                        <CreateOrganisationDialog />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-[#1e1b4b] border-indigo-900/50 hover:border-indigo-700/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-200">
                                    Total Organisations
                                </CardTitle>
                                <Building className="h-4 w-4 text-indigo-400" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? <Skeleton className="h-8 w-20 bg-indigo-900/20" /> : (
                                    <>
                                        <div className="text-2xl font-bold text-white">{stats?.totalOrganisations}</div>
                                        <p className="text-xs text-slate-400">
                                            {stats?.activeOrganisations} active, {stats?.suspendedOrganisations} suspended
                                        </p>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1e1b4b] border-indigo-900/50 hover:border-indigo-700/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-200">
                                    Total Users
                                </CardTitle>
                                <Users className="h-4 w-4 text-blue-400" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? <Skeleton className="h-8 w-20 bg-indigo-900/20" /> : (
                                    <div className="text-2xl font-bold text-white">{stats?.totalUsers}</div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1e1b4b] border-indigo-900/50 hover:border-indigo-700/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-200">
                                    Active Licenses
                                </CardTitle>
                                <Shield className="h-4 w-4 text-emerald-400" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? <Skeleton className="h-8 w-20 bg-indigo-900/20" /> : (
                                    <div className="text-2xl font-bold text-white">{stats?.activeLicenses}</div>
                                )}
                            </CardContent>
                        </Card>
                        <Card className="bg-[#1e1b4b] border-indigo-900/50 hover:border-indigo-700/50 transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-slate-200">
                                    Total Revenue
                                </CardTitle>
                                <CreditCard className="h-4 w-4 text-purple-400" />
                            </CardHeader>
                            <CardContent>
                                {statsLoading ? <Skeleton className="h-8 w-20 bg-indigo-900/20" /> : (
                                    <div className="text-2xl font-bold text-white">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(stats?.totalRevenue || 0)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Organisations List */}
                    <Card className="bg-[#1e1b4b] border-indigo-900/50">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-white">Organisations</CardTitle>
                                    <CardDescription className="text-slate-400">Manage platform tenants</CardDescription>
                                </div>
                                <div className="relative w-64">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Search organisations..."
                                        className="pl-8 bg-[#0f172a] border-indigo-900/50 text-white placeholder:text-slate-500"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-indigo-800 hover:bg-indigo-900/30">
                                        <TableHead className="text-slate-300">Name</TableHead>
                                        <TableHead className="text-slate-300">Slug</TableHead>
                                        <TableHead className="text-slate-300">Plan</TableHead>
                                        <TableHead className="text-slate-300">Status</TableHead>
                                        <TableHead className="text-slate-300">Users</TableHead>
                                        <TableHead className="text-slate-300">Created</TableHead>
                                        <TableHead className="text-right text-slate-300">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orgsLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                                                Loading organisations...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredOrgs?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                                                No organisations found.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredOrgs?.map((org: any) => (
                                            <TableRow key={org.id} className="border-indigo-800/50 hover:bg-indigo-900/20">
                                                <TableCell className="font-medium text-white">{org.name}</TableCell>
                                                <TableCell className="text-slate-400">{org.slug}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="border-indigo-700 text-indigo-300">
                                                        {org.subscription?.plan?.name || 'Trial'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={org.status === 'active' ? 'default' : 'destructive'}
                                                        className={org.status === 'active'
                                                            ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/30'
                                                            : 'bg-red-500/20 text-red-300 hover:bg-red-500/30 border-red-500/30'}
                                                    >
                                                        {org.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-slate-300">{org.userCount || 0}</TableCell>
                                                <TableCell className="text-slate-400">
                                                    {new Date(org.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                                                <span className="sr-only">Open menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="bg-[#1e1b4b] border-indigo-800 text-slate-200">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuItem
                                                                onClick={() => navigate(`/super-admin/organisation/${org.id}`)}
                                                                className="hover:bg-indigo-800 focus:bg-indigo-800 cursor-pointer"
                                                            >
                                                                View Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator className="bg-indigo-800" />
                                                            {org.status === 'active' ? (
                                                                <DropdownMenuItem
                                                                    onClick={() => toggleStatusMutation.mutate({ id: org.id, status: 'active' })}
                                                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30 focus:bg-red-900/30 cursor-pointer"
                                                                >
                                                                    Suspend Organisation
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    onClick={() => toggleStatusMutation.mutate({ id: org.id, status: 'suspended' })}
                                                                    className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-900/30 focus:bg-emerald-900/30 cursor-pointer"
                                                                >
                                                                    Restore Organisation
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="plans">
                    <PlansManagement />
                </TabsContent>
            </Tabs>
        </div>
    );
}
