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
exports.updateCallSettings = exports.getCallSettings = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
// Get call settings for the organisation (create defaults if not exists)
const getCallSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        // Try to find existing settings
        let settings = yield prisma_1.default.callSettings.findUnique({
            where: { organisationId: orgId }
        });
        // If not exists, create with defaults
        if (!settings) {
            settings = yield prisma_1.default.callSettings.create({
                data: {
                    organisationId: orgId
                }
            });
        }
        res.json(settings);
    }
    catch (error) {
        console.error('Get call settings error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getCallSettings = getCallSettings;
// Update call settings
const updateCallSettings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const { autoRecordOutbound, autoRecordInbound, recordingQuality, storageType, retentionDays, autoDeleteEnabled, popupOnIncoming, autoFollowupReminder, followupDelayMinutes } = req.body;
        // Upsert settings
        const settings = yield prisma_1.default.callSettings.upsert({
            where: { organisationId: orgId },
            update: {
                autoRecordOutbound: autoRecordOutbound !== null && autoRecordOutbound !== void 0 ? autoRecordOutbound : undefined,
                autoRecordInbound: autoRecordInbound !== null && autoRecordInbound !== void 0 ? autoRecordInbound : undefined,
                recordingQuality: recordingQuality !== null && recordingQuality !== void 0 ? recordingQuality : undefined,
                storageType: storageType !== null && storageType !== void 0 ? storageType : undefined,
                retentionDays: retentionDays !== null && retentionDays !== void 0 ? retentionDays : undefined,
                autoDeleteEnabled: autoDeleteEnabled !== null && autoDeleteEnabled !== void 0 ? autoDeleteEnabled : undefined,
                popupOnIncoming: popupOnIncoming !== null && popupOnIncoming !== void 0 ? popupOnIncoming : undefined,
                autoFollowupReminder: autoFollowupReminder !== null && autoFollowupReminder !== void 0 ? autoFollowupReminder : undefined,
                followupDelayMinutes: followupDelayMinutes !== null && followupDelayMinutes !== void 0 ? followupDelayMinutes : undefined
            },
            create: {
                organisationId: orgId,
                autoRecordOutbound: autoRecordOutbound !== null && autoRecordOutbound !== void 0 ? autoRecordOutbound : true,
                autoRecordInbound: autoRecordInbound !== null && autoRecordInbound !== void 0 ? autoRecordInbound : true,
                recordingQuality: recordingQuality !== null && recordingQuality !== void 0 ? recordingQuality : 'high',
                storageType: storageType !== null && storageType !== void 0 ? storageType : 'local',
                retentionDays: retentionDays !== null && retentionDays !== void 0 ? retentionDays : 90,
                autoDeleteEnabled: autoDeleteEnabled !== null && autoDeleteEnabled !== void 0 ? autoDeleteEnabled : false,
                popupOnIncoming: popupOnIncoming !== null && popupOnIncoming !== void 0 ? popupOnIncoming : true,
                autoFollowupReminder: autoFollowupReminder !== null && autoFollowupReminder !== void 0 ? autoFollowupReminder : true,
                followupDelayMinutes: followupDelayMinutes !== null && followupDelayMinutes !== void 0 ? followupDelayMinutes : 30
            }
        });
        res.json(settings);
    }
    catch (error) {
        console.error('Update call settings error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.updateCallSettings = updateCallSettings;
