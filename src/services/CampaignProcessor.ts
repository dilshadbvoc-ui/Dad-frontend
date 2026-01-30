import prisma from '../config/prisma';
import { WhatsAppService } from './WhatsAppService';

interface CampaignRecipient {
    type: 'lead' | 'contact' | 'phone';
    id?: string;
    phone?: string;
    name?: string;
}

interface CampaignStats {
    sent: number;
    delivered: number;
    read: number;
    failed: number;
    replied: number;
    [key: string]: any; // Add index signature for Prisma JSON compatibility
}

export class CampaignProcessor {
    /**
     * Process WhatsApp campaign with batch sending
     */
    static async processWhatsAppCampaign(campaignId: string): Promise<void> {
        try {
            console.log(`[CampaignProcessor] Starting campaign ${campaignId}`);

            const campaign = await prisma.whatsAppCampaign.findUnique({
                where: { id: campaignId },
                include: {
                    organisation: true,
                    createdBy: true
                }
            });

            if (!campaign) {
                throw new Error('Campaign not found');
            }

            if (campaign.status !== 'scheduled' && campaign.status !== 'draft' && campaign.status !== 'sent') {
                throw new Error('Campaign is not in a sendable state');
            }

            // Get WhatsApp service for the organisation
            const whatsAppService = await WhatsAppService.getClientForOrg(campaign.organisationId);
            if (!whatsAppService) {
                throw new Error('WhatsApp integration not configured for this organisation');
            }

            // Get recipients
            const recipients = await this.getRecipients(campaign);
            if (recipients.length === 0) {
                throw new Error('No recipients found for campaign');
            }

            console.log(`[CampaignProcessor] Found ${recipients.length} recipients`);

            // Initialize stats
            const stats: CampaignStats = {
                sent: 0,
                delivered: 0,
                read: 0,
                failed: 0,
                replied: 0
            };

            // Update campaign status to sending
            await prisma.whatsAppCampaign.update({
                where: { id: campaignId },
                data: { 
                    status: 'sent',
                    sentAt: new Date(),
                    stats
                }
            });

            // Process recipients in batches to respect rate limits
            const batchSize = 10; // Process 10 messages at a time
            const delayBetweenBatches = 1000; // 1 second delay between batches

            for (let i = 0; i < recipients.length; i += batchSize) {
                const batch = recipients.slice(i, i + batchSize);
                
                await Promise.all(
                    batch.map(recipient => this.sendToRecipient(
                        whatsAppService,
                        campaign,
                        recipient,
                        stats
                    ))
                );

                // Update stats after each batch
                await prisma.whatsAppCampaign.update({
                    where: { id: campaignId },
                    data: { stats }
                });

                // Delay between batches to respect rate limits
                if (i + batchSize < recipients.length) {
                    await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
                }
            }

            console.log(`[CampaignProcessor] Campaign ${campaignId} completed. Stats:`, stats);

        } catch (error) {
            console.error(`[CampaignProcessor] Error processing campaign ${campaignId}:`, error);
            
            // Update campaign status to failed
            await prisma.whatsAppCampaign.update({
                where: { id: campaignId },
                data: { 
                    status: 'failed',
                    stats: { error: (error as Error).message }
                }
            }).catch(console.error);
        }
    }

    /**
     * Get recipients for a campaign
     */
    private static async getRecipients(campaign: any): Promise<Array<{ phone: string; name: string }>> {
        const recipients: Array<{ phone: string; name: string }> = [];

        // If campaign has explicit recipients list
        if (campaign.recipients && Array.isArray(campaign.recipients) && campaign.recipients.length > 0) {
            for (const recipient of campaign.recipients) {
                if (recipient.type === 'phone') {
                    recipients.push({
                        phone: recipient.phone,
                        name: recipient.name || recipient.phone
                    });
                } else if (recipient.type === 'lead') {
                    const lead = await prisma.lead.findUnique({
                        where: { id: recipient.id, organisationId: campaign.organisationId },
                        select: { phone: true, firstName: true, lastName: true }
                    });
                    if (lead && lead.phone) {
                        recipients.push({
                            phone: lead.phone,
                            name: `${lead.firstName} ${lead.lastName}`.trim()
                        });
                    }
                } else if (recipient.type === 'contact') {
                    const contact = await prisma.contact.findUnique({
                        where: { id: recipient.id, organisationId: campaign.organisationId },
                        select: { phones: true, firstName: true, lastName: true }
                    });
                    if (contact && contact.phones) {
                        // Extract phone from JSON field
                        const phones = contact.phones as any;
                        let phone = null;
                        
                        if (Array.isArray(phones) && phones.length > 0) {
                            phone = phones[0];
                        } else if (typeof phones === 'object' && phones.primary) {
                            phone = phones.primary;
                        } else if (typeof phones === 'string') {
                            phone = phones;
                        }
                        
                        if (phone) {
                            recipients.push({
                                phone,
                                name: `${contact.firstName} ${contact.lastName}`.trim()
                            });
                        }
                    }
                }
            }
        }

        // If no explicit recipients, use test number if provided
        if (recipients.length === 0 && campaign.testNumber) {
            recipients.push({
                phone: campaign.testNumber,
                name: 'Test Recipient'
            });
        }

        return recipients;
    }

