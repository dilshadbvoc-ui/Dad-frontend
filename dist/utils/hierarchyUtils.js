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
exports.getOrgId = exports.getVisibleUserIds = exports.getSubordinateIds = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
/**
 * Recursively fetches all subordinate user IDs for a given user.
 * @param userId The ID of the manager/user.
 * @returns Array of user IDs including the manager themselves.
 */
const getSubordinateIds = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Start with the user themselves
    const subordinateIds = [userId.toString()];
    // 2. Queue for BFS/DFS traversing
    const queue = [userId.toString()];
    while (queue.length > 0) {
        const currentManagerId = queue.shift();
        // Find direct reports using Prisma
        const directReports = yield prisma_1.default.user.findMany({
            where: { reportsToId: currentManagerId },
            select: { id: true }
        });
        for (const report of directReports) {
            const reportId = report.id;
            // Avoid infinite loops if circular dependency exists
            if (!subordinateIds.includes(reportId)) {
                subordinateIds.push(reportId);
                queue.push(reportId);
            }
        }
    }
    return subordinateIds;
});
exports.getSubordinateIds = getSubordinateIds;
/**
 * Safely extracts the Organisation ID as a string from a user object.
 * Handles both Prisma objects (flat or included) and potential legacy inputs.
 */
/**
 * Returns all user IDs that _userId_ is allowed to see.
 * Combines:
 *  1. The user themselves + all subordinates (reportsTo chain via BFS)
 *  2. All users in branches the user manages (BranchManager relation)
 */
const getVisibleUserIds = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    // 1. Subordinates via reporting chain
    const subordinateIds = yield (0, exports.getSubordinateIds)(userId);
    // 2. Users in managed branches
    const managedBranches = yield prisma_1.default.branch.findMany({
        where: { managerId: userId, isDeleted: false },
        select: { id: true }
    });
    if (managedBranches.length > 0) {
        const branchIds = managedBranches.map(b => b.id);
        const branchUsers = yield prisma_1.default.user.findMany({
            where: { branchId: { in: branchIds } },
            select: { id: true }
        });
        for (const u of branchUsers) {
            if (!subordinateIds.includes(u.id)) {
                subordinateIds.push(u.id);
            }
        }
    }
    return subordinateIds;
});
exports.getVisibleUserIds = getVisibleUserIds;
const getOrgId = (user) => {
    if (!user)
        return null;
    // Prisma style: user.organisationId (if flat) or user.organisation.id (if included)
    if (user.organisationId)
        return user.organisationId;
    if (user.organisation && user.organisation.id)
        return user.organisation.id;
    // Legacy Mongoose fallback (just in case)
    if (user.organisation && user.organisation._id)
        return user.organisation._id.toString();
    if (user.organisation)
        return user.organisation.toString();
    return null;
};
exports.getOrgId = getOrgId;
