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
exports.getAccountProducts = exports.addAccountProduct = exports.deleteAccount = exports.updateAccount = exports.getAccountById = exports.createAccount = exports.getAccounts = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
// GET /api/accounts
const getAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pageSize = Number(req.query.pageSize) || 10;
        const page = Number(req.query.page) || 1;
        const user = req.user;
        const where = { isDeleted: false };
        // 1. Organisation Scoping
        if (user.role === 'super_admin') {
            if (req.query.organisationId) {
                where.organisationId = String(req.query.organisationId);
            }
        }
        else {
            const orgId = (0, hierarchyUtils_1.getOrgId)(user);
            if (!orgId)
                return res.status(403).json({ message: 'User has no organisation' });
            where.organisationId = orgId;
            if (user.branchId)
                where.branchId = user.branchId;
        }
        // 2. Hierarchy Visibility
        if (user.role !== 'super_admin' && user.role !== 'admin') {
            const subordinateIds = yield (0, hierarchyUtils_1.getSubordinateIds)(user.id);
            // In Prisma: ownerId IN [...]
            where.ownerId = { in: [...subordinateIds, user.id] };
        }
        // Filters
        if (req.query.type)
            where.type = String(req.query.type);
        if (req.query.industry)
            where.industry = String(req.query.industry);
        // Search
        if (req.query.search) {
            const search = String(req.query.search);
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { website: { contains: search, mode: 'insensitive' } },
                // JSON filtering for City (best effort for Prisma+PG)
                { address: { path: ['city'], string_contains: search } }
            ];
        }
        const count = yield prisma_1.default.account.count({ where });
        const accounts = yield prisma_1.default.account.findMany({
            where,
            include: {
                owner: { select: { firstName: true, lastName: true, email: true } }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ accounts, page, pages: Math.ceil(count / pageSize), total: count });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAccounts = getAccounts;
// POST /api/accounts
const createAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'Organisation context required' });
        // Custom Field Validation
        if (req.body.customFields) {
            const { CustomFieldValidationService } = yield Promise.resolve().then(() => __importStar(require('../services/CustomFieldValidationService')));
            yield CustomFieldValidationService.validateFields('Account', orgId, req.body.customFields);
        }
        const accountData = {
            name: req.body.name,
            industry: req.body.industry,
            website: req.body.website,
            size: req.body.size,
            annualRevenue: req.body.annualRevenue,
            address: req.body.address,
            phone: req.body.phone,
            type: req.body.type || 'prospect',
            customFields: req.body.customFields,
            tags: req.body.tags,
            organisation: { connect: { id: orgId } },
            owner: req.body.owner ? { connect: { id: req.body.owner } } : { connect: { id: user.id } },
            branch: user.branchId ? { connect: { id: user.branchId } } : (req.body.branchId ? { connect: { id: req.body.branchId } } : undefined),
        };
        const account = yield prisma_1.default.account.create({
            data: accountData
        });
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'CREATE_ACCOUNT',
                entity: 'Account',
                entityId: account.id,
                actorId: user.id,
                organisationId: orgId,
                details: { name: account.name, type: account.type }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.status(201).json(account);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createAccount = createAccount;
const getAccountById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const where = { id: req.params.id, isDeleted: false };
        if (user.role !== 'super_admin') {
            if (!orgId)
                return res.status(403).json({ message: 'User has no organisation' });
            where.organisationId = orgId;
            if (user.branchId)
                where.branchId = user.branchId;
        }
        const account = yield prisma_1.default.account.findFirst({
            where,
            include: {
                owner: { select: { firstName: true, lastName: true, email: true } },
                contacts: { select: { id: true, firstName: true, lastName: true, email: true } },
                opportunities: { select: { id: true, name: true, amount: true, stage: true } }
            }
        });
        if (!account)
            return res.status(404).json({ message: 'Account not found' });
        res.json(account);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAccountById = getAccountById;
const updateAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updates = Object.assign({}, req.body);
        const accountId = req.params.id;
        if (updates.owner && typeof updates.owner === 'string') {
            updates.owner = { connect: { id: updates.owner } };
        }
        const requester = req.user;
        const whereObj = { id: accountId };
        if (requester.role !== 'super_admin') {
            const orgId = (0, hierarchyUtils_1.getOrgId)(requester);
            if (!orgId)
                return res.status(403).json({ message: 'No org' });
            whereObj.organisationId = orgId;
            if (requester.branchId)
                whereObj.branchId = requester.branchId;
        }
        // Get current account for validation
        const currentAccount = yield prisma_1.default.account.findUnique({ where: whereObj });
        if (!currentAccount)
            return res.status(404).json({ message: 'Account not found' });
        // Custom Field Validation
        if (updates.customFields) {
            const { CustomFieldValidationService } = yield Promise.resolve().then(() => __importStar(require('../services/CustomFieldValidationService')));
            yield CustomFieldValidationService.validateFields('Account', currentAccount.organisationId, updates.customFields);
        }
        const account = yield prisma_1.default.account.update({
            where: whereObj,
            data: updates,
            include: {
                owner: { select: { firstName: true, lastName: true, email: true } }
            }
        });
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'UPDATE_ACCOUNT',
                entity: 'Account',
                entityId: accountId,
                actorId: requester.id,
                organisationId: account.organisationId,
                details: { name: account.name, updatedFields: Object.keys(updates) }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.json(account);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updateAccount = updateAccount;
const deleteAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const accountId = req.params.id;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        // 1. Role Check
        if (user.role !== 'super_admin' && user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete accounts' });
        }
        const where = { id: accountId };
        if (user.role !== 'super_admin') {
            if (!orgId)
                return res.status(403).json({ message: 'No org' });
            where.organisationId = orgId;
            if (user.branchId)
                where.branchId = user.branchId;
        }
        const account = yield prisma_1.default.account.findFirst({ where });
        if (!account)
            return res.status(404).json({ message: 'Account not found' });
        // 2. Transaction for Cascading Soft-Delete
        yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Update Account
            yield tx.account.update({
                where: { id: accountId },
                data: { isDeleted: true }
            });
            // Update Contacts
            yield tx.contact.updateMany({
                where: { accountId: accountId, organisationId: orgId || account.organisationId },
                data: { isDeleted: true }
            });
            // Update Opportunities
            yield tx.opportunity.updateMany({
                where: { accountId: accountId, organisationId: orgId || account.organisationId },
                data: { isDeleted: true }
            });
            // Audit Log
            try {
                const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
                logAudit({
                    action: 'DELETE_ACCOUNT',
                    entity: 'Account',
                    entityId: accountId,
                    actorId: user.id,
                    organisationId: orgId || account.organisationId,
                    details: { name: account.name }
                });
            }
            catch (e) {
                console.error('Audit Log Error:', e);
            }
        }));
        res.json({ message: 'Account and related contacts/opportunities deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteAccount = deleteAccount;
// Add product to account (Asset)
const addAccountProduct = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const { accountId } = req.params;
        const { productId, quantity, purchaseDate, serialNumber, status, notes } = req.body;
        if (!orgId)
            return res.status(400).json({ message: 'Organisation context required' });
        const account = yield prisma_1.default.account.findFirst({
            where: { id: accountId, organisationId: orgId }
        });
        if (!account)
            return res.status(404).json({ message: 'Account not found' });
        const asset = yield prisma_1.default.accountProduct.create({
            data: {
                accountId,
                productId,
                quantity: Number(quantity) || 1,
                purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
                serialNumber,
                status: status || 'active',
                notes,
                organisationId: orgId
            },
            include: { product: true }
        });
        yield prisma_1.default.interaction.create({
            data: {
                accountId,
                type: 'note',
                subject: `Added Asset: ${asset.product.name}`,
                description: `Added product: ${asset.product.name} (Qty: ${asset.quantity})`,
                createdById: user.id,
                organisationId: orgId
            }
        });
        res.status(201).json(asset);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.addAccountProduct = addAccountProduct;
// Get account products
const getAccountProducts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const { accountId } = req.params;
        const assets = yield prisma_1.default.accountProduct.findMany({
            where: { accountId, organisationId: orgId || undefined },
            include: { product: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json(assets);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAccountProducts = getAccountProducts;
