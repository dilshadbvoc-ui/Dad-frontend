import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCustomFields, createCustomField, type CustomFieldData } from "@/services/settingsService"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface CustomField {
    id: string;
    name: string;
    label: string;
    type: string;
    entity: string;
}

export default function CustomFieldsSettingsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const queryClient = useQueryClient()

    const { data, isLoading } = useQuery({
        queryKey: ['customFields'],
        queryFn: () => getCustomFields()
    })

    const customFields = data?.customFields || []

    const createMutation = useMutation({
        mutationFn: (data: CustomFieldData) => createCustomField(data),
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customFields'] }); setIsDialogOpen(false); toast.success('Custom field created') }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        createMutation.mutate({
            name: formData.get('name') as string,
            label: formData.get('label') as string,
            type: formData.get('type') as string,
            entity: formData.get('entity') as string
        })
    }

    const fieldsByEntity = customFields.reduce((acc: Record<string, CustomField[]>, field: CustomField) => {
        if (!acc[field.entity]) acc[field.entity] = []
        acc[field.entity].push(field)
        return acc
    }, {} as Record<string, CustomField[]>)

    return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-y-auto p-6 lg:p-8">
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <div><h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Custom Fields</h1><p className="text-gray-500">Define custom fields for your entities</p></div>
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"><Plus className="h-4 w-4 mr-2" />Add Field</Button></DialogTrigger>
                                <DialogContent>
                                    <form onSubmit={handleSubmit}>
                                        <DialogHeader><DialogTitle>Create Custom Field</DialogTitle></DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>Field Name</Label><Input name="name" placeholder="e.g. custom_source" required /></div>
                                                <div><Label>Label</Label><Input name="label" placeholder="e.g. Custom Source" required /></div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><Label>Entity</Label><Select name="entity" defaultValue="Lead"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Lead">Lead</SelectItem><SelectItem value="Contact">Contact</SelectItem><SelectItem value="Account">Account</SelectItem><SelectItem value="Opportunity">Opportunity</SelectItem></SelectContent></Select></div>
                                                <div><Label>Type</Label><Select name="type" defaultValue="text"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="number">Number</SelectItem><SelectItem value="date">Date</SelectItem><SelectItem value="select">Select</SelectItem><SelectItem value="checkbox">Checkbox</SelectItem></SelectContent></Select></div>
                                            </div>
                                        </div>
                                        <DialogFooter><Button type="submit">Create Field</Button></DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center p-16"><div className="h-10 w-10 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" /></div>
                        ) : Object.keys(fieldsByEntity).length === 0 ? (
                            <Card><CardContent className="py-12"><div className="text-center text-gray-500"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No custom fields defined</p></div></CardContent></Card>
                        ) : (
                            (Object.entries(fieldsByEntity) as [string, CustomField[]][]).map(([entity, fields]) => (
                                <Card key={entity}>
                                    <CardHeader><CardTitle>{entity} Fields</CardTitle></CardHeader>
                                    <CardContent>
                                        <div className="space-y-2">
                                            {fields.map((field: CustomField) => (
                                                <div key={field.id} className="flex items-center justify-between p-3 rounded-lg border">
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-medium">{field.label}</span>
                                                        <Badge variant="outline">{field.type}</Badge>
                                                    </div>
                                                    <code className="text-sm text-gray-500">{field.name}</code>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
