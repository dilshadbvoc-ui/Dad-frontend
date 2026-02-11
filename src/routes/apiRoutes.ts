
import express from 'express';
import { verifyApiKey } from '../middleware/apiKeyMiddleware';
import prisma from '../config/prisma';
import { LeadSource, LeadStatus } from '../generated/client';
import { DistributionService } from '../services/DistributionService';
import { WorkflowEngine } from '../services/WorkflowEngine';

const router = express.Router();

/**
 * @route POST /api/v1/leads
 * @desc Create a lead via public API
 */
router.post('/leads', verifyApiKey, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, company, message, source } = req.body;
        const user = (req as any).user;
        const orgId = user.organisationId;

        // Basic Validation
        if (!email && !phone) {
            return res.status(400).json({ message: 'Email or Phone is required' });
        }

        // Sanitize
        let cleanPhone = phone?.toString().replace(/\D/g, '');
        if (cleanPhone && cleanPhone.length > 10) cleanPhone = cleanPhone.slice(-10);

        // Check Duplicates (by email or phone)
        const existing = await prisma.lead.findFirst({
            where: {
                organisationId: orgId,
                OR: [
                    { email: email || 'invalid' },
                    { phone: cleanPhone || 'invalid' }
                ]
            }
        });

        if (existing) {
            // For API, we might usually perform an UPSERT or return 200 with existing ID
            // Let's return 409 for now to be strict
            return res.status(409).json({ message: 'Lead already exists', id: existing.id });
        }

        const lead = await prisma.lead.create({
            data: {
                firstName: firstName || 'Unknown',
                lastName: lastName || '',
                email,
                phone: cleanPhone,
                company,
                source: source || LeadSource.api,
                status: LeadStatus.new,
                organisationId: orgId,
                customFields: { message } // Store raw message
            }
        });

        // Async Distribution & Workflow
        DistributionService.assignLead(lead, orgId).catch(console.error);
        if (req.body.score !== false) {
            import('../services/LeadScoringService').then(({ LeadScoringService }) => {
                LeadScoringService.scoreLead(lead.id).catch(console.error);
            });
        }

        // Trigger Created Workflow
        WorkflowEngine.evaluate('Lead', 'created', lead, orgId).catch(console.error);

        res.status(201).json({ id: lead.id, message: 'Lead created successfully' });

    } catch (error) {
        console.error('Public API Create Lead Error:', error);
        res.status(500).json({ message: 'Server Error' });
    }
});

/**
 * @route GET /api/v1/leads
 * @desc List leads for the organisation (ReadOnly)
 */
router.get('/leads', verifyApiKey, async (req, res) => {
    try {
        const user = (req as any).user;
        const orgId = user.organisationId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;

        const leads = await prisma.lead.findMany({
            where: { organisationId: orgId },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                company: true,
                status: true,
                createdAt: true
            }
        });

        res.json({ data: leads, page, limit });
    } catch {
        res.status(500).json({ message: 'Server Error' });
    }
});

export default router;
