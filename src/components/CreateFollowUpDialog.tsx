import { useState, useEffect } from 'react';
import { createFollowUp, type AiNextStepSuggestion } from '@/services/followUpService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface CreateFollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  defaultValues?: {
    assignedTo?: string;
    relatedTo?: string;
    onModel?: string;
  };
  onSuccess: () => void;
  aiSuggestion?: AiNextStepSuggestion | null;
  onRegenerateAi?: () => void;
  isRegeneratingAi?: boolean;
}

const isoToDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function CreateFollowUpDialog({ open, onOpenChange, leadId, defaultValues, onSuccess, aiSuggestion, onRegenerateAi, isRegeneratingAi }: CreateFollowUpDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (!open) return;

    if (aiSuggestion) {
      setSubject(aiSuggestion.subject);
      setDescription(aiSuggestion.description);
      setPriority(aiSuggestion.priority);
      setDueDate(isoToDatetimeLocal(aiSuggestion.dueDate));
    } else {
      setSubject('Follow up');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
  }, [open, aiSuggestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: any = {
        subject,
        description,
        priority,
        dueDate: new Date(dueDate).toISOString(),
        status: 'not_started',
      };

      // Handle Lead context
      if (leadId) {
        payload.relatedTo = leadId;
        payload.onModel = 'Lead';
      }

      // Handle default/explicit values override
      if (defaultValues) {
        if (defaultValues.assignedTo) payload.assignedToId = defaultValues.assignedTo;
        if (defaultValues.relatedTo) payload.relatedTo = defaultValues.relatedTo;
        if (defaultValues.onModel) payload.onModel = defaultValues.onModel;
      }

      // AI suggested an owner and no explicit override was given
      if (aiSuggestion?.assignedToId && !payload.assignedToId) {
        payload.assignedToId = aiSuggestion.assignedToId;
      }

      await createFollowUp(payload);

      toast.success(aiSuggestion ? 'AI-suggested follow-up scheduled' : 'Follow-up scheduled successfully');
      onSuccess();
      onOpenChange(false);

    } catch (error: any) {
      console.error('Follow-up creation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to schedule follow-up';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-[425px] p-4 sm:p-6 rounded-xl sm:rounded-lg">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
          <DialogDescription>Set a reminder for your next interaction.</DialogDescription>
        </DialogHeader>

        <AnimatePresence>
          {aiSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="flex items-center justify-between gap-2 rounded-lg border border-purple-500/20 bg-purple-500/5 px-3 py-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10">
                    <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">AI suggested this step</p>
                    <p className="text-[11px] text-muted-foreground">
                      Based on lead score & recent activity
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-0 text-[10px] px-1.5 py-0">
                    {aiSuggestion.source === 'gemini' ? 'Gemini AI' : 'Smart Rules'}
                  </Badge>
                  {onRegenerateAi && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={isRegeneratingAi}
                      onClick={onRegenerateAi}
                      title="Regenerate suggestion"
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', isRegeneratingAi && 'animate-spin')} />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form
          key={aiSuggestion ? `ai-${aiSuggestion.subject}-${aiSuggestion.dueDate}` : 'manual'}
          onSubmit={handleSubmit}
          className="space-y-4"
          initial={aiSuggestion ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
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
              placeholder="Details about the follow-up..."
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
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dueDate">Due Date & Time</Label>
              <Input
                id="dueDate"
                type="datetime-local"
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
              Schedule Follow-up
            </Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
