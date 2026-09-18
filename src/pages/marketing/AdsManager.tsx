import React, { useState, useEffect, useMemo } from 'react';
import { getAdAccounts, getMetaCampaigns, createMetaCampaign, getAccountInsights, getCampaignInsights, type Campaign, type AdInsight } from '../../services/marketingService';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { Eye, MousePointerClick, DollarSign, Target, TrendingUp, Users, BarChart3, RefreshCcw, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Filter, Building2 } from 'lucide-react';
import { FILTER_CARD_CLASS, FILTER_ICON_CLASS, FILTER_LABEL_CLASS, FILTER_TRIGGER_CLASS } from '@/pages/leads/filterStyles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrganisation } from '../../services/settingsService';
import { useNavigate } from 'react-router-dom';
import { DateRangePicker } from '../../components/shared/DateRangePicker';
import { subDays } from 'date-fns';
import { formatIST, toISTDateString, getISTNow } from '../../lib/dateUtils';

const AdsManager: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: organisation } = useQuery({
    queryKey: ['organisation'],
    queryFn: getOrganisation
  });
  const [adAccounts, setAdAccounts] = useState<{ id: string; name: string; account_id: string }[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [metaConnected, setMetaConnected] = useState(true);
  const [tokenExpired, setTokenExpired] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', objective: 'OUTCOME_LEADS' });

  // Analytics state
  const [accountInsights, setAccountInsights] = useState<AdInsight | null>(null);
  const [campaignInsights, setCampaignInsights] = useState<AdInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);

  // Shared date range — drives both the account overview and every campaign's
  // expanded analytics, since campaignInsights is fetched with the same range.
  const [startDate, setStartDate] = useState<string>(toISTDateString(subDays(getISTNow(), 29)));
  const [endDate, setEndDate] = useState<string>(toISTDateString());

  // Campaign list sort/filter
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchAdAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      fetchCampaigns(selectedAccount);
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedAccount) {
      fetchInsights(selectedAccount);
    }
  }, [selectedAccount, startDate, endDate]);

  const fetchAdAccounts = async () => {
    try {
      const res = await getAdAccounts();
      if (res.code === 'META_NOT_CONNECTED') {
        setMetaConnected(false);
        return;
      }
      if (res.data && res.data.data) {
        setAdAccounts(res.data.data);
        if (res.data.data.length > 0) {
          setSelectedAccount(res.data.data[0].id);
        }
      } else if (res.data) {
        const accounts = Array.isArray(res.data) ? res.data : res.data.data || [];
        setAdAccounts(accounts);
        if (accounts.length > 0) {
          setSelectedAccount(accounts[0].id);
        }
      }
      setMetaConnected(true);
      setTokenExpired(false);
    } catch (error: unknown) {
      const err = error as { response?: { status: number; data?: { code?: string } } };
      if (err.response?.status === 401 || err.response?.data?.code === 'META_TOKEN_EXPIRED') {
        setTokenExpired(true);
      } else if (err.response?.status === 400 && err.response?.data?.code === 'META_NOT_CONNECTED') {
        setMetaConnected(false);
      } else {
        console.error('Failed to fetch ad accounts', error);
        toast.error('Failed to load Ad Accounts.');
      }
    }
  };

  const fetchCampaigns = async (accountId: string) => {
    if (!accountId) return;
    setLoading(true);
    try {
      const res = await getMetaCampaigns(accountId);
      setCampaigns(res.data || res || []);
    } catch (error) {
      console.error('Failed to fetch campaigns', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchInsights = async (accountId: string) => {
    setInsightsLoading(true);
    try {
      const [acctData, campData] = await Promise.all([
        getAccountInsights(accountId, startDate, endDate).catch(() => null),
        getCampaignInsights(accountId, startDate, endDate).catch(() => [])
      ]);

      if (acctData && !acctData.error) {
        const insights = Array.isArray(acctData) ? acctData[0] : acctData;
        setAccountInsights(insights || null);
      }

      if (campData && !campData.error) {
        const campInsights = Array.isArray(campData) ? campData : campData.data || [];
        setCampaignInsights(campInsights);
      }
    } catch (error) {
      console.error('Failed to fetch insights', error);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedAccount) return;
    try {
      await createMetaCampaign(selectedAccount, {
        name: newCampaign.name,
        objective: newCampaign.objective,
        status: 'PAUSED',
        special_ad_categories: []
      } as Partial<Campaign> & Record<string, unknown>);
      toast.success('Campaign Created Successfully!');
      fetchCampaigns(selectedAccount);
      setNewCampaign({ name: '', objective: 'OUTCOME_LEADS' });
      setShowCreateForm(false);
    } catch {
      toast.error('Failed to create campaign');
    }
  };

  const handleToggleLeadSync = async (accountId: string, enabled: boolean) => {
    try {
      const { updateOrganisation } = await import('../../services/settingsService');
      const currentIntegrations = (organisation?.integrations as any) || {};
      const meta = currentIntegrations.meta || {};

      // Compute new enabled list for the primary meta field
      const enabledAccounts = [...(meta.enabledLeadSyncAccounts || [])];
      let newEnabledAccounts: string[];
      if (enabled) {
        newEnabledAccounts = enabledAccounts.includes(accountId)
          ? enabledAccounts
          : [...enabledAccounts, accountId];
      } else {
        newEnabledAccounts = enabledAccounts.filter((id: string) => id !== accountId);
      }

      // FIX: Also propagate to every metaAccounts[] entry so the backend
      // lead service (which reads matchedAccount.enabledLeadSyncAccounts) picks it up.
      const updatedMetaAccounts = (currentIntegrations.metaAccounts || []).map((acc: any) => ({
        ...acc,
        enabledLeadSyncAccounts: enabled
          ? (acc.enabledLeadSyncAccounts || []).includes(accountId)
            ? acc.enabledLeadSyncAccounts
            : [...(acc.enabledLeadSyncAccounts || []), accountId]
          : (acc.enabledLeadSyncAccounts || []).filter((id: string) => id !== accountId)
      }));

      await updateOrganisation({
        integrations: {
          ...currentIntegrations,
          meta: {
            ...meta,
            enabledLeadSyncAccounts: newEnabledAccounts
          },
          // Write to metaAccounts[] too — this is what the backend lead service reads
          metaAccounts: updatedMetaAccounts
        }
      });

      queryClient.invalidateQueries({ queryKey: ['organisation'] });
      toast.success(enabled ? 'Lead sync enabled for this account' : 'Lead sync disabled for this account');
    } catch (error) {
      console.error('Failed to update lead sync settings', error);
      toast.error('Failed to update sync settings');
    }
  };

  // Per-campaign lead sync opt-out — lets a client keep the ad account/page connected
  // and enabled overall, but stop specific campaigns from creating CRM leads. Absence
  // from this list means "still syncing", so every existing campaign stays enabled by
  // default and nothing changes until someone explicitly unchecks one.
  const disabledCampaignIds: string[] = (organisation?.integrations as any)?.meta?.disabledLeadSyncCampaignIds || [];

  const handleToggleCampaignLeadSync = async (campaignId: string, enabled: boolean) => {
    try {
      const { updateOrganisation } = await import('../../services/settingsService');
      const currentIntegrations = (organisation?.integrations as any) || {};
      const meta = currentIntegrations.meta || {};
      const currentDisabled: string[] = meta.disabledLeadSyncCampaignIds || [];

      const newDisabled = enabled
        ? currentDisabled.filter((id: string) => id !== campaignId)
        : currentDisabled.includes(campaignId)
          ? currentDisabled
          : [...currentDisabled, campaignId];

      await updateOrganisation({
        integrations: {
          ...currentIntegrations,
          meta: {
            ...meta,
            disabledLeadSyncCampaignIds: newDisabled
          }
        }
      });

      queryClient.invalidateQueries({ queryKey: ['organisation'] });
      toast.success(enabled ? 'Lead sync enabled for this campaign' : 'Lead sync disabled for this campaign');
    } catch (error) {
      console.error('Failed to update campaign lead sync settings', error);
      toast.error('Failed to update sync settings');
    }
  };

  const formatNumber = (val: string | number | undefined) => {
    if (!val) return '0';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  const formatCurrency = (val: string | number | undefined) => {
    if (!val) return '₹0.00';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `₹${num.toFixed(2)}`;
  };

  const formatPercent = (val: string | number | undefined) => {
    if (!val) return '0.00%';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return `${num.toFixed(2)}%`;
  };

  const getLeadCount = (actions?: { action_type: string; value: string }[]) => {
    if (!actions) return '0';
    const leadAction = actions.find(a => a.action_type === 'lead' || a.action_type === 'onsite_conversion.lead_grouped');
    return leadAction?.value || '0';
  };

  const getCampaignInsight = (campaignId: string): AdInsight | undefined => {
    return campaignInsights.find(i => i.campaign_id === campaignId);
  };

  // Converts Meta's SCREAMING_SNAKE_CASE delivery values into readable labels,
  // e.g. "CAMPAIGN_PAUSED" -> "Campaign Paused".
  const humanizeStatus = (status: string) =>
    status
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'PAUSED':
      case 'CAMPAIGN_PAUSED':
      case 'ADSET_PAUSED': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'ARCHIVED':
      case 'DELETED': return 'bg-muted text-muted-foreground';
      case 'DISAPPROVED':
      case 'WITH_ISSUES': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'PENDING_REVIEW':
      case 'IN_PROCESS':
      case 'PENDING_BILLING_INFO':
      case 'PREAPPROVED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const availableStatuses = useMemo(() => {
    const set = new Set(campaigns.map(c => c.effective_status?.toUpperCase()).filter(Boolean));
    return Array.from(set) as string[];
  }, [campaigns]);

  const getSortValue = (camp: Campaign, insight: AdInsight | undefined, key: string): number | string => {
    switch (key) {
      case 'status': return camp.effective_status?.toLowerCase() || '';
      case 'impressions': return insight ? parseFloat(insight.impressions) || 0 : 0;
      case 'clicks': return insight ? parseFloat(insight.clicks) || 0 : 0;
      case 'spend': return insight ? parseFloat(insight.spend) || 0 : 0;
      case 'ctr': return insight ? parseFloat(insight.ctr) || 0 : 0;
      case 'leads': return insight ? parseFloat(getLeadCount(insight.actions)) || 0 : 0;
      case 'name':
      default:
        return camp.name?.toLowerCase() || '';
    }
  };

  const displayedCampaigns = useMemo(() => {
    const filtered = statusFilter === 'all'
      ? campaigns
      : campaigns.filter(c => c.effective_status?.toUpperCase() === statusFilter);

    return [...filtered].sort((a, b) => {
      const valA = getSortValue(a, getCampaignInsight(a.id), sortBy);
      const valB = getSortValue(b, getCampaignInsight(b.id), sortBy);
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      const numA = valA as number;
      const numB = valB as number;
      return sortDir === 'asc' ? numA - numB : numB - numA;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaigns, campaignInsights, statusFilter, sortBy, sortDir]);

  return (
    <div className="flex flex-col gap-5 p-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-12 w-12 rounded-[10px] bg-[hsl(var(--chart-5))]/10 flex items-center justify-center text-[hsl(var(--chart-5))] shrink-0">
            <Target className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold font-poppins text-foreground tracking-tight">Ads Manager</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Monitor and sync your Facebook ad campaigns</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => selectedAccount && fetchInsights(selectedAccount)}
            disabled={insightsLoading}
            className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-medium"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${insightsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <a href="https://adsmanager.facebook.com" target="_blank" rel="noreferrer">
            <Button className="h-9 rounded-[10px] gap-2 text-xs sm:text-sm font-semibold bg-[hsl(var(--chart-5))] text-white shadow-lg shadow-[hsl(var(--chart-5))]/20 hover:bg-[hsl(var(--chart-5))]/90">
              Open Meta Ads Manager
            </Button>
          </a>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-[10px] p-4 flex items-start gap-3" role="alert">
        <div className="bg-blue-100 dark:bg-blue-800 p-1 rounded-full mt-0.5 shrink-0">
          <Target className="h-4 w-4 text-blue-600 dark:text-blue-300" />
        </div>
        <div>
          <p className="font-semibold text-blue-800 dark:text-blue-300">Campaign Management</p>
          <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">
            Campaigns and ads are now managed directly in your <strong>Meta Ads Manager</strong> account.
            Incoming leads will automatically sync to your CRM leads list.
          </p>
        </div>
      </div>

      {!metaConnected && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-[10px] p-4" role="alert">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Meta Account Not Connected</p>
          <p className="text-amber-700 dark:text-amber-400 text-sm mt-1">Please connect your Facebook account in Settings → Integrations to manage ads.</p>
        </div>
      )}

      {tokenExpired && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-[10px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" role="alert">
          <div>
            <p className="font-semibold text-destructive">Meta Connection Expired</p>
            <p className="text-destructive/80 text-sm mt-1">Your Meta access token has expired or been revoked. Please reconnect to continue managing ads.</p>
          </div>
          <Button variant="destructive" size="sm" className="rounded-[10px] shrink-0" onClick={() => navigate('/settings/integrations')}>
            Reconnect Now
          </Button>
        </div>
      )}

      {/* Connection Info / Notice */}
      {metaConnected && organisation?.integrations?.facebook_payload?.connected && organisation?.integrations?.facebook_payload?.connectionMode === 'webhook' && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-[10px] p-4">
          <p className="font-semibold text-indigo-800 dark:text-indigo-300 flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Push-only Webhook Active
          </p>
          <p className="text-indigo-700 dark:text-indigo-400 text-sm mt-1">
            You are currently using the <strong>Direct Webhook URL</strong> to receive leads.
            In this mode, real-time analytics like reach and impressions are not available because no Meta Access Token is provided.
            <br />
            <Button variant="link" className="p-0 h-auto text-xs text-indigo-600 underline" onClick={() => navigate('/settings/integrations')}>
              Switch to API Sync to see analytics
            </Button>
          </p>
        </div>
      )}

      {/* Account Selector & Sync Toggle */}
      {metaConnected && (
        <div className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
          <div className={FILTER_CARD_CLASS}>
            <Building2 className={FILTER_ICON_CLASS} />
            <div className="min-w-0 flex-1">
              <label className={FILTER_LABEL_CLASS}>Ad Account</label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className={FILTER_TRIGGER_CLASS}><SelectValue placeholder="Select Account" /></SelectTrigger>
                <SelectContent className="rounded-xl shadow-2xl border-border/50">
                  {adAccounts.map(acc => (
                    <SelectItem key={acc.id} value={acc.id} className="rounded-lg">
                      {acc.name} ({acc.account_id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedAccount && (
            <div className={FILTER_CARD_CLASS}>
              <RefreshCcw className={FILTER_ICON_CLASS} />
              <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                <div>
                  <label className={FILTER_LABEL_CLASS}>Auto-Sync Leads</label>
                  <span className="text-sm font-bold">
                    {(organisation?.integrations as any)?.meta?.enabledLeadSyncAccounts?.includes(selectedAccount) ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <input
                  type="checkbox"
                  id="sync-toggle"
                  className="w-4 h-4 rounded border-border text-[hsl(var(--chart-5))] focus:ring-[hsl(var(--chart-5))] shrink-0"
                  checked={(organisation?.integrations as any)?.meta?.enabledLeadSyncAccounts?.includes(selectedAccount) || false}
                  onChange={(e) => handleToggleLeadSync(selectedAccount, e.target.checked)}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============= ANALYTICS OVERVIEW ============= */}
      {metaConnected && selectedAccount && (organisation?.integrations?.facebook_payload?.connectionMode !== 'webhook' || organisation?.integrations?.meta?.connected) && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Account Performance
            </h2>
            <div className="w-full sm:w-auto sm:min-w-[260px]">
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onUpdate={(start, end) => {
                  // Falls back to the default last-30-days window if the picker is cleared
                  setStartDate(start || toISTDateString(subDays(getISTNow(), 29)));
                  setEndDate(end || toISTDateString());
                }}
              />
            </div>
          </div>

          {insightsLoading && !accountInsights ? (
            <div className="flex justify-center items-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="ml-3 text-muted-foreground">Loading analytics...</span>
            </div>
          ) : accountInsights ? (
            <>
              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  { label: 'Impressions', value: formatNumber(accountInsights.impressions), icon: Eye, gradient: 'from-blue-500/5', badge: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' },
                  { label: 'Reach', value: formatNumber(accountInsights.reach), icon: Users, gradient: 'from-green-500/5', badge: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' },
                  { label: 'Clicks', value: formatNumber(accountInsights.clicks), icon: MousePointerClick, gradient: 'from-purple-500/5', badge: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' },
                  { label: 'CTR', value: formatPercent(accountInsights.ctr), icon: TrendingUp, gradient: 'from-amber-500/5', badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' },
                  { label: 'Spend', value: formatCurrency(accountInsights.spend), icon: DollarSign, gradient: 'from-red-500/5', badge: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' },
                  { label: 'Leads', value: getLeadCount(accountInsights.actions), icon: Target, gradient: 'from-teal-500/5', badge: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="block relative overflow-hidden rounded-[0.8rem] md:rounded-[2rem] bg-card p-4 sm:p-6 shadow-sm border-0 transition-all hover:shadow-md hover:-translate-y-1 group"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
                    <div className="relative flex flex-col items-center justify-center space-y-2 sm:space-y-3">
                      <div className={`flex h-9 w-9 sm:h-12 sm:w-12 items-center justify-center rounded-xl group-hover:scale-110 transition-transform ${stat.badge}`}>
                        <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" />
                      </div>
                      <h3 className="text-[9px] sm:text-sm font-bold text-muted-foreground text-center uppercase tracking-tight sm:normal-case sm:tracking-normal">{stat.label}</h3>
                      <div className="text-lg sm:text-2xl font-extrabold text-card-foreground truncate max-w-full">{stat.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Secondary metrics row */}
              <div className="rounded-[10px] bg-card border border-border overflow-hidden mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 divide-x divide-border">
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">Cost per Click</p>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(accountInsights.cpc)}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">CPM</p>
                    <p className="text-lg font-semibold text-foreground">{formatCurrency(accountInsights.cpm)}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">Unique Clicks</p>
                    <p className="text-lg font-semibold text-foreground">{formatNumber(accountInsights.unique_clicks)}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-muted-foreground">Date Range</p>
                    <p className="text-sm font-medium text-foreground">{accountInsights.date_start} – {accountInsights.date_stop}</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Create Campaign Form */}
      {showCreateForm && (
        <Card className="border-[hsl(var(--chart-5))]/20 shadow-md rounded-[10px]">
          <CardHeader>
            <CardTitle className="text-lg">Create New Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Campaign Name</Label>
                <Input
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                  placeholder="e.g. Summer Sale 2026"
                />
              </div>
              <div className="space-y-2">
                <Label>Objective</Label>
                <Select
                  value={newCampaign.objective}
                  onValueChange={(val) => setNewCampaign({ ...newCampaign, objective: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OUTCOME_LEADS">Leads</SelectItem>
                    <SelectItem value="OUTCOME_TRAFFIC">Traffic</SelectItem>
                    <SelectItem value="OUTCOME_SALES">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateCampaign} disabled={!newCampaign.name || loading}>
              {loading ? 'Processing...' : 'Create Campaign'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ============= CAMPAIGNS WITH INSIGHTS ============= */}
      <Card className="rounded-[10px]">
        <CardHeader className="flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Campaigns</CardTitle>
              {startDate && endDate && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Performance shown for {formatIST(startDate, 'MMM d, yyyy')} – {formatIST(endDate, 'MMM d, yyyy')}
                </p>
              )}
            </div>
            <span className="bg-muted text-muted-foreground px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0">
              {statusFilter === 'all' ? `${campaigns.length} total` : `${displayedCampaigns.length} of ${campaigns.length}`}
            </span>
          </div>

          {/* Sort & Filter controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
              <Filter className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Filter</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-[140px] text-xs bg-card rounded-[8px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="rounded-lg">All statuses</SelectItem>
                {availableStatuses.map(s => (
                  <SelectItem key={s} value={s} className="rounded-lg">{humanizeStatus(s)}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 w-[150px] text-xs bg-card rounded-[8px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="name" className="rounded-lg">Name</SelectItem>
                <SelectItem value="status" className="rounded-lg">Status</SelectItem>
                <SelectItem value="impressions" className="rounded-lg">Impressions</SelectItem>
                <SelectItem value="clicks" className="rounded-lg">Clicks</SelectItem>
                <SelectItem value="spend" className="rounded-lg">Spend</SelectItem>
                <SelectItem value="ctr" className="rounded-lg">CTR</SelectItem>
                <SelectItem value="leads" className="rounded-lg">Leads</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-[8px]"
              onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}
              title={sortDir === 'asc' ? 'Ascending' : 'Descending'}
            >
              {sortDir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--chart-5))] border-t-transparent" />
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No campaigns found.</p>
          ) : displayedCampaigns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No campaigns match the selected filter.</p>
          ) : (
            <div className="space-y-3">
              {displayedCampaigns.map((camp) => {
                const insight = getCampaignInsight(camp.id);
                const isExpanded = expandedCampaign === camp.id;

                return (
                  <div
                    key={camp.id}
                    className="border border-border rounded-[10px] overflow-hidden hover:shadow-md transition-shadow bg-card"
                  >
                    {/* Campaign Header */}
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => setExpandedCampaign(isExpanded ? null : camp.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                          checked={!disabledCampaignIds.includes(camp.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleToggleCampaignLeadSync(camp.id, e.target.checked)}
                          title="Sync leads from this campaign into the CRM"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground truncate">{camp.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">ID: {camp.id}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Quick stats inline */}
                        {insight && (
                          <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground mr-4">
                            <span title="Impressions" className="flex items-center gap-1.5">
                              <Eye className="h-3.5 w-3.5 text-blue-500" /> {formatNumber(insight.impressions)}
                            </span>
                            <span title="Clicks" className="flex items-center gap-1.5">
                              <MousePointerClick className="h-3.5 w-3.5 text-purple-500" /> {formatNumber(insight.clicks)}
                            </span>
                            <span title="Spend" className="flex items-center gap-1.5">
                              <DollarSign className="h-3.5 w-3.5 text-red-500" /> {formatCurrency(insight.spend)}
                            </span>
                            <span title="CTR" className="flex items-center gap-1.5">
                              <BarChart3 className="h-3.5 w-3.5 text-amber-500" /> {formatPercent(insight.ctr)}
                            </span>
                          </div>
                        )}

                        <Badge className={getStatusColor(camp.effective_status || camp.status)}>
                          {humanizeStatus(camp.effective_status || camp.status)}
                        </Badge>

                        <Badge variant="outline" className="hidden sm:inline-flex">
                          {camp.objective?.replace('OUTCOME_', '') || 'N/A'}
                        </Badge>

                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Expanded Campaign Insights */}
                    {isExpanded && !insight && (
                      <div className="border-t border-border bg-muted/40 p-4">
                        <p className="text-sm text-muted-foreground text-center py-2">
                          No performance data for this campaign in the selected date range.
                        </p>
                      </div>
                    )}
                    {isExpanded && insight && (
                      <div className="border-t border-border bg-muted/40 p-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                          {[
                            { label: 'Impressions', value: formatNumber(insight.impressions), icon: Eye, color: 'text-blue-500' },
                            { label: 'Reach', value: formatNumber(insight.reach), icon: Users, color: 'text-green-500' },
                            { label: 'Clicks', value: formatNumber(insight.clicks), icon: MousePointerClick, color: 'text-purple-500' },
                            { label: 'CTR', value: formatPercent(insight.ctr), icon: BarChart3, color: 'text-amber-500' },
                            { label: 'Spend', value: formatCurrency(insight.spend), icon: DollarSign, color: 'text-red-500' },
                            { label: 'CPC', value: formatCurrency(insight.cpc), icon: DollarSign, color: 'text-red-400' },
                            { label: 'CPM', value: formatCurrency(insight.cpm), icon: DollarSign, color: 'text-red-400' },
                            { label: 'Unique Clicks', value: formatNumber(insight.unique_clicks), icon: MousePointerClick, color: 'text-purple-400' },
                            { label: 'Leads', value: getLeadCount(insight.actions), icon: Target, color: 'text-teal-500' },
                          ].map((stat) => (
                            <div key={stat.label} className="bg-card rounded-lg border border-border p-3">
                              <div className="flex items-center gap-1.5 mb-1">
                                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</p>
                              </div>
                              <p className="text-lg font-bold">{stat.value}</p>
                            </div>
                          ))}
                          <div className="bg-card rounded-lg border border-border p-3 col-span-2">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Period</p>
                            <p className="text-sm font-medium">{insight.date_start} – {insight.date_stop}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdsManager;
