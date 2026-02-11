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
exports.MetaIntegrationService = {
    /**
     * Handle incoming webhook from Meta
     */
    handleWebhook(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[MetaWebhook] Received payload:', JSON.stringify(payload, null, 2));
                // Basic parsing logic for Facebook Webhooks
                if (payload.entry) {
                    for (const entry of payload.entry) {
                        if (entry.changes) {
                            for (const change of entry.changes) {
                                if (change.field === 'leadgen') {
                                    yield this.processLeadGen(change.value);
                                }
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error('[MetaWebhook] Error processing webhook:', error);
            }
        });
    },
    processLeadGen(value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { leadgen_id, page_id } = value;
                console.log(`[MetaWebhook] Processing LeadGen ID: ${leadgen_id} for Page: ${page_id}`);
                // Find organisation with this page in their integrations
                const orgs = yield prisma_1.default.organisation.findMany({
                    select: {
                        id: true,
                        name: true,
                        integrations: true
                    }
                });
                const matchingOrg = orgs.find(org => {
                    var _a;
                    const integrations = org.integrations;
                    return ((_a = integrations === null || integrations === void 0 ? void 0 : integrations.meta) === null || _a === void 0 ? void 0 : _a.pageId) === page_id;
                });
                if (!matchingOrg) {
                    console.log('[MetaWebhook] No connected account found for page', page_id);
                    return;
                }
                // Create a basic lead record
                const lead = yield prisma_1.default.lead.create({
                    data: {
                        firstName: 'Meta Lead',
                        lastName: leadgen_id,
                        phone: `meta_${leadgen_id}`, // Required field, using leadgen_id as placeholder
                        source: 'meta_leadgen',
                        status: 'new',
                        organisationId: matchingOrg.id
                    }
                });
                console.log(`[MetaWebhook] Created lead ${lead.id} from Meta LeadGen ID: ${leadgen_id}`);
            }
            catch (error) {
                console.error('[MetaWebhook] Error processing leadgen:', error);
            }
        });
    },
    /**
     * Sync campaigns for a connected account
     */
    syncCampaigns(organisationId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[MetaIntegration] Syncing campaigns for organization ${organisationId}`);
            return [];
        });
    },
    /**
     * Verify Webhook (GET request)
     */
    verifyWebhook(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];
            const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'my_secure_token';
            if (mode && token) {
                if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                    console.log('[MetaWebhook] Verified webhook');
                    res.status(200).send(challenge);
                }
                else {
                    console.log('[MetaWebhook] Webhook verification failed - invalid token');
                    res.sendStatus(403);
                }
            }
            else {
                console.log('[MetaWebhook] Webhook verification failed - missing parameters');
                res.sendStatus(400);
            }
        });
    }
};
