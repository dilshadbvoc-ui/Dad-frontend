
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import crypto from 'crypto';

export const verifyApiKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const apiKey = req.header('X-API-KEY');

        if (!apiKey) {
            return res.status(401).json({ message: 'Missing X-API-KEY header' });
        }

        const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

        const keyRecord = await prisma.apiKey.findFirst({
            where: {
                keyHash: keyHash, // Use hashed key
                status: 'active', // Check status enum string
                isDeleted: false
            },
            include: { organisation: true }
        });

        if (!keyRecord) {
            return res.status(401).json({ message: 'Invalid API Key' });
        }

        // Update Usage stats
        // Storing last used in JSON since no column exists
        const currentUsage = (keyRecord.usage as any) || {};
        await prisma.apiKey.update({
            where: { id: keyRecord.id },
            data: {
                usage: { ...currentUsage, lastUsedAt: new Date().toISOString() }
            }
        });

        // Attach user-like object to request for compatibility
        (req as any).user = {
            id: 'api-user',
            organisationId: keyRecord.organisationId,
            role: 'api_client'
        };

        next();
    } catch {
        res.status(500).json({ message: 'API Key Error' });
    }
};
