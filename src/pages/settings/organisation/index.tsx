import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BulkImportLeads } from "@/components/organisation/BulkImportLeads"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

interface UpsellConfig {
    itemLabel?: string;
    quantityLabel?: string;
    priceLabel?: string;
}

export default function OrganisationSettingsPage() {
    const queryClient = useQueryClient()

    const { data: org, isLoading } = useQuery({
        queryKey: ['organisation'],
        queryFn: async () => {
            const res = await axios.get('/api/organisation')
            return res.data
        }
    })

    const updateMutation = useMutation({
        mutationFn: async (data: Record<string, unknown>) => {
            const res = await axios.put('/api/organisation', data)
            return res.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['organisation'] })
            toast.success('Organisation updated successfully')
        },
        onError: (err: { response?: { data?: { message?: string } } }) => {
            toast.error(err.response?.data?.message || 'Failed to update organisation')
        }
    })

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        updateMutation.mutate({
            name: formData.get('name'),
            contactEmail: formData.get('contactEmail'),
            contactPhone: formData.get('contactPhone'),
            address: formData.get('address')
        })
    }

    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>

    return (
        <div className="space-y-6 container mx-auto p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">Organisation Settings</h1>
                    <p className="text-gray-500">Manage your company profile.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Profile</CardTitle>
                        <CardDescription>Update your organisation's details.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Organisation Name</Label>
                                    <Input name="name" defaultValue={org?.name} required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Slug</Label>
                                    <Input value={org?.slug} disabled className="bg-gray-100" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Contact Email</Label>
                                    <Input name="contactEmail" type="email" defaultValue={org?.contactEmail} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Phone</Label>
                                    <Input name="contactPhone" type="tel" defaultValue={org?.contactPhone} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Address</Label>
                                <Input name="address" defaultValue={org?.address} placeholder="123 Business St, City, Country" />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            await axios.post('/api/organisation/send-test-report')
                                            toast.success('Test report sent successfully')
                                        } catch (err: unknown) {
                                            const error = err as { response?: { data?: { message?: string } } };
                                            toast.error(error.response?.data?.message || 'Failed to send test report')
                                        }
                                    }}
                                >
                                    Send Daily Report Now
                                </Button>
                                <Button type="submit" disabled={updateMutation.isPending}>Save Changes</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Upsell Calculator Settings</CardTitle>
                        <CardDescription>Configure labels for the revenue calculator (e.g., "Students", "Tuition").</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            // Combine existing profile update logic or separating it? 
                            // For simplicity, let's keep one update function but we need to merge data carefully or just send what's changed.
                            // The current implementation sends specific fields. Let's update it to send everything.

                            const upsellConfig = {
                                itemLabel: formData.get('itemLabel'),
                                quantityLabel: formData.get('quantityLabel'),
                                priceLabel: formData.get('priceLabel')
                            }

                            updateMutation.mutate({
                                upsellConfig
                            })
                        }} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Item Label (Default: Item)</Label>
                                    <Input name="itemLabel" defaultValue={(org?.upsellConfig as UpsellConfig)?.itemLabel || 'Item'} placeholder="e.g. Service, Product" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Quantity Label (Default: Quantity)</Label>
                                    <Input name="quantityLabel" defaultValue={(org?.upsellConfig as UpsellConfig)?.quantityLabel || 'Quantity'} placeholder="e.g. Students, Hours" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Price Label (Default: Price)</Label>
                                    <Input name="priceLabel" defaultValue={(org?.upsellConfig as UpsellConfig)?.priceLabel || 'Price'} placeholder="e.g. Tuition Fee, Rate" />
                                </div>
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={updateMutation.isPending}>Save Settings</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <BulkImportLeads />
            </div>
        </div>
    )
}
