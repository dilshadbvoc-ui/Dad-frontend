"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.WhatsAppIntegrationService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const socket_1 = require("../socket");
exports.WhatsAppIntegrationService = {
    /**
     * Handle incoming webhook from WhatsApp
     */
    handleWebhook(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[WhatsAppWebhook] Received payload:', JSON.stringify(payload, null, 2));
                // WhatsApp webhook structure
                if (payload.entry) {
                    for (const entry of payload.entry) {
                        if (entry.changes) {
                            for (const change of entry.changes) {
                                if (change.field === 'messages') {
                                    const value = change.value;
                                    // Handle incoming messages
                                    if (value.messages) {
                                        yield this.processMessage(value);
                                    }
                                    // Handle message status updates
                                    if (value.statuses) {
                                        yield this.processStatusUpdate(value);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            catch (error) {
                console.error('[WhatsAppWebhook] Error processing webhook:', error);
            }
        });
    },
    processMessage(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const { messages, contacts, metadata } = value;
            if (!messages || messages.length === 0)
                return;
            console.log(`[WhatsAppWebhook] Processing messages for phone: ${metadata.phone_number_id}`);
            // Find organisation with this phone number in their integrations
            // Note: Using string contains search since JSON path queries are complex in Prisma
            const orgs = yield prisma_1.default.organisation.findMany({
                select: {
                    id: true,
                    name: true,
                    integrations: true
                }
            }).then(orgs => {
                return orgs.filter(org => {
                    var _a, _b;
                    const integrations = org.integrations;
                    return (((_a = integrations === null || integrations === void 0 ? void 0 : integrations.whatsapp) === null || _a === void 0 ? void 0 : _a.phoneNumberId) === metadata.phone_number_id) ||
                        (((_b = integrations === null || integrations === void 0 ? void 0 : integrations.meta) === null || _b === void 0 ? void 0 : _b.phoneNumberId) === metadata.phone_number_id);
                });
            }).catch(() => []);
            if (orgs.length === 0) {
                console.log('[WhatsAppWebhook] No connected account found for phone number', metadata.phone_number_id);
                return;
            }
            const org = orgs[0];
            for (const message of messages) {
                yield this.saveIncomingMessage(org.id, message, contacts);
            }
        });
    },
    saveIncomingMessage(organisationId, message, contacts) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const contact = contacts === null || contacts === void 0 ? void 0 : contacts.find(c => c.wa_id === message.from);
                const contactName = ((_a = contact === null || contact === void 0 ? void 0 : contact.profile) === null || _a === void 0 ? void 0 : _a.name) || message.from;
                // Normalize phone number (remove +, spaces, dashes, etc. for searching)
                const normalizedPhone = message.from.replace(/\D/g, '');
                // Check if message already exists
                const existingMessage = yield prisma_1.default.whatsAppMessage.findFirst({
                    where: {
                        waMessageId: message.id,
                        organisationId
                    }
                });
                if (existingMessage) {
                    console.log('[WhatsAppWebhook] Message already exists:', message.id);
                    return;
                }
                // Determine message type and content
                let messageType = 'text';
                let content = {};
                if (message.text) {
                    messageType = 'text';
                    content.text = message.text.body;
                }
                else if (message.image) {
                    messageType = 'image';
                    content.mediaUrl = message.image.id;
                    content.caption = message.image.caption;
                }
                else if (message.document) {
                    messageType = 'document';
                    content.mediaUrl = message.document.id;
                    content.fileName = message.document.filename;
                    content.caption = message.document.caption;
                }
                else if (message.audio) {
                    messageType = 'audio';
                    content.mediaUrl = message.audio.id;
                }
                else if (message.video) {
                    messageType = 'video';
                    content.mediaUrl = message.video.id;
                    content.caption = message.video.caption;
                }
                else if (message.location) {
                    messageType = 'location';
                    content.latitude = message.location.latitude;
                    content.longitude = message.location.longitude;
                }
                // Try to find existing lead or contact
                // Search with normalized phone
                const lead = yield prisma_1.default.lead.findFirst({
                    where: {
                        OR: [
                            { phone: message.from },
                            { phone: normalizedPhone },
                            { phone: `+${normalizedPhone}` }
                        ],
                        organisationId,
                        isDeleted: false
                    }
                });
                const contactRecord = yield prisma_1.default.$queryRawUnsafe(`
                SELECT id FROM "Contact" 
                WHERE "organisationId" = $1
                AND ("phones"::text ILIKE $2 OR "phones"::text ILIKE $3)
            `, organisationId, `%${message.from}%`, `%${normalizedPhone}%`);
                const contactId = (_b = contactRecord === null || contactRecord === void 0 ? void 0 : contactRecord[0]) === null || _b === void 0 ? void 0 : _b.id;
                // Create WhatsApp message record
                const messageRecord = yield prisma_1.default.whatsAppMessage.create({
                    data: {
                        conversationId: `${message.from}_${organisationId}`,
                        phoneNumber: message.from,
                        direction: 'incoming',
                        messageType,
                        content,
                        status: 'delivered',
                        waMessageId: message.id,
                        deliveredAt: new Date(parseInt(message.timestamp) * 1000),
                        organisationId,
                        leadId: lead === null || lead === void 0 ? void 0 : lead.id,
                        contactId: contactId,
                        isReadByAgent: false
                    }
                });
                // Create lead if none exists and link to message
                if (!lead && !contactId) {
                    const newLead = yield prisma_1.default.lead.create({
                        data: {
                            firstName: contactName.split(' ')[0] || contactName,
                            lastName: contactName.split(' ').slice(1).join(' ') || '',
                            phone: message.from,
                            source: 'whatsapp',
                            status: 'new',
                            organisationId
                        }
                    });
                    // Update message to link to newly created lead
                    yield prisma_1.default.whatsAppMessage.update({
                        where: { id: messageRecord.id },
                        data: { leadId: newLead.id }
                    });
                }
                console.log(`[WhatsAppWebhook] Saved incoming message from ${message.from}`);
                // Real-time socket notification
                const io = (0, socket_1.getIO)();
                if (io) {
                    io.to(`org:${organisationId}`).emit('whatsapp_message_received', {
                        message: messageRecord,
                        phoneNumber: message.from
                    });
                }
            }
            catch (error) {
                console.error('[WhatsAppWebhook] Error saving message:', error);
            }
        });
    },
    /**
     * Handle message status updates (delivered, read, failed)
     */
    processStatusUpdate(value) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const { statuses } = value;
            if (!statuses || statuses.length === 0)
                return;
            for (const status of statuses) {
                try {
                    const updateData = {
                        status: status.status
                    };
                    if (status.status === 'delivered') {
                        updateData.deliveredAt = new Date(parseInt(status.timestamp) * 1000);
                    }
                    else if (status.status === 'read') {
                        updateData.readAt = new Date(parseInt(status.timestamp) * 1000);
                    }
                    else if (status.status === 'failed') {
                        updateData.errorCode = (_b = (_a = status.errors) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.code;
                        updateData.errorMessage = (_d = (_c = status.errors) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.title;
                    }
                    // Update message in database
                    const updatedMessage = yield prisma_1.default.whatsAppMessage.updateMany({
                        where: {
                            waMessageId: status.id
                        },
                        data: updateData
                    });
                    // Update campaign statistics if message was updated
                    if (updatedMessage.count > 0) {
                        // Import CampaignProcessor here to avoid circular dependency
                        const { CampaignProcessor } = yield Promise.resolve().then(() => __importStar(require('./CampaignProcessor')));
                        // Find the message to get its ID for campaign stats update
                        const message = yield prisma_1.default.whatsAppMessage.findFirst({
                            where: { waMessageId: status.id },
                            select: { id: true }
                        });
                        if (message) {
                            yield CampaignProcessor.updateCampaignStats(message.id, status.status);
                            // Emit socket event for status update
                            const io = (0, socket_1.getIO)();
                            if (io) {
                                // Find the full message to get organisationId
                                const fullMessage = yield prisma_1.default.whatsAppMessage.findUnique({
                                    where: { id: message.id },
                                    select: { organisationId: true, phoneNumber: true }
                                });
                                if (fullMessage) {
                                    io.to(`org:${fullMessage.organisationId}`).emit('whatsapp_status_update', {
                                        messageId: status.id, // WhatsApp ID
                                        dbMessageId: message.id, // Database ID
                                        status: status.status,
                                        phoneNumber: fullMessage.phoneNumber
                                    });
                                }
                            }
                        }
                    }
                    console.log(`[WhatsAppWebhook] Updated message ${status.id} status to ${status.status}`);
                    // Real-time socket notification for status update
                    // Note: To emit to the correct org, we need to find the message first 
                    // (which we already do below for campaign stats)
                }
                catch (error) {
                    console.error('[WhatsAppWebhook] Error updating message status:', error);
                }
            }
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
            const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
            if (!VERIFY_TOKEN) {
                console.error('[WhatsAppWebhook] WHATSAPP_VERIFY_TOKEN not configured');
                return res.sendStatus(500);
            }
            if (mode && token) {
                if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                    console.log('[WhatsAppWebhook] Verified webhook');
                    res.status(200).send(challenge);
                }
                else {
                    console.log('[WhatsAppWebhook] Webhook verification failed - invalid token');
                    res.sendStatus(403);
                }
            }
            else {
                console.log('[WhatsAppWebhook] Webhook verification failed - missing parameters');
                res.sendStatus(400);
            }
        });
    }
};
