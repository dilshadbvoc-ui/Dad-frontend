import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrganisation } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, CheckCircle2 } from "lucide-react";
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
            description: 'This feature automatically integrates leads from Facebook to Leadbox Solutions, eliminating the need for manual input of lead data.',
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

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIntegrations.map((integration) => (
                    <Card key={integration.id} className="h-full bg-[#1e1b4b] hover:shadow-md hover:shadow-indigo-900/20 transition-shadow duration-200 border border-indigo-900/50">
                        <CardContent className="p-5 flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-900/50 rounded-lg">
                                        <integration.icon className={`h-6 w-6 ${integration.iconColor}`} />
                                    </div>
                                    <h3 className="font-semibold text-white text-lg">
                                        {integration.name}
                                    </h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    {integration.connected && (
                                        <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10 gap-1 px-2 py-0.5 rounded-full">
                                            <CheckCircle2 className="h-3 w-3" />
                                            Enabled
                                        </Badge>
                                    )}
                                    {integration.connected && integration.hasSettings && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-indigo-300/60 hover:text-indigo-200"
                                            onClick={() => openConfig(integration.settingsType!)}
                                        >
                                            <Settings className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <p className="text-sm text-indigo-300/70 mb-4 flex-1 leading-relaxed">
                                {integration.description}
                            </p>

                            {/* Show connected accounts for Facebook */}
                            {integration.id === 'facebook' && integration.accounts && integration.accounts.length > 0 && (
                                <div className="mb-4 space-y-2">
                                    <p className="text-xs font-medium text-indigo-300">Connected Accounts:</p>
                                    {integration.accounts.map((acc: MetaAccount, idx: number) => (
                                        <div key={acc.adAccountId || idx} className="flex items-center justify-between bg-indigo-900/30 p-2 rounded-lg text-xs">
                                            <div className="flex flex-col">
                                                <span className="font-medium text-white">{acc.adAccountName || acc.pageName || 'Account'}</span>
                                                <span className="text-[10px] text-indigo-400">ID: {acc.adAccountId || 'N/A'}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-6 text-indigo-300 hover:text-white text-xs"
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
                                                    className="h-6 text-red-400 hover:text-red-300 text-xs"
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
                                                    Disconnect
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Debug: Client-side Login Button */}
                            {integration.id === 'facebook' && window.location.protocol === 'https:' && (
                                <div className="mb-4 p-2 bg-indigo-950/30 rounded border border-indigo-500/20 text-center">
                                    <p className="text-xs text-indigo-400 mb-2">Client SDK Test</p>
                                    <div
                                        className="fb-login-button"
                                        data-width=""
                                        data-size="large"
                                        data-button-type="continue_with"
                                        data-layout="default"
                                        data-auto-logout-link="false"
                                        data-use-continue-as="false"
                                        data-scope="public_profile,email,ads_read,ads_management,business_management,leads_retrieval,pages_read_engagement,pages_show_list,pages_manage_ads"
                                        data-onlogin="checkLoginState();">
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto flex justify-end">
                                {integration.link ? (
                                    <Button
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 h-9 text-sm font-medium"
                                        onClick={() => window.location.href = integration.link!}
                                    >
                                        Enable
                                    </Button>
                                ) : (
                                    <Button
                                        className={`${integration.connected
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white'} px-6 h-9 text-sm font-medium`}
                                        onClick={() => {
                                            if (integration.isPlaceholder) {
                                                toast.info("This integration is coming soon!");
                                                return;
                                            }
                                            if (integration.connected) {
                                                integration.onDisable?.();
                                            } else {
                                                integration.onEnable?.();
                                            }
                                        }}
                                    >
                                        {integration.connected ? 'Disable' : 'Enable'}
                                    </Button>
                                )}
                            </div>
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
