import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrganisation } from "@/services/settingsService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, CheckCircle2, Unplug, Plug } from "lucide-react";
import {
  FacebookLogo,
  WhatsAppLogo,
  GoogleAdsLogo,
  HappileeLogo,
  WabisLogo,
  DoubleTickLogo,
  WatiLogo,
  GallaboxLogo,
  HalApiLogo,
  WebFormLogo,
  ZapierLogo
} from "@/components/icons/BrandLogos";
import { IntegrationConfigDialog } from "@/components/settings/IntegrationConfigDialog";
import { MetaAccountConfigDialog } from "@/components/settings/MetaAccountConfigDialog";
import { GmailConnect } from "@/components/settings/GmailConnect";
import { formatIST } from "@/lib/dateUtils";

interface MetaAccount {
  adAccountId?: string;
  adAccountName?: string;
  pageName?: string;
  pageId?: string;
  branchId?: string;
  connected?: boolean;
  needsAdAccountSelection?: boolean;
  pixelId?: string;
}

interface WhatsAppAccount {
  phoneNumberId?: string;
  wabaId?: string;
  displayPhoneNumber?: string;
  verifiedName?: string;
  connected?: boolean;
  connectedAt?: string;
}

export default function IntegrationsPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm] = useState("");

  // Config Dialog State
  const [configOpen, setConfigOpen] = useState(false);
  const [activeConfigType, setActiveConfigType] = useState<'meta' | 'slack' | 'twilio' | 'whatsapp' | 'sso' | 'happilee' | 'wabis' | 'doubletick' | 'googleads' | 'wati' | 'halapi' | 'gallabox' | 'zapier' | null>(null);

  // Meta Account Config State
  const [metaConfigOpen, setMetaConfigOpen] = useState(false);
  const [selectedMetaAccount, setSelectedMetaAccount] = useState<MetaAccount | null>(null);

  // Fetch Organisation for integration settings
  const { data: orgData } = useQuery({
    queryKey: ['organisation'],
    queryFn: getOrganisation
  });


  const integrations = orgData?.integrations || {};

  // Right after connecting, if the connecting Facebook user had more than one ad account,
  // there's no safe default to pick — force the "which ad account" choice immediately instead
  // of leaving it to be discovered later. Also re-checks on every load (not just the redirect)
  // so the prompt reappears if it was dismissed without being resolved.
  useEffect(() => {
    const metaAccounts: MetaAccount[] = integrations.metaAccounts || [];
    const pendingAccount = metaAccounts.find(acc => acc.needsAdAccountSelection);
    if (pendingAccount) {
      setSelectedMetaAccount(pendingAccount);
      setMetaConfigOpen(true);
    }
    if (searchParams.get('needsAdAccountSelection')) {
      const next = new URLSearchParams(searchParams);
      next.delete('needsAdAccountSelection');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgData]);

  // Surface the result of the Meta OAuth redirect (Facebook Leads or WhatsApp
  // connect) - previously silent, which made a failed/no-op connection
  // indistinguishable from a successful one.
  useEffect(() => {
    const error = searchParams.get('error');
    const whatsappResult = searchParams.get('whatsapp');
    const success = searchParams.get('success');

    if (error) {
      toast.error(searchParams.get('message') || 'Failed to connect to Meta');
    } else if (whatsappResult === 'connected') {
      toast.success('WhatsApp number connected successfully');
    } else if (whatsappResult === 'no_account_found') {
      toast.error('No WhatsApp Business Account found for that Facebook login. Make sure the number is registered under your Business Manager before connecting.');
    } else if (success && searchParams.get('meta') === 'connected') {
      toast.success('Facebook account connected successfully');
    }

    if (error || whatsappResult || success) {
      const next = new URLSearchParams(searchParams);
      ['error', 'message', 'whatsapp', 'success', 'meta'].forEach(k => next.delete(k));
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectMeta = async (type: 'meta' | 'whatsapp' = 'meta') => {
    try {
      const { api } = await import('@/services/api');
      const { data } = await api.get('/meta/auth', { params: { type } });
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

  const openConfig = (type: 'meta' | 'slack' | 'twilio' | 'whatsapp' | 'sso' | 'happilee' | 'wabis' | 'doubletick' | 'googleads' | 'wati' | 'halapi' | 'gallabox' | 'zapier') => {
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
      onEnable: () => handleConnectMeta('meta'),
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
      connected: (integrations.whatsappAccounts?.length > 0) || integrations.whatsapp?.connected,
      accounts: integrations.whatsappAccounts || [],
      onEnable: () => handleConnectMeta('whatsapp'),
      onDisable: async () => {
        try {
          const { api } = await import('@/services/api');
          await api.post('/meta/disconnect', { type: 'whatsapp' });
          queryClient.invalidateQueries({ queryKey: ['organisation'] });
          toast.success('Disconnected from WhatsApp');
        } catch {
          toast.error('Failed to disconnect');
        }
      },
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
    },
    {
      id: 'gallabox',
      name: 'Gallabox',
      description: 'Connect Gallabox for advanced WhatsApp lead syncing and communication.',
      icon: GallaboxLogo,
      iconColor: 'text-indigo-500',
      connected: integrations.gallabox?.connected,
      onEnable: () => openConfig('gallabox'),
      hasSettings: true,
      settingsType: 'gallabox' as const,
      isPlaceholder: false
    },
    {
      id: 'zapier',
      name: 'Zapier (Facebook Leads)',
      description: 'Connect Facebook Lead Ads via Zapier to automatically sync leads into PypeCRM without direct Meta API access.',
      icon: ZapierLogo,
      iconColor: 'text-orange-500',
      connected: integrations.zapier?.connected,
      onEnable: () => openConfig('zapier'),
      onDisable: async () => {
        try {
          const { api } = await import('@/services/api');
          await api.post('/organisation', { integrations: { ...integrations, zapier: { connected: false } } });
          queryClient.invalidateQueries({ queryKey: ['organisation'] });
          toast.success('Disconnected Zapier');
        } catch {
          toast.error('Failed to disconnect');
        }
      },
      hasSettings: true,
      settingsType: 'zapier' as const,
      isPlaceholder: false
    }
  ];

  const filteredIntegrations = INTEGRATION_LIST.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const connectedCount = filteredIntegrations.filter(i => i.connected).length;

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
          <Plug className="h-6 w-6" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight flex items-center gap-2.5">
            Integrations
            <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-sm font-bold">
              {connectedCount}/{filteredIntegrations.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Manage webhooks, APIs, and third-party integrations
          </p>
        </div>
      </div>

      {/* Personal Email Integration */}
      <div className="rounded-[10px] border border-border bg-card p-4 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Your Email</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Connect your personal Gmail to send emails from the CRM.</p>
        </div>
        <div className="max-w-md">
          <GmailConnect />
        </div>
      </div>

      {/* Organisation Integrations */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-1">Organisation Integrations</h2>
        <p className="text-sm text-muted-foreground mb-4">Manage webhooks, APIs, and third-party integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredIntegrations.map((integration) => (
          <Card key={integration.id} className={`rounded-[10px] ${integration.connected ? "border-green-200 dark:border-green-800" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center ${integration.id === 'facebook' ? 'bg-gradient-to-br from-blue-600 to-blue-800' :
                      integration.id === 'webform' ? 'bg-gradient-to-br from-indigo-500 to-indigo-700' :
                        integration.id === 'whatsapp' ? 'bg-gradient-to-br from-green-500 to-green-700' :
                          integration.id === 'happilee' ? 'bg-gradient-to-br from-sky-400 to-sky-600' :
                            integration.id === 'wabis' ? 'bg-gradient-to-br from-emerald-500 to-emerald-700' :
                              integration.id === 'doubletick' ? 'bg-gradient-to-br from-teal-500 to-teal-700' :
                                integration.id === 'googleads' ? 'bg-gradient-to-br from-yellow-400 via-red-400 to-blue-500' :
                                  integration.id === 'wati' ? 'bg-gradient-to-br from-green-600 to-green-800' :
                                    integration.id === 'halapi' ? 'bg-gradient-to-br from-purple-500 to-purple-700' :
                                      integration.id === 'gallabox' ? 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500' :
                                          integration.id === 'zapier' ? 'bg-gradient-to-br from-orange-500 to-amber-600' :
                                            'bg-gradient-to-br from-gray-500 to-gray-700'
                    }`}>
                    <integration.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {integration.id === 'facebook' ? 'Auto-sync leads from Facebook' :
                        integration.id === 'webform' ? 'Capture leads from your website' :
                          integration.id === 'whatsapp' ? 'Sync leads from WhatsApp' :
                            integration.id === 'googleads' ? 'Import leads from Google Ads' :
                              integration.id === 'zapier' ? 'Facebook Leads via Zapier webhook' :
                                `Connect with ${integration.name}`}
                    </CardDescription>
                  </div>
                </div>
                {integration.connected ? (
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Connected
                    </Badge>
                    {integration.id === 'facebook' && integrations.meta?.tokenExpiresAt && (
                      <span className={`text-[10px] font-medium ${
                        new Date(integrations.meta.tokenExpiresAt).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000
                          ? 'text-amber-500 animate-pulse'
                          : 'text-muted-foreground'
                      }`}>
                        Expires: {formatIST(integrations.meta.tokenExpiresAt, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not Connected
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Show connected accounts for Facebook */}
              {integration.id === 'facebook' && integration.accounts && integration.accounts.length > 0 ? (
                <div className="space-y-4">

                  {integration.accounts.map((acc: MetaAccount, idx: number) => (
                    <div key={acc.pageId || acc.adAccountId || idx} className={`flex items-center justify-between p-3 rounded-[8px] border ${
                      acc.needsAdAccountSelection
                        ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30"
                        : acc.connected !== false
                        ? "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30"
                        : "bg-slate-50/30 dark:bg-slate-900/5 border-slate-100 dark:border-slate-900/10 opacity-70"
                    }`}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{acc.pageName || acc.adAccountName || 'Account'}</span>
                          {acc.needsAdAccountSelection ? (
                            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 text-[10px] py-0 px-1.5 h-4">
                              Action needed
                            </Badge>
                          ) : acc.connected !== false ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[10px] py-0 px-1.5 h-4">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800 text-[10px] py-0 px-1.5 h-4">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <span className={`text-xs ${acc.needsAdAccountSelection ? 'text-amber-600 dark:text-amber-500 font-medium' : 'text-muted-foreground'}`}>
                          {acc.needsAdAccountSelection
                            ? 'This Facebook user has multiple ad accounts — select which one to use'
                            : acc.adAccountName ? `Ad Account: ${acc.adAccountName}` : 'No ad account linked'}
                        </span>
                        {!acc.needsAdAccountSelection && (
                          <span className={`text-[11px] ${acc.pixelId ? 'text-green-600 dark:text-green-500' : 'text-muted-foreground'}`}>
                            Conversions API: {acc.pixelId ? 'Connected' : 'Not connected — add a Pixel ID in Config'}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={acc.needsAdAccountSelection ? "default" : "ghost"}
                          className="h-7 text-xs"
                          onClick={() => {
                            setSelectedMetaAccount(acc);
                            setMetaConfigOpen(true);
                          }}
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          {acc.needsAdAccountSelection ? 'Select Ad Account' : 'Config'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            try {
                              const { api } = await import('@/services/api');
                              await api.post('/meta/disconnect', { type: 'meta', pageId: acc.pageId });
                              queryClient.invalidateQueries({ queryKey: ['organisation'] });
                              toast.success(`Disconnected ${acc.pageName || 'page'}`);
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
                    onClick={() => handleConnectMeta('meta')}
                  >
                    Add Another Account
                  </Button>
                </div>
              ) : integration.id === 'whatsapp' && integration.accounts && integration.accounts.length > 0 ? (
                <div className="space-y-4">
                  {integration.accounts.map((acc: WhatsAppAccount, idx: number) => (
                    <div key={acc.phoneNumberId || idx} className={`flex items-center justify-between p-3 rounded-[8px] border ${
                      acc.connected !== false
                        ? "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30"
                        : "bg-slate-50/30 dark:bg-slate-900/5 border-slate-100 dark:border-slate-900/10 opacity-70"
                    }`}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{acc.displayPhoneNumber || acc.phoneNumberId || 'Number'}</span>
                          {acc.connected !== false ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800 text-[10px] py-0 px-1.5 h-4">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800 text-[10px] py-0 px-1.5 h-4">
                              Inactive
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {acc.verifiedName || 'No business name set'}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={async () => {
                            try {
                              const { api } = await import('@/services/api');
                              await api.post('/meta/disconnect', { type: 'whatsapp', phoneNumberId: acc.phoneNumberId });
                              queryClient.invalidateQueries({ queryKey: ['organisation'] });
                              toast.success(`Disconnected ${acc.displayPhoneNumber || 'number'}`);
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
                    onClick={() => handleConnectMeta('whatsapp')}
                  >
                    Add Another Number
                  </Button>
                </div>
              ) : integration.connected ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                  

                  {integration.id === 'zapier' && integrations.zapier?.connected && (
                    <div className="bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 space-y-2 mt-2 mb-3">
                      <h4 className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase">Zapier Webhook URL</h4>
                      <p className="text-xs text-orange-600/80 dark:text-orange-300/80">
                        Use this URL as the <strong>Webhook URL</strong> in your Zapier action step.
                      </p>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-orange-600/60 dark:text-orange-400/60">Webhook URL</label>
                        <div className="flex gap-2">
                          <code className="text-xs bg-white dark:bg-gray-950 p-2 rounded border flex-1 break-all">
                            {`${window.location.origin.replace('3000', '5001').replace('5173', '5000')}/api/public/zapier/webhook/${orgData?.id || '<ORG_ID>'}?apiKey=${integrations.zapier?.apiKey || '<API_KEY>'}`}
                          </code>
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => {
                            navigator.clipboard.writeText(
                              `${window.location.origin.replace('3000', '5001').replace('5173', '5000')}/api/public/zapier/webhook/${orgData?.id || ''}?apiKey=${integrations.zapier?.apiKey || ''}`
                            );
                            toast.success('Webhook URL Copied');
                          }}>Copy</Button>
                        </div>
                      </div>
                    </div>
                  )}

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
                  <p className="text-sm text-muted-foreground">
                    {integration.description}
                  </p>
                  {integration.link ? (
                    <Button
                      size="sm"
                      onClick={() => window.location.href = integration.link!}
                      className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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
                      className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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
