import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getWebhooks, createWebhook, deleteWebhook, toggleWebhook } from "@/services/webhookService";
import { getOrganisation } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
    Webhook,
    Plus,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Activity,
    Box
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { IntegrationConfigDialog } from "@/components/settings/IntegrationConfigDialog";

const EVENTS = [
    "contact.created",
    "contact.updated",
    "deal.created",
    "deal.updated",
    "deal.stage_changed"
];

export default function IntegrationsPage() {
    const queryClient = useQueryClient();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newWebhook, setNewWebhook] = useState({ url: "", event: "" });
    const [isMetaDialogOpen, setIsMetaDialogOpen] = useState(false);
    const [isWhatsAppDialogOpen, setIsWhatsAppDialogOpen] = useState(false);

    // Fetch Organisation for integration settings
    const { data: orgData } = useQuery({
        queryKey: ['organisation'],
        queryFn: getOrganisation
    });

    const integrations = orgData?.integrations || {};

    // Fetch Webhooks
    const { data: webhooks = [], isLoading } = useQuery({
        queryKey: ['webhooks'],
        queryFn: getWebhooks
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: createWebhook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            setIsDialogOpen(false);
            setNewWebhook({ url: "", event: "" });
            toast.success("Webhook created successfully");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to create webhook");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: deleteWebhook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            toast.success("Webhook deleted");
        },
        onError: () => {
            toast.error("Failed to delete webhook");
        }
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => toggleWebhook(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] });
            toast.success("Webhook updated");
        },
        onError: () => {
            toast.error("Failed to update webhook");
        }
    });

    const handleAddWebhook = () => {
        if (!newWebhook.url || !newWebhook.event) return;
        createMutation.mutate({
            url: newWebhook.url,
            events: [newWebhook.event]
        });
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Integrations</h1>
                <p className="text-gray-500 mt-1">Manage 3rd party connections and webhooks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Native Integrations */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Box className="h-5 w-5 text-blue-500" />
                        Native Integrations
                    </h2>

                    {/* Meta / WhatsApp OAuth Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base">Meta / WhatsApp</CardTitle>
                                <CardDescription>Connect Facebook Ads & WhatsApp Business</CardDescription>
                            </div>
                            <Badge
                                variant="default"
                                className={integrations.meta?.connected
                                    ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300"
                                }
                            >
                                {integrations.meta?.connected ? 'Connected' : 'Not Connected'}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            {integrations.meta?.connected ? (
                                <div className="space-y-3">
                                    <div className="text-sm text-gray-500">
                                        <p><strong>Ad Account:</strong> {integrations.meta?.adAccountName || 'N/A'}</p>
                                        <p><strong>Page:</strong> {integrations.meta?.pageName || 'N/A'}</p>
                                        {integrations.whatsapp?.connected && (
                                            <p className="text-green-600"><strong>WhatsApp:</strong> Connected ✓</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    const { api } = await import('@/services/api');
                                                    const { data } = await api.get('/meta/auth');
                                                    if (data.url) window.location.href = data.url;
                                                } catch (error: any) {
                                                    toast.error(error.response?.data?.message || 'Failed to initiate connection');
                                                }
                                            }}
                                        >
                                            Reconnect
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    const { api } = await import('@/services/api');
                                                    await api.post('/meta/disconnect', { type: 'both' });
                                                    queryClient.invalidateQueries({ queryKey: ['organisation'] });
                                                    toast.success('Disconnected from Meta');
                                                } catch (error: any) {
                                                    toast.error(error.response?.data?.message || 'Failed to disconnect');
                                                }
                                            }}
                                        >
                                            Disconnect
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="text-sm text-gray-500">
                                        Connect your Facebook account to sync Meta Ads and WhatsApp Business.
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            className="bg-[#1877F2] hover:bg-[#166FE5] text-white"
                                            size="sm"
                                            onClick={async () => {
                                                try {
                                                    const { api } = await import('@/services/api');
                                                    const { data } = await api.get('/meta/auth');
                                                    if (data.url) window.location.href = data.url;
                                                } catch (error: any) {
                                                    toast.error(error.response?.data?.message || 'Failed to initiate connection');
                                                }
                                            }}
                                        >
                                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                            </svg>
                                            Connect with Facebook
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="opacity-100">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base">Gmail / Google Workspace</CardTitle>
                                <CardDescription>Sync emails and calendar</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => toast.info("Google OAuth flow would start here")}>
                                Connect
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mt-2">
                                Two-way sync for emails and calendar events.
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="opacity-100">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base">AI Content Writer</CardTitle>
                                <CardDescription>Generate marketing content</CardDescription>
                            </div>
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                Enabled
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mt-2">
                                Describe your topic and let AI generate email campaigns and posts.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Webhooks */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold flex items-center gap-2">
                            <Webhook className="h-5 w-5 text-purple-500" />
                            Webhooks
                        </h2>
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/25 rounded-xl">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Webhook
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add New Webhook</DialogTitle>
                                    <DialogDescription>
                                        Send real-time data to external services (Zapier, Slack, etc.)
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="url">Payload URL</Label>
                                        <Input
                                            id="url"
                                            placeholder="https://hooks.zapier.com/..."
                                            value={newWebhook.url}
                                            onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="event">Trigger Event</Label>
                                        <Select
                                            onValueChange={(val) => setNewWebhook({ ...newWebhook, event: val })}
                                            value={newWebhook.event}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select event" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {EVENTS.map(event => (
                                                    <SelectItem key={event} value={event}>{event}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button onClick={handleAddWebhook} disabled={createMutation.isPending}>
                                        {createMutation.isPending ? 'Creating...' : 'Create Webhook'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="text-center p-8 text-gray-500">Loading webhooks...</div>
                        ) : webhooks.map((webhook) => (
                            <Card key={webhook.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {webhook.events.join(", ")}
                                                </Badge>
                                                {/* Status logic based on failureCount/successCount if needed */}
                                                {!webhook.lastError && (
                                                    <span className="flex items-center text-[10px] text-green-600 font-medium">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Healthy
                                                    </span>
                                                )}
                                                {webhook.lastError && (
                                                    <span className="flex items-center text-[10px] text-red-600 font-medium">
                                                        <AlertCircle className="h-3 w-3 mr-1" /> Error
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={webhook.url}>
                                                {webhook.url}
                                            </div>
                                            {webhook.lastTriggeredAt && (
                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                    <Activity className="h-3 w-3 mr-1" />
                                                    Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={webhook.isActive}
                                                onCheckedChange={(checked) => toggleMutation.mutate({ id: webhook.id, isActive: checked })}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => deleteMutation.mutate(webhook.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {!isLoading && webhooks.length === 0 && (
                            <div className="text-center p-8 border-2 border-dashed rounded-xl bg-gray-50 dark:bg-gray-900/50">
                                <p className="text-sm text-gray-500">No webhooks configured.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
