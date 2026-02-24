
import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;

        if (!user || !user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const userId = user.id;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const type = req.query.type as string; // 'info', 'warning', etc.
        const isRead = req.query.isRead; // 'true', 'false', or undefined

        const whereClause: any = { recipientId: userId };

        if (type && type !== 'all') {
            whereClause.type = type;
        }

        if (isRead === 'true') {
            whereClause.isRead = true;
        } else if (isRead === 'false') {
            whereClause.isRead = false;
        }

        const notifications = await prisma.notification.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: (page - 1) * limit
        });

        const total = await prisma.notification.count({ where: whereClause });
        const unreadCount = await prisma.notification.count({
            where: { recipientId: userId, isRead: false }
        });

        res.json({
            notifications,
            unreadCount,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (error) {
        console.error('getNotifications Error:', error);
        res.status(500).json({ message: (error as Error).message });
    }
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.notification.update({
            where: { id },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        await prisma.notification.updateMany({
            where: { recipientId: userId, isRead: false },
            data: { isRead: true }
        });
        res.json({ success: true });
    } catch {
        res.status(500).json({ message: 'Server Error' });
    }
};
