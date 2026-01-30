import prisma from '../config/prisma';

export const WhatsAppIntegrationService = {
    /**
     * Handle incoming webhook from WhatsApp
     */
    async handleWebhook(payload: any): Promise<void> {
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
                                    await this.processMessage(value);
                                }
                                
                                // Handle message status updates
                                if (value.statuses) {
                                    await this.processStatusUpdate(value);
                                }
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[WhatsAppWebhook] Error processing webhook:', error);
        }
    },

    async processMessage(value: any) {
        const { messages, contacts, metadata } = value;
        
        if (!messages || messages.length === 0) return;

        console.log(`[WhatsAppWebhook] Processing messages for phone: ${metadata.phone_number_id}`);

        // Find organisation with this phone number in their integrations
        // Note: Using string contains search since JSON path queries are complex in Prisma
        const orgs = await prisma.organisation.findMany({
            select: {
                id: true,
                name: true,
                integrations: true
            }
        }).then(orgs => {
            return orgs.filter(org => {
                const integrations = org.integrations as any;
                return (integrations?.whatsapp?.phoneNumberId === metadata.phone_number_id) ||
                       (integrations?.meta?.phoneNumberId === metadata.phone_number_id);
            });
        }).catch(() => []);

        if (orgs.length === 0) {
            console.log('[WhatsAppWebhook] No connected account found for phone number', metadata.phone_number_id);
            return;
        }

        const org = orgs[0];

        for (const message of messages) {
            await this.saveIncomingMessage(org.id, message, contacts);
        }
    },

    async saveIncomingMessage(organisationId: string, message: any, contacts: any[]) {
        try {
            const contact = contacts?.find(c => c.wa_id === message.from);
            const contactName = contact?.profile?.name || message.from;

            // Check if message already exists
            const existingMessage = await prisma.whatsAppMessage.findFirst({
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
            let content: any = {};

            if (message.text) {
                messageType = 'text';
                content.text = message.text.body;
            } else if (message.image) {
                messageType = 'image';
                content.mediaUrl = message.image.id;
                content.caption = message.image.caption;
            } else if (message.document) {
                messageType = 'document';
                content.mediaUrl = message.document.id;
                content.fileName = message.document.filename;
                content.caption = message.document.caption;
            } else if (message.audio) {
                messageType = 'audio';
                content.mediaUrl = message.audio.id;
            } else if (message.video) {
                messageType = 'video';
                content.mediaUrl = message.video.id;
                content.caption = message.video.caption;
            } else if (message.location) {
                messageType = 'location';
                content.latitude = message.location.latitude;
                content.longitude = message.location.longitude;
            }

            // Try to find existing lead or contact
            const lead = await prisma.lead.findFirst({
                where: {
                    phone: message.from,
                    organisationId,
                    isDeleted: false
                }
            });

            const contactRecord = await prisma.contact.findFirst({
                where: {
                    organisationId
                },
                select: {
                    id: true,
                    phones: true
                }
            }).then(async (contact) => {
                // Since Prisma JSON queries are limited, we'll do a secondary filter
                if (!contact) return null;
                
                // For now, we'll create a simple search - in production you might want to use raw SQL
                const allContacts = await prisma.contact.findMany({
                    where: {
                        organisationId
                    },
                    select: {
                        id: true,
                        phones: true
                    }
                });
                
                return allContacts.find(contact => {
                    const phones = contact.phones as any;
                    if (Array.isArray(phones)) {
                        return phones.some(phone => phone.includes(message.from));
                    } else if (typeof phones === 'object' && phones !== null) {
                        return Object.values(phones).some(phone => 
                            typeof phone === 'string' && phone.includes(message.from)
                        );
                    }
                    return false;
                }) || null;
            });

            // Create WhatsApp message record
            const messageRecord = await prisma.whatsAppMessage.create({
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
                    leadId: lead?.id,
                    contactId: contactRecord?.id
                }
            });

            // Create lead if none exists and link to message
            if (!lead && !contactRecord) {
                const newLead = await prisma.lead.create({
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
                await prisma.whatsAppMessage.update({
                    where: { id: messageRecord.id },
                    data: { leadId: newLead.id }
                });
            }

            console.log(`[WhatsAppWebhook] Saved incoming message from ${message.from}`);
        } catch (error) {
            console.error('[WhatsAppWebhook] Error saving message:', error);
        }
    },

    /**
     * Handle message status updates (delivered, read, failed)
     */
    async processStatusUpdate(value: any) {
        const { statuses } = value;
        
        if (!statuses || statuses.length === 0) return;

        for (const status of statuses) {
            try {
                const updateData: any = {
                    status: status.status
                };

                if (status.status === 'delivered') {
                    updateData.deliveredAt = new Date(parseInt(status.timestamp) * 1000);
                } else if (status.status === 'read') {
                    updateData.readAt = new Date(parseInt(status.timestamp) * 1000);
                } else if (status.status === 'failed') {
                    updateData.errorCode = status.errors?.[0]?.code;
                    updateData.errorMessage = status.errors?.[0]?.title;
                }

                // Update message in database
                const updatedMessage = await prisma.whatsAppMessage.updateMany({
                    where: {
                        waMessageId: status.id
                    },
                    data: updateData
                });

                // Update campaign statistics if message was updated
                if (updatedMessage.count > 0) {
                    // Import CampaignProcessor here to avoid circular dependency
                    const { CampaignProcessor } = await import('./CampaignProcessor');
                    
                    // Find the message to get its ID for campaign stats update
                    const message = await prisma.whatsAppMessage.findFirst({
                        where: { waMessageId: status.id },
                        select: { id: true }
                    });
                    
                    if (message) {
                        await CampaignProcessor.updateCampaignStats(message.id, status.status);
                    }
                }

                console.log(`[WhatsAppWebhook] Updated message ${status.id} status to ${status.status}`);
            } catch (error) {
                console.error('[WhatsAppWebhook] Error updating message status:', error);
            }
        }
    },

    /**
     * Verify Webhook (GET request)
     */
    async verifyWebhook(req: any, res: any): Promise<void> {
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
            } else {
                console.log('[WhatsAppWebhook] Webhook verification failed - invalid token');
                res.sendStatus(403);
            }
        } else {
            console.log('[WhatsAppWebhook] Webhook verification failed - missing parameters');
            res.sendStatus(400);
        }
    }
};