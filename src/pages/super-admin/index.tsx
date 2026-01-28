
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { api } from "@/services/api"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
    Building,
    Plus,
    Search,
    Trash2,
    Edit,
    Eye
} from "lucide-react"

// Types
interface Plan {
    id: string;
    name: string;
    price: number;
    billingType: 'flat_rate' | 'per_user';
    durationDays: number;
    maxUsers: number;
    isActive: boolean;
}

export default function SuperAdminDashboard() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedOrg, setSelectedOrg] = useState<any>(null)
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)

    // Dialog States
    const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false)
    const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'org' | 'plan' } | null>(null)

    const queryClient = useQueryClient()
    const navigate = useNavigate()

    // --- Queries ---

    // Helper to get headers
    const getAuthHeaders = () => {
        const userInfo = localStorage.getItem('userInfo');
        const token = userInfo ? JSON.parse(userInfo).token : null;
        return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
    };
    const { data: organisations = [], isLoading: isLoadingOrgs } = useQuery({
        queryKey: ['organisations', 'all'],
        queryFn: async () => (await api.get('/organisation/all', getAuthHeaders())).data
    })

    const { data: plansData, isLoading: isLoadingPlans } = useQuery({
        queryKey: ['plans', 'all'],
        queryFn: async () => (await api.get('/super-admin/plans', getAuthHeaders())).data
    })

    // Safety check for plans array
    const plans = plansData?.plans || [];

    // --- Mutations ---

    // Organisations
    const createOrgMutation = useMutation({
        mutationFn: (data: any) => api.post('/organisation', data, getAuthHeaders()),
        onSuccess: (res) => {
            queryClient.invalidateQueries({ queryKey: ['organisations'] })
            setIsOrgDialogOpen(false)
            toast.success('Organisation created', { description: `Password: ${res.data.tempPassword}` })
        },
        onError: (error: any) => {
            console.error('Create organisation failed:', error);
            toast.error(error.response?.data?.message || 'Failed to create organisation');
        }
    })

    const updateOrgMutation = useMutation({
        mutationFn: (data: any) => api.put(`/super-admin/organisations/${selectedOrg.id}`, data, getAuthHeaders()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organisations'] })
            setIsOrgDialogOpen(false)
            toast.success('Organisation updated')
        },
        onError: (error: any) => {
            console.error('Update organisation failed:', error);
            toast.error(error.response?.data?.message || 'Failed to update organisation');
        }
    })

    const deleteOrgMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/super-admin/organisations/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organisations'] })
            setIsDeleteDialogOpen(false)
            toast.success('Organisation deleted')
        },
        onError: (error: any) => {
            console.error('Delete organisation failed:', error);
            toast.error(error.response?.data?.message || 'Failed to delete organisation');
            setIsDeleteDialogOpen(false)
        }
    })

    // Plans
    const createPlanMutation = useMutation({
        mutationFn: (data: any) => api.post('/super-admin/plans', data, getAuthHeaders()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] })
            setIsPlanDialogOpen(false)
            toast.success('Plan created')
        }
    })

    const updatePlanMutation = useMutation({
        mutationFn: (data: any) => api.put(`/super-admin/plans/${selectedPlan?.id}`, data, getAuthHeaders()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] })
            setIsPlanDialogOpen(false)
            toast.success('Plan updated')
        }
    })

    const deletePlanMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/super-admin/plans/${id}`, getAuthHeaders()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] })
            setIsDeleteDialogOpen(false)
            toast.success('Plan deactivated')
        }
    })

    // --- Handlers ---

    const handleOrgSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)

        if (selectedOrg) {
            // Update existing org - include all editable fields
            const data = {
                name: fd.get('name'),
                contactEmail: fd.get('email'),
                contactPhone: fd.get('phone') || undefined,
                address: fd.get('address') || undefined,
                userLimit: Number(fd.get('userLimit')) || 5,
                status: fd.get('status'),
                planId: fd.get('planId') || undefined,
                // Correctly nest subscription update
                subscription: {
                    ...(selectedOrg.subscription as object || {}),
                    status: fd.get('subscriptionStatus')
                },
            }
            updateOrgMutation.mutate(data)
        } else {
            // Create new org
            const data = {
                name: fd.get('name'),
                email: fd.get('email'),
                firstName: fd.get('firstName'),
                lastName: fd.get('lastName'),
                password: fd.get('password'),
            }
            createOrgMutation.mutate(data)
        }
    }

    const handlePlanSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const data = {
            name: fd.get('name'),
            price: Number(fd.get('price')),
            durationDays: Number(fd.get('durationDays')),
            maxUsers: Number(fd.get('maxUsers')),
            billingType: fd.get('billingType')
        }

        if (selectedPlan) {
            updatePlanMutation.mutate(data)
        } else {
            createPlanMutation.mutate(data)
        }
    }

    const confirmDelete = () => {
        if (!itemToDelete) return
        if (itemToDelete.type === 'org') deleteOrgMutation.mutate(itemToDelete.id)
        if (itemToDelete.type === 'plan') deletePlanMutation.mutate(itemToDelete.id)
    }

    // Filter
    const filteredOrgs = organisations.filter((org: any) =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="flex h-screen overflow-hidden bg-[#fdfbf7] dark:bg-stone-900">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-4xl font-serif text-stone-800 dark:text-stone-100">Super Admin</h1>
                            <p className="text-stone-500 font-serif italic">Platform management</p>
                        </div>

                        <Tabs defaultValue="organisations" className="space-y-6">
                            <TabsList className="bg-[#f4f1ea] dark:bg-stone-800 border border-stone-300">
                                <TabsTrigger value="organisations" className="font-serif data-[state=active]:bg-white">Organisations</TabsTrigger>
                                <TabsTrigger value="plans" className="font-serif data-[state=active]:bg-white">License Plans</TabsTrigger>
                            </TabsList>

                            {/* ORGANISATIONS TAB */}
                            <TabsContent value="organisations" className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="relative w-72">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Search organisations..."
                                            className="pl-10"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Button onClick={() => { setSelectedOrg(null); setIsOrgDialogOpen(true) }} className="bg-stone-800 text-white font-serif uppercase tracking-wider hover:bg-stone-700">
                                        <Plus className="h-4 w-4 mr-2" />Onboard Client
                                    </Button>
                                </div>

                                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {isLoadingOrgs ? <p>Loading...</p> : filteredOrgs.map((org: any) => (
                                        <Card key={org.id} className="bg-white border-2 border-stone-300 shadow-[3px_3px_0px_0px_rgba(120,113,108,0.5)] hover:shadow-[5px_5px_0px_0px_rgba(120,113,108,0.7)] transition-shadow group cursor-pointer" onClick={() => navigate(`/super-admin/organisation/${org.id}`)}>
                                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                <CardTitle className="text-lg font-serif font-bold truncate pr-4 text-stone-800">{org.name}</CardTitle>
                                                <Building className="h-4 w-4 text-muted-foreground" />
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-sm text-muted-foreground mb-4">{org.slug}</div>
                                                <div className="flex items-center justify-between mb-4">
                                                    <Badge variant={org.status === 'active' ? 'default' : 'secondary'}>{org.status}</Badge>
                                                    <span className="text-xs text-gray-500">
                                                        {org.userCount || 0} / {org.userLimit || 5} users
                                                    </span>
                                                </div>
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/super-admin/organisation/${org.id}`) }}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setSelectedOrg(org); setIsOrgDialogOpen(true) }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600"
                                                        onClick={(e) => { e.stopPropagation(); setItemToDelete({ id: org.id, type: 'org' }); setIsDeleteDialogOpen(true) }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>

                            {/* PLANS TAB */}
                            <TabsContent value="plans" className="space-y-6">
                                <div className="flex justify-end">
                                    <Button onClick={() => { setSelectedPlan(null); setIsPlanDialogOpen(true) }}>
                                        <Plus className="h-4 w-4 mr-2" />Create Plan
                                    </Button>
                                </div>

                                <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
                                    {isLoadingPlans ? <p>Loading...</p> : plans.map((plan: Plan) => (
                                        <Card key={plan.id} className={`bg-white border-2 border-stone-300 shadow-[3px_3px_0px_0px_rgba(120,113,108,0.5)] hover:shadow-[5px_5px_0px_0px_rgba(120,113,108,0.7)] transition-all ${!plan.isActive ? 'opacity-60 grayscale' : ''}`}>
                                            <CardHeader>
                                                <CardTitle className="flex justify-between items-center">
                                                    {plan.name}
                                                    {plan.isActive && <div className="h-2 w-2 rounded-full bg-green-500" />}
                                                </CardTitle>
                                                <CardDescription>
                                                    <span className="text-2xl font-bold text-foreground">₹{plan.price}</span>
                                                    <span className="text-xs ml-1">/{plan.durationDays} days</span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 text-sm text-gray-600 mb-6">
                                                    <div className="flex justify-between">
                                                        <span>Max Users:</span>
                                                        <span className="font-medium">{plan.maxUsers}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Billing:</span>
                                                        <span className="capitalize">{plan.billingType.replace('_', ' ')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" className="flex-1" onClick={() => { setSelectedPlan(plan); setIsPlanDialogOpen(true) }}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-red-500"
                                                        onClick={() => { setItemToDelete({ id: plan.id, type: 'plan' }); setIsDeleteDialogOpen(true) }}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* ORGANISATION DIALOG */}
                        <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
                            <DialogContent>
                                <form onSubmit={handleOrgSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>{selectedOrg ? 'Edit Organisation' : 'New Organisation'}</DialogTitle>
                                        <DialogDescription>
                                            {selectedOrg ? 'Update the details of the organisation.' : 'Enter details to onboard a new client organisation.'}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input name="name" defaultValue={selectedOrg?.name} required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Contact Email</Label>
                                            <Input name="email" type="email" defaultValue={selectedOrg?.contactEmail} required />
                                        </div>
                                        {!selectedOrg ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div><Label>Admin First Name</Label><Input name="firstName" required /></div>
                                                    <div><Label>Admin Last Name</Label><Input name="lastName" required /></div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Temp Password</Label>
                                                    <Input name="password" placeholder="Leave empty to auto-generate" />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                {/* Edit Mode: Show all org fields */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>User Limit</Label>
                                                        <Input name="userLimit" type="number" defaultValue={selectedOrg?.userLimit || 5} min={1} required />
                                                        <p className="text-xs text-muted-foreground">Max users this org can create</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Current Users</Label>
                                                        <Input value={selectedOrg?.userCount || 0} disabled className="bg-muted" />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label>Org Status</Label>
                                                        <Select name="status" defaultValue={selectedOrg?.status || 'active'}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                                <SelectItem value="suspended">Suspended</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Subscription Status</Label>
                                                        <Select name="subscriptionStatus" defaultValue={selectedOrg?.subscription?.status || 'trial'}>
                                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="trial">Trial</SelectItem>
                                                                <SelectItem value="expired">Expired</SelectItem>
                                                                <SelectItem value="cancelled">Cancelled</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2 pt-2">
                                                    <Label>Assign Plan (License)</Label>
                                                    <Select name="planId">
                                                        <SelectTrigger><SelectValue placeholder="Select a plan to assign" /></SelectTrigger>
                                                        <SelectContent>
                                                            {plans.map((plan: any) => (
                                                                <SelectItem key={plan.id} value={plan.id}>{plan.name} ({plan.maxUsers} Users - {plan.durationDays} Days)</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-xs text-muted-foreground">Assigning a plan will update user limits and set status to active.</p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Contact Phone</Label>
                                                    <Input name="phone" defaultValue={selectedOrg?.contactPhone} placeholder="+91 XXXXX XXXXX" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Address</Label>
                                                    <Input name="address" defaultValue={selectedOrg?.address} placeholder="Business address" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={createOrgMutation.isPending || updateOrgMutation.isPending}>
                                            {selectedOrg ? 'Save Changes' : 'Create Organisation'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* PLAN DIALOG */}
                        <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                            <DialogContent>
                                <form onSubmit={handlePlanSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>{selectedPlan ? 'Edit Plan' : 'New Subscription Plan'}</DialogTitle>
                                        <DialogDescription>
                                            {selectedPlan ? 'Modify the subscription plan details.' : 'Create a new subscription pricing plan.'}
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Plan Name</Label>
                                            <Input name="name" defaultValue={selectedPlan?.name} placeholder="e.g. Pro Plan" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Price (₹)</Label>
                                                <Input name="price" type="number" defaultValue={selectedPlan?.price} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Duration (Days)</Label>
                                                <Input name="durationDays" type="number" defaultValue={selectedPlan?.durationDays || 30} required />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Max Users</Label>
                                                <Input name="maxUsers" type="number" defaultValue={selectedPlan?.maxUsers || 5} required />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Billing Type</Label>
                                                <Select name="billingType" defaultValue={selectedPlan?.billingType || "flat_rate"}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="flat_rate">Flat Rate</SelectItem>
                                                        <SelectItem value="per_user">Per User</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={createPlanMutation.isPending || updatePlanMutation.isPending}>
                                            {selectedPlan ? 'Save Changes' : 'Create Plan'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* DELETE DIALOG */}
                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Are you sure?</DialogTitle>
                                    <DialogDescription>
                                        This action cannot be undone. This will permanently delete the
                                        {itemToDelete?.type === 'org' ? ' organisation and all its data' : ' license plan'}.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4"></div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
                                    <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </div>
                </main>
            </div>
        </div>
    )
}
