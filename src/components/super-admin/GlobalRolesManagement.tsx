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
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, MoreHorizontal, Loader2, ShieldCheck, Info } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Role {
    id: string;
    roleKey: string;
    name: string;
    description?: string;
    permissions: string[];
    isSystemRole: boolean;
}

interface RoleFormData {
    roleKey: string;
    name: string;
    description: string;
    permissions: string; // Comma separated for UI
}

export function GlobalRolesManagement() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const queryClient = useQueryClient();

    const { data: roles, isLoading } = useQuery({
        queryKey: ['global-roles'],
        queryFn: async () => {
            const res = await api.get('/super-admin/roles');
            return res.data.roles;
        }
    });

    const upsertMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/super-admin/roles', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['global-roles'] });
            toast.success('Global role updated successfully');
            setIsCreateOpen(false);
            setEditingRole(null);
        },
        onError: (err: { response?: { data?: { message?: string } } }) =>
            toast.error(err.response?.data?.message || 'Failed to update global role')
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-white">Global Role Templates</h2>
                    <p className="text-slate-400 text-sm">System-wide role definitions that organisations can use or override.</p>
                </div>
                <Button onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Plus className="h-4 w-4 mr-2" /> Create Global Role
                </Button>
            </div>

            <div className="rounded-md border border-indigo-900/50 bg-[#1e1b4b]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-indigo-800 hover:bg-indigo-900/30">
                            <TableHead className="text-slate-300">Role Name</TableHead>
                            <TableHead className="text-slate-300">Key</TableHead>
                            <TableHead className="text-slate-300">Permissions</TableHead>
                            <TableHead className="text-slate-300">Type</TableHead>
                            <TableHead className="text-right text-slate-300">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-400">Loading...</TableCell>
                            </TableRow>
                        ) : roles?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-slate-400">No global roles found</TableCell>
                            </TableRow>
                        ) : (
                            roles?.map((role: Role) => (
                                <TableRow key={role.id} className="border-indigo-800/50 hover:bg-indigo-900/20">
                                    <TableCell className="font-medium text-white">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-indigo-400" />
                                            {role.name}
                                        </div>
                                        {role.description && <div className="text-xs text-slate-400 ml-6">{role.description}</div>}
                                    </TableCell>
                                    <TableCell className="text-slate-400 font-mono text-xs">{role.roleKey}</TableCell>
                                    <TableCell className="text-slate-300">
                                        <div className="flex flex-wrap gap-1">
                                            {role.permissions.map((p, i) => (
                                                <Badge key={i} variant="secondary" className="bg-indigo-900/50 text-indigo-300 text-[10px] border-indigo-700/50">
                                                    {p}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={role.isSystemRole ? 'outline' : 'default'} className={role.isSystemRole ? 'border-indigo-700 text-indigo-300' : 'bg-indigo-600'}>
                                            {role.isSystemRole ? 'System' : 'Custom'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="bg-[#1e1b4b] border-indigo-800 text-slate-200">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setEditingRole(role)} className="cursor-pointer hover:bg-indigo-800">
                                                    Edit Template
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Card className="bg-indigo-950/20 border-indigo-900/30">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                        <Info className="h-4 w-4" /> About Global Roles
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Global roles serve as templates. When a core organisation is created, it inherits these roles.
                        Organisation admins can override these templates with custom names or permissions for their specific needs.
                        Changes to global roles will NOT automatically propagate to existing organisation overrides.
                    </p>
                </CardContent>
            </Card>

            <RoleDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                onSubmit={(data) => upsertMutation.mutate(data)}
                isLoading={upsertMutation.isPending}
                mode="create"
            />

            {editingRole && (
                <RoleDialog
                    open={!!editingRole}
                    onOpenChange={(open) => !open && setEditingRole(null)}
                    onSubmit={(data) => upsertMutation.mutate(data)}
                    isLoading={upsertMutation.isPending}
                    initialData={editingRole}
                    mode="edit"
                />
            )}
        </div>
    );
}

function RoleDialog({ open, onOpenChange, onSubmit, isLoading, initialData, mode }: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: any) => void;
    isLoading: boolean;
    initialData?: Role;
    mode: 'create' | 'edit';
}) {
    const { register, handleSubmit, formState: { errors } } = useForm<RoleFormData>({
        defaultValues: initialData ? {
            roleKey: initialData.roleKey,
            name: initialData.name,
            description: initialData.description || '',
            permissions: initialData.permissions.join(', ')
        } : {
            roleKey: '',
            name: '',
            description: '',
            permissions: ''
        }
    });

    const onFormSubmit = (data: RoleFormData) => {
        onSubmit({
            ...data,
            permissions: data.permissions.split(',').map(p => p.trim()).filter(Boolean),
            isSystemRole: true
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-[#0f172a] border-indigo-900/50 text-white">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Create Global Role Template' : 'Edit Global Role Template'}</DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Define a platform-wide role template.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Role Key (Immutable ID)</Label>
                        <Input
                            {...register('roleKey', { required: 'Key is required' })}
                            placeholder="e.g. sales_manager"
                            className="bg-[#1e1b4b] border-indigo-900/50 text-white"
                            disabled={mode === 'edit'}
                        />
                        {errors.roleKey && <span className="text-red-400 text-xs">{errors.roleKey.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label>Role Name</Label>
                        <Input
                            {...register('name', { required: 'Name is required' })}
                            placeholder="e.g. Sales Manager"
                            className="bg-[#1e1b4b] border-indigo-900/50 text-white"
                        />
                        {errors.name && <span className="text-red-400 text-xs">{errors.name.message}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                            {...register('description')}
                            placeholder="Brief role description"
                            className="bg-[#1e1b4b] border-indigo-900/50 text-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Permissions (Comma separated)</Label>
                        <Input
                            {...register('permissions', { required: 'At least one permission is required' })}
                            placeholder="leads:read, leads:*, contacts:read"
                            className="bg-[#1e1b4b] border-indigo-900/50 text-white"
                        />
                        <p className="text-[10px] text-slate-500">Enable features using glob patterns (e.g., `leads:*`). Use `*` for full system access.</p>
                        {errors.permissions && <span className="text-red-400 text-xs">{errors.permissions.message}</span>}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">Cancel</Button>
                        <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {mode === 'create' ? 'Create Template' : 'Update Template'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
