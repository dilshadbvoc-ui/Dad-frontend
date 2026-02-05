
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
    integrationType: 'meta' | 'slack' | 'twilio' | 'whatsapp' | 'sso' | 'happilee' | 'wabis' | 'doubletick' | 'googleads' | 'wati' | 'halapi'
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
            if (integrationType === 'sso') {
                // For SSO, we save to ssoConfig root field
                return updateOrganisation({ ssoConfig: data })
            }
            const updatePayload: { integrations: Record<string, IntegrationSettings> } = { integrations: {} }
            updatePayload.integrations[integrationType] = data
            return updateOrganisation(updatePayload)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["organisation"] })
            toast.success(`${integrationType.toUpperCase()} settings updated`)
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
            : integrationType === 'twilio'
                ? 'Twilio Integration'
                : integrationType === 'whatsapp'
                    ? 'WhatsApp Integration'
                    : integrationType === 'happilee'
                        ? 'Happilee Integration'
                        : integrationType === 'wabis'
                            ? 'Wabis Integration'
                            : integrationType === 'doubletick'
                                ? 'DoubleTick Integration'
                                : integrationType === 'googleads'
                                    ? 'Google Ads Integration'
                                    : integrationType === 'wati'
                                        ? 'Wati Integration'
                                        : integrationType === 'halapi'
                                            ? 'HAL API Integration'
                                            : 'Single Sign-On (SAML)'

    const description = integrationType === 'meta'
        ? 'Connect your Facebook/Instagram account to sync leads.'
        : integrationType === 'slack'
            ? 'Connect Slack to receive notifications.'
            : integrationType === 'twilio'
                ? 'Connect Twilio account for cloud telephony.'
                : integrationType === 'whatsapp'
                    ? 'Connect WhatsApp Business API.'
                    : integrationType === 'happilee'
                        ? 'Connect Happilee for WhatsApp automation.'
                        : integrationType === 'wabis'
                            ? 'Sync leads from Wabis.'
                            : integrationType === 'doubletick'
                                ? 'Integrate DoubleTick WhatsApp API.'
                                : integrationType === 'googleads'
                                    ? 'Sync Google Ads lead forms.'
                                    : integrationType === 'wati'
                                        ? 'Connect Wati for WhatsApp marketing.'
                                        : integrationType === 'halapi'
                                            ? 'Integrate HAL API for appointments.'
                                            : 'Configure SAML 2.0 Identity Provider (Okta, Azure AD, etc)'

    return (
        <Dialog open={finalOpen} onOpenChange={finalOnOpenChange}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px]">
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
                                            Turn on to activate.
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

                        {/* Fields for SSO */}
                        {integrationType === 'sso' && isConnected && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="entryPoint"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>IDP Entry Point (SSO URL)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://idp.example.com/sso/saml" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Login URL provided by your Identity Provider.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="issuer"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Issuer (Entity ID)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="mern-crm" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Audience URI / Entity ID configured in IDP. Default: mern-crm
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="cert"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Identity Provider Certificate</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <textarea
                                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                        placeholder="-----BEGIN CERTIFICATE-----..."
                                                        {...field}
                                                    />
                                                </div>
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                X.509 Certificate (PEM format) from your IDP.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

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
                                    name="appId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>App ID (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Meta App ID" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Required for token exchange. Overrides system default.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="appSecret"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>App Secret (Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Meta App Secret" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Required for token exchange. Overrides system default.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Fields for WhatsApp */}
                        {integrationType === 'whatsapp' && isConnected && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="accessToken"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Access Token</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Enter WhatsApp Access Token" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                System User Access Token from Meta Business.
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
                                                <Input placeholder="WhatsApp Phone Number ID" {...field} />
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
                                            <FormLabel>WABA ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="WhatsApp Business Account ID" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Required for templates and advanced features.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="appId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>App ID (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Meta App ID" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="appSecret"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>App Secret (Optional)</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Meta App Secret" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Fields for Meta - Updated to remove WhatsApp fields */}
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

                        {/* Fields for Happilee, Wabis, DoubleTick, Wati, HAL API */}
                        {['happilee', 'wabis', 'doubletick', 'wati', 'halapi'].includes(integrationType) && isConnected && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="apiKey"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>API Key</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Provider API Key" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endpoint"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Endpoint URL (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="https://api.provider.com/v1" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        {/* Specific Fields for Google Ads */}
                        {integrationType === 'googleads' && isConnected && (
                            <>
                                <FormField
                                    control={form.control}
                                    name="customerId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Customer ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="123-456-7890" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs">
                                                Your Google Ads Customer ID.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="apiKey"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Developer Token</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Developer Token" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </>
                        )}

                        <DialogFooter className="flex justify-between sm:justify-between">
                            {((integrationType === 'meta' && isConnected) || (integrationType === 'whatsapp' && isConnected)) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={async () => {
                                        try {
                                            if (integrationType === 'meta') {
                                                const { testMetaConnection } = await import("@/services/adService");
                                                const result = await testMetaConnection();
                                                if (result.success) {
                                                    toast.success(`Connected to: ${result.accountName} (${result.status})`);
                                                }
                                            } else if (integrationType === 'whatsapp') {
                                                const { testWhatsAppConnection } = await import("@/services/whatsAppService");
                                                const result = await testWhatsAppConnection();
                                                if (result.success) {
                                                    toast.success(`Connected to: ${result.verifiedName} (${result.phoneNumber})`);
                                                }
                                            }
                                        } catch (err: unknown) {
                                            const error = err as { message?: string; response?: { data?: { message?: string } } };
                                            toast.error("Connection failed: " + (error.response?.data?.message || error.message));
                                        }
                                    }}
                                >
                                    Test Connection
                                </Button>
                            )}
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
