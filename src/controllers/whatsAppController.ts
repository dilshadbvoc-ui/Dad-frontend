import { Request, Response } from 'express';
import { WhatsAppService } from '../services/WhatsAppService';
import prisma from '../config/prisma';
import { getOrgId } from '../utils/hierarchyUtils';

// Type extension for Request to include user
interface AuthRequest extends Request {
    user?: {
        id: string;
        organisationId: string;
    };
}

export const getWhatsAppConfig = async (req: AuthRequest) => {
    if (!req.user?.organisationId) {
        throw new Error('User not authenticated or missing organisation');
    }

    const org = await prisma.organisation.findUnique({
        where: { id: req.user.organisationId }
    });

    if (!org) throw new Error('Organisation not found');

    const integrations = org.integrations as any;
    
    // Check for dedicated WhatsApp config first
    let whatsappConfig = integrations?.whatsapp;
    
    // Fallback to meta config for backward compatibility
    if (!whatsappConfig?.connected && integrations?.meta?.phoneNumberId) {
        whatsappConfig = {
            accessToken: integrations.meta.accessToken,
            phoneNumberId: integrations.meta.phoneNumberId,
            wabaId: integrations.meta.wabaId,
            connected: integrations.meta.connected
        };
    }

    if (!whatsappConfig?.connected || !whatsappConfig.phoneNumberId || !whatsappConfig.accessToken) {
        throw new Error('WhatsApp integration not configured. Please check settings.');
    }

    return whatsappConfig;
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
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

        const config = await getWhatsAppConfig(req);
        
        const whatsAppService = new WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });

        let result;
        if (type === 'template') {
            const { templateName, languageCode = 'en_US', components = [] } = req.body;
            result = await whatsAppService.sendTemplateMessage(to, templateName, languageCode, components);
        } else {
            result = await whatsAppService.sendTextMessage(to, sanitizedMessage!);
        }

        // Log the message to database
        const user = req.user;
        const orgId = getOrgId(user);
        
        if (orgId) {
            await prisma.whatsAppMessage.create({
                data: {
                    conversationId: `${to}_${Date.now()}`,
                    phoneNumber: to,
                    direction: 'outgoing',
                    messageType: type,
                    content: {
                        text: type === 'text' ? sanitizedMessage : undefined,
                        templateName: type === 'template' ? req.body.templateName : undefined
                    },
                    status: 'sent',
                    waMessageId: result.messages?.[0]?.id,
                    sentAt: new Date(),
                    organisationId: orgId,
                    agentId: user?.id
                }
            });
        }

        res.json({ success: true, result });
    } catch (error: any) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No organisation found' });

        const { phoneNumber, limit = 50, offset = 0 } = req.query;

        const where: any = {
            organisationId: orgId,
            isDeleted: false
        };

        if (phoneNumber) {
            where.phoneNumber = phoneNumber;
        }

        const messages = await prisma.whatsAppMessage.findMany({
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
    } catch (error: any) {
        console.error('Error in getMessages:', error);
        res.status(500).json({ message: error.message });
    }
};

export const testConnection = async (req: AuthRequest, res: Response) => {
    try {
        const config = await getWhatsAppConfig(req);
        
        const whatsAppService = new WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });

        // Test by getting phone number info
        const response = await whatsAppService.makeRequest(`${config.phoneNumberId}`, config.accessToken, {
            fields: 'display_phone_number,verified_name,quality_rating'
        });

        res.json({
            success: true,
            phoneNumber: response.display_phone_number,
            verifiedName: response.verified_name,
            qualityRating: response.quality_rating
        });
    } catch (error: any) {
        console.error('Error in testConnection:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getTemplates = async (req: AuthRequest, res: Response) => {
    try {
        const config = await getWhatsAppConfig(req);
        
        if (!config.wabaId) {
            return res.status(400).json({ message: 'WABA ID required to fetch templates' });
        }

        const whatsAppService = new WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });

        const response = await whatsAppService.makeRequest(`${config.wabaId}/message_templates`, config.accessToken, {
            fields: 'name,status,category,language,components'
        });

        res.json(response.data || []);
    } catch (error: any) {
        console.error('Error in getTemplates:', error);
        res.status(500).json({ message: error.message });
    }
};

