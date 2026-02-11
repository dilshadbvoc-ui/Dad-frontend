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
exports.migrateWhatsAppIntegrations = migrateWhatsAppIntegrations;
const prisma_1 = __importDefault(require("../config/prisma"));
/**
 * Migration script to separate WhatsApp configuration from Meta integration
 * This script will:
 * 1. Find organisations with Meta integration that has WhatsApp fields
 * 2. Create separate WhatsApp integration configuration
 * 3. Keep Meta integration for ads functionality only
 */
function migrateWhatsAppIntegrations() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        console.log('Starting WhatsApp integration migration...');
        try {
            // Find all organisations with integrations
            const organisations = yield prisma_1.default.organisation.findMany({
                select: {
                    id: true,
                    name: true,
                    integrations: true
                }
            });
            let migratedCount = 0;
            for (const org of organisations) {
                const integrations = org.integrations;
                // Check if Meta integration has WhatsApp fields
                if (((_a = integrations === null || integrations === void 0 ? void 0 : integrations.meta) === null || _a === void 0 ? void 0 : _a.phoneNumberId) && !(integrations === null || integrations === void 0 ? void 0 : integrations.whatsapp)) {
                    console.log(`Migrating organisation: ${org.name} (${org.id})`);
                    // Create separate WhatsApp configuration
                    const whatsappConfig = {
                        connected: integrations.meta.connected || false,
                        accessToken: integrations.meta.accessToken,
                        phoneNumberId: integrations.meta.phoneNumberId,
                        wabaId: integrations.meta.wabaId
                    };
                    // Clean Meta configuration (remove WhatsApp fields)
                    const metaConfig = {
                        connected: integrations.meta.connected || false,
                        pageId: integrations.meta.pageId,
                        accessToken: integrations.meta.accessToken,
                        adAccountId: integrations.meta.adAccountId
                    };
                    // Update organisation with separated integrations
                    const updatedIntegrations = Object.assign(Object.assign({}, integrations), { meta: metaConfig, whatsapp: whatsappConfig });
                    yield prisma_1.default.organisation.update({
                        where: { id: org.id },
                        data: {
                            integrations: updatedIntegrations
                        }
                    });
                    migratedCount++;
                    console.log(`✓ Migrated ${org.name}`);
                }
                else if (integrations === null || integrations === void 0 ? void 0 : integrations.whatsapp) {
                    console.log(`⚠ Organisation ${org.name} already has separate WhatsApp config`);
                }
                else {
                    console.log(`- Organisation ${org.name} has no WhatsApp integration to migrate`);
                }
            }
            console.log(`\nMigration completed! Migrated ${migratedCount} organisations.`);
        }
        catch (error) {
            console.error('Migration failed:', error);
            throw error;
        }
    });
}
// Run migration if called directly
if (require.main === module) {
    migrateWhatsAppIntegrations()
        .then(() => {
        console.log('Migration script completed successfully');
        process.exit(0);
    })
        .catch((error) => {
        console.error('Migration script failed:', error);
        process.exit(1);
    });
}
