import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { OpportunityActions } from "./OpportunityActions"

export const columns: ColumnDef<any>[] = [
    {
        accessorKey: "name",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue("name")}</div>
        }
    },
    {
        accessorKey: "amount",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Value
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const amount = parseFloat(row.getValue("amount"))
            const formatted = new Intl.NumberFormat("en-IN", {
                style: "currency",
                currency: "INR",
            }).format(amount)
            return <div className="font-medium">{formatted}</div>
        }
    },
    {
        accessorKey: "stage",
        header: "Stage",
        cell: ({ row }) => {
            const stage = row.getValue("stage") as string
            let variant: "default" | "secondary" | "destructive" | "outline" = "secondary"

            switch (stage) {
                case 'closed_won': variant = "default"; break;
                case 'closed_lost': variant = "destructive"; break;
                case 'negotiation': variant = "outline"; break;
                default: variant = "secondary";
            }

            return <Badge variant={variant} className="capitalize">{stage.replace('_', ' ')}</Badge>
        }
    },
    {
        accessorKey: "probability",
        header: "Prob.",
        cell: ({ row }) => {
            const prob = row.getValue("probability") as number
            return <div>{prob}%</div>
        }
    },
    {
        accessorKey: "account",
        header: "Account",
        cell: ({ row }) => {
            const account = row.original.account
            return account ? <span className="font-medium">{account.name}</span> : <span className="text-gray-400">-</span>
        }
    },
    {
        accessorKey: "closeDate",
        header: "Close Date",
        cell: ({ row }) => {
            const date = row.getValue("closeDate")
            return date ? <div>{format(new Date(date as string), "MMM d, yyyy")}</div> : <div>-</div>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const opportunity = row.original
            return <OpportunityActions opportunity={opportunity} />
        },
    },
]
