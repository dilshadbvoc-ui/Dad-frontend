import { type ColumnDef } from "@tantml:parameter/react-table"
import { ArrowUpDown, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type FollowUpTask } from "@/services/followUpService"
import { format, isPast, isToday } from "date-fns"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"

export const columns: ColumnDef<FollowUpTask>[] = [
    {
        accessorKey: "subject",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Subject
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return <div className="font-medium">{row.getValue("subject")}</div>
        }
    },
    {
        accessorKey: "dueDate",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Due Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const date = row.getValue("dueDate") as string
            if (!date) return <div>-</div>
            
            const dueDate = new Date(date)
            const isOverdue = isPast(dueDate) && !isToday(dueDate) && row.original.status !== 'completed'
            const isDueToday = isToday(dueDate) && row.original.status !== 'completed'
            
            return (
                <div className={cn(
                    "flex items-center gap-2",
                    isOverdue && "text-red-600 font-semibold",
                    isDueToday && "text-orange-600 font-semibold"
                )}>
                    {(isOverdue || isDueToday) && <Clock className="h-3 w-3" />}
                    {format(dueDate, "MMM d, yyyy")}
                    {isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}
                    {isDueToday && <Badge className="text-xs bg-orange-500">Today</Badge>}
                </div>
            )
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            let variant: "default" | "secondary" | "destructive" | "outline" = "outline"

            switch (status) {
                case 'completed': variant = "default"; break;
                case 'in_progress': variant = "secondary"; break;
                case 'not_started': variant = "outline"; break;
                case 'deferred': variant = "destructive"; break;
            }

            return <Badge variant={variant} className="capitalize">{status.replace('_', ' ')}</Badge>
        }
    },
    {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
            const priority = row.getValue("priority") as string
            let colorClass = "";
            switch (priority) {
                case 'high': colorClass = "text-red-500 font-bold"; break;
                case 'medium': colorClass = "text-yellow-600"; break;
                case 'low': colorClass = "text-green-600"; break;
            }
            return <span className={`capitalize ${colorClass}`}>{priority}</span>
        }
    },
    {
        accessorKey: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => {
            const assigned = row.getValue("assignedTo") as { firstName: string; lastName: string; email: string } | null;

            if (!assigned) return <span className="text-gray-400">-</span>;

            return (
                <div className="text-sm">
                    {assigned.firstName} {assigned.lastName}
                </div>
            );
        }
    },
    {
        accessorKey: "createdBy",
        header: "Created By",
        cell: ({ row }) => {
            const creator = row.getValue("createdBy") as { firstName: string; lastName: string; email: string } | null;

            if (!creator) return <span className="text-gray-400">-</span>;

            return (
                <div className="text-sm text-muted-foreground">
                    {creator.firstName} {creator.lastName}
                </div>
            );
        }
    },
    {
        accessorKey: "relatedTo",
        header: "Related To",
        cell: ({ row }) => {
            const related = row.original.relatedTo as { name?: string; firstName?: string; lastName?: string; company?: string } | null
            const model = row.original.onModel
            if (!related || !model) return <span className="text-gray-400">-</span>;

            const name = related.name || related.company || `${related.firstName || ''} ${related.lastName || ''}`.trim()
            return (
                <div className="text-sm">
                    <span className="text-xs text-muted-foreground mr-1">{model}:</span>
                    <span className="font-medium">{name}</span>
                </div>
            )
        }
    },
]
