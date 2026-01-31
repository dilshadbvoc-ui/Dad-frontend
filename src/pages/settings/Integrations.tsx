import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

// Mock data for initial implementation
interface WebhookConfig {
    id: string;
    url: string;
    events: string[];
    isActive: boolean;
    lastTriggered?: string;
    status: 'healthy' | 'failed' | 'inactive';
}

const EVENTS = [
    "contact.created",
    "contact.updated",
    "deal.created",
    "deal.updated",
    "deal.stage_changed"
];

export default function IntegrationsPage() {
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
        {
            id: "1",
            url: "https://hooks.zapier.com/hooks/catch/12345/abcde",
            events: ["contact.created"],
            isActive: true,
            lastTriggered: "2024-03-24T10:30:00Z",
            status: 'healthy'
        }
    ]);

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [newWebhook, setNewWebhook] = useState({ url: "", event: "" });

    const handleAddWebhook = () => {
        if (!newWebhook.url || !newWebhook.event) return;

        setWebhooks([
            ...webhooks,
            {
                id: Math.random().toString(36).substr(2, 9),
                url: newWebhook.url,
                events: [newWebhook.event],
                isActive: true,
                status: 'inactive'
            }
        ]);
        setIsDialogOpen(false);
        setNewWebhook({ url: "", event: "" });
    };

    const handleDeleteWebhook = (id: string) => {
        setWebhooks(webhooks.filter(w => w.id !== id));
    };

    const toggleWebhook = (id: string) => {
        setWebhooks(webhooks.map(w =>
            w.id === id ? { ...w, isActive: !w.isActive } : w
        ));
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

                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base">WhatsApp / Meta</CardTitle>
                                <CardDescription>Connect WhatsApp Business API</CardDescription>
                            </div>
                            <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-300">
                                Connected
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mt-2">
                                Sync interactions and campaigns with Meta services using the Cloud API.
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button variant="outline" size="sm">Configure</Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="opacity-75">
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base">Gmail / Google Workspace</CardTitle>
                                <CardDescription>Sync emails and calendar</CardDescription>
                            </div>
                            <Badge variant="outline">Coming Soon</Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500 mt-2">
                                Two-way sync for emails and calendar events.
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
                                    <Button onClick={handleAddWebhook}>Create Webhook</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="space-y-3">
                        {webhooks.map((webhook) => (
                            <Card key={webhook.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 flex-1 min-w-0 mr-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {webhook.events.join(", ")}
                                                </Badge>
                                                {webhook.status === 'healthy' && (
                                                    <span className="flex items-center text-[10px] text-green-600 font-medium">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Healthy
                                                    </span>
                                                )}
                                                {webhook.status === 'failed' && (
                                                    <span className="flex items-center text-[10px] text-red-600 font-medium">
                                                        <AlertCircle className="h-3 w-3 mr-1" /> Error
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={webhook.url}>
                                                {webhook.url}
                                            </div>
                                            {webhook.lastTriggered && (
                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                    <Activity className="h-3 w-3 mr-1" />
                                                    Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Switch
                                                checked={webhook.isActive}
                                                onCheckedChange={() => toggleWebhook(webhook.id)}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                onClick={() => handleDeleteWebhook(webhook.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {webhooks.length === 0 && (
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
