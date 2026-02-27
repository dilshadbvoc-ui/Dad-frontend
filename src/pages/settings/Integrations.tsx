import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrganisation } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, CheckCircle2, Unplug } from "lucide-react";
import {
    FacebookLogo,
    WhatsAppLogo,
    GoogleAdsLogo,
    HappileeLogo,
    WabisLogo,
    DoubleTickLogo,
    WatiLogo,
    HalApiLogo,
    WebFormLogo
} from "@/components/icons/BrandLogos";
import { IntegrationConfigDialog } from "@/components/settings/IntegrationConfigDialog";
import { MetaAccountConfigDialog } from "@/components/settings/MetaAccountConfigDialog";
import { GmailConnect } from "@/components/settings/GmailConnect";

interface MetaAccount {
    adAccountId?: string;
    adAccountName?: string;
    pageName?: string;
    pageId?: string;
    branchId?: string;
}

export default function IntegrationsPage() {
    const queryClient = useQueryClient();
    const [searchTerm] = useState("");

    // Config Dialog State
    const [configOpen, setConfigOpen] = useState(false);
    const [activeConfigType, setActiveConfigType] = useState<'meta' | 'slack' | 'twilio' | 'whatsapp' | 'sso' | 'happilee' | 'wabis' | 'doubletick' | 'googleads' | 'wati' | 'halapi' | null>(null);

    // Meta Account Config State
    const [metaConfigOpen, setMetaConfigOpen] = useState(false);
    const [selectedMetaAccount, setSelectedMetaAccount] = useState<MetaAccount | null>(null);

    // Fetch Organisation for integration settings
    const { data: orgData } = useQuery({
        queryKey: ['organisation'],
        queryFn: getOrganisation
    });


    const integrations = orgData?.integrations || {};

    const handleConnectMeta = async () => {
        try {
            const { api } = await import('@/services/api');
            const { data } = await api.get('/meta/auth');
            if (data.url) window.location.href = data.url;
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to initiate connection');
        }
    };

    const handleDisconnectMeta = async () => {
        try {
            const { api } = await import('@/services/api');
            await api.post('/meta/disconnect', { type: 'both' });
            queryClient.invalidateQueries({ queryKey: ['organisation'] });
            toast.success('Disconnected from Meta');
        } catch (error: unknown) {
            const err = error as { response?: { data?: { message?: string } } };
            toast.error(err.response?.data?.message || 'Failed to disconnect');
        }
    };

    const openConfig = (type: 'meta' | 'slack' | 'twilio' | 'whatsapp' | 'sso' | 'happilee' | 'wabis' | 'doubletick' | 'googleads' | 'wati' | 'halapi') => {
        setActiveConfigType(type);
        setConfigOpen(true);
    };

    const INTEGRATION_LIST = [
        {
            id: 'facebook',
            name: 'Facebook Leads',
            description: 'This feature automatically integrates leads from Facebook to PYPE, eliminating the need for manual input of lead data.',
            icon: FacebookLogo,
            iconColor: 'text-blue-600',
            connected: integrations.meta?.connected || (integrations.metaAccounts?.length > 0),
            accounts: integrations.metaAccounts || [],
            onEnable: handleConnectMeta,
            onDisable: handleDisconnectMeta,
            hasSettings: true,
            settingsType: 'meta' as const,
            isPlaceholder: false
        },
        {
            id: 'webform',
            name: 'Web Form',
            description: 'This feature allows you to automatically feed the lead data collected from any website to Workpex.',
            icon: WebFormLogo,
            iconColor: 'text-blue-500',
            connected: false,
            actionLabel: 'Enable',
            isPlaceholder: false,
            link: '/marketing/forms'
        },
        {
            id: 'whatsapp',
            name: 'Whatsapp',
            description: 'With this feature, leads from WhatsApp are automatically synced to Workpex, saving you from manual data entry.',
            icon: WhatsAppLogo,
            iconColor: 'text-green-500',
            connected: integrations.whatsapp?.connected,
            onEnable: handleConnectMeta,
            hasSettings: true,
            settingsType: 'whatsapp' as const,
            isPlaceholder: false
        },
        {
            id: 'happilee',
            name: 'Happilee',
            description: 'With this feature, leads from Happilee are automatically synced to Workpex, saving you from manual data entry.',
            icon: HappileeLogo,
            iconColor: 'text-blue-400',
            connected: integrations.happilee?.connected,
            onEnable: () => openConfig('happilee'),
            hasSettings: true,
            settingsType: 'happilee' as const,
            isPlaceholder: false
        },
        {
            id: 'wabis',
            name: 'Wabis',
            description: 'With this feature, leads from Wabis are automatically synced to Workpex, saving you from manual data entry.',
            icon: WabisLogo,
            iconColor: 'text-green-600',
            connected: integrations.wabis?.connected,
            onEnable: () => openConfig('wabis'),
            hasSettings: true,
            settingsType: 'wabis' as const,
            isPlaceholder: false
        },
        {
            id: 'doubletick',
            name: 'DoubleTick',
            description: 'With this feature, leads from DoubleTick are automatically synced to Workpex, saving you from manual data entry.',
            icon: DoubleTickLogo,
            iconColor: 'text-green-600',
            connected: integrations.doubletick?.connected,
            onEnable: () => openConfig('doubletick'),
            hasSettings: true,
            settingsType: 'doubletick' as const,
            isPlaceholder: false
        },
        {
            id: 'googleads',
            name: 'Google Ads',
            description: 'With this feature, leads from Google Ads are automatically synced to Workpex, saving you from manual data entry.',
            icon: GoogleAdsLogo,
            iconColor: 'text-yellow-500',
            connected: integrations.googleads?.connected,
            onEnable: () => openConfig('googleads'),
            hasSettings: true,
            settingsType: 'googleads' as const,
            isPlaceholder: false
        },
        {
            id: 'wati',
            name: 'Wati',
            description: 'With this feature, leads from Wati are automatically synced to Workpex, saving you from manual data entry.',
            icon: WatiLogo,
            iconColor: 'text-green-600',
            connected: integrations.wati?.connected,
            onEnable: () => openConfig('wati'),
            hasSettings: true,
            settingsType: 'wati' as const,
            isPlaceholder: false
        },
        {
            id: 'halapi',
            name: 'HAL API',
            description: 'Custom implementation for HAL API integration.',
            icon: HalApiLogo,
            iconColor: 'text-purple-600',
            connected: integrations.halapi?.connected,
            onEnable: () => openConfig('halapi'),
            hasSettings: true,
            settingsType: 'halapi' as const,
            isPlaceholder: false
        }
    ];

    const filteredIntegrations = INTEGRATION_LIST.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">Integrations</h1>
                <p className="text-indigo-300/70 mt-1">Manage webhooks, APIs, and third-party integrations.</p>
            </div>

            {/* Personal Email Integration */}
            <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Your Email</h2>
                <p className="text-sm text-indigo-300/70">Connect your personal Gmail to send emails from the CRM.</p>
                <div className="max-w-md">
                    <GmailConnect />
                </div>
            </div>

            <hr className="border-indigo-900/50" />

            {/* Organisation Integrations */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-1">Organisation Integrations</h2>
                <p className="text-sm text-indigo-300/70 mb-4">Manage webhooks, APIs, and third-party integrations.</p>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredIntegrations.map((integration) => (
                    <Card key={integration.id} className={integration.connected ? "border-green-200 dark:border-green-800" : ""}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                                        <integration.icon className={`h-5 w-5 ${integration.iconColor}`} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{integration.name}</CardTitle>
                                        <CardDescription className="text-xs">
                                            {integration.description}
                                        </CardDescription>
                                    </div>
                                </div>
                                {integration.connected ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 gap-1">
                                        <CheckCircle2 className="w-3 h-3" />
                                        Connected
                                    </Badge>
                                ) : null}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Show connected accounts for Facebook */}
                            {integration.id === 'facebook' && integration.accounts && integration.accounts.length > 0 ? (
                                <div className="space-y-3">
                                    {integration.accounts.map((acc: MetaAccount, idx: number) => (
                                        <div key={acc.adAccountId || idx} className="flex items-center justify-between p-3 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{acc.adAccountName || acc.pageName || 'Account'}</span>
                                                <span className="text-xs text-muted-foreground">ID: {acc.adAccountId || 'N/A'}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs"
                                                    onClick={() => {
                                                        setSelectedMetaAccount(acc);
                                                        setMetaConfigOpen(true);
                                                    }}
                                                >
                                                    <Settings className="h-3 w-3 mr-1" />
                                                    Config
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={async () => {
                                                        try {
                                                            const { api } = await import('@/services/api');
                                                            await api.post('/meta/disconnect', { type: 'meta', adAccountId: acc.adAccountId });
                                                            queryClient.invalidateQueries({ queryKey: ['organisation'] });
                                                            toast.success(`Disconnected ${acc.adAccountName || 'account'}`);
                                                        } catch {
                                                            toast.error('Failed to disconnect');
                                                        }
                                                    }}
                                                >
                                                    <Unplug className="h-3 w-3 mr-1" />
                                                    Disconnect
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleConnectMeta}
                                    >
                                        Add Another Account
                                    </Button>
                                </div>
                            ) : integration.connected ? (
                                <div className="space-y-3">
                                    <p className="text-xs text-muted-foreground">
                                        This integration is active and syncing data to your CRM.
                                    </p>
                                    <div className="flex gap-2">
                                        {integration.hasSettings && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => openConfig(integration.settingsType!)}
                                                className="gap-1.5"
                                            >
                                                <Settings className="w-3.5 h-3.5" />
                                                Settings
                                            </Button>
                                        )}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                                            onClick={() => integration.onDisable?.()}
                                        >
                                            <Unplug className="w-3.5 h-3.5" />
                                            Disconnect
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {integration.link ? (
                                        <Button
                                            size="sm"
                                            onClick={() => window.location.href = integration.link!}
                                            className="gap-2"
                                        >
                                            Enable
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                if (integration.isPlaceholder) {
                                                    toast.info("This integration is coming soon!");
                                                    return;
                                                }
                                                integration.onEnable?.();
                                            }}
                                            className="gap-2"
                                        >
                                            Enable
                                        </Button>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Config Dialog */}
            <IntegrationConfigDialog
                open={configOpen}
                onOpenChange={setConfigOpen}
                integrationType={activeConfigType!}
                initialValues={integrations[activeConfigType!] || {}}
            />

            {/* Meta Account Config Dialog */}
            <MetaAccountConfigDialog
                open={metaConfigOpen}
                onOpenChange={setMetaConfigOpen}
                account={selectedMetaAccount}
                integrations={integrations}
            />
        </div >
    );
}
