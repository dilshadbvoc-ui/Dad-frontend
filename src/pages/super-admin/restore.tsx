import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploadCloud, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Organisation {
  id: string;
  name: string;
  slug: string;
}

export default function SuperAdminRestorePage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);

  // Fetch Organisations
  const { data: organisations, isLoading: orgsLoading } = useQuery({
    queryKey: ['organisations', 'list-basic'],
    queryFn: async () => {
      const res = await api.get('/super-admin/organisations');
      return res.data.organisations as Organisation[];
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const restoreMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await api.post(`/backup/restore/${selectedOrgId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Organisation restored successfully!');
      setFile(null);
      setSelectedOrgId('');
    },
    onError: (err: any) => {
      console.error('Restore error:', err);
      toast.error(err.response?.data?.message || 'Failed to restore backup');
    }
  });

  const handleRestore = () => {
    if (!selectedOrgId) {
      toast.error('Please select an organisation to restore into.');
      return;
    }
    if (!file) {
      toast.error('Please select a backup file (.zip) to upload.');
      return;
    }

    const confirmed = window.confirm(
      "⚠️ DANGER: ALL EXISTING DATA WILL BE OVERWRITTEN ⚠️\n\n" +
      "Restoring a backup will completely wipe out any existing users, leads, contacts, and all other data belonging to this " +
      "organisation before uploading the backup records. This action cannot be undone.\n\n" +
      "Are you absolutely sure you want to proceed?"
    );

    if (!confirmed) return;

    const formData = new FormData();
    formData.append('backup', file);

    toast.loading('Uploading and processing backup...', { id: 'restore' });
    restoreMutation.mutate(formData, {
      onSettled: () => toast.dismiss('restore')
    });
  };

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            Restore Data
          </h1>
          <p className="text-muted-foreground mt-1">Super Admin utility to restore an organisation from a ZIP backup</p>
        </div>
      </div>

      <div className="max-w-2xl mt-8">
        <Card className="bg-card border-red-900/50">
          <CardHeader className="border-b border-border pb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/20 text-red-400 rounded-full">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl text-foreground">Disaster Recovery</CardTitle>
                <CardDescription className="text-red-300 mt-1 font-medium">
                  Restoring a backup will wipe and replace all data for the selected Organisation.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 text-foreground">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Target Organisation</label>
              {orgsLoading ? (
                <div className="p-3 border border-border rounded-md bg-muted text-indigo-600 dark:text-indigo-300">
                  Loading organisations...
                </div>
              ) : (
                <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                  <SelectTrigger className="w-full bg-background border-border text-foreground">
                    <SelectValue placeholder="Select an organisation to overwrite..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    {organisations?.map(org => (
                      <SelectItem key={org.id} value={org.id} className="hover:bg-accent focus:bg-accent cursor-pointer">
                        {org.name} <span className="text-muted-foreground text-xs ml-2">({org.slug})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Backup Archive (.zip)</label>
              <label
                htmlFor="backup-upload"
                className="flex flex-col items-center justify-center w-full h-40 border-2 border-border border-dashed rounded-lg cursor-pointer bg-background hover:bg-muted/40 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <UploadCloud className="w-10 h-10 mb-3 text-indigo-400" />
                  <p className="mb-2 text-sm text-foreground">
                    <span className="font-semibold text-foreground">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">ZIP archive containing backup.json</p>

                </div>
                <input
                  id="backup-upload"
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {file && (
                <div className="p-3 mt-4 flex items-center justify-between border border-emerald-500/30 bg-emerald-500/10 rounded-md">
                  <span className="text-sm font-medium text-emerald-400 truncate max-w-[400px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-emerald-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}
            </div>

          </CardContent>
          <CardFooter className="bg-card/50 border-t border-border py-4 flex justify-end">
            <Button
              variant="destructive"
              onClick={handleRestore}
              disabled={!selectedOrgId || !file || restoreMutation.isPending}
              className="bg-red-600 hover:bg-red-700 font-semibold shadow-lg shadow-red-900/20 transition-all"
            >
              {restoreMutation.isPending ? 'Restoring...' : 'Start Restoration Data Override'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
