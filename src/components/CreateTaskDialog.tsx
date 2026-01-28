import { useState, useEffect } from 'react';
import type { CreateTaskData } from '@/services/taskService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leadId?: string; // Optional: Keep for backward compat
    defaultValues?: {
        assignedTo?: string;
        relatedTo?: string;
        onModel?: string;
    };
    onSuccess: () => void;
}

export function CreateTaskDialog({ open, onOpenChange, leadId, defaultValues, onSuccess }: CreateTaskDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Form States
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [dueDate, setDueDate] = useState('');

    useEffect(() => {
        if (open) {
            setSubject('');
            setDescription('');
            setPriority('Medium');
            setDueDate('');
        }
    }, [open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const payload: CreateTaskData = {
                subject,
                description,
                priority,
                dueDate,
                status: 'Not Started',
            };

            // Handle Lead context (backward compatibility)
            if (leadId) {
                payload.relatedTo = leadId;
                payload.onModel = 'Lead';
            }

            // Handle default/explicit values override
            if (defaultValues) {
                if (defaultValues.assignedTo) payload.assignedTo = defaultValues.assignedTo;
                if (defaultValues.relatedTo) payload.relatedTo = defaultValues.relatedTo;
                if (defaultValues.onModel) payload.onModel = defaultValues.onModel;
            }

            await api.post('/tasks', payload);

            toast.success('Task created successfully');
            onSuccess();
            onOpenChange(false);

        } catch (error) {
            console.error(error);
            toast.error('Failed to create task');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Task</DialogTitle>
                    <DialogDescription>Assign a new task.</DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Follow up..."
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Details about the task..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="Low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

