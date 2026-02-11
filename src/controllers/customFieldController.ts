import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { getOrgId } from '../utils/hierarchyUtils';
import { logAudit } from '../utils/auditLogger';

export const getCustomFields = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = getOrgId(user);
        const entityType = req.query.entity as string;

        if (!orgId) return res.status(400).json({ message: 'No organisation' });

        const where: any = {
            organisationId: orgId,
            isDeleted: false
        };

        if (entityType) {
            where.entityType = entityType;
        }

        const customFields = await prisma.customField.findMany({
            where,
            orderBy: { order: 'asc' }
        });

        res.json({ customFields });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createCustomField = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No organisation' });

        const customField = await prisma.customField.create({
            data: {
                name: req.body.name,
                label: req.body.label,
                entityType: req.body.entityType,
                fieldType: req.body.fieldType,
                options: req.body.options || [],
                isRequired: req.body.isRequired || false,
                defaultValue: req.body.defaultValue,
                placeholder: req.body.placeholder,
                order: req.body.order || 0,
                isActive: true,
                showInList: req.body.showInList || false,
                showInForm: req.body.showInForm !== false,
                organisation: { connect: { id: orgId } },
                createdBy: { connect: { id: user.id } }
            }
        });

        await logAudit({
            organisationId: orgId,
            actorId: user.id,
            action: 'CREATE_CUSTOM_FIELD',
            entity: 'CustomField',
            entityId: customField.id,
            details: { label: customField.label, entityType: customField.entityType }
        });

        res.status(201).json(customField);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const updateCustomField = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No organisation' });

        const customField = await prisma.customField.update({
            where: {
                id: req.params.id,
                organisationId: orgId
            },
            data: req.body
        });

        await logAudit({
            organisationId: orgId,
            actorId: user.id,
            action: 'UPDATE_CUSTOM_FIELD',
            entity: 'CustomField',
            entityId: customField.id,
            details: { label: customField.label, updatedFields: Object.keys(req.body) }
        });

        res.json(customField);
    } catch (error) {
        if ((error as any).code === 'P2025') return res.status(404).json({ message: 'Custom field not found' });
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteCustomField = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const orgId = getOrgId(user);
        if (!orgId) return res.status(400).json({ message: 'No organisation' });

        await prisma.customField.update({
            where: {
                id: req.params.id,
                organisationId: orgId
            },
            data: { isDeleted: true }
        });

        await logAudit({
            organisationId: orgId,
            actorId: user.id,
            action: 'DELETE_CUSTOM_FIELD',
            entity: 'CustomField',
            entityId: req.params.id
        });

        res.json({ message: 'Custom field deleted' });
    } catch (error) {
        if ((error as any).code === 'P2025') return res.status(404).json({ message: 'Custom field not found' });
        res.status(500).json({ message: (error as Error).message });
    }
};
