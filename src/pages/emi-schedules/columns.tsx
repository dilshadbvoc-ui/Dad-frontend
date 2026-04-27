import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Link } from "react-router-dom"
import { EMIActions } from "./EMIActions"

export interface EMISchedule {
  id: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: 'active' | 'completed' | 'defaulted'
  startDate: string
  endDate: string
  opportunity: {
    id: string
    name: string
  }
  installments: Array<{
    id: string
    installmentNumber: number
    amount: number
    dueDate: string
    status: 'pending' | 'paid' | 'overdue' | 'missed'
    paidAmount: number
    paidDate: string | null
  }>
  createdAt: string
}

export const columns: ColumnDef<EMISchedule>[] = [
  {
    accessorKey: "opportunity.name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Opportunity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const opp = row.original.opportunity
      return (
        <Link
          to={`/opportunities/${opp.id}`}
          className="font-medium hover:underline text-blue-600"
        >
          {opp.name}
        </Link>
      )
    }
  },
  {
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => {
      return <div className="font-medium">₹{row.getValue<number>("totalAmount").toLocaleString('en-IN')}</div>
    }
  },
  {
    accessorKey: "paidAmount",
    header: "Paid",
    cell: ({ row }) => {
      return <div className="text-green-600 font-medium">₹{row.getValue<number>("paidAmount").toLocaleString('en-IN')}</div>
    }
  },
  {
    accessorKey: "remainingAmount",
    header: "Remaining",
    cell: ({ row }) => {
      return <div className="text-orange-600 font-medium">₹{row.getValue<number>("remainingAmount").toLocaleString('en-IN')}</div>
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      let variant: "default" | "secondary" | "destructive" = "secondary"

      switch (status) {
        case 'completed': variant = "default"; break;
        case 'active': variant = "secondary"; break;
        case 'defaulted': variant = "destructive"; break;
      }

      return <Badge variant={variant} className="capitalize">{status}</Badge>
    }
  },
  {
    header: "Installments",
    cell: ({ row }) => {
      const installments = row.original.installments
      const total = installments.length
      const paid = installments.filter(i => i.status === 'paid').length
      const overdue = installments.filter(i => i.status === 'overdue' || i.status === 'missed').length

      return (
        <div className="text-sm">
          <div>{paid}/{total} paid</div>
          {overdue > 0 && <div className="text-red-500 text-xs">{overdue} overdue</div>}
        </div>
      )
    }
  },
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      const date = row.getValue("startDate")
      return date ? <div>{format(new Date(date as string), "MMM d, yyyy")}</div> : <div>-</div>
    }
  },
  {
    accessorKey: "endDate",
    header: "End Date",
    cell: ({ row }) => {
      const date = row.getValue("endDate")
      return date ? <div>{format(new Date(date as string), "MMM d, yyyy")}</div> : <div>-</div>
    }
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <EMIActions schedule={row.original} />
  },
]
