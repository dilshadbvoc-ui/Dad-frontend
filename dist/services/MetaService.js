"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaService = exports.MetaService = void 0;
const axios_1 = __importDefault(require("axios"));
class MetaService {
    constructor() {
        this.baseUrl = 'https://graph.facebook.com/v18.0';
    }
    makeRequest(endpoint_1, accessToken_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, accessToken, params = {}, retries = 3) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r;
            let lastError;
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const response = yield axios_1.default.get(`${this.baseUrl}/${endpoint}`, {
                        params: Object.assign({ access_token: accessToken }, params),
                        timeout: 30000 // 30 second timeout
                    });
                    return response.data;
                }
                catch (error) {
                    lastError = error;
                    console.error(`Meta API Error (attempt ${attempt}/${retries}):`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                    // Don't retry on client errors (4xx) except rate limiting
                    if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) >= 400 && ((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) < 500 && ((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) !== 429) {
                        break;
                    }
                    // Wait before retrying (exponential backoff)
                    if (attempt < retries) {
                        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                        yield new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            const errorMsg = ((_g = (_f = (_e = lastError === null || lastError === void 0 ? void 0 : lastError.response) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.error) === null || _g === void 0 ? void 0 : _g.message) || (lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Failed to fetch data from Meta API';
            const errorType = (_k = (_j = (_h = lastError === null || lastError === void 0 ? void 0 : lastError.response) === null || _h === void 0 ? void 0 : _h.data) === null || _j === void 0 ? void 0 : _j.error) === null || _k === void 0 ? void 0 : _k.type;
            const errorCode = (_o = (_m = (_l = lastError === null || lastError === void 0 ? void 0 : lastError.response) === null || _l === void 0 ? void 0 : _l.data) === null || _m === void 0 ? void 0 : _m.error) === null || _o === void 0 ? void 0 : _o.code;
            const errorSubcode = (_r = (_q = (_p = lastError === null || lastError === void 0 ? void 0 : lastError.response) === null || _p === void 0 ? void 0 : _p.data) === null || _q === void 0 ? void 0 : _q.error) === null || _r === void 0 ? void 0 : _r.error_subcode;
            console.error(`[MetaService] Final Error: ${errorMsg} (Type: ${errorType}, Code: ${errorCode}, Subcode: ${errorSubcode})`);
            if (errorCode === 190) { // OAuth Error
                throw new Error(`Invalid or expired Meta Access Token. Please reconnect your account. (Code: 190, Subcode: ${errorSubcode})`);
            }
            throw new Error(errorMsg);
        });
    }
    makePostRequest(endpoint_1, accessToken_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, accessToken, data = {}, retries = 2) {
            var _a, _b, _c, _d, _e, _f, _g;
            let lastError;
            for (let attempt = 1; attempt <= retries; attempt++) {
                try {
                    const response = yield axios_1.default.post(`${this.baseUrl}/${endpoint}`, data, {
                        params: { access_token: accessToken },
                        timeout: 60000 // Post might take longer
                    });
                    return response.data;
                }
                catch (error) {
                    lastError = error;
                    console.error(`Meta API POST Error (attempt ${attempt}/${retries}):`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                    if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) >= 400 && ((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) < 500 && ((_d = error.response) === null || _d === void 0 ? void 0 : _d.status) !== 429) {
                        break;
                    }
                    if (attempt < retries) {
                        const delay = Math.pow(2, attempt) * 2000;
                        yield new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            const errorMsg = ((_g = (_f = (_e = lastError === null || lastError === void 0 ? void 0 : lastError.response) === null || _e === void 0 ? void 0 : _e.data) === null || _f === void 0 ? void 0 : _f.error) === null || _g === void 0 ? void 0 : _g.message) || (lastError === null || lastError === void 0 ? void 0 : lastError.message) || 'Failed to post data to Meta API';
            throw new Error(errorMsg);
        });
    }
    exchangeForLongLivedToken(shortLivedToken, config) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Prefer config values (from DB), fallback to env vars (system default)
                const appId = (config === null || config === void 0 ? void 0 : config.appId) || process.env.META_APP_ID;
                const appSecret = (config === null || config === void 0 ? void 0 : config.appSecret) || process.env.META_APP_SECRET;
                if (!appId || !appSecret) {
                    console.warn('Meta App ID or Secret not configured (neither in DB nor ENV), skipping token exchange');
                    return shortLivedToken;
                }
                const response = yield axios_1.default.get(`${this.baseUrl}/oauth/access_token`, {
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
            }
            catch (error) {
                console.error('Failed to exchange Meta token:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                // Return original token on failure to avoid breaking the flow completely
                return shortLivedToken;
            }
        });
    }
    getCampaigns(config) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = 'id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time';
            const data = yield this.makeRequest(`${this.getFormattedAdAccountId(config.adAccountId)}/campaigns`, config.accessToken, {
                fields,
                limit: 50
            });
            return data.data; // Meta returns { data: [], paging: {} }
        });
    }
    getAdSets(config, campaignId) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = 'id,name,status,start_time,end_time,daily_budget,lifetime_budget,targeting';
            const endpoint = campaignId ? `${campaignId}/adsets` : `${this.getFormattedAdAccountId(config.adAccountId)}/adsets`;
            const data = yield this.makeRequest(endpoint, config.accessToken, {
                fields,
                limit: 50
            });
            return data.data;
        });
    }
    getAds(config, adSetId) {
        return __awaiter(this, void 0, void 0, function* () {
            const fields = 'id,name,status,creative{id,title,body,image_url}';
            const endpoint = adSetId ? `${adSetId}/ads` : `${this.getFormattedAdAccountId(config.adAccountId)}/ads`;
            const data = yield this.makeRequest(endpoint, config.accessToken, {
                fields,
                limit: 50
            });
            return data.data;
        });
    }
    getInsights(config_1) {
        return __awaiter(this, arguments, void 0, function* (config, level = 'account') {
            const fields = 'impressions,clicks,spend,cpc,cpm,cpp,ctr,unique_clicks,reach,actions';
            // Default to last 30 days
            const date_preset = 'last_30d';
            const data = yield this.makeRequest(`${this.getFormattedAdAccountId(config.adAccountId)}/insights`, config.accessToken, {
                level,
                fields,
                date_preset
            });
            return data.data;
        });
    }
    testConnection(config) {
        return __awaiter(this, void 0, void 0, function* () {
            // Try to fetch the ad account details to verify credentials
            const data = yield this.makeRequest(this.getFormattedAdAccountId(config.adAccountId), config.accessToken, {
                fields: 'name,account_status'
            });
            return {
                success: true,
                accountName: data.name,
                status: data.account_status
            };
        });
    }
    createCampaign(config, details) {
        return __awaiter(this, void 0, void 0, function* () {
            const adAccountId = this.getFormattedAdAccountId(config.adAccountId);
            return yield this.makePostRequest(`${adAccountId}/campaigns`, config.accessToken, {
                name: details.name,
                objective: details.objective,
                status: details.status || 'PAUSED', // Always create as paused by default
                special_ad_categories: 'NONE'
            });
        });
    }
    createAdSet(config, details) {
        return __awaiter(this, void 0, void 0, function* () {
            const adAccountId = this.getFormattedAdAccountId(config.adAccountId);
            const data = {
                name: details.name,
                campaign_id: details.campaignId,
                optimization_goal: details.optimizationGoal || 'REACH',
                billing_event: details.billingEvent || 'IMPRESSIONS',
                status: details.status || 'PAUSED',
                targeting: details.targeting
            };
            if (details.dailyBudget) {
                data.daily_budget = details.dailyBudget;
            }
            if (details.bidAmount) {
                data.bid_amount = details.bidAmount;
            }
            return yield this.makePostRequest(`${adAccountId}/adsets`, config.accessToken, data);
        });
    }
    createAdCreative(config, details) {
        return __awaiter(this, void 0, void 0, function* () {
            const adAccountId = this.getFormattedAdAccountId(config.adAccountId);
            const object_story_spec = {
                page_id: details.pageId,
                link_data: {
                    message: details.message,
                    link: details.link,
                    call_to_action: { type: 'LEARN_MORE' }
                }
            };
            if (details.imageHash) {
                object_story_spec.link_data.image_hash = details.imageHash;
            }
            return yield this.makePostRequest(`${adAccountId}/adcreatives`, config.accessToken, {
                name: details.name,
                object_story_spec
            });
        });
    }
    createAd(config, details) {
        return __awaiter(this, void 0, void 0, function* () {
            const adAccountId = this.getFormattedAdAccountId(config.adAccountId);
            return yield this.makePostRequest(`${adAccountId}/ads`, config.accessToken, {
                name: details.name,
                adset_id: details.adSetId,
                creative_id: details.creativeId,
                status: details.status || 'PAUSED'
            });
        });
    }
    uploadImage(config, imageUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const adAccountId = this.getFormattedAdAccountId(config.adAccountId);
            // This is a simplified version, usually we'd pass a buffer or stream
            // But Graph API accepts URL for images in some cases or we can use the bytes parameter
            return yield this.makePostRequest(`${adAccountId}/adimages`, config.accessToken, {
                url: imageUrl
            });
        });
    }
    getFormattedAdAccountId(adAccountId) {
        if (!adAccountId)
            return '';
        // If it already starts with act_, return it
        if (adAccountId.startsWith('act_')) {
            return adAccountId;
        }
        // Otherwise prepend act_
        return `act_${adAccountId}`;
    }
}
exports.MetaService = MetaService;
exports.metaService = new MetaService();
