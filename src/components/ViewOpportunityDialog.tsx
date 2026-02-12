import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Target } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export interface Opportunity {
    id: string
    name: string
    amount: number
    stage: string
    probability: number
    closeDate?: string
    priority?: string
}

interface ViewOpportunityDialogProps {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    opportunity: Opportunity
}

export function ViewOpportunityDialog({ children, open, onOpenChange, opportunity }: ViewOpportunityDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">{opportunity.name}</DialogTitle>
                    <DialogDescription>
                        Opportunity Details
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-500">Stage</span>
                            <Badge variant="secondary" className="mt-1 capitalize w-fit">{opportunity.stage.replace('_', ' ')}</Badge>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-gray-500">Probability</span>
                            <span className="text-lg font-bold flex items-center mt-1">
                                <Target className="w-4 h-4 mr-1 text-blue-500" />
                                {opportunity.probability}%
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Value</span>
                            </div>
                            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {formatCurrency(opportunity.amount)}
                            </span>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Close Date</span>
                            </div>
                            <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                {opportunity.closeDate ? new Date(opportunity.closeDate).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <span className="text-sm font-medium text-gray-500 mb-2 block">ID</span>
                        <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block select-all">
                            {opportunity.id}
                        </code>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
