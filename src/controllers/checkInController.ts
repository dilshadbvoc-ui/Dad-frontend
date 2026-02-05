import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import prisma from '../config/prisma';

export const createCheckIn = async (req: AuthRequest, res: Response) => {
    try {
        const { type, notes, photoUrl, leadId, contactId, accountId, location } = req.body;


        // Handle both flat and nested location structures
        const rawLat = location?.latitude ?? req.body.latitude;
        const rawLng = location?.longitude ?? req.body.longitude;
        const rawAddr = location?.address ?? req.body.address;

        const latitude = rawLat !== undefined ? parseFloat(String(rawLat)) : null;
        const longitude = rawLng !== undefined ? parseFloat(String(rawLng)) : null;
        const address = rawAddr;

        const userId = req.user?.id;
        const organisationId = req.user?.organisationId;

        if (!userId || !organisationId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const checkIn = await prisma.checkIn.create({
            data: {
                type,
                latitude,
                longitude,
                address,
                notes,
                photoUrl,
                userId,
                organisationId,
                leadId,
                contactId,
                accountId
            },
            include: {
                user: { select: { firstName: true, lastName: true } }
            }
        });

        res.status(201).json(checkIn);
    } catch (error: any) {
        console.error('Error creating check-in:', error);
        res.status(500).json({ error: 'Failed to create check-in' });
    }
};

export const getCheckIns = async (req: AuthRequest, res: Response) => {
    try {
        const organisationId = req.user?.organisationId;
        const { date, userId } = req.query;

        if (!organisationId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const where: any = { organisationId };

        if (date) {
            const startDate = new Date(date as string);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);

            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }

        if (userId) {
            where.userId = userId as string;
        }

        const checkIns = await prisma.checkIn.findMany({
            where,
            include: {
                user: { select: { firstName: true, lastName: true } },
                lead: { select: { firstName: true, lastName: true, company: true } },
                contact: { select: { firstName: true, lastName: true } },
                account: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json(checkIns);
    } catch (error: any) {
        console.error('Error fetching check-ins:', error);
        res.status(500).json({ error: 'Failed to fetch check-ins' });
    }
};
