import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getAuditLogs = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const { entity, action, userId, startDate, endDate, page = 1, limit = 20 } = req.query;

        // Base where clause - users see ALL activities within their organisation (no hierarchy restrictions)
        const where: any = {};
        if (user.organisationId) {
            where.organisationId = user.organisationId;
        } else if (user.role !== 'super_admin') {
            return res.status(400).json({ message: 'Organisation not found' });
        }

        // Branch Isolation: Users can only see activities from actors in their branch (or system events)
        if (user.branchId) {
            where.OR = [
                { actor: { branchId: user.branchId } },
                { actorId: null } // System events
            ];
        } else if (req.query.branchId) {
            // Admin filtering by specific branch
            where.actor = { branchId: String(req.query.branchId) };
        }

        // Filters
        if (entity) where.entity = String(entity);
        if (action) where.action = String(action);
        if (userId) where.actorId = String(userId);
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(String(startDate));
            if (endDate) where.createdAt.lte = new Date(String(endDate));
        }

        const skip = (Number(page) - 1) * Number(limit);

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip,
            include: {
                actor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        const total = await prisma.auditLog.count({ where });

        res.json({
            logs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
