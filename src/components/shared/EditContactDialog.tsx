import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DynamicCustomFields from '@/components/forms/DynamicCustomFields';

interface EditContactDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contact: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        phones?: { type: string; number: string }[];
        jobTitle?: string;
        department?: string;
    };
    onSuccess: () => void;
}

export function EditContactDialog({ open, onOpenChange, contact, onSuccess }: EditContactDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        jobTitle: '',
        phones: [] as { type: string; number: string }[]
    });

    useEffect(() => {
        if (contact) {
            setFormData({
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                email: contact.email || '',
                jobTitle: contact.jobTitle || '',
                phones: contact.phones || [{ type: 'mobile', number: '' }]
            });
            // Load existing custom field values if any
            setCustomFieldValues((contact as any).customFields || {});
        }
    }, [contact]);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePhoneChange = (index: number, field: 'type' | 'number', value: string) => {
        const newPhones = [...formData.phones];
        newPhones[index] = { ...newPhones[index], [field]: value };
        setFormData(prev => ({ ...prev, phones: newPhones }));
    };

    const addPhone = () => {
        setFormData(prev => ({ ...prev, phones: [...prev.phones, { type: 'mobile', number: '' }] }));
    };

    const removePhone = (index: number) => {
        setFormData(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload = {
                ...formData,
                customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined
            };
            await api.put(`/contacts/${contact.id}`, payload);
            toast.success('Contact updated successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error: unknown) {
            console.error(error);
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update contact');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCustomFieldChange = (name: string, value: any) => {
        setCustomFieldValues(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Edit Contact</DialogTitle>
                    <DialogDescription>Update contact information and details.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <Input id="jobTitle" value={formData.jobTitle} onChange={(e) => handleChange('jobTitle', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label>Phone Numbers</Label>
                        {formData.phones.map((phone, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <Input
                                    placeholder="Number"
                                    value={phone.number}
                                    onChange={(e) => handlePhoneChange(index, 'number', e.target.value)}
                                />
                                <Button type="button" variant="outline" size="sm" onClick={() => removePhone(index)}>
                                    Remove
                                </Button>
                            </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={addPhone} className="w-full">
                            + Add Phone
                        </Button>
                    </div>

                    {/* Custom Fields */}
                    <DynamicCustomFields
                        entityType="Contact"
                        values={customFieldValues}
                        onChange={handleCustomFieldChange}
                    />

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
