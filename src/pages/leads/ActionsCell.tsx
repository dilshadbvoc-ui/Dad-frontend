import { copyToClipboard } from "@/lib/utils";
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { MoreHorizontal, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"
import { deleteLead, type Lead } from "@/services/leadService"

export function ActionsCell({ lead }: { lead: Lead }) {
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
        } catch (error: unknown) {
            const err = error as { message?: string };
            toast.error(err.message || 'Failed to delete lead')
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
                    <DropdownMenuItem onClick={() => copyToClipboard(lead.id)}>
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

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={handleDelete}
                title="Delete Lead"
                description={`Are you sure you want to delete ${lead.firstName} ${lead.lastName}? This action cannot be undone.`}
                confirmText="Delete Lead"
                isDeleting={isDeleting}
            />
        </>
    )
}
