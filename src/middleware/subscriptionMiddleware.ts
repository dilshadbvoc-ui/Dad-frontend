import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware'; // Assuming AuthRequest is exported from authMiddleware
import prisma from '../config/prisma';

export const checkPlanLimits = (resource: 'leads' | 'contacts' | 'users' | 'storage') => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const orgId = req.user.organisationId || req.user.organisation;
            if (!orgId) {
                // If super admin or no org, maybe bypass or error?
                // For safety, error if not super admin
                if (req.user.isSuperAdmin) return next();
                return res.status(403).json({ message: 'No organisation context found for limit check' });
            }

            // Fetch Organisation using Prisma
            const org = await prisma.organisation.findUnique({
                where: { id: orgId.toString() }
            });

            if (!org || !org.subscription) {
                return res.status(403).json({ message: 'No active subscription found.' });
            }

            const subscription = org.subscription as any;

            // Check Subscription Status
            if (subscription.status !== 'active' && subscription.status !== 'trial') {
                return res.status(403).json({ message: 'Subscription is not active.' });
            }

            // Fetch Plan
            let plan;
            if (subscription.planId) {
                plan = await prisma.subscriptionPlan.findUnique({
                    where: { id: subscription.planId }
                });
            }

            // Fallback for trial or missing plan: Use "Starter" defaults
            if (!plan) {
                plan = {
                    maxLeads: 100,
                    maxContacts: 500,
                    maxUsers: 2, // Trial limit
                    maxStorage: 1000
                };
            }

            let currentCount = 0;
            let limit = 0;

            switch (resource) {
                case 'leads':
                    // Verify if Leads are stored in Postgres or Mongo?
                    // Previous logs showed Lead controller using Prisma (Postgres)
                    currentCount = await prisma.lead.count({ where: { organisationId: orgId.toString(), isDeleted: false } });
                    limit = plan.maxLeads || 100;
                    break;
                case 'contacts':
                    // Contact model in schema does NOT have isDeleted (checked schema.prisma)
                    currentCount = await prisma.contact.count({ where: { organisationId: orgId.toString() } });
                    limit = plan.maxContacts || 500;
                    break;
                case 'users':
                    // User check is usually done in inviteUser, but good to have middleware too
                    currentCount = await prisma.user.count({ where: { organisationId: orgId.toString(), isActive: true } });
                    limit = plan.maxUsers || 1;
                    break;
                // Add storage check if needed
            }

            if (currentCount >= limit) {
                return res.status(403).json({
                    message: `Plan limit reached for ${resource}. Current: ${currentCount}, Max: ${limit}. Please upgrade your plan.`
                });
            }

            next();
        } catch (error) {
            console.error('[SubscriptionMiddleware] Error:', error);
            res.status(500).json({ message: 'Error checking subscription limits' });
        }
    };
};
