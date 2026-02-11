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
exports.deleteLandingPage = exports.updateLandingPage = exports.createLandingPage = exports.getLandingPages = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const getLandingPages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const pages = yield prisma_1.default.landingPage.findMany({
            where: { organisationId: orgId, isDeleted: false },
            orderBy: { createdAt: 'desc' }
        });
        res.json(pages);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.getLandingPages = getLandingPages;
const createLandingPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        if (!orgId)
            return res.status(400).json({ message: 'No org' });
        const page = yield prisma_1.default.landingPage.create({
            data: Object.assign(Object.assign({}, req.body), { organisationId: orgId, createdById: user.id })
        });
        res.status(201).json(page);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }
});
exports.createLandingPage = createLandingPage;
const updateLandingPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const page = yield prisma_1.default.landingPage.update({
            where: { id: req.params.id },
            data: req.body
        });
        res.json(page);
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.updateLandingPage = updateLandingPage;
const deleteLandingPage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma_1.default.landingPage.update({
            where: { id: req.params.id },
            data: { isDeleted: true }
        });
        res.json({ message: 'Landing Page deleted' });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
exports.deleteLandingPage = deleteLandingPage;
