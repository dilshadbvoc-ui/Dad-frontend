import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAccount, type CreateAccountData } from '@/services/accountService';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import DynamicCustomFields from '@/components/forms/DynamicCustomFields';

interface CreateAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (accountId: string) => void;
}

const EMPTY_FORM = {
  name: '',
  website: '',
  industry: 'Other',
  type: 'Customer',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  }
};

export function CreateAccountDialog({ open, onOpenChange, onSuccess }: CreateAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, string>,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const resetAndClose = () => {
    setFormData(EMPTY_FORM);
    setCustomFieldValues({});
    onOpenChange(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Account name is required');
      return;
    }
    setIsLoading(true);

    try {
      const payload: CreateAccountData = {
        ...formData,
        type: formData.type as CreateAccountData['type'],
        customFields: Object.keys(customFieldValues).length > 0 ? customFieldValues : undefined
      } as CreateAccountData;
      const account = await createAccount(payload);
      toast.success('Account created successfully');
      onSuccess(account.id);
      resetAndClose();
    } catch (error: unknown) {
      console.error(error);
      toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomFieldChange = (name: string, value: unknown) => {
    setCustomFieldValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) resetAndClose(); else onOpenChange(next); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Account</DialogTitle>
          <DialogDescription>Add a new business account or customer to your CRM.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Account Name</Label>
              <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} required autoFocus />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={formData.website} onChange={(e) => handleChange('website', e.target.value)} placeholder="example.com" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Select value={formData.industry} onValueChange={(val) => handleChange('industry', val)}>
                <SelectTrigger><SelectValue placeholder="Select Industry" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(val) => handleChange('type', val)}>
                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Prospect">Prospect</SelectItem>
                  <SelectItem value="Customer">Customer</SelectItem>
                  <SelectItem value="Partner">Partner</SelectItem>
                  <SelectItem value="Vendor">Vendor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input placeholder="Street" value={formData.address.street} onChange={(e) => handleChange('address.street', e.target.value)} className="mb-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="City" value={formData.address.city} onChange={(e) => handleChange('address.city', e.target.value)} />
              <Input placeholder="State" value={formData.address.state} onChange={(e) => handleChange('address.state', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <Input placeholder="Zip Code" value={formData.address.zipCode} onChange={(e) => handleChange('address.zipCode', e.target.value)} />
              <Input placeholder="Country" value={formData.address.country} onChange={(e) => handleChange('address.country', e.target.value)} />
            </div>
          </div>

          <DynamicCustomFields
            entityType="Account"
            values={customFieldValues}
            onChange={handleCustomFieldChange}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={resetAndClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
