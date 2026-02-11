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
exports.verifyApiKey = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const crypto_1 = __importDefault(require("crypto"));
const verifyApiKey = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const apiKey = req.header('X-API-KEY');
        if (!apiKey) {
            return res.status(401).json({ message: 'Missing X-API-KEY header' });
        }
        const keyHash = crypto_1.default.createHash('sha256').update(apiKey).digest('hex');
        const keyRecord = yield prisma_1.default.apiKey.findFirst({
            where: {
                keyHash: keyHash, // Use hashed key
                status: 'active', // Check status enum string
                isDeleted: false
            },
            include: { organisation: true }
        });
        if (!keyRecord) {
            return res.status(401).json({ message: 'Invalid API Key' });
        }
        // Update Usage stats
        // Storing last used in JSON since no column exists
        const currentUsage = keyRecord.usage || {};
        yield prisma_1.default.apiKey.update({
            where: { id: keyRecord.id },
            data: {
                usage: Object.assign(Object.assign({}, currentUsage), { lastUsedAt: new Date().toISOString() })
            }
        });
        // Attach user-like object to request for compatibility
        req.user = {
            id: 'api-user',
            organisationId: keyRecord.organisationId,
            role: 'api_client'
        };
        next();
    }
    catch (_a) {
        res.status(500).json({ message: 'API Key Error' });
    }
});
exports.verifyApiKey = verifyApiKey;
