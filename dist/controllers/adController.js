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
exports.uploadAdImage = exports.createFullAd = exports.getAccountInsights = exports.getCampaignInsights = exports.syncCampaigns = exports.testConnection = exports.getInsights = exports.getAds = exports.getAdSets = exports.getCampaigns = exports.getMetaConfig = void 0;
const MetaService_1 = require("../services/MetaService");
const MetaIntegrationService_1 = require("../services/MetaIntegrationService");
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const getMetaConfig = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organisationId)) {
        throw new Error('User not authenticated or missing organisation');
    }
    const org = yield prisma_1.default.organisation.findUnique({
        where: { id: req.user.organisationId }
    });
    if (!org)
        throw new Error('Organisation not found');
    const integrations = org.integrations;
    const metaConfig = integrations === null || integrations === void 0 ? void 0 : integrations.meta;
    if (!(metaConfig === null || metaConfig === void 0 ? void 0 : metaConfig.accessToken) || !(metaConfig === null || metaConfig === void 0 ? void 0 : metaConfig.adAccountId)) {
        throw new Error('Meta integration not configured. Please check settings.');
    }
    return metaConfig;
});
exports.getMetaConfig = getMetaConfig;
const getCampaigns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getMetaConfig)(req);
        const campaigns = yield MetaService_1.metaService.getCampaigns(config);
        res.json(campaigns);
    }
    catch (error) {
        console.error('Error in getCampaigns:', error);
        // Return empty array instead of 500 error
        res.status(200).json({
            message: error.message || 'Unable to fetch campaigns',
            campaigns: [],
            error: true
        });
    }
});
exports.getCampaigns = getCampaigns;
const getAdSets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getMetaConfig)(req);
        const { campaignId } = req.query;
        const adSets = yield MetaService_1.metaService.getAdSets(config, campaignId);
        res.json(adSets);
    }
    catch (error) {
        console.error('Error in getAdSets:', error);
        res.status(200).json({
            message: error.message || 'Unable to fetch ad sets',
            adSets: [],
            error: true
        });
    }
});
exports.getAdSets = getAdSets;
const getAds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getMetaConfig)(req);
        const { adSetId } = req.query;
        const ads = yield MetaService_1.metaService.getAds(config, adSetId);
        res.json(ads);
    }
    catch (error) {
        console.error('Error in getAds:', error);
        res.status(200).json({
            message: error.message || 'Unable to fetch ads',
            ads: [],
            error: true
        });
    }
});
exports.getAds = getAds;
const getInsights = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getMetaConfig)(req);
        const { level } = req.query;
        const insights = yield MetaService_1.metaService.getInsights(config, level);
        res.json(insights);
    }
    catch (error) {
        console.error('Error in getInsights:', error);
        res.status(200).json({
            message: error.message || 'Unable to fetch insights',
            insights: [],
            error: true
        });
    }
});
exports.getInsights = getInsights;
const testConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getMetaConfig)(req);
        const result = yield MetaService_1.metaService.testConnection(config);
        res.json(result);
    }
    catch (error) {
        console.error('Error in testConnection:', error);
        res.status(200).json({
            success: false,
            message: error.message || 'Unable to test connection',
            error: true
        });
    }
});
exports.testConnection = testConnection;
const syncCampaigns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No organisation found' });
        const campaigns = yield MetaIntegrationService_1.MetaIntegrationService.syncCampaigns(orgId);
        res.json({
            message: `Successfully synced ${campaigns.length} campaigns`,
            campaigns
        });
    }
    catch (error) {
        console.error('Error in syncCampaigns:', error);
        res.status(200).json({
            message: error.message || 'Unable to sync campaigns',
            campaigns: [],
            error: true
        });
    }
});
exports.syncCampaigns = syncCampaigns;
const getCampaignInsights = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getMetaConfig)(req);
        const insights = yield MetaService_1.metaService.getInsights(config, 'campaign');
        res.json(insights);
    }
    catch (error) {
        console.error('Error in getCampaignInsights:', error);
        res.status(200).json({
            message: error.message || 'Unable to fetch campaign insights',
            insights: [],
            error: true
        });
    }
});
exports.getCampaignInsights = getCampaignInsights;
const getAccountInsights = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getMetaConfig)(req);
        const insights = yield MetaService_1.metaService.getInsights(config, 'account');
        res.json(insights);
    }
    catch (error) {
        console.error('Error in getAccountInsights:', error);
        res.status(200).json({
            message: error.message || 'Unable to fetch account insights',
            insights: [],
            error: true
        });
    }
});
exports.getAccountInsights = getAccountInsights;
const createFullAd = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getMetaConfig)(req);
        const { campaign, adSet, creative, ad } = req.body;
        // 1. Create Campaign
        const campaignResult = yield MetaService_1.metaService.createCampaign(config, campaign);
        const campaignId = campaignResult.id;
        // 2. Create Ad Set
        const adSetResult = yield MetaService_1.metaService.createAdSet(config, Object.assign(Object.assign({}, adSet), { campaignId }));
        const adSetId = adSetResult.id;
        // 3. Create Creative
        // First, check if we need to upload an image from a URL
        let imageHash = creative.imageHash;
        if (creative.imageUrl && !imageHash) {
            const uploadResult = yield MetaService_1.metaService.uploadImage(config, creative.imageUrl);
            imageHash = uploadResult.images[Object.keys(uploadResult.images)[0]].hash;
        }
        const creativeResult = yield MetaService_1.metaService.createAdCreative(config, Object.assign(Object.assign({}, creative), { imageHash }));
        const creativeId = creativeResult.id;
        // 4. Create Ad
        const adResult = yield MetaService_1.metaService.createAd(config, Object.assign(Object.assign({}, ad), { adSetId,
            creativeId }));
        res.status(201).json({
            success: true,
            campaignId,
            adSetId,
            creativeId,
            adId: adResult.id
        });
    }
    catch (error) {
        console.error('Error in createFullAd:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.createFullAd = createFullAd;
const uploadAdImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getMetaConfig)(req);
        const { imageUrl } = req.body;
        if (!imageUrl) {
            return res.status(400).json({ message: 'imageUrl is required' });
        }
        const result = yield MetaService_1.metaService.uploadImage(config, imageUrl);
        res.json(result);
    }
    catch (error) {
        console.error('Error in uploadAdImage:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.uploadAdImage = uploadAdImage;
