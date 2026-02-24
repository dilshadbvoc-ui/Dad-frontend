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
exports.authorize = exports.admin = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../config/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const roleUtils_1 = require("../utils/roleUtils");
const protect = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret_key_change_this');
            // Fetch user from Postgres using Prisma
            const user = yield prisma_1.default.user.findUnique({
                where: { id: decoded.id },
                include: { organisation: true }
            });
            if (!user) {
                res.status(401).json({ message: 'Not authorized, token failed' });
                return;
            }
            // Exclude password from the object attached to request
            const userWithoutPassword = Object.assign({}, user);
            delete userWithoutPassword.password;
            // Check if user manages any branch
            const branchManaged = yield prisma_1.default.branch.findFirst({
                where: { managerId: user.id, isDeleted: false }
            });
            // Attach user to request
            req.user = Object.assign(Object.assign({}, userWithoutPassword), { isSuperAdmin: (0, roleUtils_1.isSuperAdmin)(user), isBranchManager: !!branchManaged });
            // console.log(`[AuthMiddleware] Authenticated user: ${ user.email } `); 
            return next();
        }
        catch (error) {
            console.error('[AuthMiddleware] Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    // Check for API Key if no Bearer token
    if (!token && req.headers['x-api-key']) {
        try {
            const rawKey = req.headers['x-api-key'];
            // Key format: crm_HEXSTRING (ignore prefix for hash if needed, but model says keyHash stores hash of full key)
            // Model says: verifyKey = sha256 of key.
            const keyHash = crypto_1.default.createHash('sha256').update(rawKey).digest('hex');
            const apiKey = yield prisma_1.default.apiKey.findUnique({
                where: { keyHash, isDeleted: false, status: 'active' }
            });
            if (apiKey) {
                // Update usage stats (optional, could be fire-and-forget)
                // await prisma.apiKey.update({ where: { id: apiKey.id }, data: { usage: { ...apiKey.usage, lastUsedAt: new Date() } } });
                const user = yield prisma_1.default.user.findUnique({
                    where: { id: apiKey.createdById },
                    include: { organisation: true }
                });
                if (user) {
                    const userWithoutPassword = Object.assign({}, user);
                    delete userWithoutPassword.password;
                    // Check if user manages any branch
                    const branchManaged = yield prisma_1.default.branch.findFirst({
                        where: { managerId: user.id, isDeleted: false }
                    });
                    req.user = Object.assign(Object.assign({}, userWithoutPassword), { isSuperAdmin: (0, roleUtils_1.isSuperAdmin)(user), isBranchManager: !!branchManaged });
                    return next();
                }
            }
        }
        catch (error) {
            console.error('[AuthMiddleware] API Key Error:', error);
            // Fallthrough to 401
        }
    }
    if (!token && !req.user) {
        res.status(401).json({ message: 'Not authorized, no token' });
        return;
    }
});
exports.protect = protect;
const admin = (req, res, next) => {
    if (req.user && ((0, roleUtils_1.normalizeRole)(req.user.role) === 'admin' || (0, roleUtils_1.isSuperAdmin)(req.user))) {
        next();
    }
    else {
        res.status(403).json({ message: 'Not authorized as an admin' });
    }
};
exports.admin = admin;
const authorize = (...roles) => {
    return (req, res, next) => {
        var _a;
        const userRole = req.user ? (0, roleUtils_1.normalizeRole)(req.user.role) : '';
        const normRoles = roles.map(r => r.toLowerCase().replace(/[\s-]/g, '_'));
        if (!req.user || !normRoles.includes(userRole)) {
            return res.status(403).json({ message: `User role ${(_a = req.user) === null || _a === void 0 ? void 0 : _a.role} is not authorized` });
        }
        next();
    };
};
exports.authorize = authorize;
