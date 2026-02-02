import { api } from './api';

export interface MetaCampaign {
    id: string;
    name: string;
    status: string;
    objective: string;
    daily_budget?: string;
    lifetime_budget?: string;
    start_time?: string;
    stop_time?: string;
}

export interface MetaAdSet {
    id: string;
    name: string;
    status: string;
    daily_budget?: string;
    lifetime_budget?: string;
    start_time?: string;
    end_time?: string;
    targeting?: Record<string, unknown>;
}

export interface MetaAd {
    id: string;
    name: string;
    status: string;
    creative?: {
        id: string;
        title?: string;
        body?: string;
        image_url?: string;
    };
}

export interface MetaInsights {
    impressions: string;
    clicks: string;
    spend: string;
    cpc: string;
    cpm: string;
    cpp: string;
    ctr: string;
    unique_clicks: string;
    reach: string;
    actions?: Array<Record<string, unknown>>;
}

export const getMetaCampaigns = async () => {
    const response = await api.get('/ads/meta/campaigns');
    return response.data;
};

export const getMetaAdSets = async (campaignId?: string) => {
    const response = await api.get('/ads/meta/adsets', { params: { campaignId } });
    return response.data;
};

export const getMetaAds = async (adSetId?: string) => {
    const response = await api.get('/ads/meta/ads', { params: { adSetId } });
    return response.data;
};

export const getMetaInsights = async (level: 'campaign' | 'adset' | 'ad' | 'account' = 'account') => {
    const response = await api.get('/ads/meta/insights', { params: { level } });
    return response.data;
};

export const testMetaConnection = async () => {
    const response = await api.post('/ads/meta/test');
    return response.data;
};
