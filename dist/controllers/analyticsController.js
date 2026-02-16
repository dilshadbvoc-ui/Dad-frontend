"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.getUserWiseSales = exports.getSalesBook = exports.getTopPerformers = exports.getAiInsights = exports.getLeadSourceAnalytics = exports.getSalesForecast = exports.getTopLeads = exports.getSalesChartData = exports.getDashboardStats = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const hierarchyUtils_1 = require("../utils/hierarchyUtils");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logDebug = (msg) => {
    try {
        const logPath = path_1.default.join(__dirname, '../../debug_crash.log');
        fs_1.default.appendFileSync(logPath, `${new Date().toISOString()} - ${msg}\n`);
    }
    catch (e) {
        console.error('Failed to write log', e);
    }
};
// Helper to get branch filter
const getBranchFilter = (req) => {
    const branchId = req.query.branchId;
    return branchId ? { branchId } : {};
};
const getDashboardStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    logDebug('Entered getDashboardStats');
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const isSuperAdmin = user.role === 'super_admin';
        logDebug(`[Analytics] User: ${user === null || user === void 0 ? void 0 : user.id}, Org: ${orgId}, SuperAdmin: ${isSuperAdmin}`);
        const branchFilter = getBranchFilter(req);
        // If user is not admin, they might be restricted to their own branch
        // But for now, we trust the query param if valid, or fallback to user's branch if not admin?
        // The requirement is "organisation admin dashboard can see branch vise data"
        // So this is mainly for Admins filtering.
        // If a normal user tries to filter by another branch, they shouldn't see data?
        // For now, let's assume the UI handles visibility validation, and we just filter.
        // But STRICTLY: standard users should default to their own branch if they have one?
        // Existing logic for non-admins filters by `assignedToId` or `ownerId`, which implicitly handles branch (users in branch see their own stuff).
        // So we just add the explicit branch filter.
        logDebug('[Analytics] Importing hierarchyUtils...');
        const { getSubordinateIds } = yield Promise.resolve().then(() => __importStar(require('../utils/hierarchyUtils')));
        logDebug('[Analytics] Fetching subordinateIds...');
        const subordinateIds = yield getSubordinateIds(user.id);
        logDebug(`[Analytics] Subordinates: ${subordinateIds.length}`);
        if (!orgId && !isSuperAdmin) {
            logDebug('[Analytics] No Org ID');
            return res.status(400).json({ message: 'Organisation not found' });
        }
        // Build org filter - super admin sees all orgs
        const orgFilter = orgId ? { organisationId: orgId } : {};
        const combinedFilter = Object.assign(Object.assign({}, orgFilter), branchFilter);
        // Base filter for users who are not admin/super_admin
        const visibilityFilter = {};
        if (!isSuperAdmin && user.role !== 'admin') {
            visibilityFilter.assignedToId = { in: [...subordinateIds, user.id] };
        }
        // Special case for opportunity ownerId vs assignedToId (if schema differs)
        const oppVisibilityFilter = {};
        if (!isSuperAdmin && user.role !== 'admin') {
            oppVisibilityFilter.ownerId = { in: [...subordinateIds, user.id] };
        }
        // Leads
        const totalLeads = yield prisma_1.default.lead.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false }), visibilityFilter)
        });
        const newLeads = yield prisma_1.default.lead.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false, status: 'new' }), visibilityFilter)
        });
        const convertedLeads = yield prisma_1.default.lead.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false, status: 'converted' }), visibilityFilter)
        });
        // Revenue calculation and trend
        const revenueResult = yield prisma_1.default.opportunity.aggregate({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { stage: 'closed_won', isDeleted: false }), oppVisibilityFilter),
            _sum: { amount: true }
        });
        const totalRevenue = revenueResult._sum.amount || 0;
        // Pipeline Value
        const pipelineResult = yield prisma_1.default.opportunity.aggregate({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false }), oppVisibilityFilter),
            _sum: { amount: true }
        });
        const pipelineValue = pipelineResult._sum.amount || 0;
        // Contacts/Accounts
        const totalContacts = yield prisma_1.default.contact.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false }), (!isSuperAdmin && user.role !== 'admin' ? { ownerId: { in: [...subordinateIds, user.id] } } : {}))
        });
        const totalAccounts = yield prisma_1.default.account.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false }), (!isSuperAdmin && user.role !== 'admin' ? { ownerId: { in: [...subordinateIds, user.id] } } : {}))
        });
        // Current Month Dates
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);
        const startOfLastMonth = new Date(startOfMonth);
        startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
        // Previous Month Stats for Trends
        const prevLeads = yield prisma_1.default.lead.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false, createdAt: { gte: startOfLastMonth, lt: startOfMonth } }), visibilityFilter)
        });
        const prevRevenueResult = yield prisma_1.default.opportunity.aggregate({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { stage: 'closed_won', isDeleted: false, closeDate: { gte: startOfLastMonth, lt: startOfMonth } }), oppVisibilityFilter),
            _sum: { amount: true }
        });
        const prevRevenue = prevRevenueResult._sum.amount || 0;
        // Trending Win Rate
        const totalClosedCurrent = yield prisma_1.default.opportunity.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false, stage: { in: ['closed_won', 'closed_lost'] }, closeDate: { gte: startOfMonth } }), oppVisibilityFilter)
        });
        const wonCurrent = yield prisma_1.default.opportunity.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false, stage: 'closed_won', closeDate: { gte: startOfMonth } }), oppVisibilityFilter)
        });
        const currentWinRate = totalClosedCurrent > 0 ? (wonCurrent / totalClosedCurrent) * 100 : 0;
        // Won/Lost for nested object
        const wonTotal = yield prisma_1.default.opportunity.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false, stage: 'closed_won' }), oppVisibilityFilter)
        });
        const lostTotal = yield prisma_1.default.opportunity.count({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false, stage: 'closed_lost' }), oppVisibilityFilter)
        });
        const calculateTrend = (curr, prev) => {
            if (prev === 0)
                return curr > 0 ? 100 : 0;
            return Math.round(((curr - prev) / prev) * 100);
        };
        res.json({
            // Flat structure
            totalLeads,
            activeOpportunities: yield prisma_1.default.opportunity.count({ where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false, stage: { notIn: ['closed_won', 'closed_lost'] } }), oppVisibilityFilter) }),
            salesRevenue: totalRevenue,
            winRate: Math.round(currentWinRate),
            // Trends
            trends: {
                revenue: calculateTrend(totalRevenue, prevRevenue),
                leads: calculateTrend(totalLeads, prevLeads),
                winRate: 0 // Win rate trend requires more historical data, 0 for now
            },
            // Nested structure
            leads: { total: totalLeads, new: newLeads, converted: convertedLeads },
            opportunities: {
                total: yield prisma_1.default.opportunity.count({ where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false }), oppVisibilityFilter) }),
                value: pipelineValue,
                won: wonTotal,
                lost: lostTotal
            },
            contacts: { total: totalContacts },
            accounts: { total: totalAccounts }
        });
    }
    catch (error) {
        logDebug(`getDashboardStats CRASHED: ${error.message}\nStack: ${error.stack}`);
        console.error('getDashboardStats Error:', error);
        res.status(500).json({
            message: error.message,
            debug: 'Check debug_crash.log'
        });
    }
});
exports.getDashboardStats = getDashboardStats;
const getSalesChartData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('[Analytics] Requesting Sales Chart Data');
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const isSuperAdmin = user.role === 'super_admin';
        if (!orgId && !isSuperAdmin) {
            console.error('[Analytics] Org ID missing for user:', user.id);
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const orgFilter = orgId ? { organisationId: orgId } : {};
        const branchFilter = getBranchFilter(req);
        const combinedFilter = Object.assign(Object.assign({}, orgFilter), branchFilter);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Go back 5 months to include current month = 6 total
        sixMonthsAgo.setDate(1); // Start of that month
        sixMonthsAgo.setHours(0, 0, 0, 0);
        // Base filter for visibility
        const visibilityFilter = {};
        if (user.role !== 'admin' && !isSuperAdmin) {
            const { getSubordinateIds } = yield Promise.resolve().then(() => __importStar(require('../utils/hierarchyUtils')));
            const subordinateIds = yield getSubordinateIds(user.id);
            visibilityFilter.ownerId = { in: subordinateIds };
        }
        // Fetch closed_won opportunities
        const wonOpportunities = yield prisma_1.default.opportunity.findMany({
            where: Object.assign(Object.assign(Object.assign(Object.assign({}, combinedFilter), { stage: 'closed_won', isDeleted: false }), visibilityFilter), { OR: [
                    { closeDate: { gte: sixMonthsAgo } },
                    { updatedAt: { gte: sixMonthsAgo } }
                ] }),
            select: {
                amount: true,
                closeDate: true,
                updatedAt: true
            }
        });
        // Initialize last 6 months buckets
        const monthlyData = new Map();
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        for (let i = 0; i < 6; i++) {
            const d = new Date(sixMonthsAgo);
            d.setMonth(d.getMonth() + i);
            const key = `${d.getFullYear()}-${d.getMonth()}`; // Unique key per month-year
            monthlyData.set(key, 0);
        }
        // Fill data
        for (const opp of wonOpportunities) {
            const date = new Date(opp.closeDate || opp.updatedAt);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            if (monthlyData.has(key)) {
                monthlyData.set(key, (monthlyData.get(key) || 0) + (opp.amount || 0));
            }
        }
        // Format for frontend
        const formattedData = Array.from(monthlyData.entries()).map(([key, total]) => {
            const [, monthIndex] = key.split('-').map(Number);
            return {
                name: monthNames[monthIndex],
                total,
                fullDate: key // helpful validation
            };
        });
        console.log(`[Analytics] Sales Chart returning ${formattedData.length} points.`);
        res.json(formattedData);
    }
    catch (error) {
        console.error('getSalesChartData Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getSalesChartData = getSalesChartData;
const getTopLeads = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const isSuperAdmin = user.role === 'super_admin';
        if (!orgId && !isSuperAdmin) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const orgFilter = orgId ? { organisationId: orgId } : {};
        const branchFilter = getBranchFilter(req);
        const combinedFilter = Object.assign(Object.assign({}, orgFilter), branchFilter);
        // Visibility
        const visibilityFilter = {};
        if (!isSuperAdmin && user.role !== 'admin') {
            const { getSubordinateIds } = yield Promise.resolve().then(() => __importStar(require('../utils/hierarchyUtils')));
            const subordinateIds = yield getSubordinateIds(user.id);
            visibilityFilter.assignedToId = { in: [...subordinateIds, user.id] };
        }
        const topLeads = yield prisma_1.default.lead.findMany({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { isDeleted: false }), visibilityFilter),
            orderBy: { leadScore: 'desc' },
            take: 5,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                company: true,
                email: true,
                leadScore: true
            }
        });
        res.json(topLeads);
    }
    catch (error) {
        console.error('getTopLeads Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getTopLeads = getTopLeads;
const getSalesForecast = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const isSuperAdmin = user.role === 'super_admin';
        if (!orgId && !isSuperAdmin) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const orgFilter = orgId ? { organisationId: orgId } : {};
        const branchFilter = getBranchFilter(req);
        const combinedFilter = Object.assign(Object.assign({}, orgFilter), branchFilter);
        // Visibility
        const visibilityFilter = {};
        if (!isSuperAdmin && user.role !== 'admin') {
            const { getSubordinateIds } = yield Promise.resolve().then(() => __importStar(require('../utils/hierarchyUtils')));
            const subordinateIds = yield getSubordinateIds(user.id);
            visibilityFilter.ownerId = { in: subordinateIds };
        }
        // Get open opportunities (not closed_won or closed_lost)
        const openOpportunities = yield prisma_1.default.opportunity.findMany({
            where: Object.assign(Object.assign(Object.assign({}, combinedFilter), { stage: { notIn: ['closed_won', 'closed_lost'] }, isDeleted: false }), visibilityFilter),
            select: {
                amount: true,
                probability: true
            }
        });
        let totalPipeline = 0;
        let weightedForecast = 0;
        for (const opp of openOpportunities) {
            const amount = opp.amount || 0;
            const probability = opp.probability || 0;
            totalPipeline += amount;
            weightedForecast += amount * (probability / 100);
        }
        res.json({
            weightedForecast: Math.round(weightedForecast),
            totalPipeline
        });
    }
    catch (error) {
        console.error('getSalesForecast Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getSalesForecast = getSalesForecast;
const getLeadSourceAnalytics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const isSuperAdmin = user.role === 'super_admin';
        if (!orgId && !isSuperAdmin) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const orgFilter = orgId ? { organisationId: orgId } : {};
        const branchFilter = getBranchFilter(req);
        const combinedFilter = Object.assign(Object.assign({}, orgFilter), branchFilter);
        // Prisma groupBy for lead sources
        const sourceStats = yield prisma_1.default.lead.groupBy({
            by: ['source'],
            where: Object.assign(Object.assign({}, combinedFilter), { isDeleted: false }),
            _count: { source: true },
            orderBy: { _count: { source: 'desc' } }
        });
        const formattedStats = sourceStats.map(stat => ({
            source: stat.source || 'Unknown',
            count: stat._count.source
        }));
        res.json(formattedStats);
    }
    catch (error) {
        console.error('getLeadSourceAnalytics Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getLeadSourceAnalytics = getLeadSourceAnalytics;
const getAiInsights = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log('[Analytics] Requesting AI Insights');
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const isSuperAdmin = user.role === 'super_admin';
        if (!orgId && !isSuperAdmin) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const orgFilter = orgId ? { organisationId: orgId } : {};
        const branchFilter = getBranchFilter(req);
        const combinedFilter = Object.assign(Object.assign({}, orgFilter), branchFilter);
        const insights = [];
        // 1. Top Lead Source Analysis
        const topSource = yield prisma_1.default.lead.groupBy({
            by: ['source'],
            where: Object.assign(Object.assign({}, combinedFilter), { isDeleted: false }),
            _count: { source: true },
            orderBy: { _count: { source: 'desc' } },
            take: 1
        });
        if (topSource.length > 0) {
            insights.push({
                type: 'positive',
                title: `Focus on '${topSource[0].source}' Leads`,
                description: `Leads from ${topSource[0].source} are your top volume source (${topSource[0]._count.source} leads). Consider increasing budget here.`,
                icon: 'Target'
            });
        }
        // 2. Stagnation Check (Deals in 'prospecting' or 'qualified' for > 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const stagnantDeals = yield prisma_1.default.opportunity.count({
            where: Object.assign(Object.assign({}, combinedFilter), { stage: { in: ['prospecting', 'qualified'] }, isDeleted: false, updatedAt: { lt: thirtyDaysAgo } })
        });
        if (stagnantDeals > 0) {
            insights.push({
                type: 'warning',
                title: 'Pipeline Stagnation',
                description: `You have ${stagnantDeals} deals that haven't moved in 30 days. Follow up to unblock revenue.`,
                icon: 'AlertCircle'
            });
        }
        // 3. High Value Deal Alert - Calculate dynamic threshold based on average deal size
        const avgDealResult = yield prisma_1.default.opportunity.aggregate({
            where: Object.assign(Object.assign({}, combinedFilter), { stage: { notIn: ['closed_won', 'closed_lost'] }, isDeleted: false, amount: { gt: 0 } }),
            _avg: { amount: true }
        });
        const avgDealSize = ((_a = avgDealResult._avg) === null || _a === void 0 ? void 0 : _a.amount) || 5000;
        const highValueThreshold = avgDealSize * 2; // Deals worth 2x average are considered high value
        const highValueDeals = yield prisma_1.default.opportunity.findMany({
            where: Object.assign(Object.assign({}, combinedFilter), { stage: { notIn: ['closed_won', 'closed_lost'] }, isDeleted: false, amount: { gt: highValueThreshold } }),
            take: 2,
            orderBy: { amount: 'desc' },
            select: { name: true, amount: true }
        });
        if (highValueDeals.length > 0) {
            const dealNames = highValueDeals.map(d => d.name).join(', ');
            insights.push({
                type: 'info',
                title: 'High Value Opportunities',
                description: `Key focuses: ${dealNames}. Closing these acts as a major revenue booster.`,
                icon: 'TrendingUp'
            });
        }
        // Fallback if no data
        if (insights.length === 0) {
            insights.push({
                type: 'info',
                title: 'Gathering Data',
                description: 'Add more leads and opportunities to generate smart insights.',
                icon: 'Brain'
            });
        }
        res.json(insights);
    }
    catch (error) {
        console.error('getAiInsights Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getAiInsights = getAiInsights;
const getTopPerformers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const isSuperAdmin = user.role === 'super_admin';
        if (!orgId && !isSuperAdmin) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const orgFilter = orgId ? { organisationId: orgId } : {};
        const branchFilter = getBranchFilter(req);
        // User filter needs to be applied to `User` model, but filtered by branch?
        // Users belong to a branch. So we can filter users by branchID.
        const userCombinedFilter = Object.assign(Object.assign({}, orgFilter), branchFilter);
        // For Active users
        const activeFilter = { isActive: true };
        const topUsers = yield prisma_1.default.user.findMany({
            where: Object.assign(Object.assign({}, userCombinedFilter), activeFilter),
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profileImage: true,
                ownedOpportunities: {
                    where: { stage: 'closed_won', isDeleted: false },
                    select: { amount: true }
                }
            }
        });
        const leaderboard = topUsers.map(u => ({
            id: u.id,
            name: `${u.firstName} ${u.lastName}`,
            email: u.email,
            image: u.profileImage,
            totalRevenue: u.ownedOpportunities.reduce((sum, opp) => sum + (opp.amount || 0), 0),
            dealsWon: u.ownedOpportunities.length
        }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 5);
        res.json(leaderboard);
    }
    catch (error) {
        console.error('getTopPerformers Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getTopPerformers = getTopPerformers;
const getSalesBook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const isSuperAdmin = user.role === 'super_admin';
        const { startDate, endDate } = req.query;
        if (!orgId && !isSuperAdmin) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const orgFilter = orgId ? { organisationId: orgId } : {};
        const branchFilter = getBranchFilter(req);
        const combinedFilter = Object.assign(Object.assign({}, orgFilter), branchFilter);
        // Visibility
        const visibilityFilter = {};
        if (!isSuperAdmin && user.role !== 'admin') {
            const { getSubordinateIds } = yield Promise.resolve().then(() => __importStar(require('../utils/hierarchyUtils')));
            const subordinateIds = yield getSubordinateIds(user.id);
            visibilityFilter.ownerId = { in: subordinateIds };
        }
        // Date Filter
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.closeDate = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }
        const sales = yield prisma_1.default.opportunity.findMany({
            where: Object.assign(Object.assign(Object.assign(Object.assign({}, combinedFilter), { stage: 'closed_won', isDeleted: false }), visibilityFilter), dateFilter),
            select: {
                id: true,
                name: true,
                amount: true,
                closeDate: true,
                account: { select: { name: true } },
                owner: { select: { firstName: true, lastName: true } } // Assuming 'owner' relation exists or 'assignedTo'
            },
            orderBy: { closeDate: 'desc' }
        });
        const formattedSales = sales.map(s => {
            var _a;
            return ({
                id: s.id,
                opportunityName: s.name,
                customerName: ((_a = s.account) === null || _a === void 0 ? void 0 : _a.name) || 'N/A',
                amount: s.amount,
                closeDate: s.closeDate,
                ownerName: s.owner ? `${s.owner.firstName} ${s.owner.lastName}` : 'Unknown'
            });
        });
        res.json(formattedSales);
    }
    catch (error) {
        console.error('getSalesBook Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getSalesBook = getSalesBook;
const getUserWiseSales = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = req.user;
        const orgId = (0, hierarchyUtils_1.getOrgId)(user);
        const isSuperAdmin = user.role === 'super_admin';
        const { startDate, endDate } = req.query;
        if (!orgId && !isSuperAdmin) {
            return res.status(400).json({ message: 'Organisation not found' });
        }
        const orgFilter = orgId ? { organisationId: orgId } : {};
        // Branch filter is optional here, usually user-wise report might be global for admin, but let's respect it if passed
        const branchFilter = getBranchFilter(req);
        const combinedFilter = Object.assign(Object.assign({}, orgFilter), branchFilter);
        // Determine scope of users to report on
        let userIdsToReport = [];
        if (!isSuperAdmin && user.role !== 'admin') {
            const { getSubordinateIds } = yield Promise.resolve().then(() => __importStar(require('../utils/hierarchyUtils')));
            userIdsToReport = yield getSubordinateIds(user.id);
        }
        else {
            // Admin sees all active users in org (and optional branch)
            const users = yield prisma_1.default.user.findMany({
                where: Object.assign(Object.assign({}, combinedFilter), { isActive: true }),
                select: { id: true }
            });
            userIdsToReport = users.map(u => u.id);
        }
        // Date Filter for OPPORTUNITIES
        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.closeDate = {
                gte: new Date(String(startDate)),
                lte: new Date(String(endDate))
            };
        }
        // Aggregate per user
        const userStats = yield Promise.all(userIdsToReport.map((uid) => __awaiter(void 0, void 0, void 0, function* () {
            const userDetails = yield prisma_1.default.user.findUnique({
                where: { id: uid },
                select: { firstName: true, lastName: true, email: true }
            });
            if (!userDetails)
                return null;
            const aggregates = yield prisma_1.default.opportunity.aggregate({
                where: Object.assign(Object.assign({ ownerId: uid, stage: 'closed_won', isDeleted: false }, orgFilter), dateFilter),
                _sum: { amount: true },
                _count: { id: true },
                _avg: { amount: true }
            });
            return {
                userId: uid,
                name: `${userDetails.firstName} ${userDetails.lastName}`,
                email: userDetails.email,
                totalRevenue: aggregates._sum.amount || 0,
                dealsCount: aggregates._count.id || 0,
                avgDealSize: Math.round(aggregates._avg.amount || 0)
            };
        })));
        const cleanStats = userStats.filter(s => s !== null).sort((a, b) => ((b === null || b === void 0 ? void 0 : b.totalRevenue) || 0) - ((a === null || a === void 0 ? void 0 : a.totalRevenue) || 0));
        res.json(cleanStats);
    }
    catch (error) {
        console.error('getUserWiseSales Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getUserWiseSales = getUserWiseSales;
