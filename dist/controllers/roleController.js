"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertGlobalRole = exports.getGlobalRoles = exports.deleteRole = exports.updateRole = exports.createRole = exports.getRoles = exports.initializeGlobalRoles = void 0;
const client_1 = require("../generated/client");
const prisma = new client_1.PrismaClient();
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
/**
 * Seed initial system roles if they don't exist in the database (global templates)
 */
const initializeGlobalRoles = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        for (const sr of SYSTEM_ROLES) {
            const existing = yield prisma.role.findFirst({
                where: { roleKey: sr.roleKey, organisationId: null }
            });
            if (!existing) {
                yield prisma.role.create({
                    data: Object.assign(Object.assign({}, sr), { organisationId: null })
                });
                console.log(`[RoleController] Seeded global role: ${sr.roleKey}`);
            }
        }
    }
    catch (error) {
        console.error('[RoleController] Failed to initialize global roles:', error);
    }
});
exports.initializeGlobalRoles = initializeGlobalRoles;
const getRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = req.user;
        const organisationId = currentUser.organisationId;
        // Fetch custom roles for the organisation
        const customRoles = yield prisma.role.findMany({
            where: {
                organisationId,
                isSystemRole: false
            }
        });
        // Fetch overrides for system roles
        const systemRoleOverrides = yield prisma.role.findMany({
            where: {
                organisationId,
                isSystemRole: true
            }
        });
        const overridesMap = systemRoleOverrides.reduce((acc, curr) => {
            acc[curr.roleKey] = curr;
            return acc;
        }, {});
        // Fetch user count per role
        const userCounts = yield prisma.user.groupBy({
            by: ['role'],
            where: {
                organisationId,
                isActive: true
            },
            _count: {
                role: true
            }
        });
        const userCountMap = userCounts.reduce((acc, curr) => {
            acc[curr.role] = curr._count.role;
            return acc;
        }, {});
        // Fetch Global System Roles (Templates)
        const globalRoles = yield prisma.role.findMany({
            where: {
                organisationId: null,
                isSystemRole: true
            }
        });
        // Combine global roles (with overrides) and custom roles
        let roles = globalRoles.map(gr => {
            const override = overridesMap[gr.roleKey];
            return {
                id: (override === null || override === void 0 ? void 0 : override.id) || gr.id,
                roleKey: gr.roleKey,
                name: gr.name,
                description: (override === null || override === void 0 ? void 0 : override.description) || gr.description,
                permissions: (override === null || override === void 0 ? void 0 : override.permissions) || gr.permissions,
                isSystemRole: true,
                userCount: userCountMap[gr.roleKey] || 0
            };
        });
        const customRolesWithCount = customRoles.map((cr) => (Object.assign(Object.assign({}, cr), { userCount: userCountMap[cr.roleKey] || 0 })));
        roles = [...roles, ...customRolesWithCount];
        // Filter out super_admin for non-super_admins
        if (currentUser.role !== 'super_admin') {
            roles = roles.filter(r => r.roleKey !== 'super_admin');
        }
        res.json({ roles });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getRoles = getRoles;
const createRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, permissions } = req.body;
        const currentUser = req.user;
        const organisationId = currentUser.organisationId;
        if (!name) {
            return res.status(400).json({ message: 'Role name is required' });
        }
        const role = yield prisma.role.create({
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
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createRole = createRole;
const updateRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id; // This could be roleKey OR UUID
        const { name, description, permissions } = req.body;
        const currentUser = req.user;
        const organisationId = currentUser.organisationId;
        // Find existing role in DB or check if it's a known system role
        let dbRole = yield prisma.role.findFirst({
            where: {
                OR: [
                    { id: id },
                    { roleKey: id, organisationId }
                ]
            }
        });
        if (dbRole) {
            // Update existing record
            const updated = yield prisma.role.update({
                where: { id: dbRole.id },
                data: {
                    name,
                    description,
                    permissions: permissions
                }
            });
            return res.json(updated);
        }
        else {
            // If it's a system role without a DB record yet, creating override
            const globalRole = yield prisma.role.findFirst({
                where: { roleKey: id, organisationId: null }
            });
            if (!globalRole) {
                return res.status(404).json({ message: 'Role not found' });
            }
            const override = yield prisma.role.create({
                data: {
                    roleKey: globalRole.roleKey,
                    name: name || globalRole.name,
                    description: description || globalRole.description,
                    permissions: permissions || globalRole.permissions,
                    isSystemRole: true,
                    organisationId
                }
            });
            return res.json(override);
        }
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateRole = updateRole;
const deleteRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const currentUser = req.user;
        const organisationId = currentUser.organisationId;
        const role = yield prisma.role.findFirst({
            where: { id, organisationId }
        });
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        if (role.isSystemRole) {
            return res.status(400).json({ message: 'System roles cannot be deleted' });
        }
        // Check if users are assigned to this role
        const userCount = yield prisma.user.count({
            where: { role: role.roleKey, organisationId }
        });
        if (userCount > 0) {
            return res.status(400).json({ message: 'Cannot delete role that is assigned to users' });
        }
        yield prisma.role.delete({
            where: { id }
        });
        res.json({ message: 'Role deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteRole = deleteRole;
// --- Super Admin Endpoints ---
/**
 * Get all global roles (Templates)
 */
const getGlobalRoles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const roles = yield prisma.role.findMany({
            where: { organisationId: null }
        });
        res.json({ roles });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getGlobalRoles = getGlobalRoles;
/**
 * Create or Update a Global Role
 */
const upsertGlobalRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { roleKey, name, description, permissions, isSystemRole } = req.body;
        const role = yield prisma.role.upsert({
            where: {
                roleKey_organisationId: {
                    roleKey,
                    organisationId: null // Hack for @unique constraint with null
                }
            },
            update: {
                name,
                description,
                permissions,
                isSystemRole: isSystemRole !== null && isSystemRole !== void 0 ? isSystemRole : true
            },
            create: {
                roleKey,
                name,
                description,
                permissions,
                isSystemRole: isSystemRole !== null && isSystemRole !== void 0 ? isSystemRole : true,
                organisationId: null
            }
        });
        res.json(role);
    }
    catch (error) {
        // Prisma null unique constraint might be tricky, let's fallback to manual check if needed
        // But @unique([roleKey, organisationId]) where organisationId is null in Postgres works fine
        res.status(500).json({ message: error.message });
    }
});
exports.upsertGlobalRole = upsertGlobalRole;
