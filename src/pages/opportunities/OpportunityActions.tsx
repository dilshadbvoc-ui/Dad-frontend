import { copyToClipboard } from "@/lib/utils";
import { useState } from "react"
import { MoreHorizontal, Pencil, Copy, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditOpportunityDialog, type Opportunity } from "@/components/EditOpportunityDialog"
import { ViewOpportunityDialog } from "@/components/ViewOpportunityDialog"
import { deleteOpportunity } from "@/services/opportunityService"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"

interface OpportunityActionsProps {
    opportunity: Opportunity
}

export function OpportunityActions({ opportunity }: OpportunityActionsProps) {
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [isViewOpen, setIsViewOpen] = useState(false)
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
        mutationFn: () => deleteOpportunity(opportunity.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["opportunities"] })
            toast.success("Opportunity deleted successfully")
        },
        onError: (error: unknown) => {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete opportunity")
        },
    })

    const handleDelete = () => {
        setShowDeleteDialog(true)
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
                    <DropdownMenuItem onClick={() => copyToClipboard(opportunity.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy ID
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsViewOpen(true)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => {
                        e.preventDefault();
                        console.log('Edit clicked, opening dialog');
                        setIsEditOpen(true);
                    }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Opportunity
                    </DropdownMenuItem>
                    {canDelete && (
                        <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Opportunity
                            </DropdownMenuItem>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            <EditOpportunityDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                opportunity={opportunity}
            />

            <ViewOpportunityDialog
                open={isViewOpen}
                onOpenChange={setIsViewOpen}
                opportunity={opportunity}
            />

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={() => deleteMutation.mutate()}
                title="Delete Opportunity"
                description="Are you sure you want to delete this opportunity? This action cannot be undone."
                confirmText="Delete Opportunity"
                isDeleting={deleteMutation.isPending}
            />
        </>
    )
}
