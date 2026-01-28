import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSalesChartData, getSalesForecast, getLeadSourceAnalytics } from '@/services/analyticsService';
import { AchievementNotification } from '@/components/AchievementNotification';
import { DailyBriefingDialog } from '@/components/DailyBriefingDialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, Area, AreaChart, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";


const COLORS = ['#0ea5e9', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

export default function Dashboard() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['dashboardStats'], queryFn: getDashboardStats });
    const { data: salesData, isLoading: chartLoading } = useQuery({ queryKey: ['salesChart'], queryFn: getSalesChartData });

    const { data: forecast, isLoading: forecastLoading } = useQuery({ queryKey: ['forecast'], queryFn: getSalesForecast });
    const { data: leadSources, isLoading: sourcesLoading } = useQuery({ queryKey: ['leadSources'], queryFn: getLeadSourceAnalytics });


    return (
        <div className="space-y-8">
            {/* Daily Briefing & Achievement Notification */}
            <DailyBriefingDialog />
            <AchievementNotification />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-gradient-ocean">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your sales pipeline and performance.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="stat-card-ocean group">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">Total Leads</h3>
                        <Icons.user className="h-5 w-5 text-sky-500" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.totalLeads}
                        </div>
                        <p className="text-xs text-sky-600 dark:text-sky-400 mt-1 font-medium">Total active leads</p>
                    </div>
                </div>

                <div className="stat-card-ocean group">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">Active Opportunities</h3>
                        <Icons.check className="h-5 w-5 text-cyan-500" />
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.activeOpportunities}
                        </div>
                        <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1 font-medium">Open deals in pipeline</p>
                    </div>
                </div>

                <div className="stat-card-ocean group">
                    <div className="flex flex-row items-center justify-between pb-2">
                        <h3 className="text-sm font-medium text-muted-foreground group-hover:text-sky-700 dark:group-hover:text-sky-300 transition-colors">Sales Revenue</h3>
                        <span className="text-blue-500 font-bold text-lg">₹</span>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                            {statsLoading ? <Skeleton className="h-8 w-24" /> :
                                new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(stats?.salesRevenue || 0)
                            }
                        </div>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">Total closed won</p>
                    </div>
                </div>

                <div className="stat-card-ocean group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Icons.calendar className="h-24 w-24 text-sky-600" />
                    </div>
                    <div className="flex flex-row items-center justify-between pb-2 relative z-10">
                        <h3 className="text-sm font-medium text-sky-900 dark:text-sky-100">Weighted Forecast</h3>
                        <Icons.trendingUp className="h-5 w-5 text-sky-700 dark:text-sky-300" />
                    </div>
                    <div className="relative z-10">
                        <div className="text-3xl font-bold text-sky-900 dark:text-white">
                            {forecastLoading ? <Skeleton className="h-8 w-24 bg-sky-200/50" /> :
                                new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(forecast?.weightedForecast || 0)
                            }
                        </div>
                        <p className="text-xs text-sky-800 dark:text-sky-200 mt-1 font-medium">
                            Pipeline: {forecastLoading ? '...' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', notation: 'compact' }).format(forecast?.totalPipeline || 0)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Sales Chart */}
                <Card className="col-span-4 card-ocean border-0 shadow-lg min-w-0">
                    <CardHeader>
                        <CardTitle className="text-xl">Sales Overview</CardTitle>
                        <CardDescription>Revenue trend over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        {chartLoading ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Icons.spinner className="h-8 w-8 animate-spin text-sky-500" />
                            </div>
                        ) : (
                            <div className="w-full h-[350px]" style={{ minHeight: '350px', width: '100%' }}>
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="name"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value}`}
                                                dx={-10}
                                            />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                }}
                                                itemStyle={{ color: '#0284c7' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="total"
                                                stroke="#0ea5e9"
                                                strokeWidth={3}
                                                fillOpacity={1}
                                                fill="url(#colorTotal)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Lead Sources Pie Chart */}
                <Card className="col-span-3 card-ocean border-0 shadow-lg min-w-0">
                    <CardHeader>
                        <CardTitle className="text-xl">Lead Sources</CardTitle>
                        <CardDescription>Acquisition channel distribution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sourcesLoading ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Icons.spinner className="h-8 w-8 animate-spin text-sky-500" />
                            </div>
                        ) : (
                            <div className="w-full h-[350px]" style={{ minHeight: '350px', width: '100%' }}>
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={leadSources?.map((s: any) => ({ name: s.source, value: s.count })) || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {leadSources?.map((_entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="circle"
                                                formatter={(value) => <span className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                )}
                                {(!leadSources || leadSources.length === 0) && (
                                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm pointer-events-none">
                                        No data available
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
