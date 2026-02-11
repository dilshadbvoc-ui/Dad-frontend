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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadDocument = exports.uploadGenericImage = exports.logCallWithoutRecording = exports.uploadCallRecording = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const uploadCallRecording = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        const { phoneNumber, duration, timestamp } = req.body;
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!phoneNumber) {
            // If no phone number, we can't link it easily, but we still save the file.
            // Or we could require it. Let's require it for now as the mobile app should parse it.
            return res.status(400).json({ message: 'Phone number is required' });
        }
        // Clean phone number (remove non-digits, maybe keep +)
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        // 0. Storage Limit Check (basic implementation)
        const org = yield prisma_1.default.organisation.findUnique({
            where: { id: orgId || user.organisationId },
            select: { storageLimit: true }
        });
        if (org && org.storageLimit > 0) {
            // Calculate total storage used by this org
            const totalUsed = yield prisma_1.default.interaction.aggregate({
                where: { organisationId: orgId || user.organisationId, recordingUrl: { not: null } },
                _sum: { recordingDuration: true } // Duration is a proxy, but better to check file size if we tracked it.
                // Since we don't track file size in DB, we'll use a count-based heuristic or just duration sum as placeholder
                // or ideally use fs to check size of uploads/recordings.
                // For now, let's assume 1MB per 60s of recording.
            });
            const estimatedMB = Math.ceil((totalUsed._sum.recordingDuration || 0) / 60);
            if (estimatedMB >= org.storageLimit) {
                return res.status(403).json({
                    message: `Storage limit reached (${org.storageLimit}MB). Please upgrade.`,
                    code: 'STORAGE_LIMIT_EXCEEDED'
                });
            }
        }
        // Find Lead or Contact
        let entityId = null;
        let entityType = null;
        // Try Lead
        const lead = yield prisma_1.default.lead.findFirst({
            where: {
                organisationId: orgId || undefined,
                phone: { contains: cleanPhone } // Loose match
            }
        });
        if (lead) {
            entityId = lead.id;
            entityType = 'lead';
        }
        else {
            // Try Contact (phone is inside JSON usually, but based on recent search fixes, let's try our best)
            // Note: Contact phone search is complex due to JSON. 
            // For now, let's focus on Leads as per prompt requirements usually focusing on Leads.
        }
        // DUPLICATE CHECK
        const existingInteraction = yield prisma_1.default.interaction.findFirst({
            where: {
                recordingUrl: `/uploads/recordings/${req.file.filename}`
            }
        });
        if (existingInteraction) {
            return res.json({
                message: 'Recording already exists',
                interactionId: existingInteraction.id,
                linkedTo: entityType ? `${entityType} ${entityId}` : 'Unlinked (Existing)'
            });
        }
        // Create Interaction
        const interaction = yield prisma_1.default.interaction.create({
            data: {
                organisationId: orgId || user.organisationId, // Fallback
                type: 'call',
                subject: `Recorded Call with ${phoneNumber}`,
                description: `Automatic recording upload. Duration: ${duration || '?'}s`,
                date: new Date(parseInt(timestamp) || Date.now()),
                leadId: entityType === 'lead' ? entityId : undefined,
                // contactId: entityType === 'contact' ? entityId : undefined, // If we supported contacts
                createdById: user.id,
                recordingUrl: `/uploads/recordings/${req.file.filename}`,
                recordingDuration: parseInt(duration) || 0,
                direction: 'outbound', // Assumption for now, or match from mobile params
                phoneNumber: phoneNumber,
                callStatus: 'completed'
            }
        });
        res.json({
            message: 'Recording uploaded successfully',
            interactionId: interaction.id,
            linkedTo: entityType ? `${entityType} ${entityId}` : 'Unlinked'
        });
    }
    catch (error) {
        console.error('[Upload Call] Error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
});
exports.uploadCallRecording = uploadCallRecording;
/**
 * Log a call without a recording (for when Android blocks audio capture)
 * POST /api/upload/log-call
 */
const logCallWithoutRecording = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { phoneNumber, duration, timestamp, subject, description } = req.body;
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!phoneNumber) {
            return res.status(400).json({ message: 'Phone number is required' });
        }
        // Clean phone number
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
        // Find Lead by phone
        const lead = yield prisma_1.default.lead.findFirst({
            where: {
                organisationId: orgId || undefined,
                phone: { contains: cleanPhone }
            }
        });
        // Create Interaction (without recording)
        const interaction = yield prisma_1.default.interaction.create({
            data: {
                organisationId: orgId || user.organisationId,
                type: 'call',
                subject: subject || `Phone Call with ${phoneNumber}`,
                description: description || `Auto-logged call. Duration: ${duration || 0}s. Recording unavailable due to Android restrictions.`,
                date: new Date(parseInt(timestamp) || Date.now()),
                leadId: lead === null || lead === void 0 ? void 0 : lead.id,
                createdById: user.id,
                recordingDuration: parseInt(duration) || 0,
                direction: 'outbound',
                phoneNumber: phoneNumber,
                callStatus: 'completed'
            }
        });
        res.json({
            message: 'Call logged successfully (without recording)',
            interactionId: interaction.id,
            linkedTo: lead ? `lead ${lead.id}` : 'Unlinked'
        });
    }
    catch (error) {
        console.error('[Log Call] Error:', error);
        res.status(500).json({ message: 'Log call failed: ' + error.message });
    }
});
exports.logCallWithoutRecording = logCallWithoutRecording;
const uploadGenericImage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Normalize path for frontend use (replace backslashes)
        const fileUrl = `/uploads/images/${req.file.filename}`.replace(/\\/g, '/');
        res.json({
            message: 'Image uploaded successfully',
            url: fileUrl
        });
    }
    catch (error) {
        console.error('[Upload Image] Error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
});
exports.uploadGenericImage = uploadGenericImage;
const uploadDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        // Normalize path for frontend use (replace backslashes)
        // Check for PDF extension or similar if needed, but multer filter handles it mostly
        const fileUrl = `/uploads/documents/${req.file.filename}`.replace(/\\/g, '/');
        res.json({
            message: 'Document uploaded successfully',
            url: fileUrl,
            originalName: req.file.originalname,
            size: req.file.size
        });
    }
    catch (error) {
        console.error('[Upload Document] Error:', error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
});
exports.uploadDocument = uploadDocument;
