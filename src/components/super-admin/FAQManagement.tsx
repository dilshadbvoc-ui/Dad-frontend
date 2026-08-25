import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  GripVertical,
  CheckCircle2,
  XCircle,
  Loader2,
  HelpCircle
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export function FAQManagement() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state for creating/editing
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    order: 0,
    isActive: true
  });

  // Fetch FAQs
  const { data: faqs, isLoading } = useQuery({
    queryKey: ['admin-faqs'],
    queryFn: async () => {
      const res = await api.get('/super-admin/faqs');
      return res.data.faqs as FAQ[];
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/super-admin/faqs', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('FAQ created successfully');
      setIsCreating(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create FAQ')
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await api.put(`/super-admin/faqs/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('FAQ updated successfully');
      setEditingId(null);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update FAQ')
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/super-admin/faqs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-faqs'] });
      toast.success('FAQ deleted successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete FAQ')
  });

  const resetForm = () => {
    setFormData({ question: '', answer: '', order: 0, isActive: true });
  };

  const handleEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setFormData({
      question: faq.question,
      answer: faq.answer,
      order: faq.order,
      isActive: faq.isActive
    });
    setIsCreating(false);
  };

  const handleSubmit = () => {
    if (!formData.question || !formData.answer) {
      toast.error('Question and Answer are required');
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Landing Page FAQs</h2>
          <p className="text-muted-foreground text-sm">Manage the questions and answers displayed on the public landing page.</p>
        </div>
        {!isCreating && !editingId && (
          <Button 
            onClick={() => {
              setIsCreating(true);
              resetForm();
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New FAQ
          </Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card className="bg-card border-indigo-500/30 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-foreground">
              {editingId ? 'Edit FAQ' : 'Create New FAQ'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Question</label>
                <Input 
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. What is Pype CRM?"
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Answer</label>
                <Textarea 
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  placeholder="Provide a clear and concise answer..."
                  className="bg-background border-border text-foreground min-h-[120px]"
                />
              </div>
              <div className="flex items-center gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Display Order</label>
                  <Input 
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="bg-background border-border text-foreground w-32"
                  />
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Switch 
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <span className="text-sm text-foreground">Active (Visible on Landing Page)</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsCreating(false);
                  setEditingId(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 font-bold"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingId ? 'Update FAQ' : 'Save FAQ'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {faqs?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">No FAQs found</h3>
            <p className="text-muted-foreground text-sm">Create your first FAQ to display it on the landing page.</p>
          </div>
        ) : (
          faqs?.map((faq) => (
            <Card 
              key={faq.id} 
              className={cn(
                "bg-card border-border hover:border-primary/30 transition-all group",
                !faq.isActive && "opacity-60 grayscale-[0.5]"
              )}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="pt-1 text-muted-foreground">
                    <GripVertical className="h-5 w-5 cursor-grab" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-foreground text-lg">{faq.question}</h4>
                      {!faq.isActive && (
                        <span className="text-[10px] uppercase font-black bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full tracking-widest">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{faq.answer}</p>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        Order: {faq.order}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleEdit(faq)}
                      className="h-8 w-8 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-accent"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this FAQ?')) {
                          deleteMutation.mutate(faq.id);
                        }
                      }}
                      className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-950/50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
