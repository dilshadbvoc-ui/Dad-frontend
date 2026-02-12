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
exports.DuplicateLeadService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("../generated/client");
exports.DuplicateLeadService = {
    /**
     * Check for duplicate leads by phone, email, or WhatsApp
     */
    checkDuplicate(phone, email, organisationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Sanitize phone
                const cleanPhone = phone.toString().replace(/\D/g, '');
                // Build OR conditions for duplicate check
                const conditions = [
                    { phone: cleanPhone, organisationId }
                ];
                if (email) {
                    conditions.push({ email, organisationId });
                }
                // Check for existing lead
                const existingLead = yield prisma_1.default.lead.findFirst({
                    where: {
                        OR: conditions,
                        isDeleted: false
                    },
                    include: {
                        assignedTo: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                });
                if (existingLead) {
                    // Determine what matched
                    let matchedBy = 'phone';
                    if (email && existingLead.email === email) {
                        matchedBy = 'email';
                    }
                    else if (existingLead.phone === cleanPhone) {
                        matchedBy = 'phone';
                    }
                    return {
                        isDuplicate: true,
                        existingLead,
                        matchedBy
                    };
                }
                return { isDuplicate: false };
            }
            catch (error) {
                console.error('[DuplicateLeadService] Error checking duplicate:', error);
                throw error;
            }
        });
    },
    /**
     * Handle re-enquiry: Update existing lead and notify owner/manager
     */
    handleReEnquiry(existingLead, newData, organisationId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const now = new Date();
                // Update existing lead
                const updatedLead = yield prisma_1.default.lead.update({
                    where: { id: existingLead.id },
                    data: {
                        status: client_1.LeadStatus.re_enquiry,
                        isReEnquiry: true,
                        reEnquiryCount: { increment: 1 },
                        lastEnquiryDate: now,
                        // Update source details to track re-enquiry
                        sourceDetails: Object.assign(Object.assign({}, (existingLead.sourceDetails || {})), { reEnquiries: [
                                ...(((_a = existingLead.sourceDetails) === null || _a === void 0 ? void 0 : _a.reEnquiries) || []),
                                {
                                    date: now.toISOString(),
                                    source: newData.source,
                                    details: newData.sourceDetails
                                }
                            ] })
                    },
                    include: {
                        assignedTo: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                reportsToId: true
                            }
                        }
                    }
                });
                // Create interaction record for timeline
                yield prisma_1.default.interaction.create({
                    data: {
                        type: 'other',
                        direction: 'inbound',
                        subject: 'Re-Enquiry Received',
                        description: `Lead ${existingLead.firstName} ${existingLead.lastName} has enquired again. This is re-enquiry #${updatedLead.reEnquiryCount}. Previous status: ${existingLead.status}`,
                        date: now,
                        leadId: existingLead.id,
                        createdById: existingLead.assignedToId,
                        organisationId
                    }
                });
                // Notify the assigned owner
                if (updatedLead.assignedToId) {
                    yield this.notifyOwner(updatedLead, organisationId);
                }
                // Notify the manager if exists
                const managerId = (_b = updatedLead.assignedTo) === null || _b === void 0 ? void 0 : _b.reportsToId;
                if (managerId) {
                    yield this.notifyManager(updatedLead, managerId, organisationId);
                }
                console.log(`[DuplicateLeadService] Re-enquiry handled for lead ${existingLead.id}`);
                return updatedLead;
            }
            catch (error) {
                console.error('[DuplicateLeadService] Error handling re-enquiry:', error);
                throw error;
            }
        });
    },
    /**
     * Notify lead owner about re-enquiry
     */
    notifyOwner(lead, organisationId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const { NotificationService } = yield Promise.resolve().then(() => __importStar(require('./NotificationService')));
                const ownerId = lead.assignedToId || ((_a = lead.assignedTo) === null || _a === void 0 ? void 0 : _a.id);
                if (!ownerId) {
                    console.log(`[DuplicateLeadService] No owner to notify for lead ${lead.id}`);
                    return;
                }
                yield NotificationService.send(ownerId, 'Re-Enquiry Alert', `🔄 ${lead.firstName} ${lead.lastName} has enquired again! This is their ${lead.reEnquiryCount}${this.getOrdinalSuffix(lead.reEnquiryCount)} enquiry. The lead is still interested - follow up immediately.`, 'warning');
                console.log(`[DuplicateLeadService] Owner notified for lead ${lead.id}`);
            }
            catch (error) {
                console.error('[DuplicateLeadService] Error notifying owner:', error);
            }
        });
    },
    /**
     * Notify manager about re-enquiry
     */
    notifyManager(lead, managerId, organisationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { NotificationService } = yield Promise.resolve().then(() => __importStar(require('./NotificationService')));
                const ownerName = lead.assignedTo
                    ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
                    : 'Unknown';
                yield NotificationService.send(managerId, 'Team Re-Enquiry Alert', `🔄 Re-enquiry detected: ${lead.firstName} ${lead.lastName} (assigned to ${ownerName}) has enquired again. Re-enquiry count: ${lead.reEnquiryCount}`, 'info');
                console.log(`[DuplicateLeadService] Manager notified for lead ${lead.id}`);
            }
            catch (error) {
                console.error('[DuplicateLeadService] Error notifying manager:', error);
            }
        });
    },
    /**
     * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
     */
    getOrdinalSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11)
            return 'st';
        if (j === 2 && k !== 12)
            return 'nd';
        if (j === 3 && k !== 13)
            return 'rd';
        return 'th';
    },
    /**
     * Find all potential duplicates in the system
     */
    findDuplicates(organisationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find leads with duplicate phone numbers
                const duplicatesByPhone = yield prisma_1.default.$queryRaw `
                SELECT phone, COUNT(*) as count, 
                       array_agg(id) as lead_ids,
                       array_agg("firstName" || ' ' || "lastName") as names
                FROM "Lead"
                WHERE "organisationId" = ${organisationId}
                  AND "isDeleted" = false
                GROUP BY phone
                HAVING COUNT(*) > 1
            `;
                // Find leads with duplicate emails
                const duplicatesByEmail = yield prisma_1.default.$queryRaw `
                SELECT email, COUNT(*) as count,
                       array_agg(id) as lead_ids,
                       array_agg("firstName" || ' ' || "lastName") as names
                FROM "Lead"
                WHERE "organisationId" = ${organisationId}
                  AND "isDeleted" = false
                  AND email IS NOT NULL
                GROUP BY email
                HAVING COUNT(*) > 1
            `;
                return [
                    ...duplicatesByPhone.map(d => (Object.assign(Object.assign({}, d), { type: 'phone' }))),
                    ...duplicatesByEmail.map(d => (Object.assign(Object.assign({}, d), { type: 'email' })))
                ];
            }
            catch (error) {
                console.error('[DuplicateLeadService] Error finding duplicates:', error);
                return [];
            }
        });
    },
    /**
     * Get re-enquiry leads for an organization
     */
    getReEnquiryLeads(organisationId_1) {
        return __awaiter(this, arguments, void 0, function* (organisationId, limit = 50) {
            try {
                const reEnquiryLeads = yield prisma_1.default.lead.findMany({
                    where: {
                        organisationId,
                        isDeleted: false,
                        isReEnquiry: true
                    },
                    include: {
                        assignedTo: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    },
                    orderBy: {
                        lastEnquiryDate: 'desc'
                    },
                    take: limit
                });
                return reEnquiryLeads;
            }
            catch (error) {
                console.error('[DuplicateLeadService] Error getting re-enquiry leads:', error);
                return [];
            }
        });
    }
};
exports.default = exports.DuplicateLeadService;
