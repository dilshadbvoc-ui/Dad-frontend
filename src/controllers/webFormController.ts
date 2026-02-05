
import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getOrgId } from '../utils/hierarchyUtils';

export const getWebForms = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No org' });

        const webForms = await prisma.webForm.findMany({
            where: { organisationId: orgId, isDeleted: false },
            orderBy: { createdAt: 'desc' }
        });
        res.json(webForms);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createWebForm = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No org' });

        const webForm = await prisma.webForm.create({
            data: {
                ...req.body,
                organisationId: orgId,
                createdById: user.id
            }
        });
        res.status(201).json(webForm);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateWebForm = async (req: Request, res: Response) => {
    try {
        const webForm = await prisma.webForm.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(webForm);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteWebForm = async (req: Request, res: Response) => {
    try {
        await prisma.webForm.update({
            where: { id: req.params.id },
            data: { isDeleted: true }
        });
        res.json({ message: 'WebForm deleted' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

/**
 * Public endpoint for submitting a web form
 * POST /api/public/webforms/:id/submit
 */
export const submitWebForm = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const formData = req.body;

        const webForm = await prisma.webForm.findUnique({
            where: { id, isDeleted: false }
        });

        if (!webForm || !webForm.isActive) {
            return res.status(404).json({ message: 'Form not found or inactive' });
        }

        const orgId = webForm.organisationId;

        // 1. Create Lead
        const lead = await prisma.lead.create({
            data: {
                firstName: formData.firstName || 'Unknown',
                lastName: formData.lastName || '',
                email: formData.email,
                phone: formData.phone,
                company: formData.company,
                source: 'website',
                organisationId: orgId,
                customFields: {
                    webFormId: id,
                    ...formData.customFields
                }
            }
        });

        // 2. Trigger Distribution
        const { DistributionService } = await import('../services/DistributionService');
        await DistributionService.assignLead(lead, orgId);

        // 3. AI Scoring
        const { LeadScoringService } = await import('../services/LeadScoringService');
        LeadScoringService.scoreLead(lead.id).catch(console.error);

        res.status(201).json({
            message: 'Form submitted successfully',
            leadId: lead.id
        });

    } catch (error) {
        console.error('[WebFormSubmit] Error:', error);
        res.status(400).json({ message: (error as Error).message });
    }
};
