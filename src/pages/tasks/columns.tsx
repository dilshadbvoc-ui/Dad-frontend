import { copyToClipboard } from "@/lib/utils";
import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { type Task } from "@/services/taskService"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"

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
            return <span className={`capitalize ${colorClass}`}>{priority}</span>
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
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const navigate = useNavigate();

            if (!assigned) return <span className="text-gray-400">-</span>;

            return (
                <div
                    className="cursor-pointer hover:underline text-blue-600"
                    onClick={() => navigate(`/users/${assigned._id}`)}
                >
                    {assigned.firstName} {assigned.lastName}
                </div>
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

            const name = related.name || `${related.firstName} ${related.lastName}`
            return <div><span className="text-xs text-muted-foreground mr-1">{model}:</span>{name}</div>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => <TaskActions task={row.original} />
    },
]

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteTask } from "@/services/taskService" // Assuming this exists
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"

function TaskActions({ task }: { task: Task }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const queryClient = useQueryClient()

    const deleteMutation = useMutation({
        mutationFn: () => deleteTask(task.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] })
            toast.success("Task deleted successfully")
            setShowDeleteDialog(false)
        },
        onError: (error: unknown) => {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete task")
        },
    })

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => copyToClipboard(task.id)}>
                        Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>Edit Task</DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => setShowDeleteDialog(true)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Task
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={() => deleteMutation.mutate()}
                title="Delete Task"
                description={`Are you sure you want to delete "${task.subject}"? This action cannot be undone.`}
                confirmText="Delete Task"
                isDeleting={deleteMutation.isPending}
            />
        </>
    )
}

