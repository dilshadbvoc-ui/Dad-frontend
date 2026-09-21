import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createContact, type CreateContactData } from '@/services/contactService';
import { getAccounts } from '@/services/accountService';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DynamicCustomFields from '@/components/forms/DynamicCustomFields';

interface CreateContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (contactId: string) => void;
}

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  jobTitle: '',
  account: '',
  phones: [{ type: 'mobile', number: '' }] as { type: string; number: string }[],
};

export function CreateContactDialog({ open, onOpenChange, onSuccess }: CreateContactDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: accountsData } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => getAccounts(),
    enabled: open,
  });
  const accounts = accountsData?.accounts || [];

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhoneChange = (index: number, value: string) => {
    setFormData(prev => {
      const phones = [...prev.phones];
      phones[index] = { ...phones[index], number: value };
      return { ...prev, phones };
    });
  };

  const addPhone = () => {
    setFormData(prev => ({ ...prev, phones: [...prev.phones, { type: 'mobile', number: '' }] }));
  };

  const removePhone = (index: number) => {
    setFormData(prev => ({ ...prev, phones: prev.phones.filter((_, i) => i !== index) }));
  };

  const resetAndClose = () => {
    setFormData(EMPTY_FORM);
    setCustomFieldValues({});
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    setIsLoading(true);
    try {
      const payload: CreateContactData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        jobTitle: formData.jobTitle || undefined,
        account: formData.account || undefined,
        phones: formData.phones.filter(p => p.number.trim()),
        ...(Object.keys(customFieldValues).length > 0 ? { customFields: customFieldValues } as any : {}),
      };
      const contact = await createContact(payload);
      toast.success('Contact created successfully');
      resetAndClose();
      onSuccess(contact.id);
    } catch (error: unknown) {
      const err = error as { message?: string };
      toast.error(err?.message || 'Failed to create contact');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) resetAndClose(); else onOpenChange(next); }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Contact</DialogTitle>
          <DialogDescription>Create a new person record.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" value={formData.firstName} onChange={(e) => handleChange('firstName', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
              <Input id="lastName" value={formData.lastName} onChange={(e) => handleChange('lastName', e.target.value)} />
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
            <Label>Account <span className="text-muted-foreground text-xs font-normal">(optional)</span></Label>
            <Select value={formData.account || 'none'} onValueChange={(v) => handleChange('account', v === 'none' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="No account" /></SelectTrigger>
              <SelectContent className="rounded-xl shadow-2xl border-border/50">
                <SelectItem value="none" className="rounded-lg">No account</SelectItem>
                {accounts.map((a: { id: string; name: string }) => (
                  <SelectItem key={a.id} value={a.id} className="rounded-lg">{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Phone Numbers</Label>
            {formData.phones.map((phone, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <Input
                  placeholder="Number"
                  value={phone.number}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                />
                {formData.phones.length > 1 && (
                  <Button type="button" variant="outline" size="sm" onClick={() => removePhone(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addPhone} className="w-full">
              + Add Phone
            </Button>
          </div>

          <DynamicCustomFields
            entityType="Contact"
            values={customFieldValues}
            onChange={(name, value) => setCustomFieldValues(prev => ({ ...prev, [name]: value }))}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
