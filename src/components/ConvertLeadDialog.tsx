import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ConvertLeadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lead: {
        id: string;
        firstName: string;
        lastName: string;
        company: string;
    };
}

export function ConvertLeadDialog({ open, onOpenChange, lead }: ConvertLeadDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // Default values populated from Lead
    const [accountName, setAccountName] = useState(lead.company || `${lead.firstName} ${lead.lastName}'s Account`);
    const [contactName, setContactName] = useState(`${lead.firstName} ${lead.lastName}`);
    const [opportunityName, setOpportunityName] = useState(`${lead.company || lead.firstName} - Deal`);

    const handleConvert = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { data } = await api.post(`/leads/${lead.id}/convert`, {
                accountName,
                contactName,
                opportunityName
            });

            toast.success('Lead converted successfully!');
            onOpenChange(false);

            // Redirect to the new Opportunity (if returned) or Leads list
            if (data.opportunity?.id) {
                // navigate(`/opportunities/${data.opportunity.id}`); // if route exists
                navigate('/leads'); // Fallback for now
            } else {
                navigate('/leads');
            }

        } catch (error: unknown) {
            console.error(error);
            toast.error((error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to convert lead');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Convert Lead
                    </DialogTitle>
                    <DialogDescription>
                        Create a new Account, Contact, and Opportunity from this lead.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleConvert} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="accountName">Account Name</Label>
                        <Input
                            id="accountName"
                            value={accountName}
                            onChange={(e) => setAccountName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="contactName">Contact Name</Label>
                        <Input
                            id="contactName"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="opportunityName">Opportunity Name</Label>
                        <Input
                            id="opportunityName"
                            value={opportunityName}
                            onChange={(e) => setOpportunityName(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Convert
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
