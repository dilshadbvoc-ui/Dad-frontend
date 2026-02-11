import prisma from './src/config/prisma';
import readline from 'readline';

/**
 * Fix duplicate user accounts with same email
 * This script will:
 * 1. Find users with duplicate emails
 * 2. Let you choose which organisation to keep
 * 3. Merge all data into one organisation
 * 4. Delete the duplicate user and organisation
 */

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query: string): Promise<string> {
    return new Promise(resolve => rl.question(query, resolve));
}

async function fixDuplicateUsers() {
    console.log('\n=== DUPLICATE USER FIX TOOL ===\n');
    
    try {
        // Find all users grouped by email
        const allUsers = await prisma.user.findMany({
            include: {
                organisation: {
                    include: {
                        _count: {
                            select: {
                                users: true,
                                leads: true,
                                products: true
                            }
                        }
                    }
                }
            },
            orderBy: { email: 'asc' }
        });

        // Group by email
        const emailGroups = allUsers.reduce((acc, user) => {
            if (!acc[user.email]) acc[user.email] = [];
            acc[user.email].push(user);
            return acc;
        }, {} as Record<string, typeof allUsers>);

        // Find duplicates
        const duplicates = Object.entries(emailGroups).filter(([_, users]) => users.length > 1);

        if (duplicates.length === 0) {
            console.log('✅ No duplicate emails found!');
            rl.close();
            return;
        }

        console.log(`⚠️  Found ${duplicates.length} duplicate email(s):\n`);

        for (const [email, users] of duplicates) {
            console.log(`\n📧 Email: ${email}`);
            console.log(`   Found ${users.length} accounts:\n`);

            users.forEach((user, index) => {
                console.log(`   ${index + 1}. User ID: ${user.id}`);
                console.log(`      Name: ${user.firstName} ${user.lastName}`);
                console.log(`      Role: ${user.role}`);
                console.log(`      Organisation: ${user.organisation?.name || 'No Org'}`);
                console.log(`      Org ID: ${user.organisationId || 'NULL'}`);
                if (user.organisation) {
                    console.log(`      Org Users: ${user.organisation._count.users}`);
                    console.log(`      Org Leads: ${user.organisation._count.leads}`);
                    console.log(`      Org Products: ${user.organisation._count.products}`);
                }
                console.log(`      Created: ${user.createdAt.toISOString()}`);
                console.log('');
            });

            const answer = await question(`Which account should we KEEP? (1-${users.length}, or 's' to skip): `);
            
            if (answer.toLowerCase() === 's') {
                console.log('Skipped.\n');
                continue;
            }

            const keepIndex = parseInt(answer) - 1;
            if (isNaN(keepIndex) || keepIndex < 0 || keepIndex >= users.length) {
                console.log('Invalid choice. Skipped.\n');
                continue;
            }

            const keepUser = users[keepIndex];
            const keepOrgId = keepUser.organisationId;
            const deleteUsers = users.filter((_, i) => i !== keepIndex);

            console.log(`\n✅ Keeping: ${keepUser.firstName} ${keepUser.lastName} (${keepUser.organisation?.name})`);
            console.log(`❌ Will delete: ${deleteUsers.map(u => `${u.firstName} ${u.lastName} (${u.organisation?.name})`).join(', ')}\n`);

            const confirm = await question('Are you sure? This will merge all data into the kept organisation. (yes/no): ');
            
            if (confirm.toLowerCase() !== 'yes') {
                console.log('Cancelled.\n');
                continue;
            }

            console.log('\n🔄 Starting merge process...\n');

            // For each duplicate user
            for (const deleteUser of deleteUsers) {
                const deleteOrgId = deleteUser.organisationId;

                if (deleteOrgId && keepOrgId) {
                    console.log(`Merging data from ${deleteUser.organisation?.name} to ${keepUser.organisation?.name}...`);

                    // 1. Move all leads to keep organisation
                    const leadsUpdated = await prisma.lead.updateMany({
                        where: { organisationId: deleteOrgId },
                        data: { organisationId: keepOrgId }
                    });
                    console.log(`  ✓ Moved ${leadsUpdated.count} leads`);

                    // 2. Move all products to keep organisation
                    const productsUpdated = await prisma.product.updateMany({
                        where: { organisationId: deleteOrgId },
                        data: { organisationId: keepOrgId }
                    });
                    console.log(`  ✓ Moved ${productsUpdated.count} products`);

                    // 3. Move all other users in that organisation
                    const usersUpdated = await prisma.user.updateMany({
                        where: { 
                            organisationId: deleteOrgId,
                            id: { not: deleteUser.id }
                        },
                        data: { organisationId: keepOrgId }
                    });
                    console.log(`  ✓ Moved ${usersUpdated.count} other users`);

                    // 4. Move all tasks
                    const tasksUpdated = await prisma.task.updateMany({
                        where: { organisationId: deleteOrgId },
                        data: { organisationId: keepOrgId }
                    });
                    console.log(`  ✓ Moved ${tasksUpdated.count} tasks`);

                    // 5. Move all interactions
                    const interactionsUpdated = await prisma.interaction.updateMany({
                        where: { organisationId: deleteOrgId },
                        data: { organisationId: keepOrgId }
                    });
                    console.log(`  ✓ Moved ${interactionsUpdated.count} interactions`);

                    // 6. Delete the duplicate user
                    await prisma.user.delete({
                        where: { id: deleteUser.id }
                    });
                    console.log(`  ✓ Deleted duplicate user: ${deleteUser.email}`);

                    // 7. Delete the empty organisation
                    await prisma.organisation.delete({
                        where: { id: deleteOrgId }
                    });
                    console.log(`  ✓ Deleted empty organisation: ${deleteUser.organisation?.name}`);
                }
            }

            console.log(`\n✅ Successfully merged all accounts for ${email}!\n`);
        }

        console.log('\n🎉 All duplicates processed!\n');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
        rl.close();
    }
}

fixDuplicateUsers();
