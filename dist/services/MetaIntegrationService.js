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
exports.MetaIntegrationService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const MetaService_1 = require("./MetaService");
const logger_1 = require("../utils/logger");
const DistributionService_1 = require("./DistributionService");
const encryption_1 = require("../utils/encryption");
exports.MetaIntegrationService = {
    /**
     * Handle incoming webhook from Meta
     */
    handleWebhook(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.webhook('Meta', 'receive_payload', undefined, { payload });
                // Basic parsing logic for Facebook Webhooks
                // Usually payload.entry array
                if (payload.entry) {
                    for (const entry of payload.entry) {
                        if (entry.changes) {
                            for (const change of entry.changes) {
                                if (change.field === 'leadgen') {
                                    yield this.processLeadGen(change.value);
                                }
                                else if (change.field === 'ads') {
                                    yield this.processAdUpdate(change.value);
                                }
                            }
                        }
                    }
                }
            }
            catch (error) {
                logger_1.logger.webhookError('Meta', 'process_webhook', error);
            }
        });
    },
    processLeadGen(value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // value contains leadgen_id, form_id, page_id, created_time
                const { leadgen_id, page_id, form_id } = value;
                logger_1.logger.webhook('Meta', 'process_leadgen', undefined, { leadgen_id, page_id, form_id });
                // Find organisation with this page in their integrations
                const orgs = yield prisma_1.default.organisation.findMany({
                    select: {
                        id: true,
                        name: true,
                        integrations: true
                    }
                }).then(orgs => {
                    return orgs.filter(org => {
                        var _a;
                        const integrations = org.integrations;
                        return ((_a = integrations === null || integrations === void 0 ? void 0 : integrations.meta) === null || _a === void 0 ? void 0 : _a.pageId) === page_id;
                    });
                }).catch(() => []);
                if (orgs.length === 0) {
                    logger_1.logger.warn(`No connected account found for page ${page_id}`, 'MetaWebhook');
                    return;
                }
                const org = orgs[0];
                const integrations = org.integrations;
                const metaConfig = integrations.meta;
                if (!(metaConfig === null || metaConfig === void 0 ? void 0 : metaConfig.accessToken)) {
                    logger_1.logger.warn(`No access token found for organization ${org.id}`, 'MetaWebhook', undefined, org.id);
                    return;
                }
                // Decrypt token
                const accessToken = (0, encryption_1.decrypt)(metaConfig.accessToken);
                // Fetch lead details from Meta API
                try {
                    const leadData = yield MetaService_1.metaService.makeRequest(leadgen_id, accessToken, {
                        fields: 'id,created_time,field_data'
                    });
                    // Parse field data
                    const fieldData = leadData.field_data || [];
                    const leadInfo = {
                        firstName: '',
                        lastName: '',
                        email: '',
                        phone: '',
                        company: ''
                    };
                    fieldData.forEach((field) => {
                        var _a, _b;
                        const name = (_a = field.name) === null || _a === void 0 ? void 0 : _a.toLowerCase();
                        const value = (_b = field.values) === null || _b === void 0 ? void 0 : _b[0];
                        if ((name === null || name === void 0 ? void 0 : name.includes('first_name')) || (name === null || name === void 0 ? void 0 : name.includes('firstname'))) {
                            leadInfo.firstName = value;
                        }
                        else if ((name === null || name === void 0 ? void 0 : name.includes('last_name')) || (name === null || name === void 0 ? void 0 : name.includes('lastname'))) {
                            leadInfo.lastName = value;
                        }
                        else if (name === null || name === void 0 ? void 0 : name.includes('email')) {
                            leadInfo.email = value;
                        }
                        else if (name === null || name === void 0 ? void 0 : name.includes('phone')) {
                            leadInfo.phone = value;
                        }
                        else if (name === null || name === void 0 ? void 0 : name.includes('company')) {
                            leadInfo.company = value;
                        }
                    });
                    // Create lead in CRM
                    const lead = yield prisma_1.default.lead.create({
                        data: {
                            firstName: leadInfo.firstName || 'Unknown',
                            lastName: leadInfo.lastName || '',
                            email: leadInfo.email || null,
                            phone: leadInfo.phone || null,
                            company: leadInfo.company || null,
                            source: 'meta_leadgen',
                            status: 'new',
                            organisationId: org.id,
                            customFields: {
                                metaLeadgenId: leadgen_id,
                                metaFormId: form_id,
                                metaPageId: page_id,
                                metaCreatedTime: leadData.created_time
                            }
                        }
                    });
                    logger_1.logger.info(`Created lead ${lead.id} from Meta LeadGen ID: ${leadgen_id}`, 'MetaWebhook', undefined, org.id);
                    // Auto-distribute the lead using assignment rules
                    yield DistributionService_1.DistributionService.assignLead(lead, org.id);
                    // Find an admin user to notify
                    const adminUser = yield prisma_1.default.user.findFirst({
                        where: {
                            organisationId: org.id,
                            role: { in: ['admin', 'super_admin', 'manager'] }
                        }
                    });
                    // Create notification for new lead
                    if (adminUser) {
                        yield prisma_1.default.notification.create({
                            data: {
                                title: 'New Lead from Meta',
                                message: `New lead "${leadInfo.firstName} ${leadInfo.lastName}" from Meta Lead Generation`,
                                type: 'info',
                                relatedResource: 'Lead',
                                relatedId: lead.id,
                                recipientId: adminUser.id,
                                organisationId: org.id
                            }
                        }).catch(error => {
                            logger_1.logger.error('Error creating notification', error, 'MetaWebhook', undefined, org.id);
                        });
                    }
                }
                catch (apiError) {
                    logger_1.logger.error('Error fetching lead data from Meta API', apiError, 'MetaWebhook', undefined, org.id);
                }
            }
            catch (error) {
                logger_1.logger.webhookError('Meta', 'process_leadgen_failed', error);
            }
        });
    },
    processAdUpdate(value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.webhook('Meta', 'ad_update', undefined, { value });
                // value contains data related to ad status changes
                // For now, we log it and we could potentially update a local campaign status
                // if we have a mapping between Meta Ad ID and CRM Campaign
                if (value.ad_id) {
                    console.log(`[MetaIntegration] Ad update received for Ad ID: ${value.ad_id}, Status: ${value.status}`);
                    // We could find campaigns linked to this ad and update them
                    const campaigns = yield prisma_1.default.campaign.findMany({
                        where: {
                            customFields: {
                                path: ['metaAdId'],
                                equals: value.ad_id
                            }
                        }
                    });
                    for (const campaign of campaigns) {
                        yield prisma_1.default.campaign.update({
                            where: { id: campaign.id },
                            data: {
                                status: this.mapMetaStatusToCrmStatus(value.status || 'ACTIVE')
                            }
                        });
                    }
                }
            }
            catch (error) {
                logger_1.logger.webhookError('Meta', 'ad_update_failed', error);
            }
        });
    },
    /**
     * Sync campaigns for a connected account
     */
    syncCampaigns(organisationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                logger_1.logger.info(`Syncing campaigns for organization ${organisationId}`, 'MetaIntegration', undefined, organisationId);
                const org = yield prisma_1.default.organisation.findUnique({
                    where: { id: organisationId },
                    select: { integrations: true }
                });
                if (!org) {
                    throw new Error('Organization not found');
                }
                const integrations = org.integrations;
                const metaConfig = integrations === null || integrations === void 0 ? void 0 : integrations.meta;
                if (!(metaConfig === null || metaConfig === void 0 ? void 0 : metaConfig.accessToken) || !(metaConfig === null || metaConfig === void 0 ? void 0 : metaConfig.adAccountId)) {
                    throw new Error('Meta integration not configured');
                }
                // Fetch campaigns from Meta
                const campaigns = yield MetaService_1.metaService.getCampaigns(Object.assign(Object.assign({}, metaConfig), { accessToken: (0, encryption_1.decrypt)(metaConfig.accessToken) }));
                // Sync campaigns to database
                const syncedCampaigns = [];
                for (const campaign of campaigns) {
                    try {
                        const existingCampaign = yield prisma_1.default.campaign.findFirst({
                            where: {
                                organisationId,
                                customFields: {
                                    path: ['metaCampaignId'],
                                    equals: campaign.id
                                }
                            }
                        });
                        if (existingCampaign) {
                            // Update existing campaign
                            const updated = yield prisma_1.default.campaign.update({
                                where: { id: existingCampaign.id },
                                data: {
                                    name: campaign.name,
                                    status: this.mapMetaStatusToCrmStatus(campaign.status),
                                    customFields: Object.assign(Object.assign({}, existingCampaign.customFields), { metaCampaignId: campaign.id, metaObjective: campaign.objective, metaDailyBudget: campaign.daily_budget, metaLifetimeBudget: campaign.lifetime_budget, metaStartTime: campaign.start_time, metaStopTime: campaign.stop_time })
                                }
                            });
                            syncedCampaigns.push(updated);
                        }
                        else {
                            // Create new campaign
                            const created = yield prisma_1.default.campaign.create({
                                data: {
                                    name: campaign.name,
                                    subject: `Meta Campaign: ${campaign.name}`,
                                    content: `Imported from Meta Ads - Objective: ${campaign.objective}`,
                                    status: this.mapMetaStatusToCrmStatus(campaign.status),
                                    organisationId,
                                    customFields: {
                                        metaCampaignId: campaign.id,
                                        metaObjective: campaign.objective,
                                        metaDailyBudget: campaign.daily_budget,
                                        metaLifetimeBudget: campaign.lifetime_budget,
                                        metaStartTime: campaign.start_time,
                                        metaStopTime: campaign.stop_time,
                                        source: 'meta_ads'
                                    }
                                }
                            });
                            syncedCampaigns.push(created);
                        }
                    }
                    catch (campaignError) {
                        logger_1.logger.error(`Error syncing campaign ${campaign.id}`, campaignError, 'MetaIntegration', undefined, organisationId);
                    }
                }
                logger_1.logger.info(`Synced ${syncedCampaigns.length} campaigns`, 'MetaIntegration', undefined, organisationId);
                return syncedCampaigns;
            }
            catch (error) {
                logger_1.logger.error('Error syncing campaigns', error, 'MetaIntegration', undefined, organisationId);
                throw error;
            }
        });
    },
    /**
     * Map Meta campaign status to CRM status
     */
    mapMetaStatusToCrmStatus(metaStatus) {
        const statusMap = {
            'ACTIVE': 'active',
            'PAUSED': 'paused',
            'DELETED': 'deleted',
            'ARCHIVED': 'archived',
            'PENDING_REVIEW': 'draft',
            'DISAPPROVED': 'failed',
            'PREAPPROVED': 'scheduled',
            'PENDING_BILLING_INFO': 'draft',
            'CAMPAIGN_PAUSED': 'paused',
            'ADSET_PAUSED': 'paused',
            'IN_PROCESS': 'active',
            'WITH_ISSUES': 'failed'
        };
        return statusMap[metaStatus] || 'draft';
    },
    /**
     * Get campaign insights for synced campaigns
     */
    getCampaignInsights(organisationId, campaignId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const org = yield prisma_1.default.organisation.findUnique({
                    where: { id: organisationId },
                    select: { integrations: true }
                });
                if (!org) {
                    throw new Error('Organization not found');
                }
                const integrations = org.integrations;
                const metaConfig = integrations === null || integrations === void 0 ? void 0 : integrations.meta;
                if (!(metaConfig === null || metaConfig === void 0 ? void 0 : metaConfig.accessToken) || !(metaConfig === null || metaConfig === void 0 ? void 0 : metaConfig.adAccountId)) {
                    throw new Error('Meta integration not configured');
                }
                const accessToken = (0, encryption_1.decrypt)(metaConfig.accessToken);
                let insights;
                if (campaignId) {
                    // Get insights for specific campaign
                    const campaign = yield prisma_1.default.campaign.findFirst({
                        where: { id: campaignId, organisationId },
                        select: { customFields: true }
                    });
                    if (!campaign) {
                        throw new Error('Campaign not found');
                    }
                    const customFields = campaign.customFields;
                    const metaCampaignId = customFields === null || customFields === void 0 ? void 0 : customFields.metaCampaignId;
                    if (!metaCampaignId) {
                        throw new Error('Campaign not linked to Meta');
                    }
                    insights = yield MetaService_1.metaService.makeRequest(`${metaCampaignId}/insights`, accessToken, {
                        fields: 'impressions,clicks,spend,cpc,cpm,cpp,ctr,unique_clicks,reach,actions',
                        date_preset: 'last_30d'
                    });
                }
                else {
                    // Get account-level insights
                    insights = yield MetaService_1.metaService.getInsights(Object.assign(Object.assign({}, metaConfig), { accessToken }), 'account');
                }
                return insights;
            }
            catch (error) {
                logger_1.logger.error('Error getting campaign insights', error, 'MetaIntegration', undefined, organisationId);
                throw error;
            }
        });
    },
    /**
     * Verify Webhook (GET request)
     */
    verifyWebhook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            // Helper to grab param regardless of parsing style (dot notation or nested object)
            const getParam = (name) => {
                return req.query[name] || (req.query.hub && req.query.hub[name.replace('hub.', '')]);
            };
            const mode = getParam('hub.mode');
            const token = getParam('hub.verify_token');
            const challenge = getParam('hub.challenge');
            const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;
            if (!VERIFY_TOKEN) {
                logger_1.logger.error('[MetaWebhook] META_VERIFY_TOKEN not configured', 'MetaWebhook');
                return res.status(500).json({ error: 'Server configuration error' });
            }
            logger_1.logger.info(`[MetaWebhook] Verification Request: Mode=${mode}, Token=${token}, Challenge=${challenge}`, 'MetaWebhook');
            logger_1.logger.info(`[MetaWebhook] Expected Token: ${VERIFY_TOKEN}`, 'MetaWebhook');
            if (mode && token) {
                if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                    logger_1.logger.info('[MetaWebhook] Verification SUCCESS', 'MetaWebhook');
                    // Meta expects plain text of the challenge
                    res.type('text/plain').status(200).send(challenge);
                }
                else {
                    logger_1.logger.warn(`[MetaWebhook] Verification FAILED. Received token: '${token}', Expected: '${VERIFY_TOKEN}'`, 'MetaWebhook');
                    res.sendStatus(403);
                }
            }
            else {
                logger_1.logger.warn('[MetaWebhook] Verification FAILED - Missing parameters', 'MetaWebhook');
                res.sendStatus(400);
            }
        });
    }
};
