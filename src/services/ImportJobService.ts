import prisma from '../config/prisma';
import fs from 'fs';
import csv from 'csv-parser';
import { DistributionService } from './DistributionService';

export class ImportJobService {
    static async createJob(userId: string, orgId: string, filePath: string, mapping: any) {
        return await prisma.importJob.create({
            data: {
                createdById: userId,
                organisationId: orgId,
                fileUrl: filePath, // Storing local path for now
                mapping: mapping,
                status: 'pending'
            }
        });
    }

    static async processJob(jobId: string) {
        try {
            const job = await prisma.importJob.findUnique({ where: { id: jobId } });
            if (!job || !job.fileUrl) return;

            // Update status to processing
            await prisma.importJob.update({
                where: { id: jobId },
                data: { status: 'processing', startedAt: new Date() }
            });

            const errors: any[] = [];
            let successCount = 0;
            let failureCount = 0;

            // 1. Count total lines (approximation)
            let totalLines = 0;
            await new Promise((resolve) => {
                fs.createReadStream(job.fileUrl!).pipe(csv())
                    .on('data', () => totalLines++)
                    .on('end', resolve);
            });

            await prisma.importJob.update({
                where: { id: jobId },
                data: { total: totalLines }
            });

            // 2. Process File
            const processStream = fs.createReadStream(job.fileUrl).pipe(csv());

            for await (const row of processStream) {
                try {
                    const leadData: any = {
                        organisationId: job.organisationId,
                        assignedToId: job.createdById, // Default to uploader
                        source: 'import',
                        status: 'new',
                        address: {}
                    };

                    const mapping = job.mapping as any || {};

                    // Map fields
                    for (const [csvHeader, crmField] of Object.entries(mapping)) {
                        if (!crmField) continue;
                        const value = row[csvHeader];
                        if (value === undefined || value === null || value === '') continue;

                        if (String(crmField).startsWith('address.')) {
                            const addressField = String(crmField).split('.')[1];
                            leadData.address[addressField] = value;
                        } else if (['firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle', 'source', 'status'].includes(crmField as string)) {
                            (leadData as any)[crmField as string] = value;
                        } else {
                            // Custom Fields
                            if (!leadData.customFields) leadData.customFields = {};
                            leadData.customFields[crmField as string] = value;
                        }
                    }

                    // Basic Validation
                    if (!leadData.firstName || !leadData.lastName || (!leadData.phone && !leadData.email)) {
                        throw new Error('Missing required fields (Name and at least Phone or Email)');
                    }

                    // Strict Deduplication (Organisation Scoped)
                    const existing = await prisma.lead.findFirst({
                        where: {
                            organisationId: job.organisationId,
                            isDeleted: false,
                            OR: [
                                leadData.phone ? { phone: String(leadData.phone) } : {},
                                leadData.email ? { email: String(leadData.email) } : {}
                            ].filter(q => Object.keys(q).length > 0)
                        }
                    });

                    if (existing) {
                        throw new Error(`Potential duplicate found (Phone/Email: ${leadData.phone || leadData.email})`);
                    }

                    const createdLead = await prisma.lead.create({ data: leadData });

                    // Assign Lead via Rules
                    await DistributionService.assignLead(createdLead, job.organisationId);

                    successCount++;

                } catch (err: any) {
                    failureCount++;
                    errors.push({ row, error: err.message });
                }

                // Update progress every 10 rows
                if ((successCount + failureCount) % 10 === 0) {
                    await prisma.importJob.update({
                        where: { id: jobId },
                        data: {
                            progress: successCount + failureCount,
                            successCount,
                            failureCount
                        }
                    });
                }
            }

            // Final Update
            await prisma.importJob.update({
                where: { id: jobId },
                data: {
                    status: 'completed',
                    completedAt: new Date(),
                    progress: totalLines,
                    successCount,
                    failureCount,
                    errors: errors.length > 0 ? errors : undefined
                }
            });

            // Audit the import completion
            const { logAudit } = await import('../utils/auditLogger');
            await logAudit({
                organisationId: job.organisationId,
                actorId: job.createdById,
                action: 'BULK_IMPORT_COMPLETED',
                entity: 'Lead',
                details: { jobId, successCount, failureCount }
            });

            // Cleanup file
            if (fs.existsSync(job.fileUrl)) {
                fs.unlinkSync(job.fileUrl);
            }

        } catch (error: any) {
            console.error(`Job ${jobId} failed:`, error);
            await prisma.importJob.update({
                where: { id: jobId },
                data: {
                    status: 'failed',
                    completedAt: new Date(),
                    errors: [{ error: error.message }]
                }
            });
        }
    }
}
