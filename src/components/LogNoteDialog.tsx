import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LogNoteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId: string;
    onSuccess: () => void;
}

export function LogNoteDialog({ open, onOpenChange, leadId, onSuccess }: LogNoteDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [note, setNote] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post('/interactions', {
                lead: leadId,
                type: 'Note',
                description: note,
                date: new Date().toISOString(),
                subject: 'Note' // Generic subject
            });

            toast.success('Note added successfully');
            onSuccess();
            onOpenChange(false);
            setNote('');

        } catch (error) {
            console.error(error);
            toast.error('Failed to add note');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Note</DialogTitle>
                    <DialogDescription>Add a quick note to this lead's timeline.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="note">Content</Label>
                        <Textarea
                            id="note"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Enter note details..."
                            rows={5}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Note
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
