import React, { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { getUsers } from "@/services/userService"
import { bulkLeadAction } from "@/services/leadService"
import { toast } from "sonner"
import { Loader2, Users } from "lucide-react"

interface BulkAssignDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    selectedLeads: string[]
    onSuccess: () => void
}

export function BulkAssignDialog({
    open,
    onOpenChange,
    selectedLeads,
    onSuccess,
}: BulkAssignDialogProps) {
    const [users, setUsers] = useState<any[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string>("")
    const [loading, setLoading] = useState(false)
    const [fetchingUsers, setFetchingUsers] = useState(false)

    useEffect(() => {
        if (open) {
            fetchUsers()
        }
    }, [open])

    const fetchUsers = async () => {
        setFetchingUsers(true)
        try {
            const data = await getUsers()
            setUsers(data.users || [])
        } catch (error) {
            console.error("Failed to fetch users:", error)
            toast.error("Failed to load users list")
        } finally {
            setFetchingUsers(false)
        }
    }

    const handleAssign = async () => {
        if (!selectedUserId) {
            toast.error("Please select a user")
            return
        }

        setLoading(true)
        try {
            await bulkLeadAction("assign", selectedLeads, { assignedToId: selectedUserId })
            toast.success(`Successfully assigned ${selectedLeads.length} leads`)
            onSuccess()
            onOpenChange(false)
            setSelectedUserId("")
        } catch (error: any) {
            console.error("Bulk assignment failed:", error)
            toast.error(error.message || "Failed to assign leads")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Bulk Assign Leads
                    </DialogTitle>
                    <DialogDescription>
                        Reassign {selectedLeads.length} selected leads to a specific team member.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Select User
                        </label>
                        <Select
                            value={selectedUserId}
                            onValueChange={setSelectedUserId}
                            disabled={fetchingUsers || loading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={fetchingUsers ? "Loading users..." : "Select a team member"} />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName} ({user.role?.name || user.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleAssign}
                        disabled={loading || !selectedUserId}
                        className="bg-primary text-primary-foreground"
                    >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Assign Leads
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
