
import prisma from '../config/prisma';
import { getIO } from '../socket';

// Singleton helper to get IO instance if not exported globally
// Assuming socket.ts exports initSocket and returns io instance, 
// but we might need a way to access it here. 
// Standard pattern: store io in app.set('io') and access via req, 
// OR export a getter from socket.ts.

// Let's update socket.ts to export a getter first, or use a global variable pattern.
// For now, I'll rely on a getter I will add to socket.ts.

export class NotificationService {
    static async send(recipientId: string, title: string, message: string, type: string = 'info') {
        try {
            // 1. Save to Database
            const notification = await prisma.notification.create({
                data: {
                    recipientId,
                    title,
                    message,
                    type,
                    isRead: false
                }
            });

            // 2. Emit Real-time Event
            const io = getIO();
            if (io) {
                // @ts-ignore
                io.to(recipientId).emit('notification', notification);
                // console.log(`[NotificationService] Sent to ${recipientId}`);
            } else {
                console.warn('[NotificationService] Socket IO not initialized');
            }

            return notification;
        } catch (error) {
            console.error('[NotificationService] Error sending notification:', error);
            throw error;
        }
    }

    static async sendToOrganisation(orgId: string, title: string, message: string, type: string = 'info') {
        // Send to all active users in an organisation
        const users = await prisma.user.findMany({
            where: { organisationId: orgId, isActive: true },
            select: { id: true }
        });

        const promises = users.map(user => this.send(user.id, title, message, type));
        await Promise.all(promises);
    }
}
