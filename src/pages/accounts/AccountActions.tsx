import { copyToClipboard } from "@/lib/utils";
import { useState } from "react"
import { MoreHorizontal, Copy, Eye, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { type Account, deleteAccount } from "@/services/accountService"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { useNavigate } from "react-router-dom"

import { DeleteConfirmationDialog } from "@/components/shared/DeleteConfirmationDialog"

interface AccountActionsProps {
    account: Account
}

export function AccountActions({ account }: AccountActionsProps) {
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [isOpen, setIsOpen] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    // Helper to get user role
    const getUserRole = () => {
        try {
            const userInfo = localStorage.getItem('userInfo');
            if (userInfo) {
                const user = JSON.parse(userInfo);
                return user.role; // 'super_admin' | 'admin' | 'user' ...
            }
        } catch (e) {
            console.error("Failed to parse user info", e);
        }
        return null;
    };

    const role = getUserRole();
    const canDelete = role === 'super_admin' || role === 'admin';

    const deleteMutation = useMutation({
        mutationFn: () => deleteAccount(account.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accounts"] })
            toast.success("Account deleted successfully")
            setIsOpen(false)
        },
        onError: (error: unknown) => {
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to delete account")
        },
    })

    const handleDelete = () => {
        setShowDeleteDialog(true)
    }

    return (
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => copyToClipboard(account.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(`/accounts/${account.id}`)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                </DropdownMenuItem>
                {canDelete && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Account
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>

            <DeleteConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                onConfirm={() => deleteMutation.mutate()}
                title="Delete Account"
                description="Are you sure you want to delete this account? This action cannot be undone."
                confirmText="Delete Account"
                isDeleting={deleteMutation.isPending}
            />
        </DropdownMenu>
    )
}
