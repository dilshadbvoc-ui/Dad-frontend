import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDailyAchievement, acknowledgeDailyNotification } from '@/services/salesTargetService';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Calendar, Trophy, Flag } from 'lucide-react';
import { api } from '@/services/api';

export function DailyBriefingDialog() {
    const [isOpen, setIsOpen] = useState(false);

    // Fetch Sales Target Data
    const { data: achievement } = useQuery({
        queryKey: ['daily-achievement'],
        queryFn: getDailyAchievement,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
    });

    // Fetch Pending Follow-ups Count
    const { data: pendingStats } = useQuery({
        queryKey: ['pending-followups-count'],
        queryFn: async () => {
            const res = await api.get('/leads/pending-follow-ups');
            return res.data;
        }
    });

    useEffect(() => {
        // Logic to show once per day
        const lastSeen = localStorage.getItem('dailyBriefingLastSeen');
        const today = new Date().toISOString().split('T')[0];

        if (lastSeen !== today && achievement?.hasTarget) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [achievement]);

    const handleClose = () => {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem('dailyBriefingLastSeen', today);
        setIsOpen(false);
        if (achievement?.showNotification) {
            acknowledgeDailyNotification();
        }
    };

    if (!achievement?.hasTarget || !achievement.target) return null;

    const { target } = achievement;
    const isCompleted = target.achievementPercent >= 100;

    const getMessage = () => {
        if (isCompleted) return "🎉 Incredible! Target Smashed!";
        if (target.achievementPercent >= 75) return "🔥 You're crushing it! Finish strong.";
        return "☀️ Good Morning! Here's your daily focus.";
    };

    const getGradient = () => {
        if (isCompleted) return 'from-green-500 to-emerald-600';
        if (target.achievementPercent >= 75) return 'from-orange-500 to-red-500';
        return 'from-blue-600 to-indigo-600';
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-md overflow-hidden p-0 border-0 shadow-2xl">
                {/* Header */}
                <div className={`bg-gradient-to-r ${getGradient()} p-6 text-white`}>
                    <DialogHeader>
                        <DialogTitle className="text-white text-2xl flex items-center gap-2">
                            {isCompleted ? <Trophy className="h-8 w-8" /> : <Calendar className="h-8 w-8 text-white/80" />}
                            Daily Briefing
                        </DialogTitle>
                        <DialogDescription className="text-blue-100 text-base mt-2">
                            {getMessage()}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-6 bg-white dark:bg-slate-950">
                    {/* Sales Target Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Sales Target</h4>
                            <span className="text-xs font-semibold px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                {target.daysRemaining} days left
                            </span>
                        </div>

                        <div className="text-center py-2">
                            <div className="text-4xl font-extrabold text-foreground">
                                {target.achievementPercent}%
                            </div>
                            <p className="text-sm text-muted-foreground">of {target.period} goal</p>
                        </div>
                        <Progress value={Math.min(target.achievementPercent, 100)} className="h-3" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>₹{target.achievedValue.toLocaleString()}</span>
                            <span>Goal: ₹{target.targetValue.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Pending Follow-ups Feature */}
                    {pendingStats && pendingStats.count > 0 && (
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                                <Flag className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-lg font-bold text-foreground">{pendingStats.count} Leads</p>
                                <p className="text-sm text-muted-foreground">require follow-up today</p>
                            </div>
                            {/* Optional: Add link to filtered view if available */}
                        </div>
                    )}

                    <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" onClick={handleClose}>
                        Let's get to work
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
