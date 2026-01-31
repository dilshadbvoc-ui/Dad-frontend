import prisma from '../config/prisma';

interface AuditLogParams {
    action: string;
    entity: string;
    entityId?: string;
    actorId?: string;
    organisationId: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
}

export const logAudit = async (params: AuditLogParams) => {
    try {
        await prisma.auditLog.create({
            data: {
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                actorId: params.actorId,
                organisationId: params.organisationId,
                details: params.details || {},
                ipAddress: params.ipAddress,
                userAgent: params.userAgent
            }
        });
    } catch (error) {
        // Audit logging should not block main execution flow, so we just log the error
        console.error('Failed to create audit log:', error);
    }
};
