import { Link } from "react-router-dom"
import { formatIST } from "@/lib/dateUtils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EMIActions } from "./EMIActions"
import { type EMISchedule } from "./columns"

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive"> = {
  completed: "default",
  active: "secondary",
  defaulted: "destructive",
}

export function EMIScheduleMobileCard({ schedule }: { schedule: EMISchedule }) {
  const paid = schedule.installments.filter(i => i.status === 'paid').length
  const total = schedule.installments.length
  const overdue = schedule.installments.filter(i => i.status === 'overdue' || i.status === 'missed').length

  return (
    <Card>
      <CardContent className="p-3.5 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/opportunities/${schedule.opportunity.id}`}
            className="font-semibold text-sm text-blue-600 hover:underline truncate min-w-0"
          >
            {schedule.opportunity.name}
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant={STATUS_VARIANT[schedule.status] || "secondary"} className="capitalize">
              {schedule.status}
            </Badge>
            <EMIActions schedule={schedule} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-semibold">₹{schedule.totalAmount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Paid</p>
            <p className="font-semibold text-green-600">₹{schedule.paidAmount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Remaining</p>
            <p className="font-semibold text-orange-600">₹{schedule.remainingAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <span>{paid}/{total} installments paid{overdue > 0 && <span className="text-destructive font-medium"> · {overdue} overdue</span>}</span>
          <span>{formatIST(schedule.endDate, "MMM d, yyyy")}</span>
        </div>
      </CardContent>
    </Card>
  )
}
