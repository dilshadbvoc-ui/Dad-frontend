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
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const socket_1 = require("../socket");
const EmailService_1 = require("./EmailService");
// Singleton helper to get IO instance if not exported globally
// Assuming socket.ts exports initSocket and returns io instance, 
// but we might need a way to access it here. 
// Standard pattern: store io in app.set('io') and access via req, 
// OR export a getter from socket.ts.
// Let's update socket.ts to export a getter first, or use a global variable pattern.
// For now, I'll rely on a getter I will add to socket.ts.
class NotificationService {
    static send(recipientId_1, title_1, message_1) {
        return __awaiter(this, arguments, void 0, function* (recipientId, title, message, type = 'info') {
            try {
                // 1. Save to Database
                const notification = yield prisma_1.default.notification.create({
                    data: {
                        recipientId,
                        title,
                        message,
                        type,
                        isRead: false
                    }
                });
                // 2. Emit Real-time Event
                const io = (0, socket_1.getIO)();
                if (io) {
                    io.to(recipientId).emit('notification', notification);
                }
                else {
                    console.warn('[NotificationService] Socket IO not initialized');
                }
                // 3. Email Fallback
                if (type === 'high_priority' || type === 'alert' || type === 'reminder') {
                    const user = yield prisma_1.default.user.findUnique({
                        where: { id: recipientId },
                        select: { email: true, notificationPreferences: true, firstName: true }
                    });
                    const prefs = user === null || user === void 0 ? void 0 : user.notificationPreferences;
                    if ((user === null || user === void 0 ? void 0 : user.email) && (prefs === null || prefs === void 0 ? void 0 : prefs.emailNotifications) !== false) {
                        const emailHtml = `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2>${title}</h2>
                            <p>Hi ${user.firstName},</p>
                            <p>${message}</p>
                            <hr />
                            <small>You received this because email notifications are enabled in your CRM settings.</small>
                        </div>
                    `;
                        yield EmailService_1.EmailService.sendEmail(user.email, `Notification: ${title}`, emailHtml);
                    }
                }
                return notification;
            }
            catch (error) {
                console.error('[NotificationService] Error sending notification:', error);
                throw error;
            }
        });
    }
    static sendToOrganisation(orgId_1, title_1, message_1) {
        return __awaiter(this, arguments, void 0, function* (orgId, title, message, type = 'info') {
            // Send to all active users in an organisation
            const users = yield prisma_1.default.user.findMany({
                where: { organisationId: orgId, isActive: true },
                select: { id: true }
            });
            const promises = users.map(user => this.send(user.id, title, message, type));
            yield Promise.all(promises);
        });
    }
}
exports.NotificationService = NotificationService;
