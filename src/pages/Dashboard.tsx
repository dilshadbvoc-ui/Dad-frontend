import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSalesChartData, getSalesForecast, getLeadSourceAnalytics } from '@/services/analyticsService';
import { AchievementNotification } from '@/components/AchievementNotification';
import { DailyBriefingDialog } from '@/components/DailyBriefingDialog';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { TopPerformersWidget } from '@/components/dashboard/TopPerformersWidget';
import { LicenseUsageWidget } from '@/components/dashboard/LicenseUsageWidget';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Icons } from "@/components/ui/icons";
import { TrendingUp, Check, Trophy, AlertCircle, RefreshCw } from "lucide-react";
import { ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, Area, AreaChart, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";


const COLORS = ['#34d399', '#2dd4bf', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6'];

export default function Dashboard() {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMounted(true);
        }, 0);
        return () => clearTimeout(timer);
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
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Dashboard</h1>
                    <p className="text-indigo-300/70 mt-1">Overview of your sales pipeline and performance.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {/* Expected Revenue */}
                <div className="relative overflow-hidden rounded-3xl bg-[#1e1b4b] p-6 shadow-lg shadow-indigo-950/20 border border-indigo-900/50 transition-all hover:shadow-indigo-900/40 hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-indigo-300/70">Expected Revenue</h3>
                        <div className="text-2xl font-extrabold text-white">
                            {forecastLoading ? <Skeleton className="h-8 w-24 bg-indigo-900/50" /> :
                                new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, notation: 'compact' }).format(forecast?.weightedForecast || 0)
                            }
                        </div>
                    </div>
                </div>

                {/* Deals In Pipeline */}
                <div className="relative overflow-hidden rounded-3xl bg-[#1e1b4b] p-6 shadow-lg shadow-indigo-950/20 border border-indigo-900/50 transition-all hover:shadow-indigo-900/40 hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                            <Check className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-indigo-300/70">Deals In Pipeline</h3>
                        <div className="text-2xl font-extrabold text-white">
                            {statsLoading ? <Skeleton className="h-8 w-16 bg-indigo-900/50" /> : stats?.activeOpportunities}
                        </div>
                    </div>
                </div>

                {/* Won Deals */}
                <div className="relative overflow-hidden rounded-3xl bg-[#1e1b4b] p-6 shadow-lg shadow-indigo-950/20 border border-indigo-900/50 transition-all hover:shadow-indigo-900/40 hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-indigo-300/70">Won: {new Date().toLocaleString('default', { month: 'short' })}</h3>
                        <div className="text-2xl font-extrabold text-white">
                            {statsLoading ? <Skeleton className="h-8 w-16 bg-indigo-900/50" /> : stats?.opportunities?.won || 0}
                        </div>
                    </div>
                </div>

                {/* Lost Deals */}
                <div className="relative overflow-hidden rounded-3xl bg-[#1e1b4b] p-6 shadow-lg shadow-indigo-950/20 border border-indigo-900/50 transition-all hover:shadow-indigo-900/40 hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-indigo-300/70">Lost Deals</h3>
                        <div className="text-2xl font-extrabold text-white">
                            {statsLoading ? <Skeleton className="h-8 w-16 bg-indigo-900/50" /> : stats?.opportunities?.lost || 0}
                        </div>
                    </div>
                </div>

                {/* Conversion */}
                <div className="relative overflow-hidden rounded-3xl bg-[#1e1b4b] p-6 shadow-lg shadow-indigo-950/20 border border-indigo-900/50 transition-all hover:shadow-indigo-900/40 hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400">
                            <RefreshCw className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-indigo-300/70">Conversion %</h3>
                        <div className="text-2xl font-extrabold text-white">
                            {statsLoading ? <Skeleton className="h-8 w-16 bg-indigo-900/50" /> : `${stats?.winRate || 0}%`}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7">
                {/* Sales Chart */}
                <Card className="col-span-4 min-w-0 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Sales Overview</CardTitle>
                        <CardDescription className="text-indigo-300/70">Revenue trend over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        {chartLoading ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Icons.spinner className="h-8 w-8 animate-spin text-green-600" />
                            </div>
                        ) : (
                            <div className="w-full h-[250px] sm:h-[350px]" style={{ minHeight: '250px', width: '100%' }}>
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="name"
                                                stroke="#94a3b8"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="#94a3b8"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value}`}
                                                dx={-10}
                                            />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e1b4b',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                                    boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.3)',
                                                    color: '#fff'
                                                }}
                                                itemStyle={{ color: '#818cf8' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="total"
                                                stroke="#6366f1"
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

                {/* Top Performers Widget - New */}
                <Card className="col-span-3 min-w-0 overflow-hidden">
                    <TopPerformersWidget />
                </Card>

                {/* Lead Sources Pie Chart */}
                <Card className="col-span-3 min-w-0 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-white">Lead Sources</CardTitle>
                        <CardDescription className="text-indigo-300/70">Acquisition channel distribution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sourcesLoading ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Icons.spinner className="h-8 w-8 animate-spin text-green-600" />
                            </div>
                        ) : (
                            <div className="w-full h-[250px] sm:h-[350px]" style={{ minHeight: '250px', width: '100%' }}>
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={leadSources?.map((s: { source: string, count: number }) => ({ name: s.source, value: s.count })) || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={4}
                                                dataKey="value"
                                                stroke="none"
                                            >
                                                {leadSources?.map((_entry: { source: string, count: number }, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e1b4b',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(99, 102, 241, 0.2)',
                                                    boxShadow: '0 4px 20px -2px rgb(0 0 0 / 0.3)',
                                                    color: '#fff'
                                                }}
                                            />
                                            <Legend
                                                verticalAlign="bottom"
                                                height={36}
                                                iconType="circle"
                                                formatter={(value) => <span className="text-sm font-medium text-indigo-300 ml-1">{value}</span>}
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

                {/* Recent Activity - New */}
                <div className="col-span-3">
                    <RecentActivityWidget />
                </div>

                {/* License Usage - New */}
                <div className="col-span-1">
                    <LicenseUsageWidget />
                </div>
            </div>
        </div>
    );
}
