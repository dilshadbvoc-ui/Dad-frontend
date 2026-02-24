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
exports.deleteCommission = exports.updateCommission = exports.createCommission = exports.getCommissions = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const getCommissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const commissions = yield prisma_1.default.commission.findMany({
            where: { organisationId: orgId, isDeleted: false },
            orderBy: { createdAt: 'desc' }
        });
        res.json(commissions);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getCommissions = getCommissions;
const createCommission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const commission = yield prisma_1.default.commission.create({
            data: Object.assign(Object.assign({}, req.body), { organisationId: orgId, createdById: user.id })
        });
        res.status(201).json(commission);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createCommission = createCommission;
const updateCommission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const commission = yield prisma_1.default.commission.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(commission);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateCommission = updateCommission;
const deleteCommission = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.commission.update({
            where: { id: req.params.id },
            data: { isDeleted: true }
        });
        res.json({ message: 'Commission deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteCommission = deleteCommission;
