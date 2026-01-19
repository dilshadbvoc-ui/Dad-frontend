import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { toast } from "sonner"
import { Copy, Plus, Trash2, Globe, Key, AlertCircle, Loader2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import {
    getApiKeys,
    createApiKey,
    revokeApiKey,
    deleteApiKey,
    getWebhooks,
    createWebhook,
    deleteWebhook
} from "@/services/developerService"

export default function DeveloperSettingsPage() {
    const [searchParams, setSearchParams] = useSearchParams()
    const activeTab = searchParams.get("tab") || "api-keys"

    const setActiveTab = (tab: string) => {
        setSearchParams({ tab })
    }

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="max-w-5xl mx-auto space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Developer Settings</h1>
                            <p className="text-gray-500">Manage API keys and webhooks for integrations.</p>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                            <TabsList>
                                <TabsTrigger value="api-keys" className="flex items-center gap-2"><Key className="w-4 h-4" /> API Keys</TabsTrigger>
                                <TabsTrigger value="webhooks" className="flex items-center gap-2"><Globe className="w-4 h-4" /> Webhooks</TabsTrigger>
                            </TabsList>

                            <TabsContent value="api-keys" className="space-y-4">
                                <ApiKeysTab />
                            </TabsContent>

                            <TabsContent value="webhooks" className="space-y-4">
                                <WebhooksTab />
                            </TabsContent>
                        </Tabs>
                    </div>
                </main>
            </div>
        </div>
    )
}

function ApiKeysTab() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [newKeyName, setNewKeyName] = useState("")
    const [createdKey, setCreatedKey] = useState<{ key: string, name: string } | null>(null)

    const queryClient = useQueryClient()

    const { data: apiKeysData, isLoading } = useQuery({
        queryKey: ['api-keys'],
        queryFn: getApiKeys
    })
    const apiKeys = apiKeysData?.apiKeys || []

    const createMutation = useMutation({
        mutationFn: createApiKey,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] })
            setCreatedKey({ key: data.apiKey.key, name: data.apiKey.name })
            setNewKeyName("")
            // Don't close dialog yet, showing the key
        },
        onError: (error: any) => toast.error(error.response?.data?.message || "Failed to create key")
    })

    const revokeMutation = useMutation({
        mutationFn: revokeApiKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] })
            toast.success("API Key revoked")
        }
    })

    const deleteMutation = useMutation({
        mutationFn: deleteApiKey,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['api-keys'] })
            toast.success("API Key deleted")
        }
    })

    const handleCreate = () => {
        if (!newKeyName.trim()) return
        createMutation.mutate({ name: newKeyName })
    }

    const handleCloseCreate = () => {
        setIsCreateOpen(false)
        setCreatedKey(null)
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>API Keys</CardTitle>
                    <CardDescription>Manage keys used to access the API.</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Generate New Key</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Generate API Key</DialogTitle>
                            <DialogDescription>Create a new key to access the API.</DialogDescription>
                        </DialogHeader>

                        {!createdKey ? (
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Key Name</Label>
                                    <Input
                                        placeholder="e.g. Website Integration"
                                        value={newKeyName}
                                        onChange={(e) => setNewKeyName(e.target.value)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 py-4">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-900 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">Save this key now</h4>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-400">This secret key will essentially disappear forever if you don't copy it now.</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Input value={createdKey.key} readOnly className="font-mono" />
                                    <Button size="icon" variant="outline" onClick={() => {
                                        navigator.clipboard.writeText(createdKey.key)
                                        toast.success("Key copied to clipboard")
                                    }}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        <DialogFooter>
                            {!createdKey ? (
                                <Button onClick={handleCreate} disabled={createMutation.isPending || !newKeyName.trim()}>
                                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Generate Key
                                </Button>
                            ) : (
                                <Button onClick={handleCloseCreate}>Done</Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {isLoading ? <div>Loading...</div> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>First 8 Chars</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {apiKeys.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-gray-500">No API keys found.</TableCell>
                                </TableRow>
                            ) : apiKeys.map((key: any) => (
                                <TableRow key={key.id}>
                                    <TableCell className="font-medium">{key.name}</TableCell>
                                    <TableCell>
                                        {key.isActive ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Revoked</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>{format(new Date(key.createdAt), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="font-mono text-xs max-w-[100px] truncate">{key.firstEight}...</TableCell>
                                    <TableCell className="text-right">
                                        {key.isActive && (
                                            <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 hover:bg-orange-50" onClick={() => revokeMutation.mutate(key.id)}>
                                                Revoke
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteMutation.mutate(key.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}

function WebhooksTab() {
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [url, setUrl] = useState("")

    const queryClient = useQueryClient()

    const { data: webhooksData, isLoading } = useQuery({
        queryKey: ['webhooks'],
        queryFn: getWebhooks
    })
    const webhooks = webhooksData?.webhooks || []

    const createMutation = useMutation({
        mutationFn: createWebhook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
            toast.success("Webhook created")
            setIsCreateOpen(false)
            setUrl("")
        },
        onError: (error: any) => toast.error(error.response?.data?.message || "Failed to create webhook")
    })

    const deleteMutation = useMutation({
        mutationFn: deleteWebhook,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['webhooks'] })
            toast.success("Webhook deleted")
        }
    })

    const handleCreate = () => {
        if (!url.trim()) return
        // Default to all basic lead events for now
        createMutation.mutate({ url, events: ['lead.created', 'lead.updated'] })
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Webhooks</CardTitle>
                    <CardDescription>Send data to external URLs when events occur.</CardDescription>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" /> Add Webhook</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Webhook</DialogTitle>
                            <DialogDescription>Define a URL to receive event payloads.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Endpoint URL</Label>
                                <Input
                                    placeholder="https://api.example.com/webhook"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Events</Label>
                                <div className="flex gap-2 text-sm text-gray-500">
                                    <Badge variant="secondary">lead.created</Badge>
                                    <Badge variant="secondary">lead.updated</Badge>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleCreate} disabled={createMutation.isPending || !url.trim()}>
                                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Create Webhook
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {isLoading ? <div>Loading...</div> : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>URL</TableHead>
                                <TableHead>Events</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {webhooks.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24 text-gray-500">No webhooks configured.</TableCell>
                                </TableRow>
                            ) : webhooks.map((hook: any) => (
                                <TableRow key={hook.id}>
                                    <TableCell className="font-mono text-sm">{hook.url}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-1 flex-wrap">
                                            {hook.events.map((e: string) => (
                                                <Badge key={e} variant="outline" className="text-xs">{e}</Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => deleteMutation.mutate(hook.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    )
}
