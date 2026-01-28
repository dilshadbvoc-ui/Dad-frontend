
import { useState, useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { AxiosError } from "axios"

import { Button } from "@/components/ui/button"
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
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { updateOrganisation } from "@/services/settingsService"
import type { IntegrationSettings } from "@/services/settingsService"

interface IntegrationConfigDialogProps {
    children?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    integrationType: 'meta' | 'slack' | 'twilio'
    initialValues?: Partial<IntegrationSettings>
}

export function IntegrationConfigDialog({ children, open, onOpenChange, integrationType, initialValues }: IntegrationConfigDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = open !== undefined

    const finalOpen = isControlled ? open : internalOpen
    const finalOnOpenChange = isControlled ? onOpenChange : setInternalOpen

    const queryClient = useQueryClient()

    const form = useForm<IntegrationSettings>({
        defaultValues: {
            connected: false,
            ...initialValues
        }
    })

    // Watch connected state safely
    const isConnected = useWatch({
        control: form.control,
        name: 'connected'
    })

    useEffect(() => {
        if (initialValues) {
            form.reset({
                connected: false,
                ...initialValues
            })
        }
    }, [initialValues, form])

    const mutation = useMutation({
        mutationFn: (data: IntegrationSettings) => {
            const updatePayload: { integrations: Record<string, IntegrationSettings> } = { integrations: {} }
            updatePayload.integrations[integrationType] = data
            return updateOrganisation(updatePayload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organisation"] })
            toast.success(`${integrationType === 'meta' ? 'Meta' : 'Slack'} settings updated`)
            finalOnOpenChange?.(false)
        },
        onError: (error: AxiosError<{ message: string }>) => {
            toast.error(error.response?.data?.message || "Failed to update settings")
        },
    })

    function onSubmit(values: IntegrationSettings) {
        mutation.mutate(values)
    }

    const title = integrationType === 'meta'
        ? 'Meta Integration'
        : integrationType === 'slack'
            ? 'Slack Integration'
            : 'Twilio Integration'

    const description = integrationType === 'meta'
        ? 'Connect your Facebook/Instagram account to sync leads.'
        : integrationType === 'slack'
            ? 'Connect Slack to receive notifications.'
            : 'Connect Twilio account for cloud telephony.'

    return (
        <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="connected"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">Enable Integration</FormLabel>
                                        <FormDescription>
                                            Turn on to start syncing.
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Fields for Meta */}
                        {integrationType === 'meta' && isConnected && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="pageId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Page ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter Facebook Page ID" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="accessToken"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Access Token</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Enter User Access Token" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Token from Meta Business Suite.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="adAccountId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ad Account ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="act_..." {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Meta Ad Account ID (starts with act_).
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phoneNumberId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Meta Phone Number ID" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                From WhatsApp Business Platform &gt; API Setup.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="wabaId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>WABA ID (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="WhatsApp Business Account ID" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Fields for Slack */}
                        {integrationType === 'slack' && isConnected && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="channelId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Channel ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. C12345678" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="accessToken"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bot Token</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="xoxb-..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Fields for Twilio */}
                        {integrationType === 'twilio' && isConnected && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="accountSid"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account SID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="AC..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="authToken"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Auth Token</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Key..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="phoneNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Twilio Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1234567890" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Number to make calls from.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="forwardTo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Inbound Forwarding (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+1987654321" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Redirect incoming calls to this real number.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <DialogFooter>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog >
    )
}
