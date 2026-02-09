import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getSalesForecast } from '@/services/analyticsService';
import { AchievementNotification } from '@/components/AchievementNotification';
import { DailyBriefingDialog } from '@/components/DailyBriefingDialog';
import { RecentActivityWidget } from '@/components/dashboard/RecentActivityWidget';
import { TopPerformersWidget } from '@/components/dashboard/TopPerformersWidget';
import { LicenseUsageWidget } from '@/components/dashboard/LicenseUsageWidget';
import { SalesChartWidget } from '@/components/dashboard/SalesChartWidget';
import { LeadSourcesWidget } from '@/components/dashboard/LeadSourcesWidget';
import { TrendingUp, Check, Trophy, AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
    // const [isMounted, setIsMounted] = useState(false);

    // useEffect(() => {
    //    const timer = setTimeout(() => {
    //        setIsMounted(true);
    //    }, 0);
    //    return () => clearTimeout(timer);
    // }, []);

    const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ['dashboardStats'], queryFn: getDashboardStats });
    const { data: forecast, isLoading: forecastLoading } = useQuery({ queryKey: ['forecast'], queryFn: getSalesForecast });


    return (
        <div className="space-y-8">
            {/* Daily Briefing & Achievement Notification */}
            <DailyBriefingDialog />
            <AchievementNotification />
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your sales pipeline and performance.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {/* Expected Revenue */}
                <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-muted-foreground">Expected Revenue</h3>
                        <div className="text-2xl font-extrabold text-card-foreground">
                            {forecastLoading ? <Skeleton className="h-8 w-24" /> :
                                new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, notation: 'compact' }).format(forecast?.weightedForecast || 0)
                            }
                        </div>
                    </div>
                </div>

                {/* Deals In Pipeline */}
                <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                            <Check className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-muted-foreground">Deals In Pipeline</h3>
                        <div className="text-2xl font-extrabold text-card-foreground">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.activeOpportunities}
                        </div>
                    </div>
                </div>

                {/* Won Deals */}
                <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light text-success">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-muted-foreground">Won: {new Date().toLocaleString('default', { month: 'short' })}</h3>
                        <div className="text-2xl font-extrabold text-card-foreground">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.opportunities?.won || 0}
                        </div>
                    </div>
                </div>

                {/* Lost Deals */}
                <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-light text-destructive">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-muted-foreground">Lost Deals</h3>
                        <div className="text-2xl font-extrabold text-card-foreground">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : stats?.opportunities?.lost || 0}
                        </div>
                    </div>
                </div>

                {/* Conversion */}
                <div className="relative overflow-hidden rounded-[2rem] bg-card p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1">
                    <div className="flex flex-col items-center justify-center space-y-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-light text-warning">
                            <RefreshCw className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-muted-foreground">Conversion %</h3>
                        <div className="text-2xl font-extrabold text-card-foreground">
                            {statsLoading ? <Skeleton className="h-8 w-16" /> : `${stats?.winRate || 0}%`}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-7">
                {/* Sales Chart - Temporarily Disabled for Debugging */}
                {/* Sales Chart */}
                <SalesChartWidget />

                {/* Top Performers Widget */}
                <div className="col-span-3 min-w-0 overflow-hidden">
                    <TopPerformersWidget />
                </div>

                {/* Lead Sources */}
                <LeadSourcesWidget />

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
