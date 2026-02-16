import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface EditOrganisationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    organisation: {
        id: string;
        name: string;
        slug: string;
        contactEmail?: string;
        contactPhone?: string;
        address?: string;
        userLimit: number;
    };
}

interface EditOrgFormData {
    name: string;
    slug: string;
    contactEmail: string;
    contactPhone: string;
    address: string;
    userLimit: number;
}

export function EditOrganisationDialog({
    open,
    onOpenChange,
    organisation
}: EditOrganisationDialogProps) {
    const queryClient = useQueryClient();
    const { register, handleSubmit, reset, formState: { errors } } = useForm<EditOrgFormData>({
        defaultValues: {
            name: organisation.name,
            slug: organisation.slug,
            contactEmail: organisation.contactEmail || '',
            contactPhone: organisation.contactPhone || '',
            address: organisation.address || '',
            userLimit: organisation.userLimit
        }
    });

    // Reset form when organisation changes or dialog opens
    useEffect(() => {
        if (open) {
            reset({
                name: organisation.name,
                slug: organisation.slug,
                contactEmail: organisation.contactEmail || '',
                contactPhone: organisation.contactPhone || '',
                address: organisation.address || '',
                userLimit: organisation.userLimit
            });
        }
    }, [open, organisation, reset]);

    const updateOrgMutation = useMutation({
        mutationFn: async (data: EditOrgFormData) => {
            const res = await api.put(`/super-admin/organisations/${organisation.id}`, data);
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organisation', organisation.id] });
            queryClient.invalidateQueries({ queryKey: ['organisations'] });
            toast.success('Organisation details updated successfully');
            onOpenChange(false);
        },
        onError: (error: { response?: { data?: { message?: string } } }) => {
            toast.error(error.response?.data?.message || 'Failed to update organisation');
        }
    });

    const onSubmit = (data: EditOrgFormData) => {
        // Ensure userLimit is a number
        const payload = { ...data, userLimit: Number(data.userLimit) };
        updateOrgMutation.mutate(payload);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] bg-background border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>Edit Organisation Details</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Update the basic information for {organisation.name}.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Organisation Name</Label>
                            <Input
                                id="name"
                                {...register('name', { required: 'Name is required' })}
                                className="bg-background border-input"
                            />
                            {errors.name && <span className="text-xs text-destructive">{errors.name.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug">Slug (URL Identifier)</Label>
                            <Input
                                id="slug"
                                {...register('slug', { required: 'Slug is required' })}
                                className="bg-background border-input"
                            />
                            {errors.slug && <span className="text-xs text-destructive">{errors.slug.message}</span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email</Label>
                            <Input
                                id="contactEmail"
                                type="email"
                                {...register('contactEmail', { required: 'Email is required' })}
                                className="bg-background border-input"
                            />
                            {errors.contactEmail && <span className="text-xs text-destructive">{errors.contactEmail.message}</span>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="contactPhone">Contact Phone</Label>
                            <Input
                                id="contactPhone"
                                {...register('contactPhone')}
                                className="bg-background border-input"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Address</Label>
                        <Textarea
                            id="address"
                            {...register('address')}
                            className="bg-background border-input"
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="userLimit">User Limit (Manual Override)</Label>
                        <Input
                            id="userLimit"
                            type="number"
                            {...register('userLimit', { min: 1 })}
                            className="bg-background border-input"
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Note: Changing the subscription plan will overwrite this value.
                        </p>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
                            Cancel
                        </Button>
                        <Button type="submit" disabled={updateOrgMutation.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {updateOrgMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
