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
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../generated/client");
const prisma = new client_1.PrismaClient();
function createDefaultRule() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. Get the first organization (or specific one if known, but let's target the user's org context)
            // For this script, we'll fetch the first active organisation found.
            const org = yield prisma.organisation.findFirst({
                where: { status: 'active' }
            });
            if (!org) {
                console.error("No active organisation found.");
                return;
            }
            console.log(`Creating default rule for Organisation: ${org.name} (${org.id})`);
            // 2. Create Round Robin Rule
            const rule = yield prisma.assignmentRule.create({
                data: {
                    name: 'Default Round Robin',
                    description: 'Automatically created default rule to distribute leads among sales reps',
                    organisationId: org.id,
                    entity: 'Lead',
                    distributionType: 'round_robin_role', // Using the type supported by DistributionService
                    targetRole: 'sales_rep',
                    isActive: true,
                    priority: 1,
                    enableRotation: true,
                    distributionScope: 'organisation', // Distribute among all sales reps in org
                    criteria: [] // Apply to all leads
                }
            });
            console.log("Created Assignment Rule:", rule);
        }
        catch (error) {
            console.error("Error creating rule:", error);
        }
        finally {
            yield prisma.$disconnect();
        }
    });
}
createDefaultRule();
