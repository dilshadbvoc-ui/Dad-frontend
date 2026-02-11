import prisma from './src/config/prisma';

/**
 * Merge IITS organisations
 * This will merge "IITS" into "leadhosthix" and keep iits@iitseducation.com as primary
 */

async function mergeOrganisations() {
    console.log('\n=== MERGE IITS ORGANISATIONS ===\n');
    
    try {
        // Define which to keep and which to merge
        const keepOrgId = 'ed299ebb-455f-4312-a8d8-83b318512cde'; // leadhosthix
        const keepUserId = 'e8fccadc-7402-4f3b-8d86-48a45c4de202'; // iits@iitseducation.com
        
        const deleteOrgId = 'f14f6c41-3229-4628-b666-d1ce683842a6'; // IITS
        const deleteUserId = 'ce8e3946-d9ea-4de3-aef1-aab79111b400'; // iits@iitseducation.org

        console.log('📊 Current State:');
        console.log('  KEEP: iits@iitseducation.com → leadhosthix (2 products, 1 lead)');
        console.log('  MERGE: iits@iitseducation.org → IITS (1 product, 1 lead)');
        console.log('');
        console.log('📦 After merge:');
        console.log('  iits@iitseducation.com → leadhosthix (3 products, 2 leads)');
        console.log('  iits@iitseducation.org → DELETED');
        console.log('  IITS organisation → DELETED');
        console.log('');

        // 1. Move all leads from IITS to leadhosthix
        const leadsUpdated = await prisma.lead.updateMany({
            where: { organisationId: deleteOrgId },
            data: { organisationId: keepOrgId }
        });
        console.log(`✓ Moved ${leadsUpdated.count} leads`);

        // 2. Move all products from IITS to leadhosthix
        const productsUpdated = await prisma.product.updateMany({
            where: { organisationId: deleteOrgId },
            data: { organisationId: keepOrgId }
        });
        console.log(`✓ Moved ${productsUpdated.count} products`);

        // 3. Move all tasks
        const tasksUpdated = await prisma.task.updateMany({
            where: { organisationId: deleteOrgId },
            data: { organisationId: keepOrgId }
        });
        console.log(`✓ Moved ${tasksUpdated.count} tasks`);

        // 4. Move all interactions
        const interactionsUpdated = await prisma.interaction.updateMany({
            where: { organisationId: deleteOrgId },
            data: { organisationId: keepOrgId }
        });
        console.log(`✓ Moved ${interactionsUpdated.count} interactions`);

        // 5. Move all product shares
        const sharesUpdated = await prisma.productShare.updateMany({
            where: { organisationId: deleteOrgId },
            data: { organisationId: keepOrgId }
        });
        console.log(`✓ Moved ${sharesUpdated.count} product shares`);

        // 6. Update the kept organisation name to something clear
        await prisma.organisation.update({
            where: { id: keepOrgId },
            data: { name: 'IITS Education' }
        });
        console.log(`✓ Renamed organisation to "IITS Education"`);

        // 7. Delete the duplicate user (iits@iitseducation.org)
        await prisma.user.delete({
            where: { id: deleteUserId }
        });
        console.log(`✓ Deleted user: iits@iitseducation.org`);

        // 8. Delete the empty organisation
        await prisma.organisation.delete({
            where: { id: deleteOrgId }
        });
        console.log(`✓ Deleted organisation: IITS`);

        console.log('\n✅ Merge completed successfully!\n');
        console.log('📝 Next steps:');
        console.log('  1. Logout on both PCs');
        console.log('  2. Clear browser cache on both PCs');
        console.log('  3. Login with: iits@iitseducation.com');
        console.log('  4. Both PCs will now show the same data');
        console.log('');
        console.log('📊 Final state:');
        console.log('  Email: iits@iitseducation.com');
        console.log('  Organisation: IITS Education');
        console.log('  Products: 3 total');
        console.log('  Leads: 2 total');
        console.log('');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

mergeOrganisations();
