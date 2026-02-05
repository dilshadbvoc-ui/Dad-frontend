import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, TrendingUp, Users, DollarSign, Target, BarChart3, PieChart as PieIcon, Calendar, ArrowUpRight } from "lucide-react"
import { api } from "@/services/api"
import { getUsers } from "@/services/settingsService"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function ReportsPage() {
    const [dateRange] = useState({ start: '', end: '' })

    // --- Leads Report State ---
    const [leadStage, setLeadStage] = useState('all')
    const [leadStatus, setLeadStatus] = useState('all')
    const [leadUser, setLeadUser] = useState('all')

    // --- Sales Book State ---
    const [salesPeriod, setSalesPeriod] = useState('month')

    // Fetch Users for filters
    const { data: usersData } = useQuery({ queryKey: ['users'], queryFn: getUsers })
    const users = usersData?.users || []

    // Fetch Leads Report
    const { data: leadsData, isLoading: leadsLoading } = useQuery({
        queryKey: ['report-leads', leadStage, leadStatus, leadUser, dateRange],
        queryFn: async () => {
            const params: Record<string, string> = {}
            if (leadStage !== 'all') params.stage = leadStage
            if (leadStatus !== 'all') params.status = leadStatus
            if (leadUser !== 'all') params.userId = leadUser
            if (dateRange.start) params.startDate = dateRange.start
            if (dateRange.end) params.endDate = dateRange.end
            const res = await api.get('/reports/leads', { params })
            return res.data
        }
    })

    // Prepare chart data for Leads
    const leadsByStageData = useMemo(() => {
        if (!leadsData?.summary?.byStage) return []
        return Object.entries(leadsData.summary.byStage).map(([name, value]) => ({ name, value }))
    }, [leadsData])

    const leadsByStatusData = useMemo(() => {
        if (!leadsData?.summary?.byStatus) return []
        return Object.entries(leadsData.summary.byStatus).map(([name, value]) => ({ name, value }))
    }, [leadsData])


    // Fetch User Performance
    const { data: performanceData, isLoading: perfLoading } = useQuery({
        queryKey: ['report-performance', dateRange],
        queryFn: async () => {
            const params: Record<string, string> = {}
            if (dateRange.start) params.startDate = dateRange.start
            if (dateRange.end) params.endDate = dateRange.end
            const res = await api.get('/reports/user-performance', { params })
            return res.data
        }
    })

    // Prepare chart for User Performance
    const userPerfChartData = useMemo(() => {
        if (!performanceData?.performance) return []
        return performanceData.performance.map((item: { user: { name: string }, metrics: { leadsAssigned: number, leadsConverted: number } }) => ({
            name: item.user.name.split(' ')[0], // First name only for clearer labels
            assigned: item.metrics.leadsAssigned,
            converted: item.metrics.leadsConverted
        }))
    }, [performanceData])


    // Fetch Sales Book
    const { data: salesData, isLoading: salesLoading } = useQuery({
        queryKey: ['report-sales', salesPeriod],
        queryFn: async () => {
            const res = await api.get('/reports/sales-book', { params: { period: salesPeriod } })
            return res.data
        }
    })

    // Prepare Sales Trend Data (Grouping by date based on period)
    const salesTrendData = useMemo(() => {
        if (!salesData?.sales) return []

        const grouped = salesData.sales.reduce((acc: Record<string, number>, sale: { closedAt: string, amount: number }) => {
            const date = new Date(sale.closedAt).toLocaleDateString()
            acc[date] = (acc[date] || 0) + sale.amount
            return acc
        }, {})

        return Object.entries(grouped)
            .map(([date, amount]) => ({ date, amount }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [salesData])


    const handleExport = (type: string) => {
        window.open(`${api.defaults.baseURL}/reports/export/${type}`, '_blank')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-gray-950 dark:to-slate-900">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                                    Reports & Analytics
                                </h1>
                                <p className="text-slate-600 dark:text-slate-400 mt-2">Comprehensive insights and performance metrics for your business</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 shadow-sm border">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                        {new Date().toLocaleDateString('en-IN', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Tabs defaultValue="leads" className="space-y-6">
                            <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-gray-900 shadow-sm border">
                                <TabsTrigger value="leads" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                                    <Users className="mr-2 h-4 w-4" />
                                    Leads Report
                                </TabsTrigger>
                                <TabsTrigger value="performance" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
                                    <Target className="mr-2 h-4 w-4" />
                                    User Performance
                                </TabsTrigger>
                                <TabsTrigger value="sales" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
                                    <DollarSign className="mr-2 h-4 w-4" />
                                    Sales Book
                                </TabsTrigger>
                            </TabsList>

                            {/* LEADS REPORT TAB */}
                            <TabsContent value="leads" className="space-y-4">
                                {/* Visualizations Row */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/20 dark:to-indigo-900/10 border-blue-200 dark:border-blue-800 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-semibold text-blue-800 dark:text-blue-200 flex items-center gap-2">
                                                <PieIcon className="h-5 w-5" />
                                                Leads by Stage
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={leadsByStageData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={70}
                                                        outerRadius={120}
                                                        fill="#8884d8"
                                                        paddingAngle={3}
                                                        dataKey="value"
                                                    >
                                                        {leadsByStageData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                    />
                                                    <Legend
                                                        verticalAlign="bottom"
                                                        height={36}
                                                        iconType="circle"
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                    <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800 shadow-lg">
                                        <CardHeader>
                                            <CardTitle className="text-lg font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                                                <BarChart3 className="h-5 w-5" />
                                                Leads by Status
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={leadsByStatusData}>
                                                    <defs>
                                                        <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.3} />
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                                    <XAxis
                                                        dataKey="name"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tick={{ fill: '#6b7280' }}
                                                    />
                                                    <YAxis
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tick={{ fill: '#6b7280' }}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                                                        contentStyle={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                            borderRadius: '12px',
                                                            border: 'none',
                                                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                    />
                                                    <Bar
                                                        dataKey="value"
                                                        fill="url(#colorBar)"
                                                        radius={[8, 8, 0, 0]}
                                                        maxBarSize={60}
                                                    />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>Leads Report</CardTitle>
                                                <CardDescription>Filter and analyze leads by stage, status, and user</CardDescription>
                                            </div>
                                            <Button variant="outline" onClick={() => handleExport('leads')}>
                                                <Download className="mr-2 h-4 w-4" /> Export Excel
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Filters */}
                                        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                            <div className="flex flex-col gap-1.5 min-w-[150px]">
                                                <span className="text-xs font-medium text-gray-500">Stage</span>
                                                <Select value={leadStage} onValueChange={setLeadStage}>
                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="All Stages" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Stages</SelectItem>
                                                        <SelectItem value="New">New</SelectItem>
                                                        <SelectItem value="Contacted">Contacted</SelectItem>
                                                        <SelectItem value="Qualified">Qualified</SelectItem>
                                                        <SelectItem value="Proposal">Proposal</SelectItem>
                                                        <SelectItem value="Negotiation">Negotiation</SelectItem>
                                                        <SelectItem value="Won">Won</SelectItem>
                                                        <SelectItem value="Lost">Lost</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1.5 min-w-[150px]">
                                                <span className="text-xs font-medium text-gray-500">Status</span>
                                                <Select value={leadStatus} onValueChange={setLeadStatus}>
                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="All Status" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="new">New</SelectItem>
                                                        <SelectItem value="contacted">Contacted</SelectItem>
                                                        <SelectItem value="qualified">Qualified</SelectItem>
                                                        <SelectItem value="converted">Converted</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex flex-col gap-1.5 min-w-[150px]">
                                                <span className="text-xs font-medium text-gray-500">Assigned User</span>
                                                <Select value={leadUser} onValueChange={setLeadUser}>
                                                    <SelectTrigger className="bg-white"><SelectValue placeholder="All Users" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Users</SelectItem>
                                                        <SelectItem value="unassigned">Unassigned</SelectItem>
                                                        {users.map((u: { id: string, firstName: string, lastName: string }) => (
                                                            <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Table */}
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Name</TableHead>
                                                        <TableHead>Company</TableHead>
                                                        <TableHead>Stage</TableHead>
                                                        <TableHead>Status</TableHead>
                                                        <TableHead>Assigned To</TableHead>
                                                        <TableHead>Created</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {leadsLoading ? (
                                                        <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
                                                    ) : leadsData?.leads?.length === 0 ? (
                                                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No leads found</TableCell></TableRow>
                                                    ) : (
                                                        leadsData?.leads?.map((lead: { id: string, firstName: string, lastName: string, company?: string, stage?: string, status: string, assignedTo?: { firstName: string, lastName: string }, createdAt: string }) => (
                                                            <TableRow key={lead.id}>
                                                                <TableCell className="font-medium">{lead.firstName} {lead.lastName}</TableCell>
                                                                <TableCell>{lead.company || '-'}</TableCell>
                                                                <TableCell>{lead.stage || '-'}</TableCell>
                                                                <TableCell className="capitalize">{lead.status}</TableCell>
                                                                <TableCell>{lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}</TableCell>
                                                                <TableCell>{new Date(lead.createdAt).toLocaleDateString()}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* USER PERFORMANCE TAB */}
                            <TabsContent value="performance" className="space-y-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-sm font-medium">Leads Assigned vs Converted</CardTitle></CardHeader>
                                    <CardContent className="h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={userPerfChartData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip cursor={{ fill: 'transparent' }} />
                                                <Legend />
                                                <Bar dataKey="assigned" name="Assigned" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                                <Bar dataKey="converted" name="Converted" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>User Performance</CardTitle>
                                                <CardDescription>Activity metrics and conversion rates per user</CardDescription>
                                            </div>
                                            <Button variant="outline" onClick={() => handleExport('performance')}>
                                                <Download className="mr-2 h-4 w-4" /> Export Excel
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>User</TableHead>
                                                        <TableHead>Role</TableHead>
                                                        <TableHead className="text-right">Leads Assigned</TableHead>
                                                        <TableHead className="text-right">Converted</TableHead>
                                                        <TableHead className="text-right">Conversion Rate</TableHead>
                                                        <TableHead className="text-right">Calls Made</TableHead>
                                                        <TableHead className="text-right">Meetings Held</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {perfLoading ? (
                                                        <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
                                                    ) : !performanceData?.performance || performanceData.performance.length === 0 ? (
                                                        <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No performance data available</TableCell></TableRow>
                                                    ) : performanceData.performance.map((item: { user: { id: string, name: string, role: string }, metrics: { leadsAssigned: number, leadsConverted: number, conversionRate: number, callsMade: number, meetingsHeld: number } }) => (
                                                        <TableRow key={item.user.id}>
                                                            <TableCell className="font-medium">{item.user.name}</TableCell>
                                                            <TableCell className="capitalize">{item.user.role}</TableCell>
                                                            <TableCell className="text-right">{item.metrics.leadsAssigned}</TableCell>
                                                            <TableCell className="text-right">{item.metrics.leadsConverted}</TableCell>
                                                            <TableCell className="text-right">{item.metrics.conversionRate}%</TableCell>
                                                            <TableCell className="text-right">{item.metrics.callsMade}</TableCell>
                                                            <TableCell className="text-right">{item.metrics.meetingsHeld}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* SALES BOOK TAB */}
                            <TabsContent value="sales" className="space-y-4">
                                <Card>
                                    <CardHeader><CardTitle className="text-sm font-medium">Revenue Trend</CardTitle></CardHeader>
                                    <CardContent className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={salesTrendData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${(value / 1000)}K`} />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} dot={false} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>Sales Book</CardTitle>
                                                <CardDescription>Closed deals and revenue tracking</CardDescription>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select value={salesPeriod} onValueChange={setSalesPeriod}>
                                                    <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="day">Today</SelectItem>
                                                        <SelectItem value="week">This Week</SelectItem>
                                                        <SelectItem value="month">This Month</SelectItem>
                                                        <SelectItem value="year">This Year</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button variant="outline" onClick={() => handleExport('sales')}>
                                                    <Download className="mr-2 h-4 w-4" /> Export Excel
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Sales Summary */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/20 dark:to-emerald-900/10 border-green-200 dark:border-green-800 shadow-lg">
                                                <CardContent className="p-6 flex items-center gap-4">
                                                    <div className="bg-green-500 p-3 rounded-full shadow-lg">
                                                        <DollarSign className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-green-700 dark:text-green-300">Total Revenue</p>
                                                        <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                                                            {formatCurrency(salesData?.summary?.totalValue || 0)}
                                                        </p>
                                                        <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                                                            <ArrowUpRight className="h-3 w-3 mr-1" />
                                                            Closed deals revenue
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/20 dark:to-violet-900/10 border-purple-200 dark:border-purple-800 shadow-lg">
                                                <CardContent className="p-6 flex items-center gap-4">
                                                    <div className="bg-purple-500 p-3 rounded-full shadow-lg">
                                                        <Target className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Deals Closed</p>
                                                        <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                                                            {salesData?.summary?.totalDeals || 0}
                                                        </p>
                                                        <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                                                            <ArrowUpRight className="h-3 w-3 mr-1" />
                                                            Successfully closed
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                            <Card className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/20 dark:to-amber-900/10 border-orange-200 dark:border-orange-800 shadow-lg">
                                                <CardContent className="p-6 flex items-center gap-4">
                                                    <div className="bg-orange-500 p-3 rounded-full shadow-lg">
                                                        <TrendingUp className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Avg Deal Size</p>
                                                        <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                                                            {formatCurrency(salesData?.summary?.averageDealSize || 0)}
                                                        </p>
                                                        <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                                                            <ArrowUpRight className="h-3 w-3 mr-1" />
                                                            Average per deal
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        <div className="rounded-md border">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Deal Name</TableHead>
                                                        <TableHead>Account</TableHead>
                                                        <TableHead>Owner</TableHead>
                                                        <TableHead className="text-right">Amount</TableHead>
                                                        <TableHead className="text-right">Closed Date</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {salesLoading ? (
                                                        <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
                                                    ) : salesData?.sales?.length === 0 ? (
                                                        <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">No sales in this period</TableCell></TableRow>
                                                    ) : (
                                                        salesData?.sales?.map((sale: { id: string, name: string, account: string, owner: string, amount: number, closedAt: string }) => (
                                                            <TableRow key={sale.id}>
                                                                <TableCell className="font-medium">{sale.name}</TableCell>
                                                                <TableCell>{sale.account}</TableCell>
                                                                <TableCell>{sale.owner}</TableCell>
                                                                <TableCell className="text-right font-bold text-green-600">{formatCurrency(sale.amount || 0)}</TableCell>
                                                                <TableCell className="text-right">{new Date(sale.closedAt).toLocaleDateString()}</TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}
