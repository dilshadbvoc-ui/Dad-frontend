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
exports.getCheckIns = exports.createCheckIn = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const createCheckIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const { type, notes, photoUrl, leadId, contactId, accountId, location } = req.body;
        // Handle both flat and nested location structures
        const rawLat = (_a = location === null || location === void 0 ? void 0 : location.latitude) !== null && _a !== void 0 ? _a : req.body.latitude;
        const rawLng = (_b = location === null || location === void 0 ? void 0 : location.longitude) !== null && _b !== void 0 ? _b : req.body.longitude;
        const rawAddr = (_c = location === null || location === void 0 ? void 0 : location.address) !== null && _c !== void 0 ? _c : req.body.address;
        const latitude = rawLat !== undefined ? parseFloat(String(rawLat)) : null;
        const longitude = rawLng !== undefined ? parseFloat(String(rawLng)) : null;
        let address = rawAddr;
        const userId = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id;
        const organisationId = (_e = req.user) === null || _e === void 0 ? void 0 : _e.organisationId;
        if (!userId || !organisationId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Reverse Geocoding if address is missing or placeholder
        if ((!address || address === 'Fetching address...') && latitude && longitude) {
            try {
                // Use global fetch (Node 18+) or ensure node-fetch is available
                const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
                const geoRes = yield fetch(nominatimUrl, {
                    headers: { 'User-Agent': 'LeadHostix-CRM/1.0' }
                });
                const geoData = yield geoRes.json();
                if (geoData && geoData.display_name) {
                    address = geoData.display_name;
                }
            }
            catch (geoError) {
                console.error('Reverse Geocoding Failed:', geoError);
                // Fallback to coordinates string if geocoding fails
                if (!address)
                    address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            }
        }
        const checkIn = yield prisma_1.default.checkIn.create({
            data: {
                type,
                latitude,
                longitude,
                address,
                notes,
                photoUrl,
                userId,
                organisationId,
                leadId,
                contactId,
                accountId
            },
            include: {
                user: { select: { firstName: true, lastName: true } }
            }
        });
        res.status(201).json(checkIn);
    }
    catch (error) {
        console.error('Error creating check-in:', error);
        res.status(500).json({ error: 'Failed to create check-in' });
    }
});
exports.createCheckIn = createCheckIn;
const getCheckIns = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const organisationId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.organisationId;
        const { date, userId } = req.query;
        if (!organisationId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const where = { organisationId };
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            where.createdAt = {
                gte: startDate,
                lte: endDate
            };
        }
        if (userId) {
            where.userId = userId;
        }
        const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
        const offset = req.query.offset ? parseInt(req.query.offset) : undefined;
        const checkIns = yield prisma_1.default.checkIn.findMany({
            where,
            include: {
                user: { select: { firstName: true, lastName: true } },
                lead: { select: { firstName: true, lastName: true, company: true } },
                contact: { select: { firstName: true, lastName: true } },
                account: { select: { name: true } }
            },
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' }
        });
        res.json(checkIns);
    }
    catch (error) {
        console.error('Error fetching check-ins:', error);
        res.status(500).json({ error: 'Failed to fetch check-ins' });
    }
});
exports.getCheckIns = getCheckIns;
