import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Mail, Shield, User, Search, Building } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface TeamMember {
    id: string
    firstName: string
    lastName: string
    email: string
    role: {
        id: string
        name: string
    }
    position?: string
    avatar?: string
    isActive: boolean
    reportsTo?: {
        id: string
        firstName: string
        lastName: string
    }
    branch?: {
        id: string
        name: string
    }
}

export default function TeamSettings() {
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const queryClient = useQueryClient()

    const { data: userData, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await api.get('/users')
            return res.data
        }
    })

    const { data: branches } = useQuery({
        queryKey: ['branches'],
        queryFn: async () => {
            const res = await api.get('/branches');
            return res.data;
        }
    });

    const members = userData?.users || []

    const filteredMembers = members.filter((member: TeamMember) =>
        member.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const inviteMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.post('/users/invite', data)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast.success("Team member invited successfully")
            setIsInviteOpen(false)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to invite team member")
        }
    })

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            const res = await api.put(`/users/${editingMember?.id}`, data)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] })
            toast.success("Team member updated successfully")
            setIsInviteOpen(false)
            setEditingMember(null)
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update team member")
        }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const data = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            role: formData.get('role'),
            position: formData.get('position'),
            branchId: formData.get('branchId') === 'none' ? null : formData.get('branchId'),
            reportsTo: formData.get('reportsTo') === 'none' ? null : formData.get('reportsTo'),
        }

        if (editingMember) {
            updateMutation.mutate(data)
        } else {
            inviteMutation.mutate(data)
        }
    }

    const openEdit = (member: TeamMember) => {
        setEditingMember(member)
        setIsInviteOpen(true)
    }

    const openInvite = () => {
        setEditingMember(null)
        setIsInviteOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-medium text-foreground">Team Members</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage your team, assign roles, and control access.
                    </p>
                </div>
                <Button onClick={openInvite} className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Invite Member
                </Button>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search team members..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border border-border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Member</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Branch</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">
                                    Loading team members...
                                </TableCell>
                            </TableRow>
                        ) : filteredMembers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No team members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredMembers.map((member: TeamMember) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={member.avatar} />
                                                <AvatarFallback>
                                                    {member.firstName[0]}{member.lastName[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium text-foreground">
                                                    {member.firstName} {member.lastName}
                                                </div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Mail className="h-3 w-3" />
                                                    {member.email}
                                                </div>
                                                {member.position && (
                                                    <div className="text-xs text-muted-foreground mt-0.5">
                                                        {member.position}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <span className="capitalize">{member.role.name.replace('_', ' ')}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {member.branch ? (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Building className="h-3 w-3 text-muted-foreground" />
                                                {member.branch.name}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={member.isActive ? "default" : "secondary"} className={member.isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 border-0" : ""}>
                                            {member.isActive ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(member)}>
                                                <Pencil className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingMember ? 'Edit Team Member' : 'Invite Team Member'}</DialogTitle>
                        <DialogDescription>
                            {editingMember ? 'Update member details and permissions.' : 'Add a new member to your organization.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <Input
                                    id="firstName"
                                    name="firstName"
                                    defaultValue={editingMember?.firstName}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    name="lastName"
                                    defaultValue={editingMember?.lastName}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                defaultValue={editingMember?.email}
                                required
                                disabled={!!editingMember}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="position">Job Title / Position</Label>
                            <Input
                                id="position"
                                name="position"
                                defaultValue={editingMember?.position}
                                placeholder="e.g. Sales Manager"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select name="role" defaultValue={editingMember?.role.name || "sales_rep"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="sales_manager">Sales Manager</SelectItem>
                                        <SelectItem value="sales_rep">Sales Representative</SelectItem>
                                        <SelectItem value="viewer">Viewer (Read Only)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branchId">Branch</Label>
                                <Select name="branchId" defaultValue={editingMember?.branch?.id || "none"}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Branch</SelectItem>
                                        {branches?.map((branch: any) => (
                                            <SelectItem key={branch.id} value={branch.id}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reportsTo">Reports To</Label>
                            <Select name="reportsTo" defaultValue={editingMember?.reportsTo?.id || "none"}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a manager" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No Manager</SelectItem>
                                    {members
                                        .filter((m: TeamMember) => m.id !== editingMember?.id) // Prevent self-reporting
                                        .map((member: TeamMember) => (
                                            <SelectItem key={member.id} value={member.id}>
                                                {member.firstName} {member.lastName}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Assigning a manager creates a reporting hierarchy.
                        </p>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={inviteMutation.isPending || updateMutation.isPending}>
                                {editingMember ? 'Update Member' : 'Send Invite'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
