import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, ArrowUpDown, Trash2, AlertTriangle, Phone, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { deleteLead, type Lead } from "@/services/leadService"
import { format } from "date-fns"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useState } from "react"

// Actions cell component with state management
function ActionsCell({ lead }: { lead: Lead }) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}')
    const canDelete = userInfo.role === 'admin' || userInfo.role === 'super_admin'

    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            await deleteLead(lead.id)
            toast.success('Lead deleted successfully')
            queryClient.invalidateQueries({ queryKey: ['leads'] })
            setShowDeleteDialog(false)
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete lead')
        } finally {
            setIsDeleting(false)
        }
    }

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
                    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(lead.id)}>
                        Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(`/leads/${lead.id}`)}>
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>Edit Lead</DropdownMenuItem>

                    {canDelete && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => setShowDeleteDialog(true)}
                                className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Lead
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <AlertDialogTitle>Delete Lead</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{lead.firstName} {lead.lastName}</strong>? This action cannot be undone.
                                </AlertDialogDescription>
                            </div>
                        </div>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Lead'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

export const columns: ColumnDef<Lead>[] = [
    {
        accessorKey: "firstName",
        header: ({ column }: any) => {
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
        cell: ({ row }: any) => {
            const lead = row.original
            // eslint-disable-next-line react-hooks/rules-of-hooks
            const navigate = useNavigate()
            return (
                <div
                    className="font-medium cursor-pointer hover:underline text-blue-600"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                >
                    {lead.firstName} {lead.lastName}
                </div>
            )
        }
    },
    {
        accessorKey: "email",
        header: "Email",
    },
    {
        accessorKey: "company",
        header: "Company",
    },
    {
        accessorKey: "leadScore",
        header: ({ column }: any) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Score
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }: any) => {
            const score = parseFloat(row.getValue("leadScore"))
            return <div className={score > 50 ? "text-green-600 font-bold" : ""}>{score}</div>
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }: any) => {
            const status = row.getValue("status") as string
            let variant: "default" | "secondary" | "destructive" | "outline" = "default"

            switch (status) {
                case 'new': variant = "default"; break; // Blue-ish usually
                case 'contacted': variant = "secondary"; break;
                case 'qualified': variant = "outline"; break; // Green in custom css maybe
                case 'converted': variant = "outline"; break;
                case 'lost': variant = "destructive"; break;
                default: variant = "secondary";
            }

            return <Badge variant={variant} className="capitalize">{status}</Badge>
        }
    },
    {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }: any) => {
            return <div>{format(new Date(row.getValue("createdAt")), "MMM d, yyyy")}</div>
        }
    },
    {
        id: "contact",
        header: "Contact",
        cell: ({ row }: any) => {
            const lead = row.original
            const phone = lead.phone?.replace(/\D/g, '') // Remove non-digits
            if (!phone) return <span className="text-muted-foreground text-xs">No phone</span>

            const logAndOpenWhatsApp = async (e: React.MouseEvent) => {
                e.stopPropagation()
                try {
                    // Log the interaction
                    const userInfo = localStorage.getItem('userInfo')
                    const token = userInfo ? JSON.parse(userInfo).token : null
                    await fetch(`/api/interactions/leads/${lead.id}/quick-log`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ type: 'whatsapp', phoneNumber: phone })
                    })
                } catch (err) {
                    console.warn('Failed to log WhatsApp interaction:', err)
                }
                window.open(`https://wa.me/${phone}`, '_blank')
            }

            const logAndCall = async (e: React.MouseEvent) => {
                e.stopPropagation()
                try {
                    const userInfo = localStorage.getItem('userInfo')
                    const token = userInfo ? JSON.parse(userInfo).token : null
                    await fetch(`/api/interactions/leads/${lead.id}/quick-log`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { Authorization: `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ type: 'call', phoneNumber: phone })
                    })
                } catch (err) {
                    console.warn('Failed to log Call interaction:', err)
                }
                window.location.href = `tel:${phone}`
            }

            return (
                <div className="flex gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={logAndOpenWhatsApp}
                        title="WhatsApp"
                    >
                        <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={logAndCall}
                        title="Call"
                    >
                        <Phone className="h-4 w-4" />
                    </Button>
                </div>
            )
        }
    },
    {
        id: "actions",
        cell: ({ row }: any) => <ActionsCell lead={row.original} />,
    },
]
