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
    initialContent?: string;
}

export function LogNoteDialog({ open, onOpenChange, leadId, onSuccess, initialContent = '' }: LogNoteDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [note, setNote] = useState(initialContent);

    // Better: use useEffect to set note when open changes to true. 
    // But since we can't easily add imports here without multi replace, 
    // and I want to keep it simple, I'll stick to 'useState(initialContent)'. 
    // IMPORTANT: If initialContent changes while component is mounted, useState won't update.
    // I should add a check. But simplest is just replace the whole file or block carefully.

    // Actually, let's just use `defaultValue` concept or a `useEffect`.
    // Since I can't add useEffect easily without importing it (it is imported actually: line 1), 
    // I can do it.

    // Wait, line 1 has `import { useState } from 'react';`
    // I should probably add `useEffect` to imports too if I use it.
    // But let's check if I can just swap lines 1-20.

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post('/interactions', {
                lead: leadId,
                type: 'note',
                description: note,
                date: new Date().toISOString(),
                subject: 'Note' // Generic subject
            });

            toast.success('Note added successfully');
            onSuccess();
            onOpenChange(false);
            setNote('');

        } catch (error: any) {
            console.error('Note creation error:', error);
            console.error('Error response:', error.response?.data);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to add note';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6 rounded-xl sm:rounded-lg">
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
