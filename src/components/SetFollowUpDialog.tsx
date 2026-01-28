import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/services/api';
import { toast } from 'sonner';

interface SetFollowUpDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string;
    currentDate?: string | null;
    onSuccess?: () => void;
}

export function SetFollowUpDialog({ open, onOpenChange, leadId, currentDate, onSuccess }: SetFollowUpDialogProps) {
    const [date, setDate] = useState<string>(currentDate ? new Date(currentDate).toISOString().split('T')[0] : '');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.put(`/leads/${leadId}`, {
                nextFollowUp: date ? new Date(date).toISOString() : null
            });
            toast.success('Next follow-up updated');
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update follow-up');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Set Next Follow-up</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="followUpDate">Date</Label>
                        <Input
                            id="followUpDate"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-muted-foreground">
                            Scheduled follow-ups will appear in your daily briefing and the lead timeline.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
