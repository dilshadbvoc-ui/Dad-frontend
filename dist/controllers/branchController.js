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
exports.deleteBranch = exports.updateBranch = exports.createBranch = exports.getBranches = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
// GET /api/branches
const getBranches = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(403).json({ message: 'User has no organisation' });
        const branches = yield prisma_1.default.branch.findMany({
            where: {
                organisationId: orgId,
                isDeleted: false
            },
            include: {
                manager: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(branches);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getBranches = getBranches;
// POST /api/branches
const createBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const { name, location, contactEmail, contactPhone, managerId } = req.body;
        if (!orgId)
            return res.status(403).json({ message: 'User has no organisation' });
        // Only admins can create branches
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only admins can create branches' });
        }
        const branch = yield prisma_1.default.branch.create({
            data: {
                name,
                location,
                contactEmail,
                contactPhone,
                managerId,
                organisationId: orgId
            }
        });
        res.status(201).json(branch);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createBranch = createBranch;
// PUT /api/branches/:id
const updateBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const { name, location, contactEmail, contactPhone, managerId } = req.body;
        // Check if user has access to this branch
        const branch = yield prisma_1.default.branch.findUnique({ where: { id } });
        if (!branch)
            return res.status(404).json({ message: 'Branch not found' });
        // Only admins can update branches
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only admins can update branches' });
        }
        // Ensure branch belongs to user's org
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (branch.organisationId !== orgId && user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        const updatedBranch = yield prisma_1.default.branch.update({
            where: { id },
            data: {
                name,
                location,
                contactEmail,
                contactPhone,
                managerId
            }
        });
        res.json(updatedBranch);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.updateBranch = updateBranch;
// DELETE /api/branches/:id
const deleteBranch = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const { id } = req.params;
        const branch = yield prisma_1.default.branch.findUnique({ where: { id } });
        if (!branch)
            return res.status(404).json({ message: 'Branch not found' });
        if (user.role !== 'admin' && user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Only admins can delete branches' });
        }
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (branch.organisationId !== orgId && user.role !== 'super_admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        yield prisma_1.default.branch.update({
            where: { id },
            data: { isDeleted: true }
        });
        res.json({ message: 'Branch deleted successfully' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteBranch = deleteBranch;
