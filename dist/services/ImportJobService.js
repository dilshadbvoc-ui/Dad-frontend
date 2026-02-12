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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportJobService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const fs_1 = __importDefault(require("fs"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const DistributionService_1 = require("./DistributionService");
class ImportJobService {
    static createJob(userId, orgId, filePath, mapping) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield prisma_1.default.importJob.create({
                data: {
                    createdById: userId,
                    organisationId: orgId,
                    fileUrl: filePath, // Storing local path for now
                    mapping: mapping,
                    status: 'pending'
                }
            });
        });
    }
    static processJob(jobId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, e_1, _b, _c;
            try {
                const job = yield prisma_1.default.importJob.findUnique({ where: { id: jobId } });
                if (!job || !job.fileUrl)
                    return;
                // Update status to processing
                yield prisma_1.default.importJob.update({
                    where: { id: jobId },
                    data: { status: 'processing', startedAt: new Date() }
                });
                const errors = [];
                let successCount = 0;
                let failureCount = 0;
                // 1. Count total lines (approximation)
                let totalLines = 0;
                yield new Promise((resolve) => {
                    fs_1.default.createReadStream(job.fileUrl).pipe((0, csv_parser_1.default)())
                        .on('data', () => totalLines++)
                        .on('end', resolve);
                });
                yield prisma_1.default.importJob.update({
                    where: { id: jobId },
                    data: { total: totalLines }
                });
                // 2. Process File
                const processStream = fs_1.default.createReadStream(job.fileUrl).pipe((0, csv_parser_1.default)());
                try {
                    for (var _d = true, processStream_1 = __asyncValues(processStream), processStream_1_1; processStream_1_1 = yield processStream_1.next(), _a = processStream_1_1.done, !_a; _d = true) {
                        _c = processStream_1_1.value;
                        _d = false;
                        const row = _c;
                        try {
                            const leadData = {
                                organisationId: job.organisationId,
                                assignedToId: job.createdById, // Default to uploader
                                source: 'import',
                                status: 'new',
                                address: {}
                            };
                            const mapping = job.mapping || {};
                            // Map fields
                            for (const [csvHeader, crmField] of Object.entries(mapping)) {
                                if (!crmField)
                                    continue;
                                const value = row[csvHeader];
                                if (value === undefined || value === null || value === '')
                                    continue;
                                if (String(crmField).startsWith('address.')) {
                                    const addressField = String(crmField).split('.')[1];
                                    leadData.address[addressField] = value;
                                }
                                else if (['firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle', 'source', 'status'].includes(crmField)) {
                                    leadData[crmField] = value;
                                }
                                else {
                                    // Custom Fields
                                    if (!leadData.customFields)
                                        leadData.customFields = {};
                                    leadData.customFields[crmField] = value;
                                }
                            }
                            // Basic Validation
                            if (!leadData.firstName || !leadData.lastName || (!leadData.phone && !leadData.email)) {
                                throw new Error('Missing required fields (Name and at least Phone or Email)');
                            }
                            // Sanitize phone
                            if (leadData.phone) {
                                leadData.phone = leadData.phone.toString().replace(/\D/g, '');
                                if (leadData.phone.length > 10) {
                                    leadData.phone = leadData.phone.slice(-10);
                                }
                            }
                            // Check for duplicates using DuplicateLeadService
                            const { DuplicateLeadService } = yield Promise.resolve().then(() => __importStar(require('./DuplicateLeadService')));
                            const duplicateCheck = yield DuplicateLeadService.checkDuplicate(leadData.phone, leadData.email, job.organisationId);
                            if (duplicateCheck.isDuplicate && duplicateCheck.existingLead) {
                                // Handle as re-enquiry instead of creating duplicate
                                yield DuplicateLeadService.handleReEnquiry(duplicateCheck.existingLead, {
                                    firstName: leadData.firstName,
                                    lastName: leadData.lastName,
                                    email: leadData.email,
                                    phone: leadData.phone,
                                    company: leadData.company,
                                    source: 'import',
                                    sourceDetails: { importJobId: jobId }
                                }, job.organisationId);
                                // Count as success (re-enquiry handled)
                                successCount++;
                                continue;
                            }
                            const createdLead = yield prisma_1.default.lead.create({ data: leadData });
                            // Assign Lead via Rules
                            yield DistributionService_1.DistributionService.assignLead(createdLead, job.organisationId);
                            successCount++;
                        }
                        catch (err) {
                            failureCount++;
                            errors.push({ row, error: err.message });
                        }
                        // Update progress every 10 rows
                        if ((successCount + failureCount) % 10 === 0) {
                            yield prisma_1.default.importJob.update({
                                where: { id: jobId },
                                data: {
                                    progress: successCount + failureCount,
                                    successCount,
                                    failureCount
                                }
                            });
                        }
                    }
                }
                catch (e_1_1) { e_1 = { error: e_1_1 }; }
                finally {
                    try {
                        if (!_d && !_a && (_b = processStream_1.return)) yield _b.call(processStream_1);
                    }
                    finally { if (e_1) throw e_1.error; }
                }
                // Final Update
                yield prisma_1.default.importJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'completed',
                        completedAt: new Date(),
                        progress: totalLines,
                        successCount,
                        failureCount,
                        errors: errors.length > 0 ? errors : undefined
                    }
                });
                // Audit the import completion
                const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
                yield logAudit({
                    organisationId: job.organisationId,
                    actorId: job.createdById,
                    action: 'BULK_IMPORT_COMPLETED',
                    entity: 'Lead',
                    details: { jobId, successCount, failureCount }
                });
                // Cleanup file
                if (fs_1.default.existsSync(job.fileUrl)) {
                    fs_1.default.unlinkSync(job.fileUrl);
                }
            }
            catch (error) {
                console.error(`Job ${jobId} failed:`, error);
                yield prisma_1.default.importJob.update({
                    where: { id: jobId },
                    data: {
                        status: 'failed',
                        completedAt: new Date(),
                        errors: [{ error: error.message }]
                    }
                });
            }
        });
    }
}
exports.ImportJobService = ImportJobService;
