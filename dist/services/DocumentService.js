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
exports.DocumentService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logger_1 = require("../utils/logger");
class DocumentService {
    /**
     * Create a document record and link it to an entity
     */
    static createDocument(data) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { organisationId, createdById, leadId, contactId, accountId, opportunityId } = data, rest = __rest(data, ["organisationId", "createdById", "leadId", "contactId", "accountId", "opportunityId"]);
                const document = yield prisma_1.default.document.create({
                    data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, rest), { organisation: { connect: { id: organisationId } }, createdBy: { connect: { id: createdById } } }), (leadId && { lead: { connect: { id: leadId } } })), (contactId && { contact: { connect: { id: contactId } } })), (accountId && { account: { connect: { id: accountId } } })), (opportunityId && { opportunity: { connect: { id: opportunityId } } }))
                });
                // Log Interaction
                yield prisma_1.default.interaction.create({
                    data: {
                        organisationId,
                        type: 'other',
                        subject: 'Document Uploaded',
                        description: `File "${data.name}" uploaded.`,
                        direction: 'inbound',
                        leadId: leadId || undefined,
                        contactId: contactId || undefined,
                        createdById: createdById || undefined
                    }
                });
                return document;
            }
            catch (error) {
                logger_1.logger.error('DocumentService.createDocument Error:', error);
                throw error;
            }
        });
    }
    /**
     * Get documents for an entity
     */
    static getEntityDocuments(entityType, entityId, orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const where = {
                    organisationId: orgId,
                    isDeleted: false,
                    [`${entityType}Id`]: entityId
                };
                return yield prisma_1.default.document.findMany({
                    where,
                    orderBy: { createdAt: 'desc' }
                });
            }
            catch (error) {
                logger_1.logger.error('DocumentService.getEntityDocuments Error:', error);
                throw error;
            }
        });
    }
    /**
     * Soft delete a document
     */
    static deleteDocument(documentId, orgId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.default.document.update({
                    where: { id: documentId, organisationId: orgId },
                    data: { isDeleted: true }
                });
            }
            catch (error) {
                logger_1.logger.error('DocumentService.deleteDocument Error:', error);
                throw error;
            }
        });
    }
}
exports.DocumentService = DocumentService;
