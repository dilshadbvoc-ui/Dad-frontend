import { Request, Response } from 'express';
import { PrismaClient } from '../generated/client';
const prisma = new PrismaClient();

const SYSTEM_ROLES = [
    {
        roleKey: 'super_admin',
        name: 'Super Admin',
        description: 'Full system access across all organisations',
        permissions: ['*'],
        isSystemRole: true
    },
    {
        roleKey: 'admin',
        name: 'Admin',
        description: 'Full access within organisation',
        permissions: ['users:*', 'leads:*', 'contacts:*', 'accounts:*', 'opportunities:*', 'reports:*', 'settings:*'],
        isSystemRole: true
    },
    {
        roleKey: 'manager',
        name: 'Manager',
        description: 'Manage team and view reports',
        permissions: ['users:read', 'leads:*', 'contacts:*', 'accounts:*', 'opportunities:*', 'reports:read', 'team:*'],
        isSystemRole: true
    },
    {
        roleKey: 'sales_rep',
        name: 'Sales Rep',
        description: 'Manage assigned leads and opportunities',
        permissions: ['leads:*', 'contacts:*', 'accounts:read', 'opportunities:*'],
        isSystemRole: true
    },
    {
        roleKey: 'marketing',
        name: 'Marketing',
        description: 'Manage campaigns and email lists',
        permissions: ['leads:read', 'contacts:read', 'campaigns:*', 'email-lists:*', 'reports:read'],
        isSystemRole: true
    }
];

export const getRoles = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;
        const organisationId = currentUser.organisationId;

        // Fetch custom roles for the organisation
        const customRoles = await prisma.role.findMany({
            where: {
                organisationId,
                isSystemRole: false
            }
        });

        // Fetch overrides for system roles
        const systemRoleOverrides = await prisma.role.findMany({
            where: {
                organisationId,
                isSystemRole: true
            }
        });

        const overridesMap = systemRoleOverrides.reduce((acc: any, curr: any) => {
            acc[curr.roleKey] = curr;
            return acc;
        }, {} as Record<string, any>);

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

        const userCountMap = userCounts.reduce((acc: any, curr: any) => {
            acc[curr.role] = curr._count.role;
            return acc;
        }, {} as Record<string, number>);

        // Combine system roles (with overrides) and custom roles
        let roles = SYSTEM_ROLES.map(sr => {
            const override = overridesMap[sr.roleKey];
            return {
                id: override?.id || sr.roleKey, // Use ID if in DB, else roleKey
                roleKey: sr.roleKey,
                name: sr.name,
                description: override?.description || sr.description,
                permissions: override?.permissions || sr.permissions,
                isSystemRole: true,
                userCount: userCountMap[sr.roleKey] || 0
            };
        });

        const customRolesWithCount = customRoles.map((cr: any) => ({
            ...cr,
            userCount: userCountMap[cr.roleKey] || 0
        }));

        roles = [...roles, ...customRolesWithCount];

        // Filter out super_admin for non-super_admins
        if (currentUser.role !== 'super_admin') {
            roles = roles.filter(r => r.roleKey !== 'super_admin');
        }

        res.json({ roles });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const createRole = async (req: Request, res: Response) => {
    try {
        const { name, description, permissions } = req.body;
        const currentUser = (req as any).user;
        const organisationId = currentUser.organisationId;

        if (!name) {
            return res.status(400).json({ message: 'Role name is required' });
        }

        const role = await prisma.role.create({
            data: {
                roleKey: `custom_${Date.now()}`,
                name,
                description,
                permissions: permissions || [],
                isSystemRole: false,
                organisationId
            }
        });

        res.status(201).json(role);
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const id = req.params.id; // This could be roleKey OR UUID
        const { name, description, permissions } = req.body;
        const currentUser = (req as any).user;
        const organisationId = currentUser.organisationId;

        // Find existing role in DB or check if it's a known system role
        let dbRole = await prisma.role.findFirst({
            where: {
                OR: [
                    { id: id },
                    { roleKey: id, organisationId }
                ]
            }
        });

        if (dbRole) {
            // Update existing record
            const updated = await prisma.role.update({
                where: { id: dbRole.id },
                data: {
                    name,
                    description,
                    permissions: permissions
                }
            });
            return res.json(updated);
        } else {
            // If it's a system role without a DB record yet, creating override
            const systemRole = SYSTEM_ROLES.find(sr => sr.roleKey === id);
            if (!systemRole) {
                return res.status(404).json({ message: 'Role not found' });
            }

            const override = await prisma.role.create({
                data: {
                    roleKey: systemRole.roleKey,
                    name: name || systemRole.name,
                    description: description || systemRole.description,
                    permissions: permissions || systemRole.permissions,
                    isSystemRole: true,
                    organisationId
                }
            });
            return res.json(override);
        }
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const currentUser = (req as any).user;
        const organisationId = currentUser.organisationId;

        const role = await prisma.role.findFirst({
            where: { id, organisationId }
        });

        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        if (role.isSystemRole) {
            return res.status(400).json({ message: 'System roles cannot be deleted' });
        }

        // Check if users are assigned to this role
        const userCount = await prisma.user.count({
            where: { role: role.roleKey, organisationId }
        });

        if (userCount > 0) {
            return res.status(400).json({ message: 'Cannot delete role that is assigned to users' });
        }

        await prisma.role.delete({
            where: { id }
        });

        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: (error as Error).message });
    }
};
