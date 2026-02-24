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
exports.submitWebForm = exports.deleteWebForm = exports.updateWebForm = exports.createWebForm = exports.getWebForms = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const getWebForms = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const webForms = yield prisma_1.default.webForm.findMany({
            where: { organisationId: orgId, isDeleted: false },
            orderBy: { createdAt: 'desc' }
        });
        res.json(webForms);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getWebForms = getWebForms;
const createWebForm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const webForm = yield prisma_1.default.webForm.create({
            data: Object.assign(Object.assign({}, req.body), { organisationId: orgId, createdById: user.id })
        });
        res.status(201).json(webForm);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createWebForm = createWebForm;
const updateWebForm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const webForm = yield prisma_1.default.webForm.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(webForm);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateWebForm = updateWebForm;
const deleteWebForm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.webForm.update({
            where: { id: req.params.id },
            data: { isDeleted: true }
        });
        res.json({ message: 'WebForm deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteWebForm = deleteWebForm;
/**
 * Public endpoint for submitting a web form
 * POST /api/public/webforms/:id/submit
 */
const submitWebForm = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const formData = req.body;
        const webForm = yield prisma_1.default.webForm.findUnique({
            where: { id, isDeleted: false }
        });
        if (!webForm || !webForm.isActive) {
            return res.status(404).json({ message: 'Form not found or inactive' });
        }
        const orgId = webForm.organisationId;
        // Sanitize phone
        let cleanPhone = ((_a = formData.phone) === null || _a === void 0 ? void 0 : _a.toString().replace(/\D/g, '')) || '';
        if (cleanPhone.length > 10) {
            cleanPhone = cleanPhone.slice(-10);
        }
        // Check for duplicates
        const { DuplicateLeadService } = yield Promise.resolve().then(() => __importStar(require('../services/DuplicateLeadService')));
        const duplicateCheck = yield DuplicateLeadService.checkDuplicate(cleanPhone, formData.email, orgId);
        if (duplicateCheck.isDuplicate && duplicateCheck.existingLead) {
            // Handle as re-enquiry
            yield DuplicateLeadService.handleReEnquiry(duplicateCheck.existingLead, {
                firstName: formData.firstName || 'Unknown',
                lastName: formData.lastName || '',
                email: formData.email,
                phone: cleanPhone,
                company: formData.company,
                source: 'website',
                sourceDetails: Object.assign({ webFormId: id }, formData.customFields)
            }, orgId);
            return res.status(200).json({
                message: 'Thank you for your interest! We will contact you soon.',
                isReEnquiry: true
            });
        }
        // 1. Create Lead
        const lead = yield prisma_1.default.lead.create({
            data: {
                firstName: formData.firstName || 'Unknown',
                lastName: formData.lastName || '',
                email: formData.email,
                phone: cleanPhone,
                company: formData.company,
                source: 'website',
                organisationId: orgId,
                customFields: Object.assign({ webFormId: id }, formData.customFields)
            }
        });
        // 2. Trigger Distribution
        const { DistributionService } = yield Promise.resolve().then(() => __importStar(require('../services/DistributionService')));
        yield DistributionService.assignLead(lead, orgId);
        // 3. AI Scoring
        const { LeadScoringService } = yield Promise.resolve().then(() => __importStar(require('../services/LeadScoringService')));
        LeadScoringService.scoreLead(lead.id).catch(console.error);
        res.status(201).json({
            message: 'Form submitted successfully',
            leadId: lead.id
        });
    }
    catch (error) {
        console.error('[WebFormSubmit] Error:', error);
        res.status(400).json({ message: error.message });
    }
});
exports.submitWebForm = submitWebForm;
