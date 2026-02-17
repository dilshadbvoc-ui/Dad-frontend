import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSalesForecast } from '@/services/analyticsService';
import { getBranches } from '@/services/settingsService';
import { AchievementNotification } from '@/components/AchievementNotification';
import { DailyBriefingDialog } from '@/components/DailyBriefingDialog';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { TopPerformersWidget } from '@/components/dashboard/TopPerformersWidget';
import { LicenseUsageWidget } from '@/components/dashboard/LicenseUsageWidget';
import { SalesChartWidget } from '@/components/dashboard/SalesChartWidget';
import { LeadSourcesWidget } from '@/components/dashboard/LeadSourcesWidget';
import { Calendar, ArrowRight } from "lucide-react";
import { TrendingUp, Check, Trophy, AlertCircle, RefreshCw, Building2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { formatCurrencyCompact, isAdmin as checkIsAdmin } from "@/lib/utils";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface User {
    id: string;
    name: string;
    email: string;
    role: {
        name: string;
    } | string;
    // Add other user properties as needed
}

interface Branch {
    id: string;
    name: string;
    // Add other branch properties as needed
}

interface DashboardStats {
    activeOpportunities: number;
    opportunities: {
        won: number;
        lost: number;
    };
    winRate: number;
    // Add other stats properties as needed
}

interface SalesForecast {
    weightedForecast: number;
    // Add other forecast properties as needed
}

export default function Dashboard() {
    const [user] = useState<User | null>(() => {
        const userInfo = localStorage.getItem('userInfo');
        return userInfo ? JSON.parse(userInfo) : null;
    });
    const [branches, setBranches] = useState<Branch[]>([]);
    const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);

    const isAdmin = checkIsAdmin(user);

    useEffect(() => {
        const fetchBranches = async () => {
            if (isAdmin) {
                try {
                    const data = await getBranches();
                    setBranches(data || []);
                } catch (error) {
                    console.error("Failed to fetch branches", error);
                }
            }
        };
        if (user) fetchBranches();
    }, [user, isAdmin]);

    const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
        queryKey: ['dashboardStats', selectedBranchId],
        queryFn: () => getDashboardStats(selectedBranchId || undefined)
    });

    const { data: forecast, isLoading: forecastLoading } = useQuery<SalesForecast>({
        queryKey: ['forecast', selectedBranchId],
        queryFn: () => getSalesForecast(selectedBranchId || undefined)
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
                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    {isAdmin && branches.length > 0 && (
                        <div className="w-[200px]">
                            <Select
                                value={selectedBranchId || "all"}
                                onValueChange={(val) => setSelectedBranchId(val === "all" ? null : val)}
                            >
                                <SelectTrigger className="h-10 w-full bg-background border-input">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                        <SelectValue placeholder="All Branches" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Branches</SelectItem>
                                    {branches.map((branch: Branch) => (
                                        <SelectItem key={branch.id} value={branch.id}>
                                            {branch.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

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
                            {formatCurrencyCompact(forecast?.weightedForecast || 0)}
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
                {isAdmin && (
                    <ErrorBoundary name="LicenseUsageWidget">
                        <LicenseUsageWidget />
                    </ErrorBoundary>
                )}
            </div>

            {/* Main Charts Row */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <ErrorBoundary name="SalesChartWidget">
                    <SalesChartWidget branchId={selectedBranchId} />
                </ErrorBoundary>
                <div className="col-span-3 space-y-6">
                    <ErrorBoundary name="TopPerformersWidget">
                        <TopPerformersWidget branchId={selectedBranchId} />
                    </ErrorBoundary>
                    <ErrorBoundary name="LeadSourcesWidget">
                        <LeadSourcesWidget branchId={selectedBranchId} />
                    </ErrorBoundary>
                </div>
            </div>

            {/* Activity Row */}
            <div className="grid gap-6 md:grid-cols-1">
                <ErrorBoundary name="RecentActivityWidget">
                    <RecentActivityWidget branchId={selectedBranchId} />
                </ErrorBoundary>
            </div>
        </div>
    );
}