export const createTemplate = async (req: AuthRequest, res: Response) => {
    try {
        const config = await getWhatsAppConfig(req);
        
        if (!config.wabaId) {
            return res.status(400).json({ message: 'WABA ID required to create templates' });
        }

        const whatsAppService = new WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });

        const result = await whatsAppService.createTemplate(req.body);
        res.json(result);
    } catch (error: any) {
        console.error('Error in createTemplate:', error);
        res.status(500).json({ message: error.message });
    }
};

export const sendMediaMessage = async (req: AuthRequest, res: Response) => {
    try {
        const { to, mediaType, mediaId, caption, filename } = req.body;
        
        if (!to || !mediaType || !mediaId) {
            return res.status(400).json({ message: 'Phone number, media type, and media ID are required' });
        }

        const config = await getWhatsAppConfig(req);
        
        const whatsAppService = new WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });

        const result = await whatsAppService.sendMediaMessage(to, mediaType, mediaId, caption, filename);

        // Log the message to database
        const user = req.user;
        const orgId = getOrgId(user);
        
        if (orgId) {
            await prisma.whatsAppMessage.create({
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
                    waMessageId: result.messages?.[0]?.id,
                    sentAt: new Date(),
                    organisationId: orgId,
                    agentId: user?.id
                }
            });
        }

        res.json({ success: true, result });
    } catch (error: any) {
        console.error('Error in sendMediaMessage:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getMessageStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { messageId } = req.params;
        
        if (!messageId) {
            return res.status(400).json({ message: 'Message ID is required' });
        }

        const config = await getWhatsAppConfig(req);
        
        const whatsAppService = new WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });

        const result = await whatsAppService.getMessageStatus(messageId);
        res.json(result);
    } catch (error: any) {
        console.error('Error in getMessageStatus:', error);
        res.status(500).json({ message: error.message });
    }
};

export const markMessageAsRead = async (req: AuthRequest, res: Response) => {
    try {
        const { messageId } = req.body;
        
        if (!messageId) {
            return res.status(400).json({ message: 'Message ID is required' });
        }

        const config = await getWhatsAppConfig(req);
        
        const whatsAppService = new WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });

        const result = await whatsAppService.markMessageAsRead(messageId);
        res.json({ success: true, result });
    } catch (error: any) {
        console.error('Error in markMessageAsRead:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getConversationAnalytics = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({ message: 'Start date and end date are required' });
        }

        const config = await getWhatsAppConfig(req);
        
        const whatsAppService = new WhatsAppService({
            accessToken: config.accessToken,
            phoneNumberId: config.phoneNumberId,
            wabaId: config.wabaId
        });

        const result = await whatsAppService.getConversationAnalytics(startDate as string, endDate as string);
        res.json(result);
    } catch (error: any) {
        console.error('Error in getConversationAnalytics:', error);
        res.status(500).json({ message: error.message });
    }
};

export const getMessageStatistics = async (req: AuthRequest, res: Response) => {
    try {
        const user = req.user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No organisation found' });

        const { startDate, endDate, phoneNumber } = req.query;

        const where: any = {
            organisationId: orgId,
            isDeleted: false
        };

        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
            };
        }

        if (phoneNumber) {
            where.phoneNumber = phoneNumber;
        }

        // Get message counts by status
        const statusCounts = await prisma.whatsAppMessage.groupBy({
            by: ['status'],
            where,
            _count: {
                id: true
            }
        });

        // Get message counts by type
        const typeCounts = await prisma.whatsAppMessage.groupBy({
            by: ['messageType'],
            where,
            _count: {
                id: true
            }
        });

        // Get message counts by direction
        const directionCounts = await prisma.whatsAppMessage.groupBy({
            by: ['direction'],
            where,
            _count: {
                id: true
            }
        });

        // Get total messages
        const totalMessages = await prisma.whatsAppMessage.count({ where });

        // Get unique conversations
        const uniqueConversations = await prisma.whatsAppMessage.findMany({
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
            }, {} as Record<string, number>),
            typeBreakdown: typeCounts.reduce((acc, item) => {
                acc[item.messageType] = item._count.id;
                return acc;
            }, {} as Record<string, number>),
            directionBreakdown: directionCounts.reduce((acc, item) => {
                acc[item.direction] = item._count.id;
                return acc;
            }, {} as Record<string, number>)
        });
    } catch (error: any) {
        console.error('Error in getMessageStatistics:', error);
        res.status(500).json({ message: error.message });
    }
};