
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api'; // Use configured API client
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import {
    TrendingUp,
    Users,
    DollarSign,
    Target,
    Download,
    Calendar,
    Briefcase,
    ArrowUpRight,
    ArrowDownRight,
    Brain,
    AlertCircle
} from 'lucide-react';


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types matching backend
interface DashboardStats {
    totalLeads: number;
    activeOpportunities: number;
    salesRevenue: number;
    winRate: number;
}

interface SalesDataPoint {
    name: string;
    total: number;
}

interface LeadSourceData {
    source: string;
    count: number;
}

interface TopLead {
    id: string;
    firstName: string;
    lastName: string;
    company: string;
    email: string;
    leadScore: number;
}

// COLORS for Charts
const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444']; // Blue, Green, Yellow, Orange, Red

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState("6m");

    // Fetch API Data
    const { data: stats } = useQuery({
        queryKey: ['analytics-stats'],
        queryFn: async () => (await api.get<DashboardStats>('/analytics/dashboard')).data
    });

    const { data: salesData } = useQuery({
        queryKey: ['analytics-sales'],
        queryFn: async () => (await api.get<SalesDataPoint[]>('/analytics/sales-chart')).data
    });

    const { data: leadSources } = useQuery({
        queryKey: ['analytics-sources'],
        queryFn: async () => (await api.get<LeadSourceData[]>('/analytics/lead-sources')).data
    });

    const { data: topLeads } = useQuery({
        queryKey: ['analytics-topleads'],
        queryFn: async () => (await api.get<TopLead[]>('/analytics/top-leads')).data
    });

    interface Insight {
        type: 'positive' | 'warning' | 'info';
        title: string;
        description: string;
        icon: string;
    }

    const { data: insights } = useQuery({
        queryKey: ['analytics-insights'],
        queryFn: async () => (await api.get<Insight[]>('/analytics/insights')).data
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-8 pb-10">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                                    Advanced Analytics
                                </h1>
                                <p className="text-gray-500 mt-1">Deep insights into your sales performance.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Select value={timeRange} onValueChange={setTimeRange}>
                                    <SelectTrigger className="w-[160px] bg-white dark:bg-gray-900">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        <SelectValue placeholder="Period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1m">Last 30 Days</SelectItem>
                                        <SelectItem value="3m">Last Quarter</SelectItem>
                                        <SelectItem value="6m">Last 6 Months</SelectItem>
                                        <SelectItem value="1y">Year to Date</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button variant="outline" className="bg-white dark:bg-gray-900">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Report
                                </Button>
                            </div>
                        </div>

                        {/* KPI Cards */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/10 border-green-100 dark:border-green-900">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0 pb-2">
                                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue</p>
                                        <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                                        {stats ? formatCurrency(stats.salesRevenue) : '-'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                                        <span className="text-green-600 font-medium">+12%</span> from last month
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0 pb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Active Deals</p>
                                        <Briefcase className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {stats?.activeOpportunities || '-'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Worth {formatCurrency(stats?.activeOpportunities ? stats.activeOpportunities * 5000 : 0)} estimated
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0 pb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Win Rate</p>
                                        <TrendingUp className="h-4 w-4 text-indigo-500" />
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {stats?.winRate || 0}%
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                        <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                                        <span className="text-green-600 font-medium">+2.1%</span> vs industry avg
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between space-y-0 pb-2">
                                        <p className="text-sm font-medium text-muted-foreground">Total Leads</p>
                                        <Users className="h-4 w-4 text-orange-500" />
                                    </div>
                                    <div className="text-2xl font-bold">
                                        {stats?.totalLeads || '-'}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                        <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                                        <span className="text-red-500 font-medium">-4%</span> from last week
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Charts Section */}
                        <div className="grid gap-6 md:grid-cols-7">
                            {/* Revenue Trend - Main Chart */}
                            <Card className="md:col-span-4 lg:col-span-5">
                                <CardHeader>
                                    <CardTitle>Revenue Trend</CardTitle>
                                    <CardDescription>Monthly sales performance over time</CardDescription>
                                </CardHeader>
                                <CardContent className="pl-0">
                                    <div className="h-[350px] w-full min-w-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis
                                                    stroke="#888888"
                                                    fontSize={12}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    tickFormatter={(value) => `₹${value}`}
                                                />
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    formatter={(value: number | undefined) => [`₹${(value || 0)}`, 'Revenue']}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="total"
                                                    stroke="#22c55e"
                                                    strokeWidth={3}
                                                    fillOpacity={1}
                                                    fill="url(#colorTotal)"
                                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Lead Sources - Donut Chart */}
                            <Card className="md:col-span-3 lg:col-span-2">
                                <CardHeader>
                                    <CardTitle>Lead Sources</CardTitle>
                                    <CardDescription>Where are your leads coming from?</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-[300px] w-full min-w-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={leadSources?.map(s => ({ name: s.source, count: s.count }))}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={60}
                                                    outerRadius={90}
                                                    paddingAngle={5}
                                                    dataKey="count"
                                                >
                                                    {leadSources?.map((_entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend
                                                    layout="horizontal"
                                                    verticalAlign="bottom"
                                                    align="center"
                                                    wrapperStyle={{ paddingTop: '20px' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Top Leads Table */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>High Value Opportunities</CardTitle>
                                    <CardDescription>Top leads with highest engagement scores</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        {topLeads?.map((lead) => (
                                            <div key={lead.id} className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {lead.leadScore}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium leading-none">{lead.firstName} {lead.lastName}</p>
                                                        <p className="text-xs text-muted-foreground mt-1">{lead.company}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-medium text-foreground">{formatCurrency(lead.leadScore * 150)}</p>
                                                    <p className="text-xs text-muted-foreground">Est. Value</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                <CardHeader>
                                    <CardTitle className="text-white">AI Insights</CardTitle>
                                    <CardDescription className="text-indigo-100">Smart recommendations based on your data</CardDescription>
                                </CardHeader>
                                <CardContent className="relative z-10 space-y-4">
                                    {insights?.length === 0 && (
                                        <p className="text-sm text-indigo-100/80">Analysing your data...</p>
                                    )}
                                    {insights?.map((insight, index) => {
                                        const icons: Record<string, React.ComponentType<{ className?: string }>> = { Target, TrendingUp, AlertCircle, Brain };
                                        const IconComponent = icons[insight.icon] || Brain;
                                        return (
                                            <div key={index} className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10">
                                                <div className="flex gap-3">
                                                    <IconComponent className={`h-5 w-5 shrink-0 ${insight.type === 'positive' ? 'text-green-300' : insight.type === 'warning' ? 'text-yellow-300' : 'text-indigo-200'}`} />
                                                    <div>
                                                        <h4 className="font-semibold text-sm">{insight.title}</h4>
                                                        <p className="text-xs text-indigo-100 mt-1 leading-relaxed">
                                                            {insight.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <Button variant="secondary" className="w-full mt-2 bg-white text-indigo-600 hover:bg-indigo-50">
                                        Generate Full Report
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
