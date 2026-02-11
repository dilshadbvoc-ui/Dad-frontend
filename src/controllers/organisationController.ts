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
            data: {
                ...data,
                // Ensure currency is allowed if passed
                currency: data.currency
            }
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

        // CRITICAL FIX: Use SOFT DELETE instead of hard delete to prevent data loss
        // This marks the organisation as deleted but preserves all data
        await prisma.organisation.update({
            where: { id: orgId },
            data: {
                isDeleted: true,
                updatedAt: new Date()
            }
        });

        // Also soft delete all users in the organisation to prevent login
        await prisma.user.updateMany({
            where: { organisationId: orgId },
            data: { isActive: false }
        });

        // Audit Log
        logAudit({
            action: 'SOFT_DELETE_ORGANISATION',
            entity: 'Organisation',
            entityId: orgId,
            actorId: (req as any).user.id,
            organisationId: orgId,
            details: {
                name: org.name,
                note: 'Organisation soft deleted - data preserved for recovery'
            }
        });

        res.json({
            message: 'Organisation marked as deleted (data preserved for recovery)',
            canRestore: true,
            deletedAt: new Date()
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

// NEW: Restore a soft-deleted organisation
export const restoreOrganisation = async (req: Request, res: Response) => {
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

        if (!org.isDeleted) {
            return res.status(400).json({ message: 'Organisation is not deleted' });
        }

        // Restore the organisation
        await prisma.organisation.update({
            where: { id: orgId },
            data: {
                isDeleted: false,
                updatedAt: new Date()
            }
        });

        // Reactivate all users in the organisation
        await prisma.user.updateMany({
            where: { organisationId: orgId },
            data: { isActive: true }
        });

        // Audit Log
        logAudit({
            action: 'RESTORE_ORGANISATION',
            entity: 'Organisation',
            entityId: orgId,
            actorId: (req as any).user.id,
            organisationId: orgId,
            details: {
                name: org.name,
                note: 'Organisation restored from soft delete'
            }
        });

        res.json({
            message: 'Organisation restored successfully',
            restoredAt: new Date()
        });
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

/**
 * Permanently delete an organisation and all its data
 * SUPER ADMIN ONLY - This is irreversible!
 */
export const permanentlyDeleteOrganisation = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        // Only super admin can permanently delete
        if (user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only super admins can permanently delete organisations' });
        }

        const orgId = req.params.id;

        // Verify organisation exists
        const org = await prisma.organisation.findUnique({
            where: { id: orgId },
            include: {
                _count: {
                    select: {
                        users: true,
                        leads: true,
                        products: true,
                        tasks: true
                    }
                }
            }
        });

        if (!org) {
            return res.status(404).json({ message: 'Organisation not found' });
        }

        // Prevent super admin from deleting their own organisation
        const userOrgId = getOrgId(user);
        if (userOrgId === orgId) {
            return res.status(400).json({ message: 'You cannot delete your own organisation' });
        }

        // Require confirmation parameter
        const { confirm } = req.body;
        if (confirm !== 'PERMANENTLY_DELETE') {
            return res.status(400).json({
                message: 'Confirmation required',
                instruction: 'Send { "confirm": "PERMANENTLY_DELETE" } in request body to proceed',
                warning: 'This will permanently delete all data including users, leads, products, and tasks',
                dataToBeDeleted: {
                    organisation: org.name,
                    users: org._count.users,
                    leads: org._count.leads,
                    products: org._count.products,
                    tasks: org._count.tasks
                }
            });
        }

        console.log(`⚠️  PERMANENT DELETE: Organisation "${org.name}" (${orgId}) by ${user.email}`);

        // Delete all related data in correct order (respecting foreign key constraints)

        // 1. Delete product shares
        await prisma.productShare.deleteMany({ where: { organisationId: orgId } });

        // 2. Delete interactions
        await prisma.interaction.deleteMany({ where: { organisationId: orgId } });

        // 3. Delete tasks
        await prisma.task.deleteMany({ where: { organisationId: orgId } });

        // 4. Delete lead history
        const leadIds = await prisma.lead.findMany({
            where: { organisationId: orgId },
            select: { id: true }
        });
        await prisma.leadHistory.deleteMany({
            where: { leadId: { in: leadIds.map(l => l.id) } }
        });

        // 5. Delete leads
        await prisma.lead.deleteMany({ where: { organisationId: orgId } });

        // 6. Delete products
        await prisma.product.deleteMany({ where: { organisationId: orgId } });

        // 7. Delete campaigns
        await prisma.campaign.deleteMany({ where: { organisationId: orgId } });

        // 8. Delete goals
        await prisma.goal.deleteMany({ where: { organisationId: orgId } });

        // 9. Delete licenses
        await prisma.license.deleteMany({ where: { organisationId: orgId } });

        // 10. Delete API keys
        await prisma.apiKey.deleteMany({ where: { organisationId: orgId } });

        // 11. Get all user IDs from this organisation
        const userIds = await prisma.user.findMany({
            where: { organisationId: orgId },
            select: { id: true }
        });

        // 12. Delete notifications for these users (foreign key constraint)
        await prisma.notification.deleteMany({
            where: { recipientId: { in: userIds.map(u => u.id) } }
        });

        // 13. Delete search history for these users (no organisationId)
        await prisma.searchHistory.deleteMany({
            where: { userId: { in: userIds.map(u => u.id) } }
        });

        // 14. Delete all user-created records that have foreign key constraints to users
        // These must be deleted BEFORE deleting users to avoid foreign key violations

        // Delete calendar events created by users
        await prisma.calendarEvent.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete quotes created by users
        await prisma.quote.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete goals created by users
        await prisma.goal.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete cases created by users
        await prisma.case.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete import jobs created by users
        await prisma.importJob.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete API keys created by users
        await prisma.apiKey.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete assignment rules created by users
        await prisma.assignmentRule.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete campaigns created by users
        await prisma.campaign.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete custom fields created by users
        await prisma.customField.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete email lists created by users
        await prisma.emailList.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete interactions created by users
        await prisma.interaction.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete pipelines created by users
        await prisma.pipeline.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete web forms created by users
        await prisma.webForm.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete SMS campaigns created by users
        await prisma.sMSCampaign.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete WhatsApp campaigns created by users
        await prisma.whatsAppCampaign.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete commissions created by users
        await prisma.commission.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete landing pages created by users
        await prisma.landingPage.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete documents created by users
        await prisma.document.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete webhooks created by users
        await prisma.webhook.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete workflows created by users
        await prisma.workflow.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete workflow rules created by users
        await prisma.workflowRule.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete sales targets created by users
        await prisma.salesTarget.deleteMany({
            where: { assignedById: { in: userIds.map(u => u.id) } }
        });

        // Delete teams created by users
        await prisma.team.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete product shares created by users
        await prisma.productShare.deleteMany({
            where: { createdById: { in: userIds.map(u => u.id) } }
        });

        // Delete user lead quota trackers
        await prisma.userLeadQuotaTracker.deleteMany({
            where: { userId: { in: userIds.map(u => u.id) } }
        });

        // Delete lead history records where users are referenced
        await prisma.leadHistory.deleteMany({
            where: {
                OR: [
                    { oldOwnerId: { in: userIds.map(u => u.id) } },
                    { newOwnerId: { in: userIds.map(u => u.id) } },
                    { changedById: { in: userIds.map(u => u.id) } }
                ]
            }
        });

        // Update records that reference users but shouldn't be deleted
        // Set user references to null for records that should remain

        // Update leads that are assigned to these users
        await prisma.lead.updateMany({
            where: { assignedToId: { in: userIds.map(u => u.id) } },
            data: { assignedToId: null }
        });

        // Update leads that have previous owners
        await prisma.lead.updateMany({
            where: { previousOwnerId: { in: userIds.map(u => u.id) } },
            data: { previousOwnerId: null }
        });

        // Update contacts owned by these users
        await prisma.contact.updateMany({
            where: { ownerId: { in: userIds.map(u => u.id) } },
            data: { ownerId: null }
        });

        // Update accounts owned by these users
        await prisma.account.updateMany({
            where: { ownerId: { in: userIds.map(u => u.id) } },
            data: { ownerId: null }
        });

        // Update opportunities owned by these users
        await prisma.opportunity.updateMany({
            where: { ownerId: { in: userIds.map(u => u.id) } },
            data: { ownerId: null }
        });

        // Update tasks assigned to these users
        await prisma.task.updateMany({
            where: { assignedToId: { in: userIds.map(u => u.id) } },
            data: { assignedToId: null }
        });

        // Update tasks created by these users
        await prisma.task.updateMany({
            where: { createdById: { in: userIds.map(u => u.id) } },
            data: { createdById: null }
        });

        // Update quotes assigned to these users
        await prisma.quote.updateMany({
            where: { assignedToId: { in: userIds.map(u => u.id) } },
            data: { assignedToId: null }
        });

        // Update cases assigned to these users
        await prisma.case.updateMany({
            where: { assignedToId: { in: userIds.map(u => u.id) } },
            data: { assignedToId: null }
        });

        // Update sales targets assigned to these users
        await prisma.salesTarget.updateMany({
            where: { assignedToId: { in: userIds.map(u => u.id) } },
            data: { assignedToId: null }
        });

        // Update goals assigned to these users
        await prisma.goal.updateMany({
            where: { assignedToId: { in: userIds.map(u => u.id) } },
            data: { assignedToId: null }
        });

        // Update territories managed by these users
        await prisma.territory.updateMany({
            where: { managerId: { in: userIds.map(u => u.id) } },
            data: { managerId: null }
        });

        // Update assignment rules that reference these users
        await prisma.assignmentRule.updateMany({
            where: { lastAssignedUserId: { in: userIds.map(u => u.id) } },
            data: { lastAssignedUserId: null }
        });

        await prisma.assignmentRule.updateMany({
            where: { targetManagerId: { in: userIds.map(u => u.id) } },
            data: { targetManagerId: null }
        });

        // Update teams managed by these users
        await prisma.team.updateMany({
            where: { managerId: { in: userIds.map(u => u.id) } },
            data: { managerId: null }
        });

        // Update user hierarchy (reports to relationships)
        await prisma.user.updateMany({
            where: { reportsToId: { in: userIds.map(u => u.id) } },
            data: { reportsToId: null }
        });

        // Update licenses activated/cancelled by these users
        await prisma.license.updateMany({
            where: { activatedById: { in: userIds.map(u => u.id) } },
            data: { activatedById: null }
        });

        await prisma.license.updateMany({
            where: { cancelledById: { in: userIds.map(u => u.id) } },
            data: { cancelledById: null }
        });

        // Update WhatsApp messages assigned to these users
        await prisma.whatsAppMessage.updateMany({
            where: { agentId: { in: userIds.map(u => u.id) } },
            data: { agentId: null }
        });

        // Update commissions for these users
        await prisma.commission.updateMany({
            where: { userId: { in: userIds.map(u => u.id) } },
            data: { userId: null }
        });

        // Update check-ins by these users
        await prisma.checkIn.updateMany({
            where: { userId: { in: userIds.map(u => u.id) } },
            data: { userId: null }
        });

        // 15. Delete audit logs for this org (before deleting users/org)
        await prisma.auditLog.deleteMany({ where: { organisationId: orgId } });

        // 16. Delete users (after all foreign key constraints are handled)
        await prisma.user.deleteMany({ where: { organisationId: orgId } });

        // 15. Finally, delete the organisation
        await prisma.organisation.delete({ where: { id: orgId } });

        // Audit Log
        logAudit({
            action: 'PERMANENT_DELETE_ORGANISATION',
            entity: 'Organisation',
            entityId: orgId,
            actorId: user.id,
            organisationId: getOrgId(user) || 'system', // Use user's org or system
            details: {
                name: org.name,
                deletedUsers: org._count.users,
                deletedLeads: org._count.leads,
                deletedProducts: org._count.products,
                deletedTasks: org._count.tasks,
                warning: 'PERMANENT DELETION - DATA CANNOT BE RECOVERED'
            }
        });

        res.json({
            message: 'Organisation permanently deleted',
            deletedData: {
                organisation: org.name,
                users: org._count.users,
                leads: org._count.leads,
                products: org._count.products,
                tasks: org._count.tasks
            },
            warning: 'This action cannot be undone'
        });
    } catch (error) {
        console.error('Permanent delete error:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};
