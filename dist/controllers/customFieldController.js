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
exports.deleteCustomField = exports.updateCustomField = exports.createCustomField = exports.getCustomFields = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const auditLogger_1 = require("../utils/auditLogger");
const getCustomFields = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const entityType = req.query.entity;
        if (!orgId)
            return res.status(400).json({ message: 'No organisation' });
        const where = {
            organisationId: orgId,
            isDeleted: false
        };
        if (entityType) {
            where.entityType = entityType;
        }
        const customFields = yield prisma_1.default.customField.findMany({
            where,
            orderBy: { order: 'asc' }
        });
        res.json({ customFields });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getCustomFields = getCustomFields;
const createCustomField = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No organisation' });
        const customField = yield prisma_1.default.customField.create({
            data: {
                name: req.body.name,
                label: req.body.label,
                entityType: req.body.entityType,
                fieldType: req.body.fieldType,
                options: req.body.options || [],
                isRequired: req.body.isRequired || false,
                defaultValue: req.body.defaultValue,
                placeholder: req.body.placeholder,
                order: req.body.order || 0,
                isActive: true,
                showInList: req.body.showInList || false,
                showInForm: req.body.showInForm !== false,
                organisation: { connect: { id: orgId } },
                createdBy: { connect: { id: user.id } }
            }
        });
        yield (0, auditLogger_1.logAudit)({
            organisationId: orgId,
            actorId: user.id,
            action: 'CREATE_CUSTOM_FIELD',
            entity: 'CustomField',
            entityId: customField.id,
            details: { label: customField.label, entityType: customField.entityType }
        });
        res.status(201).json(customField);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createCustomField = createCustomField;
const updateCustomField = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No organisation' });
        const customField = yield prisma_1.default.customField.update({
            where: {
                id: req.params.id,
                organisationId: orgId
            },
            data: req.body
        });
        yield (0, auditLogger_1.logAudit)({
            organisationId: orgId,
            actorId: user.id,
            action: 'UPDATE_CUSTOM_FIELD',
            entity: 'CustomField',
            entityId: customField.id,
            details: { label: customField.label, updatedFields: Object.keys(req.body) }
        });
        res.json(customField);
    }
    catch (error) {
        if (error.code === 'P2025')
            return res.status(404).json({ message: 'Custom field not found' });
        res.status(500).json({ message: error.message });
    }
});
exports.updateCustomField = updateCustomField;
const deleteCustomField = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No organisation' });
        yield prisma_1.default.customField.update({
            where: {
                id: req.params.id,
                organisationId: orgId
            },
            data: { isDeleted: true }
        });
        yield (0, auditLogger_1.logAudit)({
            organisationId: orgId,
            actorId: user.id,
            action: 'DELETE_CUSTOM_FIELD',
            entity: 'CustomField',
            entityId: req.params.id
        });
        res.json({ message: 'Custom field deleted' });
    }
    catch (error) {
        if (error.code === 'P2025')
            return res.status(404).json({ message: 'Custom field not found' });
        res.status(500).json({ message: error.message });
    }
});
exports.deleteCustomField = deleteCustomField;
