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
exports.getAuditLogs = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getAuditLogs = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { entity, action, userId, startDate, endDate, page = 1, limit = 20 } = req.query;
        // Base where clause - super admin sees all orgs, others see their own
        const where = {};
        if (user.organisationId) {
            where.organisationId = user.organisationId;
        }
        else if (user.role !== 'super_admin') {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        // Filters
        if (entity)
            where.entity = String(entity);
        if (action)
            where.action = String(action);
        if (userId)
            where.actorId = String(userId);
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(String(startDate));
            if (endDate)
                where.createdAt.lte = new Date(String(endDate));
        }
        const skip = (Number(page) - 1) * Number(limit);
        const logs = yield prisma_1.default.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: Number(limit),
            skip,
            include: {
                actor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });
        const total = yield prisma_1.default.auditLog.count({ where });
        res.json({
            logs,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getAuditLogs = getAuditLogs;
