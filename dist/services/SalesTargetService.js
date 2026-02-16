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
exports.SalesTargetService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const NotificationService_1 = require("./NotificationService");
class SalesTargetService {
    /**
     * Updates the progress of a user's active targets based on won opportunities.
     * Also handles rolling up progress to parent targets.
     * @param userId The ID of the user (opportunity owner)
     * @param date The date of the opportunity update (usually 'now')
     */
    static updateProgressForUser(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, date = new Date()) {
            try {
                console.log(`[SalesTargetService] Updating progress for user: ${userId}`);
                // 1. Find all active targets (and completed ones to check for regression)
                const activeTargets = yield prisma_1.default.salesTarget.findMany({
                    where: {
                        assignedToId: userId,
                        status: { in: ['active', 'completed'] },
                        isDeleted: false,
                        autoDistributed: false, // Only update leaf nodes
                        startDate: { lte: date },
                        endDate: { gte: date }
                    }
                });
                if (activeTargets.length === 0)
                    return;
                for (const target of activeTargets) {
                    let achievedValue = 0;
                    // Construct filter for Opportunity Type if specified
                    const typeFilter = target.opportunityType ? { type: target.opportunityType } : {};
                    // 2. Calculate based on metric
                    if (target.metric === 'units' || target.productId) {
                        // Calculate from QuoteLineItems (Units or Product Revenue)
                        const aggregation = yield prisma_1.default.quoteLineItem.aggregate({
                            where: {
                                quote: {
                                    opportunity: Object.assign({ ownerId: userId, stage: 'closed_won', isDeleted: false, updatedAt: { gte: target.startDate, lte: target.endDate } }, typeFilter)
                                },
                                productId: target.productId || undefined
                            },
                            _sum: {
                                quantity: true,
                                total: true
                            }
                        });
                        if (target.metric === 'units') {
                            achievedValue = aggregation._sum.quantity || 0;
                        }
                        else {
                            // Revenue for specific product
                            achievedValue = aggregation._sum.total || 0;
                        }
                    }
                    else {
                        // Generic Revenue (Total Opportunity Amount)
                        const aggregation = yield prisma_1.default.opportunity.aggregate({
                            where: Object.assign({ ownerId: userId, stage: 'closed_won', isDeleted: false, updatedAt: {
                                    gte: target.startDate,
                                    lte: target.endDate
                                } }, typeFilter),
                            _sum: {
                                amount: true
                            }
                        });
                        achievedValue = aggregation._sum.amount || 0;
                    }
                    // 3. Update the target logic
                    let newStatus = target.status;
                    // Check for completion
                    if (achievedValue >= target.targetValue && target.status !== 'completed') {
                        newStatus = 'completed';
                        // Notify user
                        try {
                            yield NotificationService_1.NotificationService.send(userId, 'Sales Target Achieved! 🎯', `Congratulations! You have achieved your sales target for ${target.period} (${target.metric || 'revenue'}). Great work!`, 'success');
                        }
                        catch (err) {
                            console.error('[SalesTargetService] Failed to send notification', err);
                        }
                    }
                    else if (achievedValue < target.targetValue && target.status === 'completed') {
                        // Regression (e.g. order cancelled)
                        newStatus = 'active';
                    }
                    console.log(`[SalesTargetService] Target ${target.id}: Achieved ${achievedValue} / ${target.targetValue} (${newStatus})`);
                    // ALWAYS Update
                    yield prisma_1.default.salesTarget.update({
                        where: { id: target.id },
                        data: {
                            achievedValue,
                            status: newStatus
                        }
                    });
                    // Check for hierarchy rollup
                    if (target.parentTargetId) {
                        yield SalesTargetService.rollupToParent(target.parentTargetId);
                    }
                }
            }
            catch (error) {
                console.error('[SalesTargetService] Error updating progress:', error);
            }
        });
    }
    /**
     * Recursively rolls up achieved values to parent targets.
     * @param parentTargetId The ID of the parent target
     */
    static rollupToParent(parentTargetId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const parentTarget = yield prisma_1.default.salesTarget.findUnique({
                    where: { id: parentTargetId }
                });
                if (!parentTarget || parentTarget.isDeleted)
                    return;
                // Sum achieved values from children
                const childAggregation = yield prisma_1.default.salesTarget.aggregate({
                    where: {
                        parentTargetId: parentTargetId,
                        isDeleted: false
                    },
                    _sum: {
                        achievedValue: true
                    }
                });
                const totalChildAchieved = childAggregation._sum.achievedValue || 0;
                console.log(`[SalesTargetService] Rolling up to parent ${parentTargetId}: Child Sum = ${totalChildAchieved}`);
                const updateData = { achievedValue: totalChildAchieved };
                if (totalChildAchieved >= parentTarget.targetValue && parentTarget.status !== 'completed') {
                    updateData.status = 'completed';
                    // Notify parent... skipped
                }
                else if (totalChildAchieved < parentTarget.targetValue && parentTarget.status === 'completed') {
                    updateData.status = 'active';
                }
                yield prisma_1.default.salesTarget.update({
                    where: { id: parentTargetId },
                    data: updateData
                });
                // Recursively go up
                if (parentTarget.parentTargetId) {
                    yield this.rollupToParent(parentTarget.parentTargetId);
                }
            }
            catch (error) {
                console.error('[SalesTargetService] Error rolling up to parent:', error);
            }
        });
    }
}
exports.SalesTargetService = SalesTargetService;
