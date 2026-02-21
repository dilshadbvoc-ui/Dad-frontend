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
exports.verifyWebhook = exports.handleWebhook = exports.uploadMedia = exports.getMedia = exports.getMessageStatistics = exports.getConversationAnalytics = exports.markConversationAsRead = exports.markMessageAsRead = exports.getMessageStatus = exports.sendMediaMessage = exports.createTemplate = exports.getTemplates = exports.testConnection = exports.getConversations = exports.getMessages = exports.sendMessage = exports.getWhatsAppConfig = void 0;
const WhatsAppService_1 = require("../services/WhatsAppService");
const WhatsAppIntegrationService_1 = require("../services/WhatsAppIntegrationService");
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const socket_1 = require("../socket");
const encryption_1 = require("../utils/encryption");
const getWhatsAppConfig = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.organisationId)) {
        throw new Error('User not authenticated or missing organisation');
    }
    const org = yield prisma_1.default.organisation.findUnique({
        where: { id: req.user.organisationId }
    });
    if (!org)
        throw new Error('Organisation not found');
    const integrations = org.integrations;
    // Check for dedicated WhatsApp config first
    let whatsappConfig = integrations === null || integrations === void 0 ? void 0 : integrations.whatsapp;
    // Fallback to meta config for backward compatibility
    if (!(whatsappConfig === null || whatsappConfig === void 0 ? void 0 : whatsappConfig.connected) && ((_b = integrations === null || integrations === void 0 ? void 0 : integrations.meta) === null || _b === void 0 ? void 0 : _b.phoneNumberId)) {
        whatsappConfig = {
            accessToken: integrations.meta.accessToken,
            phoneNumberId: integrations.meta.phoneNumberId,
            wabaId: integrations.meta.wabaId,
            connected: integrations.meta.connected
        };
    }
    if (!(whatsappConfig === null || whatsappConfig === void 0 ? void 0 : whatsappConfig.connected) || !whatsappConfig.phoneNumberId || !whatsappConfig.accessToken) {
        throw new Error('WhatsApp integration not configured. Please check settings.');
    }
    // Decrypt the token before using it
    return Object.assign(Object.assign({}, whatsappConfig), { accessToken: (0, encryption_1.decrypt)(whatsappConfig.accessToken) });
});
exports.getWhatsAppConfig = getWhatsAppConfig;
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Validate required fields
        const { to, message, type = 'text' } = req.body;
        if (!to) {
            return res.status(400).json({ message: 'Phone number (to) is required' });
        }
        // Validate phone number format
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(to)) {
            return res.status(400).json({ message: 'Phone number must be in international format (+1234567890)' });
        }
        if (type === 'text' && !message) {
            return res.status(400).json({ message: 'Message text is required for text messages' });
        }
        if (type === 'template' && !req.body.templateName) {
            return res.status(400).json({ message: 'Template name is required for template messages' });
        }
        // Sanitize message content
        const sanitizedMessage = message ? message.trim().substring(0, 4096) : undefined;
        const config = yield (0, exports.getWhatsAppConfig)(req);
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        let result;
        if (type === 'template') {
            const { templateName, languageCode = 'en_US', components = [] } = req.body;
            result = yield whatsAppService.sendTemplateMessage(to, templateName, languageCode, components);
        }
        else {
            result = yield whatsAppService.sendTextMessage(to, sanitizedMessage);
        }
        // Log the message to database
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (orgId) {
            yield prisma_1.default.whatsAppMessage.create({
                data: {
                    conversationId: `${to}_${Date.now()}`,
                    phoneNumber: to,
                    direction: 'outgoing',
                    messageType: type,
                    content: {
                        text: type === 'text' ? sanitizedMessage : undefined,
                        templateName: type === 'template' ? req.body.templateName : undefined,
                        language: type === 'template' ? req.body.languageCode : undefined,
                        components: type === 'template' ? req.body.components : undefined
                    },
                    status: 'sent',
                    waMessageId: (_b = (_a = result.messages) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id,
                    sentAt: new Date(),
                    organisationId: orgId,
                    agentId: user === null || user === void 0 ? void 0 : user.id
                }
            });
            // Real-time socket notification for outgoing message
            const io = (0, socket_1.getIO)();
            if (io && orgId) {
                io.to(`org:${orgId}`).emit('whatsapp_message_received', {
                    message: {
                        phoneNumber: to,
                        direction: 'outgoing',
                        messageType: type,
                        content: {
                            text: type === 'text' ? sanitizedMessage : undefined,
                            templateName: type === 'template' ? req.body.templateName : undefined,
                            language: type === 'template' ? req.body.languageCode : undefined,
                            components: type === 'template' ? req.body.components : undefined
                        },
                        status: 'sent',
                        sentAt: new Date(),
                        organisationId: orgId,
                        agentId: user === null || user === void 0 ? void 0 : user.id
                    },
                    phoneNumber: to
                });
            }
        }
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.sendMessage = sendMessage;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No organisation found' });
        const { phoneNumber, limit = 50, offset = 0 } = req.query;
        const where = {
            organisationId: orgId,
            isDeleted: false
        };
        if (phoneNumber) {
            where.phoneNumber = phoneNumber;
        }
        const messages = yield prisma_1.default.whatsAppMessage.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip: Number(offset),
            include: {
                agent: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                lead: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true }
                },
                contact: {
                    select: { id: true, firstName: true, lastName: true, email: true, phones: true }
                }
            }
        });
        res.json(messages);
    }
    catch (error) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getMessages = getMessages;
