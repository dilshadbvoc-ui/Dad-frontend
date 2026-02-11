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
exports.TaskReminderService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const client_1 = require("../generated/client");
const NotificationService_1 = require("./NotificationService");
class TaskReminderService {
    /**
     * Send reminders for tasks due today or overdue
     */
    static sendDailyReminders() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log('[TaskReminderService] Running daily task reminders...');
                const now = new Date();
                const endOfToday = new Date(now);
                endOfToday.setHours(23, 59, 59, 999);
                // Find pending tasks due today or previously
                const pendingTasks = yield prisma_1.default.task.findMany({
                    where: {
                        status: {
                            in: [client_1.TaskStatus.not_started, client_1.TaskStatus.in_progress]
                        },
                        isDeleted: false,
                        dueDate: {
                            lte: endOfToday
                        },
                        assignedToId: { not: null }
                    },
                    include: {
                        assignedTo: {
                            select: { id: true, firstName: true, lastName: true }
                        }
                    }
                });
                console.log(`[TaskReminderService] Found ${pendingTasks.length} pending tasks for reminders.`);
                for (const task of pendingTasks) {
                    if (!task.assignedToId)
                        continue;
                    const isOverdue = task.dueDate < new Date();
                    const title = isOverdue ? '⚠️ Overdue Task' : '📅 Task Due Today';
                    const message = `Task: "${task.subject}" is ${isOverdue ? 'overdue' : 'due today'}. Please review.`;
                    yield NotificationService_1.NotificationService.send(task.assignedToId, title, message, 'reminder').catch(err => console.error(`[TaskReminderService] Failed to notify user ${task.assignedToId}:`, err));
                }
                return pendingTasks.length;
            }
            catch (error) {
                console.error('[TaskReminderService] Error:', error);
                throw error;
            }
        });
    }
}
exports.TaskReminderService = TaskReminderService;
