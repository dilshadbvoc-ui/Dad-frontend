import prisma from '../config/prisma';
import { metaService } from './MetaService';

export const MetaIntegrationService = {
    /**
     * Handle incoming webhook from Meta
     */
    async handleWebhook(payload: any): Promise<void> {
        try {
            console.log('[MetaWebhook] Received payload:', JSON.stringify(payload, null, 2));

            // Basic parsing logic for Facebook Webhooks
            // Usually payload.entry array
            if (payload.entry) {
                for (const entry of payload.entry) {
                    if (entry.changes) {
                        for (const change of entry.changes) {
                            if (change.field === 'leadgen') {
                                await this.processLeadGen(change.value);
                            } else if (change.field === 'ads') {
                                await this.processAdUpdate(change.value);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('[MetaWebhook] Error processing webhook:', error);
        }
    },

    async processLeadGen(value: any) {
        try {
            // value contains leadgen_id, form_id, page_id, created_time
            const { leadgen_id, page_id, form_id } = value;
            console.log(`[MetaWebhook] Processing LeadGen ID: ${leadgen_id} for Page: ${page_id}`);

            // Find organisation with this page in their integrations
            const orgs = await prisma.organisation.findMany({
                select: {
                    id: true,
                    name: true,
                    integrations: true
                }
            }).then(orgs => {
                return orgs.filter(org => {
                    const integrations = org.integrations as any;
                    return integrations?.meta?.pageId === page_id;
                });
            }).catch(() => []);

            if (orgs.length === 0) {
                console.log('[MetaWebhook] No connected account found for page', page_id);
                return;
            }

            const org = orgs[0];
            const integrations = org.integrations as any;
            const metaConfig = integrations.meta;

            if (!metaConfig?.accessToken) {
                console.log('[MetaWebhook] No access token found for organization', org.id);
                return;
            }

            // Fetch lead details from Meta API
            try {
                const leadData = await metaService.makeRequest(leadgen_id, metaConfig.accessToken, {
                    fields: 'id,created_time,field_data'
                });

                // Parse field data
                const fieldData = leadData.field_data || [];
                const leadInfo: any = {
                    firstName: '',
                    lastName: '',
                    email: '',
                    phone: '',
                    company: ''
                };

                fieldData.forEach((field: any) => {
                    const name = field.name?.toLowerCase();
                    const value = field.values?.[0];
                    
                    if (name?.includes('first_name') || name?.includes('firstname')) {
                        leadInfo.firstName = value;
                    } else if (name?.includes('last_name') || name?.includes('lastname')) {
                        leadInfo.lastName = value;
                    } else if (name?.includes('email')) {
                        leadInfo.email = value;
                    } else if (name?.includes('phone')) {
                        leadInfo.phone = value;
                    } else if (name?.includes('company')) {
                        leadInfo.company = value;
                    }
                });

                // Create lead in CRM
                const lead = await prisma.lead.create({
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

                console.log(`[MetaWebhook] Created lead ${lead.id} from Meta LeadGen ID: ${leadgen_id}`);

                // Find an admin user to notify
                const adminUser = await prisma.user.findFirst({
                    where: {
                        organisationId: org.id,
                        role: { in: ['admin', 'super_admin', 'manager'] }
                    }
                });

                // Create notification for new lead
                if (adminUser) {
                    await prisma.notification.create({
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
                        console.error('[MetaWebhook] Error creating notification:', error);
                    });
                }

            } catch (apiError) {
                console.error('[MetaWebhook] Error fetching lead data from Meta API:', apiError);
            }

        } catch (error) {
            console.error('[MetaWebhook] Error processing leadgen:', error);
        }
    },

    async processAdUpdate(value: any) {
        try {
            console.log(`[MetaWebhook] Processing ad update:`, value);
            // Handle ad status changes, performance updates, etc.
            // This can be used to sync campaign performance data
        } catch (error) {
            console.error('[MetaWebhook] Error processing ad update:', error);
        }
    },

    /**
     * Sync campaigns for a connected account
     */
    async syncCampaigns(organisationId: string): Promise<any[]> {
        try {
            console.log(`[MetaIntegration] Syncing campaigns for organization ${organisationId}`);

            const org = await prisma.organisation.findUnique({
                where: { id: organisationId },
                select: { integrations: true }
            });

            if (!org) {
                throw new Error('Organization not found');
            }

            const integrations = org.integrations as any;
            const metaConfig = integrations?.meta;

            if (!metaConfig?.accessToken || !metaConfig?.adAccountId) {
                throw new Error('Meta integration not configured');
            }

            // Fetch campaigns from Meta
            const campaigns = await metaService.getCampaigns(metaConfig);
            
            // Sync campaigns to database
            const syncedCampaigns = [];
            for (const campaign of campaigns) {
                try {
                    const existingCampaign = await prisma.campaign.findFirst({
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
                        const updated = await prisma.campaign.update({
                            where: { id: existingCampaign.id },
                            data: {
                                name: campaign.name,
                                status: this.mapMetaStatusToCrmStatus(campaign.status),
                                customFields: {
                                    ...existingCampaign.customFields as any,
                                    metaCampaignId: campaign.id,
                                    metaObjective: campaign.objective,
                                    metaDailyBudget: campaign.daily_budget,
                                    metaLifetimeBudget: campaign.lifetime_budget,
                                    metaStartTime: campaign.start_time,
                                    metaStopTime: campaign.stop_time
                                }
                            }
                        });
                        syncedCampaigns.push(updated);
                    } else {
                        // Create new campaign
                        const created = await prisma.campaign.create({
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
                } catch (campaignError) {
                    console.error(`[MetaIntegration] Error syncing campaign ${campaign.id}:`, campaignError);
                }
            }

            console.log(`[MetaIntegration] Synced ${syncedCampaigns.length} campaigns`);
            return syncedCampaigns;

        } catch (error) {
            console.error(`[MetaIntegration] Error syncing campaigns:`, error);
            throw error;
        }
    },

    /**
     * Map Meta campaign status to CRM status
     */
    mapMetaStatusToCrmStatus(metaStatus: string): string {
        const statusMap: { [key: string]: string } = {
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
    async getCampaignInsights(organisationId: string, campaignId?: string): Promise<any> {
        try {
            const org = await prisma.organisation.findUnique({
                where: { id: organisationId },
                select: { integrations: true }
            });

            if (!org) {
                throw new Error('Organization not found');
            }

            const integrations = org.integrations as any;
            const metaConfig = integrations?.meta;

            if (!metaConfig?.accessToken || !metaConfig?.adAccountId) {
                throw new Error('Meta integration not configured');
            }

            let insights;
            if (campaignId) {
                // Get insights for specific campaign
                const campaign = await prisma.campaign.findFirst({
                    where: { id: campaignId, organisationId },
                    select: { customFields: true }
                });

                if (!campaign) {
                    throw new Error('Campaign not found');
                }

                const customFields = campaign.customFields as any;
                const metaCampaignId = customFields?.metaCampaignId;

                if (!metaCampaignId) {
                    throw new Error('Campaign not linked to Meta');
                }

                insights = await metaService.makeRequest(`${metaCampaignId}/insights`, metaConfig.accessToken, {
                    fields: 'impressions,clicks,spend,cpc,cpm,cpp,ctr,unique_clicks,reach,actions',
                    date_preset: 'last_30d'
                });
            } else {
                // Get account-level insights
                insights = await metaService.getInsights(metaConfig, 'account');
            }

            return insights;

        } catch (error) {
            console.error('[MetaIntegration] Error getting campaign insights:', error);
            throw error;
        }
    },

    /**
     * Verify Webhook (GET request)
     */
    async verifyWebhook(req: any, res: any): Promise<void> {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || 'my_secure_token';

        if (mode && token) {
            if (mode === 'subscribe' && token === VERIFY_TOKEN) {
                console.log('[MetaWebhook] Verified webhook');
                res.status(200).send(challenge);
            } else {
                console.log('[MetaWebhook] Webhook verification failed - invalid token');
                res.sendStatus(403);
            }
        } else {
            console.log('[MetaWebhook] Webhook verification failed - missing parameters');
            res.sendStatus(400);
        }
    }
};
