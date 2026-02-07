import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Loader2, Check, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';

interface Plan {
    id: string;
    name: string;
    description?: string;
    price: number;
    durationDays: number;
    maxUsers: number;
    maxLeads: number;
    maxContacts: number;
    maxStorage: number;
    isActive: boolean;
    currency: string;
}

interface PlanFormData {
    name: string;
    description: string;
    price: number;
    durationDays: number;
    maxUsers: number;
    maxLeads: number;
    maxContacts: number;
    maxStorage: number;
}

export function PlansManagement() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const queryClient = useQueryClient();

    const { data: plans, isLoading } = useQuery({
        queryKey: ['plans'],
        queryFn: async () => {
            const res = await api.get('/super-admin/plans');
            return res.data.plans;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: PlanFormData) => {
            await api.post('/super-admin/plans', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
            toast.success('Plan created successfully');
            setIsCreateOpen(false);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create plan')
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<PlanFormData> }) => {
            await api.put(`/super-admin/plans/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
            toast.success('Plan updated successfully');
            setEditingPlan(null);
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update plan')
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/super-admin/plans/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plans'] });
            toast.success('Plan deactivated successfully');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete plan')
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Subscription Plans</h2>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" /> Create Plan
                </Button>
            </div>

            <div className="rounded-md border border-indigo-900/50 bg-[#1e1b4b]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-indigo-800 hover:bg-indigo-900/30">
                            <TableHead className="text-slate-300">Name</TableHead>
                            <TableHead className="text-slate-300">Price</TableHead>
                            <TableHead className="text-slate-300">Duration</TableHead>
                            <TableHead className="text-slate-300">Limits (Users/Leads/Storage)</TableHead>
                            <TableHead className="text-slate-300">Status</TableHead>
                            <TableHead className="text-right text-slate-300">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-400">Loading...</TableCell>
                            </TableRow>
                        ) : plans?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-slate-400">No plans found</TableCell>
                            </TableRow>
                        ) : (
                            plans?.map((plan: Plan) => (
                                <TableRow key={plan.id} className="border-indigo-800/50 hover:bg-indigo-900/20">
                                    <TableCell className="font-medium text-white">
                                        {plan.name}
                                        {plan.description && <div className="text-xs text-slate-400">{plan.description}</div>}
                                    </TableCell>
                                    <TableCell className="text-slate-300">
                                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: plan.currency }).format(plan.price)}
                                    </TableCell>
                                    <TableCell className="text-slate-300">{plan.durationDays} days</TableCell>
                                    <TableCell className="text-slate-300 text-xs">
                                        Users: {plan.maxUsers} <br />
                                        Leads: {plan.maxLeads} <br />
                                        Storage: {plan.maxStorage}MB
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={plan.isActive ? 'default' : 'secondary'} className={plan.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'}>
                                            {plan.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#1e1b4b] border-indigo-800 text-slate-200">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setEditingPlan(plan)} className="hover:bg-indigo-800 cursor-pointer">
                                                    Edit
                                                </DropdownMenuItem>
                                                {plan.isActive && (
                                                    <DropdownMenuItem onClick={() => deleteMutation.mutate(plan.id)} className="text-red-400 hover:bg-red-900/30 cursor-pointer">
                                                        Deactivate
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <PlanDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSubmit={(data) => createMutation.mutate(data as PlanFormData)}
                isLoading={createMutation.isPending}
                mode="create"
            />

            {editingPlan && (
                <PlanDialog
                    open={!!editingPlan}
                    onOpenChange={(open) => !open && setEditingPlan(null)}
                    onSubmit={(data) => updateMutation.mutate({ id: editingPlan.id, data })}
                    isLoading={updateMutation.isPending}
                    initialData={editingPlan}
                    mode="edit"
                />
            )}
        </div>
    );
}

function PlanDialog({ open, onOpenChange, onSubmit, isLoading, initialData, mode }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: PlanFormData) => void;
    isLoading: boolean;
    initialData?: Plan;
    mode: 'create' | 'edit';
}) {
    const { register, handleSubmit, formState: { errors } } = useForm<PlanFormData>({
        defaultValues: initialData || {
            name: '',
            description: '',
            price: 0,
            durationDays: 30,
            maxUsers: 5,
            maxLeads: 1000,
            maxContacts: 5000,
            maxStorage: 1000
        }
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-[#1e1b4b] border-indigo-800 text-slate-100">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Create Subscription Plan' : 'Edit Subscription Plan'}</DialogTitle>
                    <DialogDescription className="text-indigo-300/70">
                        Define the limits and pricing for this plan.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Plan Name</Label>
                            <Input {...register('name', { required: 'Name is required' })} className="bg-[#0f172a] border-indigo-900/50" />
                            {errors.name && <span className="text-red-400 text-xs">{errors.name.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label>Price (INR)</Label>
                            <Input type="number" {...register('price', { valueAsNumber: true })} className="bg-[#0f172a] border-indigo-900/50" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input {...register('description')} className="bg-[#0f172a] border-indigo-900/50" />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Duration (Days)</Label>
                            <Input type="number" {...register('durationDays', { valueAsNumber: true })} className="bg-[#0f172a] border-indigo-900/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Users</Label>
                            <Input type="number" {...register('maxUsers', { valueAsNumber: true })} className="bg-[#0f172a] border-indigo-900/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Leads</Label>
                            <Input type="number" {...register('maxLeads', { valueAsNumber: true })} className="bg-[#0f172a] border-indigo-900/50" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Max Contacts</Label>
                            <Input type="number" {...register('maxContacts', { valueAsNumber: true })} className="bg-[#0f172a] border-indigo-900/50" />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Storage (MB)</Label>
                            <Input type="number" {...register('maxStorage', { valueAsNumber: true })} className="bg-[#0f172a] border-indigo-900/50" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-indigo-200">Cancel</Button>
                        <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'create' ? 'Create Plan' : 'Update Plan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
