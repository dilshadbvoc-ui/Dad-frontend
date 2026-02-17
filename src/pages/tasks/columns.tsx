import { type ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Task } from "@/services/taskService"
import { format } from "date-fns"
import { Link } from "react-router-dom"
import { TaskActions } from "./TaskActions"

export const columns: ColumnDef<Task>[] = [
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
            return <span className={`capitalize ${colorClass} `}>{priority}</span>
        }
    },
    {
        accessorKey: "dueDate",
        header: "Due Date",
        cell: ({ row }) => {
            const date = row.getValue("dueDate")
            return date ? <div>{format(new Date(date as string), "MMM d, yyyy")}</div> : <div>-</div>
        }
    },
    {
        accessorKey: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => {
            const assigned = row.getValue("assignedTo") as { _id: string; firstName: string; lastName: string } | null;

            if (!assigned) return <span className="text-gray-400">-</span>;

            return (
                <Link
                    to={`/users/${assigned._id}`}
                    className="cursor-pointer hover:underline text-blue-600"
                >
                    {assigned.firstName} {assigned.lastName}
                </Link>
            );
        }
    },
    {
        accessorKey: "relatedTo",
        header: "Related To",
        cell: ({ row }) => {
            const related = row.original.relatedTo as { name?: string; firstName?: string; lastName?: string } | null
            const model = row.original.onModel
            if (!related || !model) return <span className="text-gray-400">-</span>;

            const name = related.name || `${related.firstName} ${related.lastName} `
            return <div><span className="text-xs text-muted-foreground mr-1">{model}:</span>{name}</div>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => <TaskActions task={row.original} />
    },
]
