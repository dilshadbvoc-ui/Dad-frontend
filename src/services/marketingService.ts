import { api } from './api';

export interface EmailList {
    id: string;
    name: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    contacts?: Record<string, unknown>[];
}

export interface Campaign {
    id: string;
    name: string;
    subject?: string;
    status: string;
    stats?: {
        sent: number;
        opened: number;
        clicked: number;
    };
    sentAt?: string;
    createdAt?: string;
    objective?: string; // Added for AdsManager
    effective_status?: string; // Meta's real delivery status (accounts for ad set/ad-level pauses, review, billing holds etc.) — distinct from the raw user-set `status`
}

export const getAdAccounts = async () => {
    const response = await api.get('/marketing/ad-accounts');
    return response.data;
};

export const getMetaCampaigns = async (adAccountId: string) => {
    if (!adAccountId) return { data: [] }; // Safety check
    const response = await api.get(`/marketing/${adAccountId}/campaigns`);
    return response.data;
};

export const getEmailCampaigns = async () => {
    const response = await api.get('/campaigns');
    return response.data.campaigns;
};

export const createMetaCampaign = async (adAccountId: string, data: Partial<Campaign> & Record<string, unknown>) => {
    const response = await api.post(`/marketing/${adAccountId}/campaigns`, data);
    return response.data;
};

export const updateCampaignStatus = async (adAccountId: string, campaignId: string, status: 'ACTIVE' | 'PAUSED') => {
    const response = await api.patch(`/marketing/${adAccountId}/campaigns/${campaignId}`, { status });
    return response.data;
};

export interface AdSet {
    id: string;
    name: string;
    status: string;
    effective_status?: string;
    daily_budget?: string;
    lifetime_budget?: string;
    start_time?: string;
}

export interface Ad {
    id: string;
    name: string;
    status: string;
    effective_status?: string;
    creative?: {
        id: string;
        thumbnail_url?: string;
        image_url?: string;
        body?: string;
        title?: string;
    };
}

export const getAdSets = async (adAccountId: string, campaignId: string) => {
    const response = await api.get(`/marketing/${adAccountId}/campaigns/${campaignId}/adsets`);
    return response.data;
};

export const getAds = async (adAccountId: string, campaignId: string) => {
    const response = await api.get(`/marketing/${adAccountId}/campaigns/${campaignId}/ads`);
    return response.data;
};

export const updateAdSetStatus = async (adAccountId: string, adSetId: string, status: 'ACTIVE' | 'PAUSED') => {
    const response = await api.patch(`/marketing/${adAccountId}/adsets/${adSetId}/status`, { status });
    return response.data;
};

export const updateAdSetBudget = async (adAccountId: string, adSetId: string, budget: { dailyBudget?: number; lifetimeBudget?: number }) => {
    const response = await api.patch(`/marketing/${adAccountId}/adsets/${adSetId}/budget`, budget);
    return response.data;
};

export const createEmailCampaign = async (data: Partial<Campaign> & Record<string, unknown>) => {
    const response = await api.post('/campaigns', data);
    return response.data;
};

export const getEmailLists = async () => {
    const response = await api.get('/marketing/lists');
    return response.data;
};

export const createEmailList = async (data: Partial<EmailList>) => {
    const response = await api.post('/marketing/lists', data);
    return response.data;
};

export const getEmailListById = async (id: string) => {
    const response = await api.get(`/marketing/lists/${id}`);
    return response.data;
};

export const deleteEmailList = async (id: string) => {
    const response = await api.delete(`/marketing/lists/${id}`);
    return response.data;
};

// --- Ads Analytics ---
export interface AdInsight {
    impressions: string;
    clicks: string;
    spend: string;
    cpc: string;
    cpm: string;
    cpp: string;
    ctr: string;
    unique_clicks: string;
    reach: string;
    actions?: { action_type: string; value: string }[];
    date_start?: string;
    date_stop?: string;
    campaign_name?: string;
    campaign_id?: string;
}

export const getAccountInsights = async (accountId?: string, startDate?: string, endDate?: string) => {
    const response = await api.get('/ads/meta/account/insights', { params: { accountId, startDate, endDate } });
    return response.data;
};

export const getCampaignInsights = async (accountId?: string, startDate?: string, endDate?: string) => {
    const response = await api.get('/ads/meta/insights', { params: { level: 'campaign', accountId, startDate, endDate } });
    return response.data;
};
