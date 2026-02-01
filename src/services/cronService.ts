import cron from 'node-cron';
import { prisma } from '../config/prisma';

export const initCronJobs = () => {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('[Cron] Running daily lead rollover...');
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Find leads with nextFollowUp < Today AND status != converted
            const overdueLeads = await prisma.lead.findMany({
                where: {
                    status: { not: 'converted' },
                    nextFollowUp: {
                        lt: today
                    }
                }
            });

            console.log(`[Cron] Found ${overdueLeads.length} leads with overdue follow-ups.`);

            if (overdueLeads.length > 0) {
                // Bulk update to set nextFollowUp to Today
                const updateResult = await prisma.lead.updateMany({
                    where: {
                        status: { not: 'converted' },
                        nextFollowUp: {
                            lt: today
                        }
                    },
                    data: {
                        nextFollowUp: today
                    }
                });

                console.log(`[Cron] Rolled over ${updateResult.count} leads to today.`);
            }
        } catch (error) {
            console.error('[Cron] Error running daily lead rollover:', error);
        }

        console.log('[Cron] Running daily license expiry check...');
        try {
            const { LicenseEnforcementService } = await import('./LicenseEnforcementService');
            await LicenseEnforcementService.enforceExpiry();
        } catch (error) {
            console.error('[Cron] Error running license expiry check:', error);
        }
    });

    console.log('[Cron] Daily lead rollover job scheduled.');

    // Run every day at 09:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('[Cron] Running daily organisation reports...');
        try {
            const { ReportingService } = await import('./ReportingService');
            const { WhatsAppService } = await import('./WhatsAppService');

            const organisations = await prisma.organisation.findMany({
                where: { status: 'active' },
                include: {
                    users: {
                        where: { role: 'admin', isActive: true }
                    }
                }
            });

            for (const org of organisations) {
                try {
                    const stats = await ReportingService.getDailyStats(org.id);
                    const report = ReportingService.formatWhatsAppReport(stats, org.name);

                    // Find primary recipient
                    // 1. Admin with phone
                    // 2. Org contactPhone
                    const adminWithPhone = org.users.find(u => u.phone);
                    const targetPhone = adminWithPhone?.phone || org.contactPhone;

                    if (targetPhone) {
                        const waClient = await WhatsAppService.getClientForOrg(org.id);
                        if (waClient) {
                            console.log(`[Cron] Sending daily report to ${org.name} (${targetPhone})`);
                            await waClient.sendTextMessage(targetPhone, report);
                        } else {
                            console.warn(`[Cron] WhatsApp not connected for ${org.name}, skipping report.`);
                        }
                    } else {
                        console.warn(`[Cron] No contact phone found for organization ${org.name}`);
                    }
                } catch (orgError) {
                    console.error(`[Cron] Error generating report for ${org.name}:`, orgError);
                }
            }
        } catch (error) {
            console.error('[Cron] Error running daily reports:', error);
        }
    });

    console.log('[Cron] Daily organisation reports scheduled.');

    // Run every minute for Workflow Queue
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const pendingItems = await prisma.workflowQueue.findMany({
                where: {
                    status: 'pending',
                    executeAt: { lte: now }
                },
                take: 50 // process in batches
            });

            if (pendingItems.length > 0) {
                console.log(`[Cron] Found ${pendingItems.length} pending workflow items ready to execute.`);

                // Dynamically import to avoid circular dependency issues if any
                const { WorkflowEngine } = await import('./WorkflowEngine');

                for (const item of pendingItems) {
                    // Fire and forget or sequential?
                    // Sequential to simplify load, or promise.all
                    await WorkflowEngine.resumeWorkflow(item.id);
                }
            }
        } catch (error) {
            console.error('[Cron] Error processing workflow queue:', error);
        }
    });

    console.log('[Cron] Workflow Queue processor scheduled.');
};
