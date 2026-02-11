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
const axios_1 = __importDefault(require("axios"));
class MarketingAPIService {
    constructor(accessToken) {
        this.apiVersion = 'v19.0';
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
        this.customAxios = axios_1.default.create({
            baseURL: this.baseUrl,
            params: {
                access_token: accessToken,
            },
        });
    }
    /**
     * Fetch all Ad Accounts the user has access to
     */
    getAdAccounts() {
        return __awaiter(this, arguments, void 0, function* (fields = 'id,name,account_id,account_status,currency,timezone_name') {
            try {
                const response = yield this.customAxios.get('/me/adaccounts', {
                    params: { fields },
                });
                return response.data.data;
            }
            catch (error) {
                this.handleError(error, 'fetching ad accounts');
                return []; // Unreachable code due to throw, but keeps TS happy if return type strict
            }
        });
    }
    /**
     * Fetch Campaigns for a specific Ad Account
     */
    getCampaigns(adAccountId_1) {
        return __awaiter(this, arguments, void 0, function* (adAccountId, fields = 'id,name,status,objective,daily_budget,lifetime_budget') {
            try {
                // Ensure adAccountId starts with 'act_'
                const formattedId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
                const response = yield this.customAxios.get(`/${formattedId}/campaigns`, {
                    params: { fields },
                });
                return response.data.data;
            }
            catch (error) {
                this.handleError(error, `fetching campaigns for ${adAccountId}`);
                return [];
            }
        });
    }
    /**
     * Create a new Campaign
     */
    createCampaign(adAccountId, campaignData) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const formattedId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
                const response = yield this.customAxios.post(`/${formattedId}/campaigns`, campaignData);
                return response.data;
            }
            catch (error) {
                this.handleError(error, `creating campaign for ${adAccountId}`);
                throw error; // redundant but clear
            }
        });
    }
    handleError(error, context) {
        var _a, _b, _c;
        const status = (_a = error.response) === null || _a === void 0 ? void 0 : _a.status;
        const data = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data;
        const message = ((_c = data === null || data === void 0 ? void 0 : data.error) === null || _c === void 0 ? void 0 : _c.message) || error.message;
        console.error(`Error ${context}:`, message);
        // Propagate 401 as 400 to avoid global logout if it's just meta token issue
        // Actually controller handles user-level token missing. 
        // If meta returns 401, it means the token is invalid/expired.
        // We should throw a specific error that controller can catch.
        const err = new Error(message);
        err.status = status;
        err.metaError = data === null || data === void 0 ? void 0 : data.error;
        throw err;
    }
}
exports.default = MarketingAPIService;
