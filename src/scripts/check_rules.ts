import { PrismaClient } from '../generated/client';

const prisma = new PrismaClient();

async function checkRules() {
    try {
        const rules = await prisma.assignmentRule.findMany({
            include: {
                organisation: true
            }
        });

        console.log(`Found ${rules.length} assignment rules.`);
        rules.forEach((rule: any) => {
            console.log(`- Rule: ${rule.name} (Type: ${rule.distributionType}, Org: ${rule.organisation.name}, Active: ${rule.isActive})`);
        });

        if (rules.length === 0) {
            console.log("No assignment rules found. This explains why leads are not being assigned.");
        }
    } catch (error) {
        console.error("Error checking rules:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRules();
