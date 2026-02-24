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
/**
 * Get all custom fields for an entity type
 * GET /api/custom-fields?entityType=Lead
 */
const getCustomFields = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { entityType } = req.query;
        const organisationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organisationId;
        if (!organisationId) {
            return res.status(400).json({ message: 'Organisation ID is required' });
        }
        const where = {
            organisationId,
            isDeleted: false
        };
        if (entityType) {
            where.entityType = entityType;
        }
        const customFields = yield prisma_1.default.customField.findMany({
            where,
            orderBy: [
                { order: 'asc' },
                { createdAt: 'asc' }
            ],
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        res.json(customFields);
    }
    catch (error) {
        console.error('Error fetching custom fields:', error);
        res.status(500).json({ message: 'Failed to fetch custom fields', error: error.message });
    }
});
exports.getCustomFields = getCustomFields;
/**
 * Create a new custom field
 * POST /api/custom-fields
 */
const createCustomField = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { name, label, entityType, fieldType, options, isRequired, defaultValue, placeholder, order, isActive, showInList, showInForm } = req.body;
        const organisationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organisationId;
        const createdById = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
        if (!organisationId || !createdById) {
            return res.status(400).json({ message: 'Organisation ID and User ID are required' });
        }
        // Validate required fields
        if (!name || !label || !entityType || !fieldType) {
            return res.status(400).json({
                message: 'Name, label, entityType, and fieldType are required'
            });
        }
        // Validate field name format
        const fieldNameRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
        if (!fieldNameRegex.test(name)) {
            return res.status(400).json({
                message: 'Field name must start with a letter or underscore and contain only letters, numbers, and underscores'
            });
        }
        // Check for reserved field names
        const reservedNames = [
            'id', 'createdAt', 'updatedAt', 'organisationId', 'createdById',
            'isDeleted', 'deletedAt', 'customFields'
        ];
        if (reservedNames.includes(name)) {
            return res.status(400).json({
                message: `Field name '${name}' is reserved and cannot be used`
            });
        }
        // Validate field type
        const validFieldTypes = [
            'text', 'textarea', 'number', 'date', 'select', 'multiselect',
            'boolean', 'email', 'phone', 'url'
        ];
        if (!validFieldTypes.includes(fieldType)) {
            return res.status(400).json({
                message: `Invalid field type. Must be one of: ${validFieldTypes.join(', ')}`
            });
        }
        // Validate entity type
        const validEntityTypes = ['Lead', 'Contact', 'Account', 'Opportunity'];
        if (!validEntityTypes.includes(entityType)) {
            return res.status(400).json({
                message: `Invalid entity type. Must be one of: ${validEntityTypes.join(', ')}`
            });
        }
        // Validate options for select/multiselect
        if ((fieldType === 'select' || fieldType === 'multiselect') && (!options || options.length === 0)) {
            return res.status(400).json({
                message: 'Options are required for select and multiselect field types'
            });
        }
        // Check if field name already exists for this entity type and organization
        const existingField = yield prisma_1.default.customField.findFirst({
            where: {
                name,
                entityType,
                organisationId,
                isDeleted: false
            }
        });
        if (existingField) {
            return res.status(400).json({
                message: `A field with name '${name}' already exists for ${entityType}`
            });
        }
        // Create the custom field
        const customField = yield prisma_1.default.customField.create({
            data: {
                name,
                label,
                entityType,
                fieldType,
                options: options || [],
                isRequired: isRequired || false,
                defaultValue,
                placeholder,
                order: order || 0,
                isActive: isActive !== undefined ? isActive : true,
                showInList: showInList || false,
                showInForm: showInForm !== undefined ? showInForm : true,
                organisationId,
                createdById
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        res.status(201).json(customField);
    }
    catch (error) {
        console.error('Error creating custom field:', error);
        res.status(500).json({ message: 'Failed to create custom field', error: error.message });
    }
});
exports.createCustomField = createCustomField;
/**
 * Update a custom field
 * PUT /api/custom-fields/:id
 */
const updateCustomField = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const { label, options, isRequired, defaultValue, placeholder, order, isActive, showInList, showInForm } = req.body;
        const organisationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organisationId;
        if (!organisationId) {
            return res.status(400).json({ message: 'Organisation ID is required' });
        }
        // Check if field exists and belongs to the organization
        const existingField = yield prisma_1.default.customField.findFirst({
            where: {
                id,
                organisationId,
                isDeleted: false
            }
        });
        if (!existingField) {
            return res.status(404).json({ message: 'Custom field not found' });
        }
        // Validate options for select/multiselect if provided
        if (options && (existingField.fieldType === 'select' || existingField.fieldType === 'multiselect')) {
            if (options.length === 0) {
                return res.status(400).json({
                    message: 'Options cannot be empty for select and multiselect field types'
                });
            }
        }
        // Update the custom field
        const updatedField = yield prisma_1.default.customField.update({
            where: { id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (label && { label })), (options && { options })), (isRequired !== undefined && { isRequired })), (defaultValue !== undefined && { defaultValue })), (placeholder !== undefined && { placeholder })), (order !== undefined && { order })), (isActive !== undefined && { isActive })), (showInList !== undefined && { showInList })), (showInForm !== undefined && { showInForm })),
            include: {
                createdBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        res.json(updatedField);
    }
    catch (error) {
        console.error('Error updating custom field:', error);
        res.status(500).json({ message: 'Failed to update custom field', error: error.message });
    }
});
exports.updateCustomField = updateCustomField;
/**
 * Delete a custom field (soft delete)
 * DELETE /api/custom-fields/:id
 */
const deleteCustomField = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const organisationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organisationId;
        if (!organisationId) {
            return res.status(400).json({ message: 'Organisation ID is required' });
        }
        // Check if field exists and belongs to the organization
        const existingField = yield prisma_1.default.customField.findFirst({
            where: {
                id,
                organisationId,
                isDeleted: false
            }
        });
        if (!existingField) {
            return res.status(404).json({ message: 'Custom field not found' });
        }
        // Soft delete the custom field
        yield prisma_1.default.customField.update({
            where: { id },
            data: {
                isDeleted: true,
                isActive: false
            }
        });
        res.json({ message: 'Custom field deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting custom field:', error);
        res.status(500).json({ message: 'Failed to delete custom field', error: error.message });
    }
});
exports.deleteCustomField = deleteCustomField;
