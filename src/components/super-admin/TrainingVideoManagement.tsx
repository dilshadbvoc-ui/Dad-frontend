import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  GripVertical,
  Loader2,
  PlayCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getYoutubeThumbnail } from '@/lib/youtube';

interface TrainingVideo {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  category?: string;
  duration?: string;
  order: number;
  isActive: boolean;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  category: '',
  duration: '',
  order: 0,
  isActive: true,
};

export function TrainingVideoManagement() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: videos, isLoading } = useQuery({
    queryKey: ['admin-training-videos'],
    queryFn: async () => {
      const res = await api.get('/super-admin/training-videos');
      return res.data.videos as TrainingVideo[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await api.post('/super-admin/training-videos', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-training-videos'] });
      toast.success('Training video created successfully');
      setIsCreating(false);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create training video')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: typeof formData }) => {
      const res = await api.put(`/super-admin/training-videos/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-training-videos'] });
      toast.success('Training video updated successfully');
      setEditingId(null);
      resetForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update training video')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/super-admin/training-videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-training-videos'] });
      toast.success('Training video deleted successfully');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to delete training video')
  });

  const resetForm = () => setFormData(EMPTY_FORM);

  const handleEdit = (video: TrainingVideo) => {
    setEditingId(video.id);
    setFormData({
      title: video.title,
      description: video.description || '',
      videoUrl: video.videoUrl,
      thumbnailUrl: video.thumbnailUrl || '',
      category: video.category || '',
      duration: video.duration || '',
      order: video.order,
      isActive: video.isActive,
    });
    setIsCreating(false);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.videoUrl) {
      toast.error('Title and Video URL are required');
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
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--chart-5))]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Training Video Guides</h2>
          <p className="text-muted-foreground text-sm">Manage the video guides shown on the in-app Training page's "Video Guides" tab.</p>
        </div>
        {!isCreating && !editingId && (
          <Button
            onClick={() => { setIsCreating(true); resetForm(); }}
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white hover:bg-[hsl(var(--chart-5))]/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Video Guide
          </Button>
        )}
      </div>

      {(isCreating || editingId) && (
        <Card className="rounded-[10px] border-[hsl(var(--chart-5))]/30 shadow-md">
          <CardHeader>
            <CardTitle className="text-base">
              {editingId ? 'Edit Video Guide' : 'Add New Video Guide'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Lead Management: Full Walkthrough"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Category / Module</label>
                <Input
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g. Lead Management"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description shown under the video title..."
                className="min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Video URL</label>
                <Input
                  value={formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Thumbnail URL <span className="text-muted-foreground font-normal">(optional — auto-detected from YouTube if left blank)</span></label>
                <Input
                  value={formData.thumbnailUrl}
                  onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            {(() => {
              const previewThumbnail = formData.thumbnailUrl || getYoutubeThumbnail(formData.videoUrl);
              if (!previewThumbnail) return null;
              return (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Thumbnail preview</label>
                  <div className="w-40 aspect-video rounded-md overflow-hidden border border-border bg-muted">
                    <img
                      src={previewThumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                  {!formData.thumbnailUrl && (
                    <p className="text-[11px] text-muted-foreground">Using YouTube's default thumbnail — set a Thumbnail URL above to override.</p>
                  )}
                </div>
              );
            })()}

            <div className="flex flex-wrap items-end gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Duration <span className="text-muted-foreground font-normal">(display only)</span></label>
                <Input
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 4:32"
                  className="w-28"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Display Order</label>
                <Input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  className="w-28"
                />
              </div>
              <div className="flex items-center gap-2.5 pb-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <span className="text-sm text-foreground">Active (visible on Training page)</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="ghost"
                onClick={() => { setIsCreating(false); setEditingId(null); }}
                className="rounded-[10px]"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-[10px] bg-[hsl(var(--chart-5))] text-white hover:bg-[hsl(var(--chart-5))]/90 font-semibold"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {editingId ? 'Update Video Guide' : 'Save Video Guide'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {videos?.length === 0 ? (
          <div className="text-center py-16 bg-muted/30 rounded-[14px] border border-dashed border-border">
            <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <h3 className="text-sm font-semibold text-muted-foreground">No video guides yet</h3>
            <p className="text-muted-foreground text-xs mt-1">Add one above to show it on the in-app Training page.</p>
          </div>
        ) : (
          videos?.map((video) => (
            <Card
              key={video.id}
              className={cn(
                'rounded-[10px] hover:border-[hsl(var(--chart-5))]/30 transition-all group',
                !video.isActive && 'opacity-60'
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="pt-1 text-muted-foreground shrink-0">
                    <GripVertical className="h-4 w-4 cursor-grab" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-foreground text-sm">{video.title}</h4>
                      {video.category && (
                        <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                          {video.category}
                        </span>
                      )}
                      {video.duration && (
                        <span className="text-[10px] text-muted-foreground">{video.duration}</span>
                      )}
                      {!video.isActive && (
                        <span className="text-[10px] uppercase font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full tracking-wide">
                          Inactive
                        </span>
                      )}
                    </div>
                    {video.description && (
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">{video.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground/70 truncate">{video.videoUrl}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(video)}
                      className="h-8 w-8 text-[hsl(var(--chart-5))] hover:bg-[hsl(var(--chart-5))]/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this video guide?')) {
                          deleteMutation.mutate(video.id);
                        }
                      }}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
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
