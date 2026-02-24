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
exports.MetaConversionService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../config/prisma"));
exports.MetaConversionService = {
    /**
     * Send an event to Meta Conversions API
     */
    sendEvent(organisationId, event) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                // 1. Get Meta Config (Pixel ID & Access Token)
                const org = yield prisma_1.default.organisation.findUnique({
                    where: { id: organisationId },
                    select: { integrations: true }
                });
                if (!org)
                    return;
                const metaConfig = (_a = org.integrations) === null || _a === void 0 ? void 0 : _a.meta;
                const pixelId = metaConfig === null || metaConfig === void 0 ? void 0 : metaConfig.pixelId;
                const accessToken = metaConfig === null || metaConfig === void 0 ? void 0 : metaConfig.accessToken;
                if (!pixelId || !accessToken) {
                    // Not configured, skip silently
                    return;
                }
                console.log(`[MetaConversions] Sending ${event.eventName} event for Org ${organisationId}`);
                // 2. Hash User Data (Meta requires SHA256)
                // Note: For simplicity in this step, we'll send raw if using current API version that accepts hashing on client side
                // or standard helper. Meta actually asks for pre-hashed data usually.
                // But let's assume we send raw and let axios handle it? No, we MUST hash.
                // For MVP speed, let's implement basic hashing helper next or assume trusted environment.
                // Actually, we should hash.
                const userData = {
                    em: event.userData.email ? hash(event.userData.email) : undefined,
                    ph: event.userData.phone ? hash(event.userData.phone) : undefined,
                    fn: event.userData.firstName ? hash(event.userData.firstName) : undefined,
                    ln: event.userData.lastName ? hash(event.userData.lastName) : undefined,
                    external_id: event.userData.externalId ? hash(event.userData.externalId) : undefined,
                    client_user_agent: event.userData.clientUserAgent,
                    client_ip_address: event.userData.clientIp,
                };
                // 3. Construct Payload
                const payload = {
                    data: [
                        {
                            event_name: event.eventName,
                            event_time: Math.floor(Date.now() / 1000),
                            action_source: event.actionSource || 'system_generated',
                            user_data: userData,
                            custom_data: event.customData,
                            event_source_url: event.eventSourceUrl
                        }
                    ],
                    access_token: accessToken // Often passed in query param, but can be in body depending on library
                };
                // 4. Send Request
                // Graph API: POST /<PIXEL_ID>/events
                yield axios_1.default.post(`https://graph.facebook.com/v18.0/${pixelId}/events`, payload, {
                    params: { access_token: accessToken } // Pass here to be safe
                });
                console.log(`[MetaConversions] Event ${event.eventName} sent successfully`);
            }
            catch (error) {
                console.error('[MetaConversions] Failed to send event:', ((_b = error.response) === null || _b === void 0 ? void 0 : _b.data) || error.message);
                // Don't throw, just log. We don't want to break the main flow.
            }
        });
    }
};
// Simple SHA256 Hash Helper (using crypto)
const crypto_1 = __importDefault(require("crypto"));
function hash(value) {
    return crypto_1.default.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}
