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
exports.getDuplicateLeads = exports.getReEnquiryLeads = exports.generateAIResponse = exports.getPendingFollowUpsCount = exports.submitExplanation = exports.getLeadHistory = exports.getViolations = exports.convertLead = exports.bulkAssignLeads = exports.createBulkLeads = exports.deleteLead = exports.updateLead = exports.getLeadById = exports.createLead = exports.getLeads = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const DistributionService_1 = require("../services/DistributionService");
const WorkflowEngine_1 = require("../services/WorkflowEngine");
const client_1 = require("../generated/client");
// Dynamic import used for OpenAI to avoid startup errors if missing
// GET /api/leads
const getLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pageSize = Number(req.query.pageSize) || 10;
        const page = Number(req.query.page) || 1;
        const user = req.user;
        const where = { isDeleted: false };
        // 1. Organisation Scoping
        if (user.role === 'super_admin') {
            if (req.query.organisationId)
                where.organisationId = req.query.organisationId;
        }
        else {
            const orgId = (0, hierarchyUtils_1.getOrgId)(user);
            if (!orgId)
                return res.status(403).json({ message: 'User has no organisation' });
            where.organisationId = orgId;
        }
        // 2. Hierarchy Visibility
        if (user.role !== 'super_admin' && user.role !== 'admin') {
            const subordinateIds = yield (0, hierarchyUtils_1.getSubordinateIds)(user.id);
            // In Prisma: assignedToId IN [...]
            where.assignedToId = { in: [...subordinateIds, user.id] };
        }
        // Filter: Status
        if (req.query.status) {
            where.status = req.query.status;
        }
        // Filter: Source
        if (req.query.source) {
            where.source = req.query.source;
        }
        // Filter: Search (OR condition)
        if (req.query.search) {
            const search = String(req.query.search);
            where.OR = [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } }
            ];
        }
        // Filter: Assigned User
        if (req.query.assignedTo) {
            where.assignedToId = req.query.assignedTo;
        }
        const total = yield prisma_1.default.lead.count({ where });
        const leads = yield prisma_1.default.lead.findMany({
            where,
            include: {
                assignedTo: {
                    select: { firstName: true, lastName: true, email: true }
                }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ leads, page, pages: Math.ceil(total / pageSize), total });
    }
    catch (error) {
        console.error('getLeads Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getLeads = getLeads;
// POST /api/leads
const createLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, phone } = req.body;
        if (!phone)
            return res.status(400).json({ message: 'Phone number is required' });
        // Sanitize Phone
        let cleanPhone = phone.toString().replace(/\D/g, '');
        if (cleanPhone.length > 10 && cleanPhone.endsWith(cleanPhone.slice(-10))) {
            cleanPhone = cleanPhone.slice(-10);
        }
        const orgId = (0, hierarchyUtils_1.getOrgId)(req.user);
        if (!orgId)
            return res.status(400).json({ message: 'Organisation context required' });
        // Check for duplicates using DuplicateLeadService
        const { DuplicateLeadService } = yield Promise.resolve().then(() => __importStar(require('../services/DuplicateLeadService')));
        const duplicateCheck = yield DuplicateLeadService.checkDuplicate(cleanPhone, email, orgId);
        if (duplicateCheck.isDuplicate && duplicateCheck.existingLead) {
            // Handle as re-enquiry
            const reEnquiryData = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                email: req.body.email,
                phone: cleanPhone,
                company: req.body.company,
                source: req.body.source,
                sourceDetails: req.body.sourceDetails
            };
            const updatedLead = yield DuplicateLeadService.handleReEnquiry(duplicateCheck.existingLead, reEnquiryData, orgId);
            return res.status(200).json({
                message: 'Lead already exists. Marked as re-enquiry and notifications sent.',
                lead: updatedLead,
                isReEnquiry: true,
                matchedBy: duplicateCheck.matchedBy,
                reEnquiryCount: updatedLead.reEnquiryCount
            });
        }
        // Extract assignedTo before spreading
        const _a = req.body, { assignedTo } = _a, restBody = __rest(_a, ["assignedTo"]);
        // Detect country from IP address if not provided
        let geoData = null;
        if (!req.body.country && !req.body.countryCode) {
            const { GeoLocationService } = yield Promise.resolve().then(() => __importStar(require('../services/GeoLocationService')));
            const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection.remoteAddress;
            if (ipAddress) {
                geoData = yield GeoLocationService.detectCountryFromIP(ipAddress);
            }
            // Fallback: Try to detect from phone number
            if (!geoData && cleanPhone) {
                geoData = GeoLocationService.detectCountryFromPhone(cleanPhone);
            }
        }
        // Custom Field Validation
        if (req.body.customFields) {
            const { CustomFieldValidationService } = yield Promise.resolve().then(() => __importStar(require('../services/CustomFieldValidationService')));
            yield CustomFieldValidationService.validateFields('Lead', orgId, req.body.customFields);
        }
        // Create
        const lead = yield prisma_1.default.lead.create({
            data: Object.assign(Object.assign(Object.assign(Object.assign({}, restBody), { phone: cleanPhone, country: req.body.country || (geoData === null || geoData === void 0 ? void 0 : geoData.country) || undefined, countryCode: req.body.countryCode || (geoData === null || geoData === void 0 ? void 0 : geoData.countryCode) || undefined, phoneCountryCode: req.body.phoneCountryCode || (geoData === null || geoData === void 0 ? void 0 : geoData.phoneCountryCode) || undefined, organisation: { connect: { id: orgId } } }), (assignedTo ? { assignedTo: { connect: { id: assignedTo } } } : {})), { source: req.body.source, status: req.body.status || client_1.LeadStatus.new, potentialValue: req.body.potentialValue ? parseFloat(req.body.potentialValue) : 0 })
        });
        // 3a. Handle Products if provided
        if (req.body.products && Array.isArray(req.body.products)) {
            const productItems = req.body.products;
            let totalValue = 0;
            for (const item of productItems) {
                const product = yield prisma_1.default.product.findUnique({ where: { id: item.productId } });
                if (product) {
                    const price = product.basePrice || 0;
                    const quantity = item.quantity || 1;
                    totalValue += price * quantity;
                    yield prisma_1.default.leadProduct.create({
                        data: {
                            leadId: lead.id,
                            productId: item.productId,
                            quantity: quantity,
                            price: price
                        }
                    });
                }
            }
            // Update lead with calculated value if products were added
            if (totalValue > 0) {
                yield prisma_1.default.lead.update({
                    where: { id: lead.id },
                    data: { potentialValue: totalValue }
                });
                lead.potentialValue = totalValue; // Update local obj for response
            }
        }
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'CREATE_LEAD',
                entity: 'Lead',
                entityId: lead.id,
                actorId: req.user.id,
                organisationId: orgId,
                details: { name: `${lead.firstName} ${lead.lastName}`, company: lead.company }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        // Enable Distribution
        yield DistributionService_1.DistributionService.assignLead(lead, orgId);
        // Trigger Workflow Engine for lead creation
        try {
            yield WorkflowEngine_1.WorkflowEngine.evaluate('Lead', 'created', lead, orgId);
            Promise.resolve().then(() => __importStar(require('../services/WebhookService'))).then(({ WebhookService }) => {
                WebhookService.triggerEvent('lead.created', lead, orgId).catch(console.error);
            });
            // AI Scoring
            Promise.resolve().then(() => __importStar(require('../services/LeadScoringService'))).then(({ LeadScoringService }) => {
                LeadScoringService.scoreLead(lead.id).catch(console.error);
            });
            // Goal Automation
            Promise.resolve().then(() => __importStar(require('../services/GoalService'))).then(({ GoalService }) => {
                const assignedId = lead.assignedToId;
                if (assignedId) {
                    GoalService.updateProgressForUser(assignedId, 'leads').catch(console.error);
                }
            });
            // Meta Conversion API: New Lead
            Promise.resolve().then(() => __importStar(require('../services/MetaConversionService'))).then(({ MetaConversionService }) => {
                MetaConversionService.sendEvent(orgId, {
                    eventName: 'Lead',
                    userData: {
                        email: lead.email,
                        phone: lead.phone,
                        firstName: lead.firstName,
                        lastName: lead.lastName,
                        externalId: lead.id
                    },
                    actionSource: 'system_generated' // or website if we knew source url
                }).catch(console.error);
            });
        }
        catch (workflowErr) {
            console.error('WorkflowEngine error:', workflowErr);
            // Don't fail the request if workflow fails
        }
        res.status(201).json(lead);
    }
    catch (error) {
        console.error('createLead Error:', error);
        res.status(400).json({ message: error.message });
    }
});
exports.createLead = createLead;
const getLeadById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const where = { id: req.params.id, isDeleted: false };
        if (user.role !== 'super_admin') {
            if (!orgId)
                return res.status(403).json({ message: 'User has no organisation' });
            where.organisationId = orgId;
        }
        const lead = yield prisma_1.default.lead.findFirst({
            where,
            include: {
                assignedTo: { select: { firstName: true, lastName: true, email: true } },
                products: { include: { product: true } }
            }
        });
        if (!lead)
            return res.status(404).json({ message: 'Lead not found' });
        res.json(lead);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getLeadById = getLeadById;
const updateLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const updates = Object.assign({}, req.body);
        const leadId = req.params.id;
        const requester = req.user;
        let historyData = null;
        // Fetch current lead to check for ownership change
        const currentLead = yield prisma_1.default.lead.findUnique({ where: { id: leadId } });
        if (!currentLead)
            return res.status(404).json({ message: 'Lead not found' });
        // Hierarchy Check
        if (updates.assignedToId || updates.assignedTo) { // Handle payload differences
            const targetUserId = updates.assignedToId || updates.assignedTo; // Assuming ID string
            if (requester.role !== 'super_admin' && requester.role !== 'admin') {
                const allowedIds = yield (0, hierarchyUtils_1.getSubordinateIds)(requester.id);
                // If passing an object (legacy), extract ID?? Usually frontend sends ID string for update.
                // Let's assume ID string.
                if (typeof targetUserId === 'string' && !allowedIds.includes(targetUserId)) {
                    return res.status(403).json({ message: 'You can only assign leads to your subordinates.' });
                }
            }
            // Track History
            if (currentLead.assignedToId !== targetUserId) {
                historyData = {
                    leadId,
                    oldOwnerId: currentLead.assignedToId,
                    newOwnerId: targetUserId,
                    changedById: requester.id,
                    reason: req.body.reason || 'Manual Assignment'
                };
            }
            // Remap for Prisma
            updates.assignedTo = { connect: { id: targetUserId } };
            delete updates.assignedToId; // Clean up
        }
        // Track Status Change
        if (updates.status && updates.status !== currentLead.status) {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'LEAD_STATUS_CHANGE',
                entity: 'Lead',
                entityId: leadId,
                actorId: requester.id,
                organisationId: currentLead.organisationId,
                details: { oldStatus: currentLead.status, newStatus: updates.status }
            });
        }
        // Track Follow-up Change
        if (updates.nextFollowUp) {
            yield prisma_1.default.interaction.create({
                data: {
                    leadId: leadId,
                    type: 'other',
                    subject: 'Follow-up Scheduled',
                    description: `Next follow-up scheduled for ${new Date(updates.nextFollowUp).toLocaleDateString()}`,
                    createdById: requester.id,
                    organisationId: currentLead.organisationId
                }
            });
        }
        if (updates.customFields) {
            const { CustomFieldValidationService } = yield Promise.resolve().then(() => __importStar(require('../services/CustomFieldValidationService')));
            yield CustomFieldValidationService.validateFields('Lead', currentLead.organisationId, updates.customFields);
        }
        const whereObj = { id: leadId };
        if (requester.role !== 'super_admin') {
            const orgId = (0, hierarchyUtils_1.getOrgId)(requester);
            if (!orgId)
                return res.status(403).json({ message: 'No org' });
            whereObj.organisationId = orgId;
        }
        // Update Lead Basic Info
        const [lead] = yield prisma_1.default.$transaction([
            prisma_1.default.lead.update({
                where: whereObj,
                data: updates,
                include: { assignedTo: { select: { firstName: true, lastName: true, email: true } } }
            }),
            ...(historyData ? [prisma_1.default.leadHistory.create({ data: historyData })] : [])
        ]);
        let finalLead = lead;
        // Handle Products Update
        if (req.body.products && Array.isArray(req.body.products)) {
            const productItems = req.body.products;
            // 1. Clear existing products (simplest approach for full replace)
            yield prisma_1.default.leadProduct.deleteMany({ where: { leadId } });
            // 2. Add new products and calculate value
            let totalValue = 0;
            for (const item of productItems) {
                const product = yield prisma_1.default.product.findUnique({ where: { id: item.productId } });
                if (product) {
                    const price = product.basePrice || 0;
                    const quantity = item.quantity || 1;
                    totalValue += price * quantity;
                    yield prisma_1.default.leadProduct.create({
                        data: {
                            leadId,
                            productId: item.productId,
                            quantity: quantity,
                            price: price
                        }
                    });
                }
            }
            // 3. Update Lead Value
            finalLead = yield prisma_1.default.lead.update({
                where: { id: leadId },
                data: { potentialValue: totalValue },
                include: {
                    assignedTo: { select: { firstName: true, lastName: true, email: true } },
                    products: { include: { product: true } }
                }
            });
            // Log History for Value Change
            if (currentLead.potentialValue !== totalValue) {
                yield prisma_1.default.leadHistory.create({
                    data: {
                        leadId,
                        changedById: requester.id,
                        fieldName: 'potentialValue',
                        oldValue: ((_a = currentLead.potentialValue) === null || _a === void 0 ? void 0 : _a.toString()) || '0',
                        newValue: totalValue.toString()
                    }
                });
            }
        }
        // Audit Log for update
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'UPDATE_LEAD',
                entity: 'Lead',
                entityId: leadId,
                actorId: requester.id,
                organisationId: currentLead.organisationId,
                details: { name: `${currentLead.firstName} ${currentLead.lastName}`, updatedFields: Object.keys(updates) }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.json(finalLead);
        // Webhook
        Promise.resolve().then(() => __importStar(require('../services/WebhookService'))).then(({ WebhookService }) => {
            WebhookService.triggerEvent('lead.updated', lead, lead.organisationId).catch(console.error);
        });
        // AI Scoring Trigger (if relevant fields changed)
        if (updates.jobTitle || updates.company || updates.email || updates.phone) {
            Promise.resolve().then(() => __importStar(require('../services/LeadScoringService'))).then(({ LeadScoringService }) => {
                LeadScoringService.scoreLead(leadId).catch(console.error);
            });
        }
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updateLead = updateLead;
const deleteLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const leadId = req.params.id;
        // Role Check
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Not authorized to delete leads' });
        }
        const lead = yield prisma_1.default.lead.findUnique({ where: { id: leadId } });
        if (!lead)
            return res.status(404).json({ message: 'Lead not found' });
        // Org Check
        if (user.role !== 'super_admin') {
            const userOrgId = (0, hierarchyUtils_1.getOrgId)(user);
            if (lead.organisationId !== userOrgId) {
                return res.status(403).json({ message: 'Not authorized to delete this lead' });
            }
        }
        yield prisma_1.default.lead.update({
            where: { id: leadId },
            data: { isDeleted: true }
        });
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'DELETE_LEAD',
                entity: 'Lead',
                entityId: leadId,
                actorId: user.id,
                organisationId: lead.organisationId,
                details: { name: `${lead.firstName} ${lead.lastName}` }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.json({ message: 'Lead deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteLead = deleteLead;
const createBulkLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const leadsData = req.body;
        const user = req.user;
        if (!Array.isArray(leadsData) || leadsData.length === 0) {
            return res.status(400).json({ message: 'Invalid input' });
        }
        // Map data
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        // Import GeoLocationService for country detection
        const { GeoLocationService } = yield Promise.resolve().then(() => __importStar(require('../services/GeoLocationService')));
        // Prisma createMany does not support nested relations logic per row easily if validating constraints one by one?
        // Actually createMany is supported but it's "all or nothing" validation usually or simple insert.
        // And it doesn't return created objects, just count.
        const leadsToInsert = leadsData.map(l => {
            // Try to detect country from phone if not provided
            let geoData = null;
            if (!l.country && !l.countryCode && l.phone) {
                geoData = GeoLocationService.detectCountryFromPhone(l.phone);
            }
            return {
                firstName: l.firstName,
                lastName: l.lastName || '',
                phone: l.phone,
                email: l.email,
                company: l.company,
                country: l.country || (geoData === null || geoData === void 0 ? void 0 : geoData.country) || undefined,
                countryCode: l.countryCode || (geoData === null || geoData === void 0 ? void 0 : geoData.countryCode) || undefined,
                phoneCountryCode: l.phoneCountryCode || (geoData === null || geoData === void 0 ? void 0 : geoData.phoneCountryCode) || undefined,
                organisationId: orgId,
                assignedToId: l.assignedTo || user.id,
                source: l.source || client_1.LeadSource.import,
                status: l.status || client_1.LeadStatus.new,
                leadScore: l.leadScore || 0
            };
        });
        // Create individually to run Distribution logic (Round Robin updates)
        // prisma.createMany does not support side-effects like DistributionService
        let createdCount = 0;
        for (const data of leadsToInsert) {
            try {
                // Check duplicate if needed or rely on database constraints? 
                // createMany had skipDuplicates: true. 
                // We'll try create and catch error to simulate skipDuplicates
                const lead = yield prisma_1.default.lead.create({ data });
                // Distribute
                yield DistributionService_1.DistributionService.assignLead(lead, orgId);
                // AI Scoring
                Promise.resolve().then(() => __importStar(require('../services/LeadScoringService'))).then(({ LeadScoringService }) => {
                    LeadScoringService.scoreLead(lead.id).catch(console.error);
                });
                createdCount++;
            }
            catch (_a) {
                // Ignore duplicates (unique constraint violations)
                // Console log if needed
            }
        }
        res.status(201).json({
            message: `Successfully imported leads`,
            count: createdCount
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createBulkLeads = createBulkLeads;
const bulkAssignLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { leadIds, assignedTo } = req.body;
        const requester = req.user;
        if (requester.role !== 'super_admin' && requester.role !== 'admin') {
            const allowedIds = yield (0, hierarchyUtils_1.getSubordinateIds)(requester.id);
            if (!allowedIds.includes(assignedTo)) {
                return res.status(403).json({ message: 'Forbidden assignment' });
            }
        }
        const result = yield prisma_1.default.lead.updateMany({
            where: { id: { in: leadIds } },
            data: { assignedToId: assignedTo }
        });
        res.json({ message: 'Assigned successfully', count: result.count });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.bulkAssignLeads = bulkAssignLeads;
const convertLead = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const leadId = id;
        const { dealName, amount, accountId } = req.body; // remove leadId from params here if it was redundant
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No organisation context' });
        const lead = yield prisma_1.default.lead.findUnique({
            where: { id: leadId },
            include: { organisation: true }
        });
        if (!lead)
            return res.status(404).json({ message: 'Lead not found' });
        if (lead.status === client_1.LeadStatus.converted) {
            return res.status(400).json({ message: 'Lead already converted' });
        }
        // 0. Limit Check
        const org = lead.organisation;
        if (org.contactLimit > 0) {
            const contactCount = yield prisma_1.default.contact.count({
                where: { organisationId: orgId, isDeleted: false }
            });
            if (contactCount >= org.contactLimit) {
                return res.status(403).json({
                    message: `Contact limit reached (${org.contactLimit}). Please upgrade your plan.`,
                    code: 'LIMIT_EXCEEDED',
                    limit: org.contactLimit
                });
            }
        }
        const result = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Handle Account
            let targetAccountId = accountId;
            let account;
            if (targetAccountId) {
                account = yield tx.account.findUnique({ where: { id: targetAccountId } });
                if (!account)
                    throw new Error('Target account not found');
            }
            else {
                // Create new Account
                account = yield tx.account.create({
                    data: {
                        name: lead.company || `${lead.firstName} ${lead.lastName}`,
                        organisationId: orgId,
                        ownerId: user.id, // Assign to converter or keep lead owner? Usually converter or specific rule.
                        type: 'customer',
                        phone: lead.phone,
                        address: lead.address
                    }
                });
                targetAccountId = account.id;
            }
            // 2. Create Contact
            const contact = yield tx.contact.create({
                data: {
                    firstName: lead.firstName,
                    lastName: lead.lastName,
                    email: lead.email,
                    phones: lead.phone ? { mobile: lead.phone } : undefined,
                    jobTitle: lead.jobTitle,
                    organisationId: orgId,
                    ownerId: user.id,
                    accountId: targetAccountId,
                    address: lead.address,
                    customFields: lead.customFields // Migrate custom fields
                }
            });
            // 3. Create Opportunity
            const opportunity = yield tx.opportunity.create({
                data: {
                    name: dealName || `Deal - ${lead.company || lead.lastName}`,
                    amount: Number(amount) || 0,
                    stage: 'prospecting', // Default stage
                    organisationId: orgId,
                    ownerId: user.id,
                    accountId: targetAccountId,
                    contacts: { connect: { id: contact.id } }
                }
            });
            // 4. Update Lead
            const updatedLead = yield tx.lead.update({
                where: { id: leadId },
                data: {
                    status: client_1.LeadStatus.converted
                }
            });
            // 5. Migrate Interactions
            yield tx.interaction.updateMany({
                where: { leadId: leadId },
                data: {
                    contactId: contact.id,
                    accountId: targetAccountId
                }
            });
            // 6. Migrate WhatsApp Messages
            yield tx.whatsAppMessage.updateMany({
                where: { leadId: leadId },
                data: {
                    contactId: contact.id
                }
            });
            // 7. Migrate Tasks
            yield tx.task.updateMany({
                where: { leadId: leadId },
                data: {
                    leadId: null, // Unlink from lead
                    contactId: contact.id,
                    accountId: targetAccountId
                }
            });
            return { account, contact, opportunity, lead: updatedLead };
        }));
        // Audit Log for conversion
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'CONVERT_LEAD',
                entity: 'Lead',
                entityId: leadId,
                actorId: user.id,
                organisationId: orgId,
                details: {
                    name: `${lead.firstName} ${lead.lastName}`,
                    company: lead.company,
                    accountId: result.account.id,
                    contactId: result.contact.id,
                    opportunityId: result.opportunity.id
                }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.json({
            message: 'Lead converted successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Lead conversion error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.convertLead = convertLead;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logDebug = (msg) => {
    try {
        const logPath = path_1.default.join(__dirname, '../../debug_crash.log');
        fs_1.default.appendFileSync(logPath, `${new Date().toISOString()} - [Leads] ${msg}\n`);
    }
    catch (e) {
        console.error('Failed to write log', e);
    }
};
const getViolations = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        logDebug('Entered getViolations');
        const user = req.user;
        const pageSize = Number(req.query.pageSize) || 10;
        const page = Number(req.query.page) || 1;
        logDebug(`User: ${user === null || user === void 0 ? void 0 : user.id}, Role: ${user === null || user === void 0 ? void 0 : user.role}`);
        // User sees violations where they were the PREVIOUS owner (the one who failed)
        // OR if they are a manager, seeing violations of their subordinates?
        // Prompt says "user and their managers need to give an explanation".
        const where = {
            rotationViolation: true,
            isDeleted: false,
        };
        if (user.role !== 'super_admin') {
            const orgId = (0, hierarchyUtils_1.getOrgId)(user);
            if (!orgId)
                return res.status(403).json({ message: 'No org' });
            where.organisationId = orgId;
            let subordinateIds = [];
            try {
                logDebug('Fetching subordinates...');
                subordinateIds = yield (0, hierarchyUtils_1.getSubordinateIds)(user.id);
                logDebug(`Subordinates found: ${subordinateIds.length}`);
            }
            catch (subError) {
                logDebug(`Error fetching subordinates: ${subError.message}`);
                console.error('[getViolations] Error fetching subordinates:', subError);
                // Continue with just the user's own violations
            }
            // Logic:
            // 1. I am previousOwner (I failed)
            // 2. I am manager of previousOwner (My report failed)
            // Guard against empty array which causes Prisma issues
            const orConditions = [{ previousOwnerId: user.id }];
            if (subordinateIds.length > 0) {
                // orConditions.push({ previousOwnerId: { in: subordinateIds } });
                // FIX: Use explicit string array to avoid Prisma serialization issues if any
                orConditions.push({ previousOwnerId: { in: subordinateIds } });
            }
            where.OR = orConditions;
        }
        logDebug(`[Leads] Querying Prisma with where: ${JSON.stringify(where)}`);
        const violations = yield prisma_1.default.lead.findMany({
            where,
            include: {
                previousOwner: { select: { firstName: true, lastName: true } },
                assignedTo: { select: { firstName: true, lastName: true } }
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { violationTime: 'desc' }
        });
        logDebug(`[Leads] Violations found: ${violations.length}`);
        const total = yield prisma_1.default.lead.count({ where });
        res.json({ violations, page, pages: Math.ceil(total / pageSize), total });
    }
    catch (error) {
        logDebug(`getViolations CRASHED: ${error.message}\nStack: ${error.stack}`);
        console.error('[getViolations] Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getViolations = getViolations;
const getLeadHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = req.user;
        // Verify access (simple org check)
        const lead = yield prisma_1.default.lead.findUnique({ where: { id } });
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!lead || (orgId && lead.organisationId !== orgId && user.role !== 'super_admin')) {
            return res.status(404).json({ message: 'Lead not found' });
        }
        const history = yield prisma_1.default.leadHistory.findMany({
            where: { leadId: id },
            include: {
                oldOwner: { select: { firstName: true, lastName: true } },
                newOwner: { select: { firstName: true, lastName: true } },
                changedBy: { select: { firstName: true, lastName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getLeadHistory = getLeadHistory;
const submitExplanation = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { leadId, explanation, type } = req.body; // type = 'user' | 'manager'
        const user = req.user;
        const lead = yield prisma_1.default.lead.findUnique({ where: { id: leadId } });
        if (!lead)
            return res.status(404).json({ message: 'Lead not found' });
        if (!lead.rotationViolation) {
            return res.status(400).json({ message: 'This lead is not flagged for violation' });
        }
        const data = {};
        if (type === 'user') {
            if (lead.previousOwnerId !== user.id && user.role !== 'admin') {
                return res.status(403).json({ message: 'Only the previous owner can submit a user explanation' });
            }
            data.userExplanation = explanation;
        }
        else if (type === 'manager') {
            // Check if user is manager of previousOwner
            // Ideally we check hierarchy properly.
            // For MVP, if user is admin or has subordinates including previousOwner
            if (user.role === 'sales_rep') {
                return res.status(403).json({ message: 'Sales reps cannot submit manager explanations' });
            }
            data.managerExplanation = explanation;
        }
        else {
            return res.status(400).json({ message: 'Invalid explanation type' });
        }
        const updatedLead = yield prisma_1.default.lead.update({
            where: { id: leadId },
            data
        });
        res.json(updatedLead);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.submitExplanation = submitExplanation;
const getPendingFollowUpsCount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const now = new Date();
        const endOfToday = new Date(now.setHours(23, 59, 59, 999));
        const where = {
            nextFollowUp: { lte: endOfToday },
            status: { not: client_1.LeadStatus.converted }
        };
        if (user.role !== 'super_admin') {
            const orgId = (0, hierarchyUtils_1.getOrgId)(user);
            if (!orgId)
                return res.status(403).json({ message: 'User has no organisation' });
            where.organisationId = orgId;
        }
        // Daily Briefing is personal
        where.assignedToId = user.id;
        const count = yield prisma_1.default.lead.count({ where });
        res.json({ count });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getPendingFollowUpsCount = getPendingFollowUpsCount;
const generateAIResponse = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { context } = req.body; // e.g. "Draft an intro email"
        const lead = yield prisma_1.default.lead.findUnique({ where: { id } });
        if (!lead)
            return res.status(404).json({ message: 'Lead not found' });
        // Lazy load OpenAI
        const { OpenAI } = yield Promise.resolve().then(() => __importStar(require('openai')));
        if (!process.env.OPENAI_API_KEY) {
            return res.json({ draft: `[Mock AI Draft]\n\nHi ${lead.firstName},\n\nI noticed you work at ${lead.company}. We'd love to chat.\n\nBest,\n[Your Name]` });
        }
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const completion = yield openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful sales assistant. Draft a short, professional email." },
                { role: "user", content: `Lead: ${lead.firstName} ${lead.lastName} from ${lead.company}. Title: ${lead.jobTitle}. Context: ${context || 'Introduction'}` }
            ],
        });
        res.json({ draft: completion.choices[0].message.content });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.generateAIResponse = generateAIResponse;
// GET /api/leads/re-enquiries - Get all re-enquiry leads
const getReEnquiryLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgId = (0, hierarchyUtils_1.getOrgId)(req.user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const { DuplicateLeadService } = yield Promise.resolve().then(() => __importStar(require('../services/DuplicateLeadService')));
        const reEnquiryLeads = yield DuplicateLeadService.getReEnquiryLeads(orgId);
        res.json({
            leads: reEnquiryLeads,
            count: reEnquiryLeads.length
        });
    }
    catch (error) {
        console.error('getReEnquiryLeads Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getReEnquiryLeads = getReEnquiryLeads;
// GET /api/leads/duplicates - Find all duplicate leads
const getDuplicateLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orgId = (0, hierarchyUtils_1.getOrgId)(req.user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const { DuplicateLeadService } = yield Promise.resolve().then(() => __importStar(require('../services/DuplicateLeadService')));
        const duplicates = yield DuplicateLeadService.findDuplicates(orgId);
        res.json({
            duplicates,
            count: duplicates.length
        });
    }
    catch (error) {
        console.error('getDuplicateLeads Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getDuplicateLeads = getDuplicateLeads;
