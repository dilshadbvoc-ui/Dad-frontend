import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Target, Package } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface Opportunity {
    id: string
    name: string
    amount: number
    stage: string
    probability: number
    closeDate?: string
    priority?: string
    account?: {
        name: string
        accountProducts?: Array<{
            id: string
            quantity: number
            status: string
            notes?: string
            product: {
                id: string
                name: string
                basePrice: number
                sku?: string
                currency?: string
            }
        }>
    }
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

                    {opportunity.account?.accountProducts && opportunity.account.accountProducts.length > 0 && (
                        <Card className="border-2">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Package className="w-4 h-4 text-blue-600" />
                                    Associated Products
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {opportunity.account.accountProducts.map((ap) => (
                                    <div key={ap.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="font-medium text-sm">{ap.product.name}</div>
                                            {ap.product.sku && (
                                                <div className="text-xs text-muted-foreground">SKU: {ap.product.sku}</div>
                                            )}
                                            {ap.notes && (
                                                <div className="text-xs text-muted-foreground mt-1 italic">{ap.notes}</div>
                                            )}
                                        </div>
                                        <div className="text-right ml-4">
                                            <div className="text-sm font-semibold">
                                                {formatCurrency(ap.product.basePrice * ap.quantity)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {ap.quantity} × {formatCurrency(ap.product.basePrice)}
                                            </div>
                                            <Badge variant="outline" className="mt-1 text-xs">
                                                {ap.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                <div className="pt-2 border-t flex justify-between items-center">
                                    <span className="text-sm font-medium">Total Product Value:</span>
                                    <span className="text-lg font-bold text-green-600">
                                        {formatCurrency(
                                            opportunity.account.accountProducts.reduce(
                                                (sum, ap) => sum + (ap.product.basePrice * ap.quantity),
                                                0
                                            )
                                        )}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
