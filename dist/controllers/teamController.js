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
exports.deleteTeam = exports.updateTeam = exports.getTeam = exports.getTeams = exports.createTeam = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const auditLogger_1 = require("../utils/auditLogger");
// Create a new team
const createTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const { name, description, managerId, memberIds } = req.body;
        if (!orgId)
            return res.status(403).json({ message: 'No organisation found' });
        if (!name)
            return res.status(400).json({ message: 'Team name is required' });
        // Verify manager if provided
        if (managerId) {
            const manager = yield prisma_1.default.user.findFirst({
                where: { id: managerId, organisationId: orgId }
            });
            if (!manager)
                return res.status(400).json({ message: 'Invalid manager ID' });
        }
        const team = yield prisma_1.default.team.create({
            data: {
                name,
                description,
                managerId,
                organisationId: orgId,
                createdById: user.id,
                members: {
                    connect: (memberIds === null || memberIds === void 0 ? void 0 : memberIds.map((id) => ({ id }))) || []
                }
            },
            include: {
                members: { select: { id: true, firstName: true, lastName: true, email: true } },
                manager: { select: { id: true, firstName: true, lastName: true } }
            }
        });
        yield (0, auditLogger_1.logAudit)({
            organisationId: orgId,
            actorId: user.id,
            action: 'CREATE_TEAM',
            entity: 'Team',
            entityId: team.id,
            details: { name: team.name }
        });
        res.status(201).json(team);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.createTeam = createTeam;
// Get all teams for organisation
const getTeams = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(403).json({ message: 'No organisation found' });
        const teams = yield prisma_1.default.team.findMany({
            where: { organisationId: orgId, isDeleted: false },
            include: {
                members: { select: { id: true, firstName: true, lastName: true, profileImage: true } },
                manager: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { salesTargets: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(teams);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getTeams = getTeams;
// Get single team
const getTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const team = yield prisma_1.default.team.findFirst({
            where: { id: req.params.id, organisationId: orgId, isDeleted: false },
            include: {
                members: { select: { id: true, firstName: true, lastName: true, email: true, role: true, profileImage: true } },
                manager: { select: { id: true, firstName: true, lastName: true, email: true } },
                salesTargets: {
                    where: { isDeleted: false },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        });
        if (!team)
            return res.status(404).json({ message: 'Team not found' });
        res.json(team);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getTeam = getTeam;
// Update team
const updateTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const { name, description, managerId, memberIds } = req.body;
        const existing = yield prisma_1.default.team.findFirst({
            where: { id: req.params.id, organisationId: orgId, isDeleted: false }
        });
        if (!existing)
            return res.status(404).json({ message: 'Team not found' });
        const team = yield prisma_1.default.team.update({
            where: { id: req.params.id },
            data: {
                name,
                description,
                managerId,
                members: memberIds ? {
                    set: memberIds.map((id) => ({ id }))
                } : undefined
            },
            include: {
                members: { select: { id: true, firstName: true, lastName: true } },
                manager: { select: { id: true, firstName: true, lastName: true } }
            }
        });
        yield (0, auditLogger_1.logAudit)({
            organisationId: orgId,
            actorId: user.id,
            action: 'UPDATE_TEAM',
            entity: 'Team',
            entityId: team.id,
            details: { updatedFields: Object.keys(req.body) }
        });
        res.json(team);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateTeam = updateTeam;
// Delete team
const deleteTeam = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const existing = yield prisma_1.default.team.findFirst({
            where: { id: req.params.id, organisationId: orgId, isDeleted: false }
        });
        if (!existing)
            return res.status(404).json({ message: 'Team not found' });
        yield prisma_1.default.team.update({
            where: { id: req.params.id },
            data: { isDeleted: true }
        });
        yield (0, auditLogger_1.logAudit)({
            organisationId: orgId,
            actorId: user.id,
            action: 'DELETE_TEAM',
            entity: 'Team',
            entityId: req.params.id
        });
        res.json({ message: 'Team deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteTeam = deleteTeam;
