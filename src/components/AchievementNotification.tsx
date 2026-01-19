import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDailyAchievement, acknowledgeDailyNotification } from '@/services/salesTargetService'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Target, TrendingUp, Calendar, Trophy, Flame } from 'lucide-react'

export function AchievementNotification() {
    const [isOpen, setIsOpen] = useState(false)

    const { data } = useQuery({
        queryKey: ['daily-achievement'],
        queryFn: getDailyAchievement,
        staleTime: 1000 * 60 * 60, // Cache for 1 hour
    })

    useEffect(() => {
        if (data?.hasTarget && data?.showNotification) {
            // Small delay to ensure dashboard is loaded
            const timer = setTimeout(() => {
                setIsOpen(true)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [data])

    if (!data?.hasTarget || !data?.target) return null

    const { target } = data
    const isCompleted = target.achievementPercent >= 100

    const getMessage = () => {
        if (isCompleted) return "🎉 Congratulations! You've achieved your target!"
        if (target.achievementPercent >= 75) return "🔥 You're on fire! Almost there!"
        if (target.achievementPercent >= 50) return "💪 Great progress! Keep pushing!"
        if (target.achievementPercent >= 25) return "📈 Good start! Time to accelerate!"
        return "🚀 Let's get started! You've got this!"
    }

    const getGradient = () => {
        if (isCompleted) return 'from-green-500 to-emerald-600'
        if (target.achievementPercent >= 75) return 'from-orange-500 to-red-500'
        if (target.achievementPercent >= 50) return 'from-blue-500 to-purple-500'
        return 'from-gray-500 to-gray-600'
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open && data?.showNotification) {
            // Acknowledge when closed
            acknowledgeDailyNotification()
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md overflow-hidden p-0">
                {/* Header with gradient */}
                <div className={`bg-gradient-to-r ${getGradient()} p-6 text-white`}>
                    <DialogHeader>
                        <DialogTitle className="text-white text-xl flex items-center gap-2">
                            {isCompleted ? <Trophy className="h-6 w-6" /> : <Target className="h-6 w-6" />}
                        </DialogTitle>
                        <DialogDescription className="sr-only">
                            Daily Sales Achievement Update
                        </DialogDescription>
                    </DialogHeader>
                    <p className="mt-2 text-white/90 text-lg font-medium">{getMessage()}</p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Main stat */}
                    <div className="text-center">
                        <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {target.achievementPercent}%
                        </div>
                        <p className="text-gray-500 mt-1">of your {target.period} target</p>
                    </div>

                    {/* Progress bar */}
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium">
                                ₹{target.achievedValue.toLocaleString()} / ₹{target.targetValue.toLocaleString()}
                            </span>
                        </div>
                        <Progress value={Math.min(target.achievementPercent, 100)} className="h-3" />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-sm">Remaining</span>
                            </div>
                            <p className="text-xl font-bold">₹{target.amountRemaining.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center gap-2 text-gray-500 mb-1">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm">Days Left</span>
                            </div>
                            <p className="text-xl font-bold">{target.daysRemaining}</p>
                        </div>
                    </div>

                    {/* Daily target hint */}
                    {!isCompleted && target.daysRemaining > 0 && (
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                            <div className="flex items-center gap-2">
                                <Flame className="h-5 w-5 text-orange-500" />
                                <span className="font-medium text-blue-900 dark:text-blue-100">
                                    Daily target: ₹{Math.ceil(target.amountRemaining / target.daysRemaining).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                                Close this much daily to hit your target on time
                            </p>
                        </div>
                    )}

                    <Button
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                        onClick={() => handleOpenChange(false)}
                    >
                        Let's Go!
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
