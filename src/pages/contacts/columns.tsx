import type { ColumnDef } from "@tanstack/react-table"
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
import type { Contact } from "@/services/contactService"
import { format } from "date-fns"

export const columns: ColumnDef<Contact>[] = [
    {
        accessorKey: "firstName",
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
            return <div className="font-medium">{row.original.firstName} {row.original.lastName}</div>
        }
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "jobTitle",
        header: "Job Title",
        cell: ({ row }) => row.getValue("jobTitle") || "-"
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
        accessorKey: "owner",
        header: "Owner",
        cell: ({ row }) => {
            const owner = row.original.owner
            return owner ? <div>{owner.firstName} {owner.lastName}</div> : <span className="text-gray-400">Unassigned</span>
        }
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => {
            return <div>{format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}</div>
        }
    },
    {
        id: "actions",
        cell: ({ row }) => <ContactActions contact={row.original} />
    },
]

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteContact } from "@/services/contactService"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"

function ContactActions({ contact }: { contact: Contact }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const queryClient = useQueryClient()

    // Helper to get user role
    const getUserRole = () => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                return user.role;
            }
        } catch (e) {
            console.error("Failed to parse user info", e);
        }
        return null;
    };

    const role = getUserRole();
    const canDelete = role === 'super_admin' || role === 'admin';

    const deleteMutation = useMutation({
        mutationFn: () => deleteContact(contact.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["contacts"] })
            toast.success("Contact deleted successfully")
            setShowDeleteDialog(false)
        },
        onError: (error: unknown) => {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete contact")
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
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(contact.id)}>
                        Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = `/contacts/${contact.id}`}>View Details</DropdownMenuItem>
                    <DropdownMenuItem>Edit Contact</DropdownMenuItem>
                    {canDelete && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Contact
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={() => deleteMutation.mutate()}
                title="Delete Contact"
                description={`Are you sure you want to delete ${contact.firstName} ${contact.lastName}? This action cannot be undone.`}
                confirmText="Delete Contact"
                isDeleting={deleteMutation.isPending}
            />
        </>
    )
}
