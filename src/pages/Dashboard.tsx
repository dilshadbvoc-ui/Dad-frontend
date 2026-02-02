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
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Overview of your sales pipeline and performance.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
                {/* Expected Revenue - Light Blue */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#DCFCE7] to-[#dcfce7]/50 p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16a34a] text-white shadow-lg shadow-green-900/10">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-600">Expected Revenue:</h3>
                        <div className="text-2xl font-extrabold text-[#166534]">
                            {forecastLoading ? <Skeleton className="h-8 w-24" /> :
                                new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, notation: 'compact' }).format(forecast?.weightedForecast || 0)
                            }
                        </div>
                    </div>
                </div>

                {/* Deals In Pipeline - Blue */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#DBEAFE] to-[#dbeafe]/50 p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#3b82f6] text-white shadow-lg shadow-blue-900/10">
                            <Check className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-600">Deals In Pipeline</h3>
                        <div className="text-2xl font-extrabold text-[#1e40af]">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.activeOpportunities}
                        </div>
                    </div>
                </div>

                {/* Won Deals - Green */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#ecfccb] to-[#ecfccb]/50 p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#84cc16] text-white shadow-lg shadow-lime-900/10">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-600">Won Deals : {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}</h3>
                        <div className="text-2xl font-extrabold text-[#3f6212]">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.opportunities?.won || 0}
                        </div>
                    </div>
                </div>

                {/* Lost Deals - Orange */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#ffedd5] to-[#ffedd5]/50 p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f97316] text-white shadow-lg shadow-orange-900/10">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-600">Lost Deals Count</h3>
                        <div className="text-2xl font-extrabold text-[#9a3412]">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.opportunities?.lost || 0}
                        </div>
                    </div>
                </div>

                {/* Conversion - Teal */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#ccfbf1] to-[#ccfbf1]/50 p-6 shadow-sm">
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#14b8a6] text-white shadow-lg shadow-teal-900/10">
                            <RefreshCw className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-600">Conversion %</h3>
                        <div className="text-2xl font-extrabold text-[#115e59]">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.winRate || 0}%`}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                {/* Sales Chart */}
                <Card className="col-span-4 border-0 shadow-sm min-w-0 rounded-3xl bg-[#ECFDF5] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-[#064e3b]">Sales Overview</CardTitle>
                        <CardDescription className="text-[#065f46]">Revenue trend over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        {chartLoading ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Icons.spinner className="h-8 w-8 animate-spin text-green-600" />
                            </div>
                        ) : (
                            <div className="w-full h-[350px]" style={{ minHeight: '350px', width: '100%' }}>
                                {isMounted && (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="name"
                                                stroke="#065f46"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                dy={10}
                                            />
                                            <YAxis
                                                stroke="#065f46"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `₹${value}`}
                                                dx={-10}
                                            />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="#064e3b" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    borderRadius: '12px',
                                                    border: 'none',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                }}
                                                itemStyle={{ color: '#059669' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="total"
                                                stroke="#10b981"
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
                <Card className="col-span-3 border-0 shadow-sm min-w-0 rounded-3xl bg-white overflow-hidden">
                    <TopPerformersWidget />
                </Card>

                {/* Lead Sources Pie Chart */}
                <Card className="col-span-3 border-0 shadow-sm min-w-0 rounded-3xl bg-[#ECFDF5] overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-[#064e3b]">Lead Sources</CardTitle>
                        <CardDescription className="text-[#065f46]">Acquisition channel distribution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {sourcesLoading ? (
                            <div className="h-[350px] flex items-center justify-center">
                                <Icons.spinner className="h-8 w-8 animate-spin text-green-600" />
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
