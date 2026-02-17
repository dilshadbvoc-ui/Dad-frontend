import { Request, Response } from 'express';
const ROLE_DEFINITIONS = [
    {
        id: 'super_admin',
        name: 'Super Admin',
        description: 'Full system access across all organisations',
        permissions: ['*'],
        isSystemRole: true
    },
    {
        id: 'admin',
        name: 'Admin',
        description: 'Full access within organisation',
        permissions: ['users:*', 'leads:*', 'contacts:*', 'accounts:*', 'opportunities:*', 'reports:*', 'settings:*'],
        isSystemRole: true
    },
    {
        id: 'manager',
        name: 'Manager',
        description: 'Manage team and view reports',
        permissions: ['users:read', 'leads:*', 'contacts:*', 'accounts:*', 'opportunities:*', 'reports:read', 'team:*'],
        isSystemRole: true
    },
    {
        id: 'sales_rep',
        name: 'Sales Rep',
        description: 'Manage assigned leads and opportunities',
        permissions: ['leads:*', 'contacts:*', 'accounts:read', 'opportunities:*'],
        isSystemRole: true
    },
    {
        id: 'marketing',
        name: 'Marketing',
        description: 'Manage campaigns and email lists',
        permissions: ['leads:read', 'contacts:read', 'campaigns:*', 'email-lists:*', 'reports:read'],
        isSystemRole: true
    }
];

import { PrismaClient, UserRole } from '../generated/client';
const prisma = new PrismaClient();

export const getRoles = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const organisationId = currentUser.organisationId;

        // Fetch user count per role
        const userCounts = await prisma.user.groupBy({
            by: ['role'],
            where: {
                organisationId,
                isActive: true
            },
            _count: {
                role: true
            }
        });

        // Convert user counts to a map for easy lookup
        const userCountMap = userCounts.reduce((acc, curr) => {
            acc[curr.role] = curr._count.role;
            return acc;
        }, {} as Record<string, number>);

        // Fetch role overrides
        const rolePermissions = await prisma.rolePermission.findMany({
            where: { organisationId }
        });

        // Create a map of overrides
        const overridesMap = rolePermissions.reduce((acc, curr) => {
            acc[curr.role] = curr;
            return acc;
        }, {} as Record<string, any>);

        // Filter out super_admin role for non-super_admin users
        let roles = ROLE_DEFINITIONS.map(role => {
            const override = overridesMap[role.id];
            return {
                ...role,
                description: override?.description || role.description,
                permissions: override?.permissions || role.permissions,
                userCount: userCountMap[role.id] || 0
            };
        });

        if (currentUser.role !== 'super_admin') {
            roles = roles.filter(r => r.id !== 'super_admin');
        }

        res.json({ roles });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createRole = async (req: Request, res: Response) => {
    // Custom roles not supported in enum-based system
    res.status(400).json({
        message: 'Custom roles are not supported. Use the predefined system roles.'
    });
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { description, permissions } = req.body;
        const currentUser = (req as any).user;
        const organisationId = currentUser.organisationId;

        // Verify it's a valid system role
        const systemRole = ROLE_DEFINITIONS.find(r => r.id === id);
        if (!systemRole) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Upsert the override
        const updatedRole = await prisma.rolePermission.upsert({
            where: {
                role_organisationId: {
                    role: id as UserRole,
                    organisationId
                }
            },
            update: {
                description,
                permissions: permissions || systemRole.permissions
            },
            create: {
                role: id as UserRole,
                organisationId,
                description,
                permissions: permissions || systemRole.permissions
            }
        });

        res.json(updatedRole);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    // System roles cannot be deleted
    res.status(400).json({
        message: 'System roles cannot be deleted.'
    });
};
