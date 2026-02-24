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
exports.WebhookService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
exports.WebhookService = {
    /**
     * Trigger a webhook event for an organisation
     */
    triggerEvent(event, payload, organisationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[WebhookService] Triggering event: ${event} for Org: ${organisationId}`);
                // 1. Find active webhooks for this org that subscribe to the event
                const webhooks = yield prisma_1.default.webhook.findMany({
                    where: {
                        organisationId,
                        isActive: true,
                        isDeleted: false,
                        events: {
                            has: event
                        }
                    }
                });
                if (webhooks.length === 0) {
                    return;
                }
                console.log(`[WebhookService] Found ${webhooks.length} webhooks for event ${event}`);
                // 2. Execute webhooks in parallel
                yield Promise.all(webhooks.map(webhook => this.executeWebhook(webhook, event, payload)));
            }
            catch (error) {
                console.error('[WebhookService] Error triggering event:', error);
            }
        });
    },
    /**
     * Execute a single webhook
     */
    executeWebhook(webhook, event, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = JSON.stringify({
                    event,
                    timestamp: new Date().toISOString(),
                    data: payload
                });
                const headers = Object.assign({ 'Content-Type': 'application/json', 'User-Agent': 'MERN-CRM-Webhook/1.0' }, (webhook.headers || {}));
                if (webhook.secret) {
                    // Add signature if secret exists (simple implementation)
                    headers['X-Webhook-Secret'] = webhook.secret;
                }
                const response = yield fetch(webhook.url, {
                    method: 'POST',
                    headers,
                    body
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                // Update success stats
                yield prisma_1.default.webhook.update({
                    where: { id: webhook.id },
                    data: {
                        lastTriggeredAt: new Date(),
                        successCount: { increment: 1 },
                        lastError: null
                    }
                });
            }
            catch (error) {
                console.error(`[WebhookService] Failed to send webhook ${webhook.id} to ${webhook.url}:`, error);
                // Update failure stats
                yield prisma_1.default.webhook.update({
                    where: { id: webhook.id },
                    data: {
                        lastTriggeredAt: new Date(),
                        failureCount: { increment: 1 },
                        lastError: error.message
                    }
                });
            }
        });
    }
};
