import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getOrgId } from '../utils/hierarchyUtils';

interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        organisationId: string;
    };
}

export const getWhatsAppCampaigns = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No organisation found' });

        const campaigns = await prisma.whatsAppCampaign.findMany({
            where: { 
                organisationId: orgId,
                isDeleted: false 
            },
            orderBy: { createdAt: 'desc' },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });
        res.json(campaigns);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createWhatsAppCampaign = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No organisation found' });

        const { recipients, testNumber, ...campaignData } = req.body;

        // Validate that we have either recipients or testNumber
        if (!recipients && !testNumber) {
            return res.status(400).json({ 
                message: 'Either recipients array or testNumber is required' 
            });
        }

        // Initialize stats
        const initialStats = {
            sent: 0,
            delivered: 0,
            read: 0,
            failed: 0,
            replied: 0
        };

        const campaign = await prisma.whatsAppCampaign.create({
            data: {
                name: campaignData.name,
                message: campaignData.message,
                status: campaignData.status || 'draft',
                templateId: campaignData.templateId || null,
                scheduledAt: campaignData.scheduledAt ? new Date(campaignData.scheduledAt) : null,
                recipients: recipients || [],
                testNumber,
                organisationId: orgId,
                createdById: user.id,
                stats: initialStats
            }
        });

        res.status(201).json(campaign);
    } catch (error) {
        console.error('WhatsApp Campaign Error:', error);
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateWhatsAppCampaign = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const campaignId = req.params.id;
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No organisation found' });
        
        const existingCampaign = await prisma.whatsAppCampaign.findFirst({
            where: { 
                id: campaignId, 
                organisationId: orgId,
                isDeleted: false 
            }
        });

        if (!existingCampaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        const campaign = await prisma.whatsAppCampaign.update({
            where: { id: campaignId },
            data: {
                name: req.body.name || existingCampaign.name,
                message: req.body.message || existingCampaign.message,
                status: req.body.status || existingCampaign.status,
                templateId: req.body.templateId !== undefined ? req.body.templateId : existingCampaign.templateId,
                scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : existingCampaign.scheduledAt,
                recipients: req.body.recipients || existingCampaign.recipients,
                testNumber: req.body.testNumber !== undefined ? req.body.testNumber : existingCampaign.testNumber
            }
        });

        res.json(campaign);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteWhatsAppCampaign = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const campaignId = req.params.id;
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No organisation found' });

        const existingCampaign = await prisma.whatsAppCampaign.findFirst({
            where: { 
                id: campaignId, 
                organisationId: orgId,
                isDeleted: false 
            }
        });

        if (!existingCampaign) {
            return res.status(404).json({ message: 'Campaign not found' });
        }

        await prisma.whatsAppCampaign.update({
            where: { id: campaignId },
            data: { isDeleted: true }
        });
        
        res.json({ message: 'WhatsApp Campaign deleted' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};