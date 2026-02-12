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
exports.MetaLeadService = void 0;
const axios_1 = __importDefault(require("axios"));
const prisma_1 = __importDefault(require("../config/prisma"));
const DistributionService_1 = require("./DistributionService");
const client_1 = require("../generated/client");
exports.MetaLeadService = {
    /**
     * Processes an incoming lead from Meta Webhook
     */
    processIncomingLead(leadgenId, pageId, adId, formId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                console.log(`[MetaLeadService] Processing lead ${leadgenId}...`);
                // 1. Find the organisation connected to this Page ID
                // Try matching valid accounts in metaAccounts array or legacy meta object
                let org = yield prisma_1.default.organisation.findFirst({
                    where: {
                        isDeleted: false,
                        OR: [
                            { integrations: { path: ['meta', 'pageId'], equals: pageId } },
                            // Fallback/Optimization: In production, consider a 'pageIds' array for faster lookup
                        ]
                    }
                });
                // If not found via primary, we might need to scan. 
                // For MVP, if not found, we fetch orgs with metaAccounts and filter.
                if (!org) {
                    const candidates = yield prisma_1.default.organisation.findMany({
                        where: { isDeleted: false, integrations: { path: ['metaAccounts'], not: client_1.Prisma.JsonNull } }
                    });
                    org = candidates.find(o => {
                        var _a;
                        const accounts = (_a = o.integrations) === null || _a === void 0 ? void 0 : _a.metaAccounts;
                        return Array.isArray(accounts) && accounts.some((acc) => acc.pageId === pageId);
                    }) || null;
                }
                if (!org) {
                    console.error(`[MetaLeadService] No organisation found with Meta Page ID: ${pageId}`);
                    return;
                }
                // Extract the correct account config
                const integrations = org.integrations || {};
                const accounts = integrations.metaAccounts || [];
                if (integrations.meta)
                    accounts.push(integrations.meta); // Include legacy/primary
                const matchedAccount = accounts.find((acc) => acc.pageId === pageId);
                if (!matchedAccount || !matchedAccount.accessToken) {
                    console.error(`[MetaLeadService] Organisation ${org.id} has no Access Token for Page ${pageId}`);
                    return;
                }
                const metaConfig = matchedAccount;
                // Proceed using metaConfig.accessToken
                // 2. Fetch Lead details from Meta Graph API
                const response = yield axios_1.default.get(`https://graph.facebook.com/v18.0/${leadgenId}`, {
                    params: {
                        access_token: metaConfig.accessToken
                    }
                });
                const metaLeadData = response.data;
                if (!metaLeadData || !metaLeadData.field_data) {
                    console.error(`[MetaLeadService] No field data found for lead ${leadgenId}`);
                    return;
                }
                // 3. Map Meta field_data to CRM fields
                const fieldMap = {};
                metaLeadData.field_data.forEach((field) => {
                    if (field.values && field.values.length > 0) {
                        fieldMap[field.name] = field.values[0];
                    }
                });
                // Extract country information from Meta lead
                const { GeoLocationService } = yield Promise.resolve().then(() => __importStar(require('./GeoLocationService')));
                const geoData = GeoLocationService.extractCountryFromMetaLead(fieldMap);
                // Common Meta Field Names -> CRM Field Names
                const crmData = {
                    firstName: fieldMap.first_name || ((_a = fieldMap.full_name) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) || 'Meta',
                    lastName: fieldMap.last_name || ((_b = fieldMap.full_name) === null || _b === void 0 ? void 0 : _b.split(' ').slice(1).join(' ')) || 'Lead',
                    email: fieldMap.email || null,
                    phone: fieldMap.phone_number || '', // Will be sanitized in createLead or manually here
                    company: fieldMap.company_name || null,
                    jobTitle: fieldMap.job_title || null,
                    country: (geoData === null || geoData === void 0 ? void 0 : geoData.country) || null,
                    countryCode: (geoData === null || geoData === void 0 ? void 0 : geoData.countryCode) || null,
                    phoneCountryCode: (geoData === null || geoData === void 0 ? void 0 : geoData.phoneCountryCode) || null,
                    source: client_1.LeadSource.meta_leadgen,
                    sourceDetails: {
                        metaLeadgenId: leadgenId,
                        metaFormId: formId,
                        metaAdId: adId,
                        rawMetaFields: fieldMap
                    },
                    status: client_1.LeadStatus.new,
                    organisationId: org.id
                };
                // 4. Sanitize Phone Number (distribution logic needs clean phone)
                if (crmData.phone) {
                    crmData.phone = crmData.phone.toString().replace(/\D/g, '');
                    if (crmData.phone.length > 10) {
                        crmData.phone = crmData.phone.slice(-10);
                    }
                }
                // 5. Check for duplicate (by phone and org)
                const { DuplicateLeadService } = yield Promise.resolve().then(() => __importStar(require('./DuplicateLeadService')));
                const duplicateCheck = yield DuplicateLeadService.checkDuplicate(crmData.phone, crmData.email, org.id);
                if (duplicateCheck.isDuplicate && duplicateCheck.existingLead) {
                    console.log(`[MetaLeadService] Duplicate lead detected. Handling as re-enquiry for lead ${duplicateCheck.existingLead.id}`);
                    // Handle as re-enquiry
                    yield DuplicateLeadService.handleReEnquiry(duplicateCheck.existingLead, {
                        firstName: crmData.firstName,
                        lastName: crmData.lastName,
                        email: crmData.email,
                        phone: crmData.phone,
                        company: crmData.company,
                        source: 'meta_leadgen',
                        sourceDetails: crmData.sourceDetails
                    }, org.id);
                    return;
                }
                // 6. Create the Lead
                const lead = yield prisma_1.default.lead.create({
                    data: crmData
                });
                console.log(`[MetaLeadService] Successfully created lead ${lead.id} from Meta`);
                // 7. Auto-assign via DistributionService
                yield DistributionService_1.DistributionService.assignLead(lead, org.id);
            }
            catch (error) {
                console.error('[MetaLeadService] Error processing Meta lead:', ((_c = error.response) === null || _c === void 0 ? void 0 : _c.data) || error.message);
                throw error;
            }
        });
    }
};
exports.default = exports.MetaLeadService;
