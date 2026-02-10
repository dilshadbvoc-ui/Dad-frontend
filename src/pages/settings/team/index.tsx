import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getUsers, inviteUser, updateUser, deactivateUser, type User, type InviteUserData } from "@/services/settingsService"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, MoreVertical, UserX, Edit } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { toast } from "sonner"

export default function TeamSettingsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const queryClient = useQueryClient()

    // Get current user role from localStorage
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const currentUserRole = userInfo?.role || '';
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';

    const { data, isLoading } = useQuery({
        queryKey: ['users'],
        queryFn: getUsers
    })

    const users = data?.users || []

    const inviteMutation = useMutation({
        mutationFn: (data: InviteUserData) => inviteUser(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setIsDialogOpen(false); toast.success('User invited') },
        onError: () => toast.error('Failed to invite user')
    })

    const updateMutation = useMutation({
        mutationFn: (data: Partial<User> & { id: string }) => updateUser(data.id, data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); setIsDialogOpen(false); toast.success('User updated') },
        onError: () => toast.error('Failed to update user')
    })

    const deactivateMutation = useMutation({
        mutationFn: (id: string) => deactivateUser(id),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['users'] }); toast.success('User deactivated') }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const quotaValue = formData.get('dailyLeadQuota') as string;
        const userData = {
            firstName: formData.get('firstName') as string,
            lastName: formData.get('lastName') as string,
            email: formData.get('email') as string,
            position: formData.get('position') as string,
            reportsTo: formData.get('reportsTo') === 'none' ? undefined : formData.get('reportsTo') as string,
            role: formData.get('role') as string,
            password: formData.get('password') as string,
            dailyLeadQuota: quotaValue ? parseInt(quotaValue) : null
        }

        if (selectedUser) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updateMutation.mutate({ ...userData, id: selectedUser.id } as any)
        } else {
            inviteMutation.mutate(userData)
        }
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div><h1 className="text-3xl font-bold text-foreground">Team</h1><p className="text-muted-foreground">Manage your team members</p></div>
                            {isAdmin && (
                                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                    <DialogTrigger asChild><Button onClick={() => setSelectedUser(null)}><Plus className="h-4 w-4 mr-2" />Add Member</Button></DialogTrigger>
                                    <DialogContent>
                                        <form onSubmit={handleSubmit}>
                                            <DialogHeader>
                                                <DialogTitle>{selectedUser ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
                                                <DialogDescription>
                                                    {selectedUser ? 'Modify user details, role, and password.' : 'Add a new member to your team.'}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="grid gap-4 py-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><Label>First Name</Label><Input name="firstName" defaultValue={selectedUser?.firstName} required /></div>
                                                    <div><Label>Last Name</Label><Input name="lastName" defaultValue={selectedUser?.lastName} required /></div>
                                                </div>
                                                <div><Label>Email</Label><Input name="email" type="email" defaultValue={selectedUser?.email} required /></div>
                                                <div><Label>Job Title</Label><Input name="position" defaultValue={selectedUser?.position || ''} placeholder="e.g. Sales Manager" /></div>

                                                <div>
                                                    <Label>Reports To (Manager)</Label>
                                                    <Select name="reportsTo" defaultValue={selectedUser?.reportsTo?.id || "none"}>
                                                        <SelectTrigger><SelectValue placeholder="Select a manager" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">No Manager</SelectItem>
                                                            {users.filter((u: User) => u.id !== selectedUser?.id).map((u: User) => (
                                                                <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div>
                                                    <Label>Role</Label>
                                                    <Select name="role" defaultValue={selectedUser?.role?.name || "sales_rep"}>
                                                        <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="sales_rep">Sales Rep (Field Force)</SelectItem>
                                                            <SelectItem value="manager">Manager</SelectItem>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div><Label>Password</Label><Input name="password" type="password" placeholder={selectedUser ? "Leave empty to keep current" : "Leave empty to auto-generate"} /></div>

                                                <div>
                                                    <Label>Daily Lead Quota</Label>
                                                    <Input
                                                        name="dailyLeadQuota"
                                                        type="number"
                                                        min="0"
                                                        defaultValue={selectedUser?.dailyLeadQuota ?? ''}
                                                        placeholder="Leave empty for unlimited"
                                                    />
                                                    <p className="text-xs text-muted-foreground mt-1">Max leads per day via auto-assignment (empty = unlimited)</p>
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit" disabled={updateMutation.isPending || inviteMutation.isPending}>
                                                    <Plus className="h-4 w-4 mr-2" />{selectedUser ? 'Save Changes' : 'Add Member'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Team Members ({users.length})</CardTitle></CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="flex justify-center p-12"><div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>
                                ) : users.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No team members yet</p></div>
                                ) : (
                                    <div className="space-y-3">
                                        {users.map((user: User) => (
                                            <div key={user.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-10 w-10"><AvatarFallback className="bg-primary/10 text-primary">{user.firstName?.[0]}{user.lastName?.[0]}</AvatarFallback></Avatar>
                                                    <div>
                                                        <Link to={`/users/${user.id}`} className="hover:underline font-semibold">{user.firstName} {user.lastName}</Link>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Badge variant={user.isActive ? "default" : "secondary"}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
                                                    {user.dailyLeadQuota !== undefined && user.dailyLeadQuota !== null ? (
                                                        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary">
                                                            Quota: {user.dailyLeadQuota}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground">No Quota</Badge>
                                                    )}
                                                    {user.userId && <Badge variant="outline" className="font-mono text-xs">{user.userId}</Badge>}
                                                    {user.role && <Badge variant="secondary">{user.role.name}</Badge>}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => { setSelectedUser(user); setIsDialogOpen(true) }}><Edit className="h-4 w-4 mr-2" />Edit Details</DropdownMenuItem>
                                                            <DropdownMenuItem className="text-red-600" onClick={() => deactivateMutation.mutate(user.id)}><UserX className="h-4 w-4 mr-2" />Deactivate</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    )
}
