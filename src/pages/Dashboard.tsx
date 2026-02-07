import { useEffect } from 'react';
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
// import { Icons } from "@/components/ui/icons";
import { TrendingUp, Check, Trophy, AlertCircle, RefreshCw } from "lucide-react";
// RECHARTS IMPORT REMOVED FOR DEBUGGING
// import { ResponsiveContainer, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, Area, AreaChart, CartesianGrid } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ensureArray } from "@/hooks/useArrayData";


const COLORS = ['#34d399', '#2dd4bf', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6'];

export default function Dashboard() {
    // const [isMounted, setIsMounted] = useState(false);

    // useEffect(() => {
    //    const timer = setTimeout(() => {
    //        setIsMounted(true);
    //    }, 0);
    //    return () => clearTimeout(timer);
    // }, []);

    const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['dashboardStats'], queryFn: getDashboardStats });
    const { data: salesDataRaw, isLoading: chartLoading } = useQuery({ queryKey: ['salesChart'], queryFn: getSalesChartData });
    const { data: forecast, isLoading: forecastLoading } = useQuery({ queryKey: ['forecast'], queryFn: getSalesForecast });
    const { data: leadSourcesRaw, isLoading: sourcesLoading } = useQuery({ queryKey: ['leadSources'], queryFn: getLeadSourceAnalytics });

    // Ensure data is always an array
    const salesData = ensureArray<{ name: string; total?: number }>(salesDataRaw);
    const leadSources = ensureArray<{ source: string; count: number }>(leadSourcesRaw);

    // Debug logging
    useEffect(() => {
        if (salesDataRaw) {
            console.log('Sales Data Raw:', salesDataRaw, 'Is Array:', Array.isArray(salesDataRaw));
        }
        if (leadSourcesRaw) {
            console.log('Lead Sources Raw:', leadSourcesRaw, 'Is Array:', Array.isArray(leadSourcesRaw));
        }
    }, [salesDataRaw, leadSourcesRaw]);


    return (
        <div className="space-y-8">
            {/* Daily Briefing & Achievement Notification */}
            <DailyBriefingDialog />
            <AchievementNotification />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-[#1e293b] dark:text-white">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Overview of your sales pipeline and performance.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {/* Expected Revenue */}
                <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500">Expected Revenue</h3>
                        <div className="text-2xl font-extrabold text-[#1e293b] dark:text-white">
                            {forecastLoading ? <Skeleton className="h-8 w-24 bg-slate-100" /> :
                                new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, notation: 'compact' }).format(forecast?.weightedForecast || 0)
                            }
                        </div>
                    </div>
                </div>

                {/* Deals In Pipeline */}
                <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                            <Check className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500">Deals In Pipeline</h3>
                        <div className="text-2xl font-extrabold text-[#1e293b] dark:text-white">
                            {statsLoading ? <Skeleton className="h-8 w-16 bg-slate-100" /> : stats?.activeOpportunities}
                        </div>
                    </div>
                </div>

                {/* Won Deals */}
                <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500">Won: {new Date().toLocaleString('default', { month: 'short' })}</h3>
                        <div className="text-2xl font-extrabold text-[#1e293b] dark:text-white">
                            {statsLoading ? <Skeleton className="h-8 w-16 bg-slate-100" /> : stats?.opportunities?.won || 0}
                        </div>
                    </div>
                </div>

                {/* Lost Deals */}
                <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500">Lost Deals</h3>
                        <div className="text-2xl font-extrabold text-[#1e293b] dark:text-white">
                            {statsLoading ? <Skeleton className="h-8 w-16 bg-slate-100" /> : stats?.opportunities?.lost || 0}
                        </div>
                    </div>
                </div>

                {/* Conversion */}
                <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-card p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-0 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                            <RefreshCw className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-500">Conversion %</h3>
                        <div className="text-2xl font-extrabold text-[#1e293b] dark:text-white">
                            {statsLoading ? <Skeleton className="h-8 w-16 bg-slate-100" /> : `${stats?.winRate || 0}%`}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7">
                {/* Sales Chart - Temporarily Disabled for Debugging */}
                <Card className="col-span-4 min-w-0 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-foreground">Sales Overview</CardTitle>
                        <CardDescription className="text-muted-foreground">Revenue trend over the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-0">
                        <div className="h-[350px] flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <p className="text-muted-foreground text-sm">Chart temporarily disabled for debugging</p>
                                {!chartLoading && salesData.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium">Sales Data Available: {salesData.length} months</p>
                                        {Array.isArray(salesData) && salesData.slice(0, 3).map((data: { name: string; total?: number }, index: number) => (
                                            <div key={index} className="text-xs text-muted-foreground">
                                                {data.name}: ₹{data.total?.toLocaleString() || 0}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top Performers Widget - New */}
                <Card className="col-span-3 min-w-0 overflow-hidden">
                    <TopPerformersWidget />
                </Card>

                {/* Lead Sources - Temporarily Disabled for Debugging */}
                <Card className="col-span-3 min-w-0 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-foreground">Lead Sources</CardTitle>
                        <CardDescription className="text-muted-foreground">Acquisition channel distribution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <p className="text-muted-foreground text-sm">Chart temporarily disabled for debugging</p>
                                {!sourcesLoading && leadSources.length > 0 && (
                                    <div className="space-y-2">
                                        {Array.isArray(leadSources) && leadSources.map((source: { source: string; count: number }, index: number) => (
                                            <div key={index} className="flex items-center justify-between gap-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                    />
                                                    <span className="text-sm">{source.source}</span>
                                                </div>
                                                <span className="text-sm font-medium">{source.count}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
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
