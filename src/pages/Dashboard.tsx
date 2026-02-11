import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSalesForecast } from '@/services/analyticsService';
import { AchievementNotification } from '@/components/AchievementNotification';
import { DailyBriefingDialog } from '@/components/DailyBriefingDialog';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { TopPerformersWidget } from '@/components/dashboard/TopPerformersWidget';
import { LicenseUsageWidget } from '@/components/dashboard/LicenseUsageWidget';
import { SalesChartWidget } from '@/components/dashboard/SalesChartWidget';
import { LeadSourcesWidget } from '@/components/dashboard/LeadSourcesWidget';
import { Calendar, ArrowRight } from "lucide-react";
import { TrendingUp, Check, Trophy, AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function Dashboard() {
    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['dashboardStats'],
        queryFn: getDashboardStats
    });

    const { data: forecast, isLoading: forecastLoading } = useQuery({
        queryKey: ['forecast'],
        queryFn: getSalesForecast
    });

    if (statsLoading || forecastLoading) {
        return (
            <div className="p-8 space-y-8 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                </div>
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-[2rem]" />
                    ))}
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="col-span-4 h-[400px] rounded-[2rem]" />
                    <Skeleton className="col-span-3 h-[400px] rounded-[2rem]" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 p-4 sm:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Here's your daily overview and performance metrics.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <ErrorBoundary name="DailyBriefingDialog">
                        <DailyBriefingDialog />
                    </ErrorBoundary>
                    <Link to="/calendar">
                        <Button variant="outline" className="gap-2 hidden sm:flex">
                            <Calendar className="h-4 w-4" />
                            <span>Schedule</span>
                        </Button>
                    </Link>
                    <Link to="/leads/new">
                        <Button className="gap-2 shadow-lg shadow-primary/20 transition-all hover:shadow-primary/40 hover:-translate-y-0.5">
                            <ArrowRight className="h-4 w-4" />
                            <span>New Lead</span>
                        </Button>
                    </Link>
                </div>
            </div>

            <ErrorBoundary name="AchievementNotification">
                <AchievementNotification />
            </ErrorBoundary>

            {/* Quick Stats Row */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                <div className="relative overflow-hidden rounded-[2rem] bg-card p-4 sm:p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <h3 className="text-[10px] sm:text-sm font-bold text-muted-foreground text-center uppercase tracking-tight sm:normal-case sm:tracking-normal">Expected Revenue</h3>
                        <div className="text-lg sm:text-2xl font-extrabold text-card-foreground">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' }).format(forecast?.weightedForecast || 0)}
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] bg-card p-4 sm:p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                            <Check className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <h3 className="text-[10px] sm:text-sm font-bold text-muted-foreground text-center uppercase tracking-tight sm:normal-case sm:tracking-normal">Deals In Pipeline</h3>
                        <div className="text-xl sm:text-2xl font-extrabold text-card-foreground">
                            {stats?.activeOpportunities || 0}
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] bg-card p-4 sm:p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:scale-110 transition-transform">
                            <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <h3 className="text-[10px] sm:text-sm font-bold text-muted-foreground text-center uppercase tracking-tight sm:normal-case sm:tracking-normal">Won This Month</h3>
                        <div className="text-xl sm:text-2xl font-extrabold text-card-foreground">
                            {stats?.opportunities?.won || 0}
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] bg-card p-4 sm:p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform">
                            <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <h3 className="text-[10px] sm:text-sm font-bold text-muted-foreground text-center uppercase tracking-tight sm:normal-case sm:tracking-normal">Lost Deals</h3>
                        <div className="text-xl sm:text-2xl font-extrabold text-card-foreground">
                            {stats?.opportunities?.lost || 0}
                        </div>
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] bg-card p-4 sm:p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                            <RefreshCw className="h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <h3 className="text-[10px] sm:text-sm font-bold text-muted-foreground text-center uppercase tracking-tight sm:normal-case sm:tracking-normal">Conversion Ratio</h3>
                        <div className="text-xl sm:text-2xl font-extrabold text-card-foreground">
                            {stats?.winRate || 0}%
                        </div>
                    </div>
                </div>

                {/* License Widget */}
                <ErrorBoundary name="LicenseUsageWidget">
                    <LicenseUsageWidget />
                </ErrorBoundary>
            </div>

            {/* Main Charts Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <ErrorBoundary name="SalesChartWidget">
                    <SalesChartWidget />
                </ErrorBoundary>
                <div className="col-span-3 space-y-6">
                    <ErrorBoundary name="TopPerformersWidget">
                        <TopPerformersWidget />
                    </ErrorBoundary>
                    <ErrorBoundary name="LeadSourcesWidget">
                        <LeadSourcesWidget />
                    </ErrorBoundary>
                </div>
            </div>

            {/* Activity Row */}
            <div className="grid gap-6 md:grid-cols-1">
                <ErrorBoundary name="RecentActivityWidget">
                    <RecentActivityWidget />
                </ErrorBoundary>
            </div>
        </div>
    );
}