const getConversations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No organisation found' });
        // 1. Get unique phone numbers (conversations)
        const conversations = yield prisma_1.default.whatsAppMessage.groupBy({
            by: ['phoneNumber'],
            where: {
                organisationId: orgId,
                isDeleted: false
            },
            _max: {
                createdAt: true
            },
            orderBy: {
                _max: {
                    createdAt: 'desc'
                }
            }
        });
        // 2. Fetch details for each conversation (latest message, contact info)
        const conversationDetails = yield Promise.all(conversations.map((conv) => __awaiter(void 0, void 0, void 0, function* () {
            const lastMessage = yield prisma_1.default.whatsAppMessage.findFirst({
                where: {
                    organisationId: orgId,
                    phoneNumber: conv.phoneNumber,
                    createdAt: conv._max.createdAt
                },
                include: {
                    lead: { select: { firstName: true, lastName: true } },
                    contact: { select: { firstName: true, lastName: true } }
                }
            });
            // Determine display name
            let displayName = conv.phoneNumber;
            if (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.contact) {
                displayName = `${lastMessage.contact.firstName} ${lastMessage.contact.lastName}`;
            }
            else if (lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.lead) {
                displayName = `${lastMessage.lead.firstName} ${lastMessage.lead.lastName}`;
            }
            // Count unread messages for this specific conversation
            const unreadCount = yield prisma_1.default.whatsAppMessage.count({
                where: {
                    organisationId: orgId,
                    phoneNumber: conv.phoneNumber,
                    direction: 'incoming',
                    isReadByAgent: false,
                    isDeleted: false
                }
            });
            return {
                phoneNumber: conv.phoneNumber,
                lastMessage: lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.content,
                lastMessageAt: lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.createdAt,
                displayName: displayName.trim(),
                leadId: lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.leadId,
                contactId: lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.contactId,
                messageType: lastMessage === null || lastMessage === void 0 ? void 0 : lastMessage.messageType,
                unreadCount
            };
        })));
        res.json(conversationDetails);
    }
    catch (error) {
        console.error('Error in getConversations:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getConversations = getConversations;
const testConnection = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getWhatsAppConfig)(req);
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        // Test by getting phone number info
        const response = yield whatsAppService.makeRequest(`${config.phoneNumberId}`, config.accessToken, {
            fields: 'display_phone_number,verified_name,quality_rating'
        });
        res.json({
            success: true,
            phoneNumber: response.display_phone_number,
            verifiedName: response.verified_name,
            qualityRating: response.quality_rating
        });
    }
    catch (error) {
        console.error('Error in testConnection:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.testConnection = testConnection;
const getTemplates = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getWhatsAppConfig)(req);
        if (!config.wabaId) {
            return res.status(400).json({ message: 'WABA ID required to fetch templates' });
        }
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        const response = yield whatsAppService.makeRequest(`${config.wabaId}/message_templates`, config.accessToken, {
            fields: 'name,status,category,language,components'
        });
        res.json(response.data || []);
    }
    catch (error) {
        console.error('Error in getTemplates:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getTemplates = getTemplates;
const createTemplate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const config = yield (0, exports.getWhatsAppConfig)(req);
        if (!config.wabaId) {
            return res.status(400).json({ message: 'WABA ID required to create templates' });
        }
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        const result = yield whatsAppService.createTemplate(req.body);
        res.json(result);
    }
    catch (error) {
        console.error('Error in createTemplate:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.createTemplate = createTemplate;
const sendMediaMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { to, mediaType, mediaId, caption, filename } = req.body;
        if (!to || !mediaType || !mediaId) {
            return res.status(400).json({ message: 'Phone number, media type, and media ID are required' });
        }
        const config = yield (0, exports.getWhatsAppConfig)(req);
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        const result = yield whatsAppService.sendMediaMessage(to, mediaType, mediaId, caption, filename);
        // Log the message to database
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (orgId) {
            yield prisma_1.default.whatsAppMessage.create({
                data: {
                    conversationId: `${to}_${Date.now()}`,
                    phoneNumber: to,
                    direction: 'outgoing',
                    messageType: mediaType,
                    content: {
                        mediaId,
                        caption,
                        filename
                    },
                    status: 'sent',
                    waMessageId: (_b = (_a = result.messages) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id,
                    sentAt: new Date(),
                    organisationId: orgId,
                    agentId: user === null || user === void 0 ? void 0 : user.id
                }
            });
        }
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error in sendMediaMessage:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.sendMediaMessage = sendMediaMessage;
const getMessageStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { messageId } = req.params;
        if (!messageId) {
            return res.status(400).json({ message: 'Message ID is required' });
        }
        const config = yield (0, exports.getWhatsAppConfig)(req);
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        const result = yield whatsAppService.getMessageStatus(messageId);
        res.json(result);
    }
    catch (error) {
        console.error('Error in getMessageStatus:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getMessageStatus = getMessageStatus;
const markMessageAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { messageId } = req.body;
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId) {
            return res.status(400).json({ message: 'No organisation found' });
        }
        if (!messageId) {
            return res.status(400).json({ message: 'Message ID is required' });
        }
        const config = yield (0, exports.getWhatsAppConfig)(req);
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        // Update internal database
        yield prisma_1.default.whatsAppMessage.updateMany({
            where: {
                waMessageId: messageId,
                organisationId: orgId
            },
            data: {
                isReadByAgent: true
            }
        });
        const result = yield whatsAppService.markMessageAsRead(messageId);
        res.json({ success: true, result });
    }
    catch (error) {
        console.error('Error in markMessageAsRead:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.markMessageAsRead = markMessageAsRead;
const markConversationAsRead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber } = req.body;
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }
        if (!orgId)
            return res.status(400).json({ message: 'No organisation found' });
        yield prisma_1.default.whatsAppMessage.updateMany({
            where: {
                organisationId: orgId,
                phoneNumber,
                direction: 'incoming',
                isReadByAgent: false
            },
            data: {
                isReadByAgent: true
            }
        });
        // Notify via socket to refresh conversation list in other tabs
        const io = (0, socket_1.getIO)();
        if (io) {
            io.to(`org:${orgId}`).emit('whatsapp_conversation_read', {
                phoneNumber
            });
        }
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error in markConversationAsRead:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.markConversationAsRead = markConversationAsRead;
const getConversationAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }
        const config = yield (0, exports.getWhatsAppConfig)(req);
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        const result = yield whatsAppService.getConversationAnalytics(startDate, endDate);
        res.json(result);
    }
    catch (error) {
        console.error('Error in getConversationAnalytics:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getConversationAnalytics = getConversationAnalytics;
const getMessageStatistics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No organisation found' });
        const { startDate, endDate, phoneNumber } = req.query;
        const where = {
            organisationId: orgId,
            isDeleted: false
        };
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }
        if (phoneNumber) {
            where.phoneNumber = phoneNumber;
        }
        // Get message counts by status
        const statusCounts = yield prisma_1.default.whatsAppMessage.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true
            }
        });
        // Get message counts by type
        const typeCounts = yield prisma_1.default.whatsAppMessage.groupBy({
            by: ['messageType'],
            where,
            _count: {
                id: true
            }
        });
        // Get message counts by direction
        const directionCounts = yield prisma_1.default.whatsAppMessage.groupBy({
            by: ['direction'],
            where,
            _count: {
                id: true
            }
        });
        // Get total messages
        const totalMessages = yield prisma_1.default.whatsAppMessage.count({ where });
        // Get unique conversations
        const uniqueConversations = yield prisma_1.default.whatsAppMessage.findMany({
            where,
            select: { phoneNumber: true },
            distinct: ['phoneNumber']
        });
        res.json({
            totalMessages,
            uniqueConversations: uniqueConversations.length,
            statusBreakdown: statusCounts.reduce((acc, item) => {
                acc[item.status] = item._count.id;
                return acc;
            }, {}),
            typeBreakdown: typeCounts.reduce((acc, item) => {
                acc[item.messageType] = item._count.id;
                return acc;
            }, {}),
            directionBreakdown: directionCounts.reduce((acc, item) => {
                acc[item.direction] = item._count.id;
                return acc;
            }, {})
        });
    }
    catch (error) {
        console.error('Error in getMessageStatistics:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getMessageStatistics = getMessageStatistics;
const getMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { mediaId } = req.params;
        if (!mediaId) {
            return res.status(400).json({ message: 'Media ID is required' });
        }
        const config = yield (0, exports.getWhatsAppConfig)(req);
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        // 1. Get media URL
        const mediaUrl = yield whatsAppService.getMediaUrl(mediaId);
        // 2. Download/Proxy media
        const mediaStream = yield whatsAppService.downloadMedia(mediaUrl);
        mediaStream.pipe(res);
    }
    catch (error) {
        console.error('Error in getMedia:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getMedia = getMedia;
const uploadMedia = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const config = yield (0, exports.getWhatsAppConfig)(req);
        const whatsAppService = new WhatsAppService_1.WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });
        const result = yield whatsAppService.uploadMedia(req.file.buffer, req.file.originalname, req.file.mimetype);
        res.json(result);
    }
    catch (error) {
        console.error('Error in uploadMedia:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.uploadMedia = uploadMedia;
const handleWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const signature = req.headers['x-hub-signature-256'];
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        if (appSecret && signature) {
            const isValid = WhatsAppService_1.WhatsAppService.verifySignature(JSON.stringify(req.body), signature, appSecret);
            if (!isValid) {
                console.warn('[WhatsAppWebhook] Invalid signature');
                return res.sendStatus(401);
            }
        }
        yield WhatsAppIntegrationService_1.WhatsAppIntegrationService.handleWebhook(req.body);
        res.sendStatus(200);
    }
    catch (error) {
        console.error('Error in handleWebhook:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.handleWebhook = handleWebhook;
const verifyWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield WhatsAppIntegrationService_1.WhatsAppIntegrationService.verifyWebhook(req, res);
    }
    catch (error) {
        console.error('Error in verifyWebhook:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.verifyWebhook = verifyWebhook;
