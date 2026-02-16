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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrganisationStats = exports.suspendOrganisation = exports.updateOrganisationAdmin = exports.createOrganisation = exports.getAllOrganisations = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
// Get all organisations (Super Admin only)
const getAllOrganisations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ message: 'Access denied. Super admin only.' });
        }
        const organisations = yield prisma_1.default.organisation.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                licenses: {
                    where: { status: 'active' },
                    include: { plan: true },
                    take: 1
                }
            }
        });
        // Get user counts for each org
        const orgIds = organisations.map(o => o.id);
        const userCounts = yield prisma_1.default.user.groupBy({
            by: ['organisationId'],
            where: { organisationId: { in: orgIds }, isActive: true },
            _count: { id: true }
        });
        const countMap = new Map(userCounts.map(u => [u.organisationId, u._count.id]));
        const result = organisations.map(org => (Object.assign(Object.assign({}, org), { userCount: countMap.get(org.id) || 0, activeLicense: org.licenses[0] || null })));
        res.json({ organisations: result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAllOrganisations = getAllOrganisations;
// Create new organisation (Super Admin or Registration)
const createOrganisation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { name, slug, contactEmail, planId, firstName, lastName, password } = req.body;
        // Check if slug is unique
        const existingOrg = yield prisma_1.default.organisation.findUnique({ where: { slug } });
        if (existingOrg) {
            return res.status(400).json({ message: 'Organisation slug already exists' });
        }
        // Check if user email exists
        const existingUser = yield prisma_1.default.user.findUnique({ where: { email: contactEmail } });
        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        // Lazy load bcrypt
        const bcrypt = yield Promise.resolve().then(() => __importStar(require('bcryptjs')));
        const hashedPassword = yield bcrypt.hash(password || 'Welcome123', 10);
        // Transaction to ensure atomicity
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Create Organisation
            const organisation = yield tx.organisation.create({
                data: {
                    name,
                    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
                    contactEmail,
                    status: 'active',
                    subscription: {
                        status: 'trial',
                        startDate: new Date().toISOString(),
                        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                    }
                }
            });
            // 2. Create Admin User
            const user = yield tx.user.create({
                data: {
                    firstName: firstName || 'Admin',
                    lastName: lastName || 'User',
                    email: contactEmail,
                    password: hashedPassword,
                    role: 'admin',
                    organisationId: organisation.id,
                    isActive: true
                }
            });
            // 3. Create License (if plan)
            if (planId) {
                const plan = yield tx.subscriptionPlan.findUnique({ where: { id: planId } });
                if (plan) {
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + plan.durationDays);
                    yield tx.license.create({
                        data: {
                            organisationId: organisation.id,
                            planId: planId,
                            status: 'trial',
                            startDate: new Date(),
                            endDate,
                            maxUsers: plan.maxUsers,
                            activatedById: user.id
                        }
                    });
                }
            }
            return { organisation, tempPassword: password || 'Welcome123' };
        }));
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            yield logAudit({
                organisationId: result.organisation.id,
                actorId: ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || 'SYSTEM_REG', // Super Admin ID or SYSTEM if registration
                action: 'CREATE_ORGANISATION',
                entity: 'Organisation',
                entityId: result.organisation.id,
                details: { name: result.organisation.name, slug: result.organisation.slug }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.status(201).json(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createOrganisation = createOrganisation;
// Update organisation
const updateOrganisationAdmin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const orgId = req.params.id;
        const data = Object.assign({}, req.body);
        // Handle Plan Assignment checks
        if (data.planId) {
            const plan = yield prisma_1.default.subscriptionPlan.findUnique({ where: { id: data.planId } });
            if (!plan)
                throw new Error('Invalid Plan ID');
            // 1. Update Org Limits based on Plan
            data.userLimit = plan.maxUsers;
            data.status = 'active'; // Activate org if plan assignment happens
            // 2. Legacy Subscription JSON sync
            const existingSubscription = ((_a = (yield prisma_1.default.organisation.findUnique({ where: { id: orgId } }))) === null || _a === void 0 ? void 0 : _a.subscription) || {};
            data.subscription = Object.assign(Object.assign({}, existingSubscription), { status: 'active', plan: plan.name, planId: plan.id, startDate: new Date(), endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000) });
            // 3. Deactivate old active licenses
            yield prisma_1.default.license.updateMany({
                where: { organisationId: orgId, status: 'active' },
                data: { status: 'cancelled', cancelledAt: new Date() }
            });
            // 4. Create New License
            yield prisma_1.default.license.create({
                data: {
                    organisationId: orgId,
                    planId: plan.id,
                    status: 'active',
                    startDate: new Date(),
                    endDate: new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000),
                    maxUsers: plan.maxUsers,
                    autoRenew: true
                }
            });
            // Clean up planId from data intended for Organisation model update
            delete data.planId;
        }
        const organisation = yield prisma_1.default.organisation.update({
            where: { id: orgId },
            data: data
        });
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            yield logAudit({
                organisationId: organisation.id,
                actorId: req.user.id,
                action: 'UPDATE_ORGANISATION',
                entity: 'Organisation',
                entityId: organisation.id,
                details: { updatedFields: Object.keys(data) }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.json(organisation);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateOrganisationAdmin = updateOrganisationAdmin;
// Suspend organisation
const suspendOrganisation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const organisation = yield prisma_1.default.organisation.update({
            where: { id: req.params.id },
            data: {
                status: 'suspended',
                subscription: { status: 'cancelled' }
            }
        });
        // Cancel all licenses
        yield prisma_1.default.license.updateMany({
            where: { organisationId: organisation.id },
            data: { status: 'cancelled', cancelledAt: new Date() }
        });
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            yield logAudit({
                organisationId: organisation.id,
                actorId: req.user.id,
                action: 'SUSPEND_ORGANISATION',
                entity: 'Organisation',
                entityId: organisation.id
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.json({ message: 'Organisation suspended', organisation });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.suspendOrganisation = suspendOrganisation;
// Get organisation stats (Super Admin)
const getOrganisationStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user.isSuperAdmin) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const [totalOrgs, activeOrgs, suspendedOrgs, totalUsers, activeLicenses, newOrgsLast30Days, revenue] = yield Promise.all([
            prisma_1.default.organisation.count(),
            prisma_1.default.organisation.count({ where: { status: 'active' } }),
            prisma_1.default.organisation.count({ where: { status: 'suspended' } }),
            prisma_1.default.user.count({ where: { isActive: true } }),
            prisma_1.default.license.count({ where: { status: 'active' } }),
            prisma_1.default.organisation.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            // Calculate revenue from active licenses
            prisma_1.default.license.findMany({
                where: { status: 'active' },
                include: { plan: true }
            })
        ]);
        const totalRevenue = revenue.reduce((acc, license) => { var _a; return acc + (((_a = license.plan) === null || _a === void 0 ? void 0 : _a.price) || 0); }, 0);
        // Group by Plan
        const planDistribution = yield prisma_1.default.license.groupBy({
            by: ['planId'],
            where: { status: 'active' },
            _count: { id: true }
        });
        // Fetch plan names
        const planIds = planDistribution.map(p => p.planId).filter(id => id !== null);
        const plans = yield prisma_1.default.subscriptionPlan.findMany({ where: { id: { in: planIds } } });
        const planMap = new Map(plans.map(p => [p.id, p.name]));
        const planStats = planDistribution.map(p => ({
            name: planMap.get(p.planId) || 'Unknown',
            count: p._count.id
        }));
        res.json({
            overview: {
                totalOrganisations: totalOrgs,
                activeOrganisations: activeOrgs,
                newOrganisations: newOrgsLast30Days,
                suspendedOrganisations: suspendedOrgs,
                totalUsers,
                activeLicenses,
                totalRevenue
            },
            planDistribution: planStats
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getOrganisationStats = getOrganisationStats;
