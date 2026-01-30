import axios from 'axios';

interface MetaConfig {
    accessToken: string;
    adAccountId: string;
}

export class MetaService {
    private baseUrl = 'https://graph.facebook.com/v18.0';

    async makeRequest(endpoint: string, accessToken: string, params: any = {}, retries: number = 3) {
        let lastError: any;
        
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await axios.get(`${this.baseUrl}/${endpoint}`, {
                    params: {
                        access_token: accessToken,
                        ...params
                    },
                    timeout: 30000 // 30 second timeout
                });
                return response.data;
            } catch (error: any) {
                lastError = error;
                console.error(`Meta API Error (attempt ${attempt}/${retries}):`, error.response?.data || error.message);
                
                // Don't retry on client errors (4xx) except rate limiting
                if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
                    break;
                }
                
                // Wait before retrying (exponential backoff)
                if (attempt < retries) {
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw new Error(lastError.response?.data?.error?.message || 'Failed to fetch data from Meta API');
    }

    async exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
        try {
            const appId = process.env.META_APP_ID;
            const appSecret = process.env.META_APP_SECRET;

            if (!appId || !appSecret) {
                console.warn('Meta App ID or Secret not configured, skipping token exchange');
                return shortLivedToken;
            }

            const response = await axios.get(`${this.baseUrl}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: appId,
                    client_secret: appSecret,
                    fb_exchange_token: shortLivedToken
                }
            });

            if (response.data && response.data.access_token) {
                console.log('Successfully exchanged for long-lived Meta token');
                return response.data.access_token;
            }

            return shortLivedToken;
        } catch (error: any) {
            console.error('Failed to exchange Meta token:', error.response?.data || error.message);
            // Return original token on failure to avoid breaking the flow completely
            return shortLivedToken;
        }
    }

    async getCampaigns(config: MetaConfig) {
        const fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time';
        const data = await this.makeRequest(`${this.getFormattedAdAccountId(config.adAccountId)}/campaigns`, config.accessToken, {
            fields,
            limit: 50
        });
        return data.data; // Meta returns { data: [], paging: {} }
    }

    async getAdSets(config: MetaConfig, campaignId?: string) {
        const fields = 'id,name,status,start_time,end_time,daily_budget,lifetime_budget,targeting';
        const endpoint = campaignId ? `${campaignId}/adsets` : `${this.getFormattedAdAccountId(config.adAccountId)}/adsets`;

        const data = await this.makeRequest(endpoint, config.accessToken, {
            fields,
            limit: 50
        });
        return data.data;
    }

    async getAds(config: MetaConfig, adSetId?: string) {
        const fields = 'id,name,status,creative{id,title,body,image_url}';
        const endpoint = adSetId ? `${adSetId}/ads` : `${this.getFormattedAdAccountId(config.adAccountId)}/ads`;

        const data = await this.makeRequest(endpoint, config.accessToken, {
            fields,
            limit: 50
        });
        return data.data;
    }

    async getInsights(config: MetaConfig, level: 'campaign' | 'adset' | 'ad' | 'account' = 'account') {
        const fields = 'impressions,clicks,spend,cpc,cpm,cpp,ctr,unique_clicks,reach,actions';
        // Default to last 30 days
        const date_preset = 'last_30d';

        const data = await this.makeRequest(`${this.getFormattedAdAccountId(config.adAccountId)}/insights`, config.accessToken, {
            level,
            fields,
            date_preset
        });
        return data.data;
    }

    async testConnection(config: MetaConfig) {
        // Try to fetch the ad account details to verify credentials
        const data = await this.makeRequest(this.getFormattedAdAccountId(config.adAccountId), config.accessToken, {
            fields: 'name,account_status'
        });
        return {
            success: true,
            accountName: data.name,
            status: data.account_status
        };
    }

    private getFormattedAdAccountId(adAccountId: string): string {
        if (!adAccountId) return '';
        // If it already starts with act_, return it
        if (adAccountId.startsWith('act_')) {
            return adAccountId;
        }
        // Otherwise prepend act_
        return `act_${adAccountId}`;
    }
}

export const metaService = new MetaService();
