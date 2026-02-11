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
exports.logAudit = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const logAudit = (params) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.auditLog.create({
            data: {
                action: params.action,
                entity: params.entity,
                entityId: params.entityId,
                actorId: params.actorId,
                organisationId: params.organisationId,
                details: params.details || {},
                ipAddress: params.ipAddress,
                userAgent: params.userAgent
            }
        });
    }
    catch (error) {
        // Audit logging should not block main execution flow, so we just log the error
        console.error('Failed to create audit log:', error);
    }
});
exports.logAudit = logAudit;
