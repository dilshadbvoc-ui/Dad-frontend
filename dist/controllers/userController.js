"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivateUser = exports.inviteUser = exports.createUser = exports.updateUser = exports.getUserById = exports.getUsers = exports.getUserStats = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const logger_1 = require("../utils/logger");
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const client_1 = require("../generated/client");
const auditLogger_1 = require("../utils/auditLogger");
// GET /api/users/:id/stats - Get user performance stats
const getUserStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.id;
        const currentUser = req.user;
        // Security: Verify existence and org match
        const targetUser = yield prisma_1.default.user.findUnique({ where: { id: userId } });
        if (!targetUser)
            return res.status(404).json({ message: 'User not found' });
        if (currentUser.role !== 'super_admin') {
            const currentOrgId = (0, hierarchyUtils_1.getOrgId)(currentUser);
            if (targetUser.organisationId !== currentOrgId) {
                return res.status(403).json({ message: 'Not authorized to view stats for this user' });
            }
            // Further role checks (if not admin/super_access, must be self or manager)
            if (currentUser.role !== 'admin' && currentUser.id !== userId) {
                if (targetUser.reportsToId !== currentUser.id) {
                    return res.status(403).json({ message: 'Not authorized to view stats' });
                }
            }
        }
        // 1. Total Leads Owned
        const totalLeads = yield prisma_1.default.lead.count({
            where: { assignedToId: userId, isDeleted: false }
        });
        // 2. Leads Converted (Won)
        const convertedLeads = yield prisma_1.default.lead.count({
            where: { assignedToId: userId, status: 'converted', isDeleted: false }
        });
        // 3. Leads Lost
        const lostLeads = yield prisma_1.default.lead.count({
            where: { assignedToId: userId, status: 'lost', isDeleted: false }
        });
        // 4. Sales Value (from Opportunities won or Orders?) 
        // For now, let's assume Opportunity 'closed_won' linked to User
        const totalSalesValue = yield prisma_1.default.opportunity.aggregate({
            where: { ownerId: userId, stage: 'closed_won' },
            _sum: { amount: true }
        });
        // 5. Recent Activity (History of actions) - optional, maybe fetch via activity log later
        res.json({
            stats: {
                totalLeads,
                convertedLeads,
                lostLeads,
                conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : 0,
                totalSalesValue: totalSalesValue._sum.amount || 0
            }
        });
    }
    catch (error) {
        logger_1.logger.error('getUserStats Error', error, 'UserController');
        res.status(500).json({ message: error.message });
    }
});
exports.getUserStats = getUserStats;
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        logger_1.logger.info('getUsers called', 'UserController', undefined, (_a = req.user) === null || _a === void 0 ? void 0 : _a.organisationId);
        const currentUser = req.user;
        const where = { isActive: true }; // Default to active? Original was isDeleted: {$ne: true}, but schema uses isActive.
        // Wait, Mongoose schema had isDeleted check?
        // Original: const query: any = { isDeleted: { $ne: true } };
        // Prisma schema: isPlaceholder (default false). 
        // Lead has isDeleted, User has isActive.
        // Let's assume we want all existing users? 
        // Or if we want to filter logically deleted users? 
        // User model in Prisma doesn't have isDeleted, only isActive.
        // Let's stick to showing all users for now or check if soft delete is intended.
        // Original Mongoose find({ isDeleted: { $ne: true } }) implies a soft delete field exists.
        // In my Prisma schema for User I missed isDeleted. I have isActive.
        // I'll use isActive for now as a proxy or just show all for this phase.
        // 1. Organisation Scoping
        if (currentUser.role === 'super_admin') {
            if (req.query.organisationId) {
                where.organisationId = req.query.organisationId;
            }
        }
        else {
            const orgId = (0, hierarchyUtils_1.getOrgId)(currentUser);
            if (!orgId) {
                return res.status(403).json({ message: 'User has no organisation' });
            }
            where.organisationId = orgId;
        }
        let users = yield prisma_1.default.user.findMany({
            where,
            include: {
                organisation: { select: { name: true } }, // Equivalent to populate role? No role is enum.
                reportsTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        position: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        // logger.debug(`Query where: ${JSON.stringify(where)}`, 'UserController');
        logger_1.logger.info(`Users found: ${users.length}`, 'UserController');
        // Transform results to match frontend expectations
        const transformedUsers = users.map(u => (Object.assign(Object.assign({}, u), { _id: u.id, id: u.id, role: { id: u.role, name: u.role }, reportsTo: u.reportsTo ? Object.assign(Object.assign({}, u.reportsTo), { id: u.reportsTo.id, _id: u.reportsTo.id }) : null })));
        res.json({ users: transformedUsers });
    }
    catch (error) {
        logger_1.logger.error('getUsers Error', error, 'UserController');
        res.status(500).json({ message: error.message });
    }
});
exports.getUsers = getUsers;
const getUserById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = req.user;
        const user = yield prisma_1.default.user.findUnique({
            where: { id: req.params.id },
            include: { organisation: true }
        });
        if (!user)
            return res.status(404).json({ message: 'User not found' });
        // Security check
        if (currentUser.role !== 'super_admin') {
            const currentOrgId = (0, hierarchyUtils_1.getOrgId)(currentUser);
            const targetOrgId = (0, hierarchyUtils_1.getOrgId)(user);
            if (currentOrgId !== targetOrgId) {
                return res.status(403).json({ message: 'Not authorized to view this user' });
            }
        }
        // Exclude password
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json(userWithoutPassword);
    }
    catch (error) {
        logger_1.logger.error('getUserById Error', error, 'UserController');
        res.status(500).json({ message: error.message });
    }
});
exports.getUserById = getUserById;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = req.user;
        const _a = req.body, { password } = _a, updateData = __rest(_a, ["password"]);
        const userId = req.params.id;
        // Security Check
        if (currentUser.role !== 'super_admin') {
            const tempUser = yield prisma_1.default.user.findUnique({ where: { id: userId }, include: { organisation: true } });
            if (!tempUser)
                return res.status(404).json({ message: 'User not found' });
            const isSelfUpdate = userId === currentUser.id;
            const currentOrgId = (0, hierarchyUtils_1.getOrgId)(currentUser);
            const targetOrgId = (0, hierarchyUtils_1.getOrgId)(tempUser);
            const orgMatch = currentOrgId && targetOrgId && currentOrgId === targetOrgId;
            if (!isSelfUpdate && !orgMatch) {
                return res.status(403).json({ message: 'Not authorized to update this user' });
            }
        }
        // Process Update Data
        const dataToUpdate = Object.assign({}, updateData);
        // Security: Prevent organisationId or role changes for non-super-admins
        if (currentUser.role !== 'super_admin') {
            delete dataToUpdate.organisationId;
            // Only allow role change if admin is updating someone in their own org
            // But we should also prevent admin from making themselves or others super_admin
            if (dataToUpdate.role === 'super_admin') {
                delete dataToUpdate.role;
            }
        }
        // Handle reportsTo mapping
        if (updateData.reportsTo) {
            if (updateData.reportsTo === userId) {
                return res.status(400).json({ message: 'User cannot report to themselves' });
            }
            const manager = yield prisma_1.default.user.findUnique({ where: { id: updateData.reportsTo } });
            if (!manager)
                return res.status(400).json({ message: 'Manager not found' });
            // Check Org
            const managerOrgId = (0, hierarchyUtils_1.getOrgId)(manager);
            const targetUser = yield prisma_1.default.user.findUnique({ where: { id: userId } });
            const targetOrgId = (0, hierarchyUtils_1.getOrgId)(targetUser) || (0, hierarchyUtils_1.getOrgId)(currentUser);
            if (targetOrgId !== managerOrgId) {
                return res.status(400).json({ message: 'Manager must belong to same organisation' });
            }
            dataToUpdate.reportsTo = { connect: { id: updateData.reportsTo } };
        }
        if (password && password.trim() !== '') {
            const salt = yield bcryptjs_1.default.genSalt(10);
            dataToUpdate.password = yield bcryptjs_1.default.hash(password, salt);
        }
        const updatedUser = yield prisma_1.default.user.update({
            where: { id: userId },
            data: dataToUpdate
        });
        // Audit Log
        (0, auditLogger_1.logAudit)({
            action: 'UPDATE_USER',
            entity: 'User',
            entityId: userId,
            actorId: currentUser.id,
            organisationId: (0, hierarchyUtils_1.getOrgId)(updatedUser) || currentUser.organisationId,
            details: { updatedFields: Object.keys(dataToUpdate).filter(k => k !== 'password') }
        });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _password } = updatedUser, userNoPass = __rest(updatedUser, ["password"]);
        res.json(userNoPass);
    }
    catch (error) {
        logger_1.logger.error('UpdateUser Error', error, 'UserController');
        res.status(500).json({ message: error.message });
    }
});
exports.updateUser = updateUser;
// POST /api/users
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, role, firstName, lastName, organisationId } = req.body;
        const currentUser = req.user;
        // Determine Org ID
        let targetOrgId = organisationId;
        if (currentUser.role !== 'super_admin') {
            targetOrgId = (0, hierarchyUtils_1.getOrgId)(currentUser);
        }
        if (!targetOrgId) {
            return res.status(400).json({ message: 'Organisation ID is required' });
        }
        // 1. License Check (User Limit)
        if (currentUser.role !== 'super_admin') {
            const { LicenseEnforcementService } = yield Promise.resolve().then(() => __importStar(require('../services/LicenseEnforcementService')));
            yield LicenseEnforcementService.checkLimits(targetOrgId, 'users');
        }
        // 2. Email duplication check
        const existingUser = yield prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma_1.default.user.create({
            data: {
                email,
                password: hashedPassword,
                role: role || 'sales_rep',
                firstName,
                lastName,
                organisationId: targetOrgId,
                isActive: true, // Default to active
                // If currentUser is non-admin creating a user, maybe set reportsTo?
                reportsToId: req.body.reportsTo || (currentUser.role !== 'super_admin' ? currentUser.id : undefined)
            }
        });
        // Audit Log
        (0, auditLogger_1.logAudit)({
            action: 'CREATE_USER',
            entity: 'User',
            entityId: newUser.id,
            actorId: currentUser.id,
            organisationId: targetOrgId,
            details: { email: newUser.email, role: newUser.role }
        });
        // 3. Update Organisation Counter (Optional, if using userIdCounter)
        // await prisma.organisation.update({ where: { id: targetOrgId }, data: { userIdCounter: { increment: 1 } } });
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _ } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
        res.status(201).json(userWithoutPassword);
    }
    catch (error) {
        logger_1.logger.error('createUser Error', error, 'UserController');
        res.status(400).json({ message: error.message });
    }
});
exports.createUser = createUser;
const inviteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, firstName, lastName, role, organisationId, position, reportsTo, password } = req.body;
        const currentUser = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(currentUser) || organisationId;
        // 1. License Check
        const { LicenseEnforcementService } = yield Promise.resolve().then(() => __importStar(require('../services/LicenseEnforcementService')));
        yield LicenseEnforcementService.checkLimits(orgId, 'users');
        // Check if user exists
        if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
            return res.status(403).json({ message: 'Only administrators can invite users' });
        }
        const existingUser = yield prisma_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        let targetOrgId = (0, hierarchyUtils_1.getOrgId)(currentUser);
        if (currentUser.role === 'super_admin' && organisationId) {
            targetOrgId = organisationId;
        }
        if (!targetOrgId)
            return res.status(400).json({ message: 'Organisation is required' });
        // Check limits and increment counter
        const org = yield prisma_1.default.organisation.findUnique({ where: { id: targetOrgId } });
        if (org) {
            const userCount = yield prisma_1.default.user.count({ where: { organisationId: targetOrgId, isActive: true } });
            if (userCount >= org.userLimit) {
                return res.status(403).json({ message: 'User limit reached' });
            }
        }
        // Generate UserID
        let generatedUserId;
        if (org) {
            // Atomic update
            const updatedOrg = yield prisma_1.default.organisation.update({
                where: { id: targetOrgId },
                data: { userIdCounter: { increment: 1 } }
            });
            const prefix = updatedOrg.name.slice(0, 3).toUpperCase();
            const counter = updatedOrg.userIdCounter;
            generatedUserId = `${prefix}${counter.toString().padStart(3, '0')}`;
        }
        const tempPassword = password || Math.random().toString(36).slice(-8);
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(tempPassword, salt);
        const newUser = yield prisma_1.default.user.create({
            data: {
                email,
                firstName,
                lastName,
                password: hashedPassword,
                role: role || client_1.UserRole.sales_rep,
                organisation: { connect: { id: targetOrgId } },
                position,
                userId: generatedUserId,
                reportsTo: reportsTo ? { connect: { id: reportsTo } } : undefined,
                isActive: true
            }
        });
        // Audit Log
        (0, auditLogger_1.logAudit)({
            action: 'INVITE_USER',
            entity: 'User',
            entityId: newUser.id,
            actorId: currentUser.id,
            organisationId: targetOrgId,
            details: { email: newUser.email, role: newUser.role }
        });
        res.status(201).json({
            user: { id: newUser.id, email: newUser.email, firstName: newUser.firstName },
            message: 'User invited successfully'
        });
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.inviteUser = inviteUser;
const deactivateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(currentUser);
        const userId = req.params.id;
        const where = { id: userId };
        if (currentUser.role !== 'super_admin') {
            if (!orgId)
                return res.status(403).json({ message: 'No org' });
            where.organisationId = orgId;
        }
        // Also ensure target exists first? Update throws if not found? 
        // findFirst/updateMany or catch error. 
        // Using update directly requires ID validation implicitly or it throws "Record to update not found."
        // We can just add organisationId to the where clause of update, but prisma update `where` only accepts unique identifiers.
        // So we need to use updateMany or findFirst then update.
        // Using findFirst then update for safety.
        const existing = yield prisma_1.default.user.findFirst({ where });
        if (!existing)
            return res.status(404).json({ message: 'User not found or access denied' });
        const user = yield prisma_1.default.user.update({
            where: { id: userId },
            data: { isActive: false }
        });
        // Audit Log
        (0, auditLogger_1.logAudit)({
            action: 'DEACTIVATE_USER',
            entity: 'User',
            entityId: user.id,
            actorId: req.user.id,
            organisationId: user.organisationId || req.user.organisationId,
            details: { email: user.email }
        });
        res.json({ message: 'User deactivated', user });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deactivateUser = deactivateUser;
