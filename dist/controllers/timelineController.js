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
exports.getTimeline = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const getTimeline = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id, type } = req.params; // type = 'lead' | 'contact' | 'account'
        // Basic validation
        if (!['lead', 'contact', 'account'].includes(type) || !id) {
            return res.status(400).json({ message: 'Invalid entity type or ID' });
        }
        // Fetch related data concurrently
        const [interactions, tasks, events, auditLogs] = yield Promise.all([
            prisma_1.default.interaction.findMany({
                where: { [`${type}Id`]: id },
                orderBy: { date: 'desc' },
                include: { createdBy: { select: { firstName: true, lastName: true } } }
            }),
            prisma_1.default.task.findMany({
                where: { [`${type}Id`]: id },
                orderBy: { createdAt: 'desc' },
                include: { assignedTo: { select: { firstName: true, lastName: true } } }
            }),
            prisma_1.default.calendarEvent.findMany({
                where: { [`${type}Id`]: id },
                orderBy: { startTime: 'desc' },
                include: { createdBy: { select: { firstName: true, lastName: true } } }
            }),
            prisma_1.default.auditLog.findMany({
                where: { entityId: id }, // AuditLog stores entityId generically
                orderBy: { createdAt: 'desc' },
                include: { actor: { select: { firstName: true, lastName: true } } }
            })
        ]);
        // Normalize data for UI
        const timeline = [
            ...interactions.map(i => ({
                id: i.id,
                type: 'interaction',
                subType: i.type, // call, email, meeting
                title: i.subject,
                description: i.description,
                date: i.date,
                actor: i.createdBy,
                meta: { direction: i.direction }
            })),
            ...tasks.map(t => ({
                id: t.id,
                type: 'task',
                subType: t.status, // not_started, in_progress, etc.
                title: t.subject,
                description: t.description,
                date: t.dueDate || t.createdAt,
                actor: t.assignedTo,
                meta: { priority: t.priority }
            })),
            ...events.map(e => ({
                id: e.id,
                type: 'event',
                subType: e.type,
                title: e.title,
                description: e.description,
                date: e.startTime,
                actor: e.createdBy,
                meta: { location: e.location }
            })),
            ...auditLogs.map(a => ({
                id: a.id,
                type: 'audit',
                subType: a.action,
                title: `${a.action} ${a.entity}`,
                description: JSON.stringify(a.details),
                date: a.createdAt,
                actor: a.actor,
                meta: {}
            }))
        ];
        // Sort by date descending
        timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        res.json(timeline);
    }
    catch (error) {
        console.error('Timeline Error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.getTimeline = getTimeline;
