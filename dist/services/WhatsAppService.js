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
exports.WhatsAppService = void 0;
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../config/prisma"));
class WhatsAppService {
    constructor(config) {
        this.baseUrl = 'https://graph.facebook.com/v18.0';
        this.config = config;
    }
    /**
     * Verify WhatsApp Webhook signature
     */
    static verifySignature(payload, signature, appSecret) {
        try {
            if (!signature || !appSecret)
                return false;
            // Signature is usually sha256=HEX_HASH
            const [algo, hash] = signature.split('=');
            if (algo !== 'sha256' || !hash)
                return false;
            const expectedHash = crypto_1.default
                .createHmac('sha256', appSecret)
                .update(payload)
                .digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash));
        }
        catch (error) {
            console.error('Signature verification error:', error);
            return false;
        }
    }
    /**
     * Get configured service for an organisation
     */
    static getClientForOrg(orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const org = yield prisma_1.default.organisation.findUnique({
                where: { id: orgId },
                select: { integrations: true }
            });
            if (!org || !org.integrations)
                return null;
            const integrations = org.integrations;
            // Check for dedicated WhatsApp config first
            let whatsappConfig = integrations.whatsapp;
            // Fallback to meta config for backward compatibility
            if (!(whatsappConfig === null || whatsappConfig === void 0 ? void 0 : whatsappConfig.connected) && ((_a = integrations.meta) === null || _a === void 0 ? void 0 : _a.phoneNumberId)) {
                whatsappConfig = {
                    accessToken: integrations.meta.accessToken,
                    phoneNumberId: integrations.meta.phoneNumberId,
                    wabaId: integrations.meta.wabaId,
                    connected: integrations.meta.connected
                };
            }
            if (!(whatsappConfig === null || whatsappConfig === void 0 ? void 0 : whatsappConfig.connected) || !whatsappConfig.phoneNumberId || !whatsappConfig.accessToken) {
                return null;
            }
            return new WhatsAppService({
                accessToken: whatsappConfig.accessToken,
                phoneNumberId: whatsappConfig.phoneNumberId,
                wabaId: whatsappConfig.wabaId,
                appId: whatsappConfig.appId,
                appSecret: whatsappConfig.appSecret
            });
        });
    }
    /**
     * Make a request to WhatsApp Cloud API with retry logic
     */
    makeRequest(endpoint_1, accessToken_1) {
        return __awaiter(this, arguments, void 0, function* (endpoint, accessToken, params = {}, retries = 3) {
            var _a, _b, _c, _d, _e, _f;
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
                    console.error(`WhatsApp API Error (attempt ${attempt}/${retries}):`, ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                    // Don't retry on client errors (4xx)
                    if (((_b = error.response) === null || _b === void 0 ? void 0 : _b.status) >= 400 && ((_c = error.response) === null || _c === void 0 ? void 0 : _c.status) < 500) {
                        break;
                    }
                    // Wait before retrying (exponential backoff)
                    if (attempt < retries) {
                        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
                        yield new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }
            throw new Error(((_f = (_e = (_d = lastError.response) === null || _d === void 0 ? void 0 : _d.data) === null || _e === void 0 ? void 0 : _e.error) === null || _f === void 0 ? void 0 : _f.message) || 'Failed to fetch data from WhatsApp API');
        });
    }
    /**
     * Send a template message
     */
    sendTemplateMessage(to_1, templateName_1) {
        return __awaiter(this, arguments, void 0, function* (to, templateName, languageCode = 'en_US', components = []) {
            var _a, _b, _c, _d;
            try {
                const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
                const payload = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: {
                            code: languageCode
                        },
                        components: components
                    }
                };
                const response = yield axios_1.default.post(url, payload, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('WhatsApp Send Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to send WhatsApp message');
            }
        });
    }
    /**
     * Send a text message (requires user initiated 24h window)
     */
    sendTextMessage(to, body) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
                const payload = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'text',
                    text: {
                        body: body
                    }
                };
                const response = yield axios_1.default.post(url, payload, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('WhatsApp Send Text Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to send WhatsApp message');
            }
        });
    }
    /**
     * Send a media message (image, document, audio, video)
     */
    sendMediaMessage(to, mediaType, mediaId, caption, filename) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
                const mediaPayload = {
                    id: mediaId
                };
                if (caption && (mediaType === 'image' || mediaType === 'video' || mediaType === 'document')) {
                    mediaPayload.caption = caption;
                }
                if (filename && mediaType === 'document') {
                    mediaPayload.filename = filename;
                }
                const payload = {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: mediaType,
                    [mediaType]: mediaPayload
                };
                const response = yield axios_1.default.post(url, payload, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('WhatsApp Send Media Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to send WhatsApp media message');
            }
        });
    }
    /**
     * Get message status
     */
    getMessageStatus(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const url = `${this.baseUrl}/${messageId}`;
                const response = yield axios_1.default.get(url, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('WhatsApp Get Message Status Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to get message status');
            }
        });
    }
    /**
     * Get media URL from media ID
     */
    getMediaUrl(mediaId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const url = `${this.baseUrl}/${mediaId}`;
                const response = yield axios_1.default.get(url, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    }
                });
                return response.data.url;
            }
            catch (error) {
                console.error('WhatsApp Get Media URL Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to get media URL');
            }
        });
    }
    /**
     * Download media file
     */
    downloadMedia(mediaUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const response = yield axios_1.default.get(mediaUrl, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    },
                    responseType: 'stream'
                });
                return response.data;
            }
            catch (error) {
                console.error('WhatsApp Download Media Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error('Failed to download media file');
            }
        });
    }
    /**
     * Get WhatsApp Business Account templates
     */
    getTemplates() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                if (!this.config.wabaId) {
                    throw new Error('WhatsApp Business Account ID not configured');
                }
                const url = `${this.baseUrl}/${this.config.wabaId}/message_templates`;
                const response = yield axios_1.default.get(url, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    }
                });
                return response.data.data || [];
            }
            catch (error) {
                console.error('WhatsApp Get Templates Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to get templates');
            }
        });
    }
    /**
     * Create a new message template
     */
    createTemplate(templateData) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                if (!this.config.wabaId) {
                    throw new Error('WhatsApp Business Account ID not configured');
                }
                const url = `${this.baseUrl}/${this.config.wabaId}/message_templates`;
                const response = yield axios_1.default.post(url, templateData, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('WhatsApp Create Template Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to create template');
            }
        });
    }
    /**
     * Get phone number information
     */
    getPhoneNumberInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const url = `${this.baseUrl}/${this.config.phoneNumberId}`;
                const response = yield axios_1.default.get(url, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('WhatsApp Get Phone Info Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to get phone number info');
            }
        });
    }
    /**
     * Mark message as read
     */
    markMessageAsRead(messageId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const url = `${this.baseUrl}/${this.config.phoneNumberId}/messages`;
                const payload = {
                    messaging_product: 'whatsapp',
                    status: 'read',
                    message_id: messageId
                };
                const response = yield axios_1.default.post(url, payload, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('WhatsApp Mark Read Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to mark message as read');
            }
        });
    }
    /**
     * Get conversation analytics
     */
    getConversationAnalytics(startDate, endDate) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                if (!this.config.wabaId) {
                    throw new Error('WhatsApp Business Account ID not configured');
                }
                const url = `${this.baseUrl}/${this.config.wabaId}`;
                const response = yield axios_1.default.get(url, {
                    params: {
                        fields: 'conversation_analytics',
                        start: startDate,
                        end: endDate
                    },
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`
                    }
                });
                return response.data.conversation_analytics || {};
            }
            catch (error) {
                console.error('WhatsApp Analytics Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to get conversation analytics');
            }
        });
    }
    /**
     * Upload media to Meta servers
     */
    uploadMedia(file, fileName, mimeType) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            try {
                const url = `${this.baseUrl}/${this.config.phoneNumberId}/media`;
                const formData = new FormData();
                // Use Uint8Array to wrap Buffer for Blob compatibility in Node.js 18+
                formData.append('file', new Blob([new Uint8Array(file)]), fileName);
                formData.append('messaging_product', 'whatsapp');
                formData.append('type', mimeType);
                const response = yield axios_1.default.post(url, formData, {
                    headers: {
                        'Authorization': `Bearer ${this.config.accessToken}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
                return response.data;
            }
            catch (error) {
                console.error('WhatsApp Upload Media Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
                throw new Error(((_d = (_c = (_b = error.response) === null || _b === void 0 ? void 0 : _b.data) === null || _c === void 0 ? void 0 : _c.error) === null || _d === void 0 ? void 0 : _d.message) || 'Failed to upload media to WhatsApp');
            }
        });
    }
}
exports.WhatsAppService = WhatsAppService;
