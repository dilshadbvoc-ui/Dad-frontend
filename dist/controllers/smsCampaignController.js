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
exports.deleteSMSCampaign = exports.updateSMSCampaign = exports.createSMSCampaign = exports.getSMSCampaigns = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const getSMSCampaigns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const campaigns = yield prisma_1.default.sMSCampaign.findMany({
            where: { organisationId: orgId, isDeleted: false },
            orderBy: { createdAt: 'desc' }
        });
        res.json(campaigns);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getSMSCampaigns = getSMSCampaigns;
const createSMSCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const campaign = yield prisma_1.default.sMSCampaign.create({
            data: Object.assign(Object.assign({}, req.body), { organisationId: orgId, createdById: user.id })
        });
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'CREATE_SMS_CAMPAIGN',
                entity: 'SMSCampaign',
                entityId: campaign.id,
                actorId: user.id,
                organisationId: orgId,
                details: { name: campaign.name }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.status(201).json(campaign);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createSMSCampaign = createSMSCampaign;
const updateSMSCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const campaign = yield prisma_1.default.sMSCampaign.update({
            where: {
                id: req.params.id,
                organisationId: orgId
            },
            data: req.body
        });
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'UPDATE_SMS_CAMPAIGN',
                entity: 'SMSCampaign',
                entityId: campaign.id,
                actorId: user.id,
                organisationId: orgId,
                details: { name: campaign.name, updatedFields: Object.keys(req.body) }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.json(campaign);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateSMSCampaign = updateSMSCampaign;
const deleteSMSCampaign = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const campaign = yield prisma_1.default.sMSCampaign.update({
            where: {
                id: req.params.id,
                organisationId: orgId
            },
            data: { isDeleted: true }
        });
        // Audit Log
        try {
            const { logAudit } = yield Promise.resolve().then(() => __importStar(require('../utils/auditLogger')));
            logAudit({
                action: 'DELETE_SMS_CAMPAIGN',
                entity: 'SMSCampaign',
                entityId: req.params.id,
                actorId: user.id,
                organisationId: orgId,
                details: { name: campaign.name }
            });
        }
        catch (e) {
            console.error('Audit Log Error:', e);
        }
        res.json({ message: 'SMS Campaign deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteSMSCampaign = deleteSMSCampaign;
