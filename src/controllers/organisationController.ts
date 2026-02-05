import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getOrgId } from '../utils/hierarchyUtils';
import bcrypt from 'bcryptjs';
import { logAudit } from '../utils/auditLogger';

export const createOrganisation = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Not authorized to create organisations' });
        }

        const { name, email, password, firstName, lastName } = req.body;

        // 1. Create Organisation
        const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
        const org = await prisma.organisation.create({
            data: {
                name,
                slug,
                contactEmail: email,
                status: 'active'
            }
        });

        // 2. Create Admin User for this Organisation
        const tempPassword = password || Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const user = await prisma.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: hashedPassword,
                role: 'admin',
                organisationId: org.id,
                isActive: true
            }
        });

        // Update org with createdBy
        await prisma.organisation.update({
            where: { id: org.id },
            data: { createdBy: user.id }
        });

        // Audit Log
        logAudit({
            action: 'CREATE_ORGANISATION',
            entity: 'Organisation',
            entityId: org.id,
            actorId: (req as any).user.id,
            organisationId: org.id,
            details: { name: org.name, slug: org.slug }
        });

        res.status(201).json({ organisation: org, adminUser: { ...user, password: undefined }, tempPassword });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getAllOrganisations = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const organisations = await prisma.organisation.findMany({
            orderBy: { createdAt: 'desc' }
        });

        // Get user counts for each organisation
        const orgIds = organisations.map(o => o.id);
        const userCounts = await prisma.user.groupBy({
            by: ['organisationId'],
            where: { organisationId: { in: orgIds }, isActive: true },
            _count: { id: true }
        });

        const countMap = new Map(userCounts.map(u => [u.organisationId, u._count.id]));

        const result = organisations.map(org => ({
            ...org,
            userCount: countMap.get(org.id) || 0
        }));

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const getOrganisation = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        let orgId = getOrgId(user);

        // If super admin and requesting specific org via param
        if (user.role === 'super_admin' && req.params.id) {
            orgId = req.params.id;
        }

        if (!orgId) {
            // Super admin without own org and no id param
            if (user.role === 'super_admin') {
                return res.json({ message: 'Superadmin account', isSuperAdmin: true });
            }
            return res.status(404).json({ message: 'Organisation not found' });
        }

        const org = await prisma.organisation.findUnique({
            where: { id: orgId }
        });
        if (!org) return res.status(404).json({ message: 'Organisation not found' });

        // Get active user count
        const userCount = await prisma.user.count({
            where: {
                organisationId: orgId,
                isActive: true
            }
        });

        // If super admin requesting specific org, include full details
        if (user.role === 'super_admin' && req.params.id) {
            const [users, leadCount, contactCount, accountCount, opportunityCount, wonOpportunities] = await Promise.all([
                prisma.user.findMany({
                    where: { organisationId: orgId, isActive: true },
                    select: { id: true, firstName: true, lastName: true, email: true, role: true, position: true, createdAt: true, userId: true },
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.lead.count({ where: { organisationId: orgId } }),
                prisma.contact.count({ where: { organisationId: orgId } }),
                prisma.account.count({ where: { organisationId: orgId } }),
                prisma.opportunity.count({ where: { organisationId: orgId } }),
                prisma.opportunity.aggregate({
                    where: { organisationId: orgId, stage: 'closed_won' },
                    _sum: { amount: true }
                })
            ]);

            return res.json({
                organisation: org,
                users,
                stats: {
                    userCount: users.length,
                    leadCount,
                    contactCount,
                    accountCount,
                    opportunityCount,
                    totalRevenue: wonOpportunities._sum.amount || 0
                }
            });
        }

        // Return org with userCount for normal users
        const isStaff = user.role === 'admin' || user.role === 'super_admin';
        const sanitizedOrg = { ...org };

        // Security: Remove sensitive integration details for non-admins
        if (!isStaff) {
            if (sanitizedOrg.integrations) {
                const integrations = { ...(sanitizedOrg.integrations as any) };
                if (integrations.meta) integrations.meta.accessToken = '[HIDDEN]';
                if (integrations.whatsapp) integrations.whatsapp.token = '[HIDDEN]';
                sanitizedOrg.integrations = integrations;
            }
        }

        res.json({ ...sanitizedOrg, userCount });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const updateOrganisation = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        let orgId = getOrgId(user);

        if (user.role === 'super_admin' && req.params.id) {
            orgId = req.params.id;
        }

        if (!orgId) return res.status(404).json({ message: 'Organisation not found' });

        const data = { ...req.body };

        // Handle Meta Token Exchange
        if (data.integrations?.meta?.accessToken && data.integrations?.meta?.connected) {
            try {
                const { metaService } = require('../services/MetaService');
                const longLivedToken = await metaService.exchangeForLongLivedToken(
                    data.integrations.meta.accessToken,
                    data.integrations.meta
                );
                data.integrations.meta.accessToken = longLivedToken;
            } catch (error) {
                console.error('Error exchanging Meta token:', error);
                // Continue with short-lived token if exchange fails
            }
        }

        // Handle Plan Assignment checks
        if (data.planId) {
            const plan = await prisma.subscriptionPlan.findUnique({ where: { id: data.planId } });
            if (!plan) throw new Error('Invalid Plan ID');

            // 1. Update Org Limits based on Plan
            data.userLimit = plan.maxUsers;
            data.status = 'active'; // Activate org if plan assignment happens

            // 2. Legacy Subscription JSON sync
            const existingSubscription = (await prisma.organisation.findUnique({ where: { id: orgId } }))?.subscription as any || {};
            data.subscription = {
                ...existingSubscription,
                status: 'active',
                plan: plan.name,
                planId: plan.id,
                startDate: new Date(),
                endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000)
            };

            // 3. Deactivate old active licenses
            await prisma.license.updateMany({
                where: { organisationId: orgId, status: 'active' },
                data: { status: 'cancelled', cancelledAt: new Date() }
            });

            // 4. Create New License
            await prisma.license.create({
                data: {
                    organisationId: orgId,
                    planId: plan.id,
                    status: 'active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
                    maxUsers: plan.maxUsers,
                    autoRenew: true
                }
            });

            // Clean up planId from data intended for Organisation model update (if it's not a column)
            delete data.planId;
        }

        const org = await prisma.organisation.update({
            where: { id: orgId },
            data: data
        });

        // Audit Log
        logAudit({
            action: 'UPDATE_ORGANISATION',
            entity: 'Organisation',
            entityId: org.id,
            actorId: user.id,
            organisationId: org.id,
            details: { updatedFields: Object.keys(data) }
        });

        res.json(org);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteOrganisation = async (req: Request, res: Response) => {
    try {
        if ((req as any).user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const orgId = req.params.id;
        const org = await prisma.organisation.findUnique({
            where: { id: orgId }
        });

        if (!org) {
            return res.status(404).json({ message: 'Organisation not found' });
        }

        // Prevent Super Admin from deleting their own organisation
        const userOrgId = getOrgId((req as any).user);
        if (userOrgId === orgId) {
            return res.status(400).json({ message: 'You cannot delete your own organisation' });
        }

        // Delete the organisation
        // User and other related data will be deleted via onDelete: Cascade relations
        await prisma.organisation.delete({ where: { id: orgId } });

        // Audit Log
        logAudit({
            action: 'DELETE_ORGANISATION',
            entity: 'Organisation',
            entityId: orgId,
            actorId: (req as any).user.id,
            organisationId: orgId, // Technically gone, but for log context
            details: { name: org.name }
        });

        res.json({ message: 'Organisation and associated data deleted' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const sendTestReport = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(404).json({ message: 'Organisation not found' });

        const org = await prisma.organisation.findFirst({
            where: { id: orgId },
            include: {
                users: {
                    where: { id: user.id }
                }
            }
        });

        if (!org) return res.status(404).json({ message: 'Organisation not found' });

        const { ReportingService } = await import('../services/ReportingService');
        const { WhatsAppService } = await import('../services/WhatsAppService');

        const stats = await ReportingService.getDailyStats(orgId);
        const report = ReportingService.formatWhatsAppReport(stats, org.name);

        const targetPhone = org.users[0]?.phone || org.contactPhone;

        if (!targetPhone) {
            return res.status(400).json({ message: 'No phone number configured for report' });
        }

        const waClient = await WhatsAppService.getClientForOrg(orgId);
        if (!waClient) {
            return res.status(400).json({ message: 'WhatsApp not connected for this organisation' });
        }

        await waClient.sendTextMessage(targetPhone, report);

        res.json({ message: `Test report sent to ${targetPhone}`, stats });
    } catch (error) {
        console.error('sendTestReport Error:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};