    /**
     * Send message to a single recipient
     */
    private static async sendToRecipient(
        whatsAppService: WhatsAppService,
        campaign: any,
        recipient: { phone: string; name: string },
        stats: CampaignStats
    ): Promise<void> {
        try {
            let result;
            
            if (campaign.templateId) {
                // Send template message
                result = await whatsAppService.sendTemplateMessage(
                    recipient.phone,
                    campaign.templateId,
                    'en_US',
                    []
                );
            } else {
                // Send text message
                result = await whatsAppService.sendTextMessage(
                    recipient.phone,
                    campaign.message
                );
            }

            // Log message to database
            await prisma.whatsAppMessage.create({
                data: {
                    conversationId: `${recipient.phone}_${campaign.organisationId}`,
                    phoneNumber: recipient.phone,
                    direction: 'outgoing',
                    messageType: campaign.templateId ? 'template' : 'text',
                    content: {
                        text: campaign.templateId ? undefined : campaign.message,
                        templateName: campaign.templateId || undefined
                    },
                    status: 'sent',
                    waMessageId: result.messages?.[0]?.id,
                    sentAt: new Date(),
                    organisationId: campaign.organisationId,
                    agentId: campaign.createdById
                }
            });

            stats.sent++;
            console.log(`[CampaignProcessor] Sent message to ${recipient.phone}`);

        } catch (error) {
            console.error(`[CampaignProcessor] Failed to send to ${recipient.phone}:`, error);
            stats.failed++;

            // Log failed message
            await prisma.whatsAppMessage.create({
                data: {
                    conversationId: `${recipient.phone}_${campaign.organisationId}`,
                    phoneNumber: recipient.phone,
                    direction: 'outgoing',
                    messageType: campaign.templateId ? 'template' : 'text',
                    content: {
                        text: campaign.templateId ? undefined : campaign.message,
                        templateName: campaign.templateId || undefined
                    },
                    status: 'failed',
                    errorMessage: (error as Error).message,
                    organisationId: campaign.organisationId,
                    agentId: campaign.createdById
                }
            }).catch(console.error);
        }
    }

    /**
     * Update campaign statistics based on message status updates
     */
    static async updateCampaignStats(messageId: string, newStatus: string): Promise<void> {
        try {
            const message = await prisma.whatsAppMessage.findUnique({
                where: { id: messageId },
                select: { organisationId: true, sentAt: true, waMessageId: true }
            });

            if (!message || !message.sentAt) return;

            // Find campaign that sent this message (within 24 hour window)
            const campaign = await prisma.whatsAppCampaign.findFirst({
                where: {
                    organisationId: message.organisationId,
                    sentAt: {
                        gte: new Date(message.sentAt.getTime() - 24 * 60 * 60 * 1000), // 24 hours before
                        lte: new Date(message.sentAt.getTime() + 24 * 60 * 60 * 1000)  // 24 hours after
                    },
                    status: 'sent'
                }
            });

            if (!campaign) return;

            const stats = (campaign.stats as any) || {
                sent: 0,
                delivered: 0,
                read: 0,
                failed: 0,
                replied: 0
            };

            // Update stats based on new status
            if (newStatus === 'delivered' && stats.delivered !== undefined) {
                stats.delivered++;
            } else if (newStatus === 'read' && stats.read !== undefined) {
                stats.read++;
            } else if (newStatus === 'failed' && stats.failed !== undefined) {
                stats.failed++;
            }

            await prisma.whatsAppCampaign.update({
                where: { id: campaign.id },
                data: { stats }
            });

            console.log(`[CampaignProcessor] Updated campaign ${campaign.id} stats for status: ${newStatus}`);

        } catch (error) {
            console.error('[CampaignProcessor] Error updating campaign stats:', error);
        }
    }
}