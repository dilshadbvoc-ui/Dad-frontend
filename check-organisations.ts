import prisma from './src/config/prisma';

/**
 * Check all organisations and their users
 * This will help identify if there are duplicate organisations
 */

async function checkOrganisations() {
    console.log('\n=== ORGANISATION CHECK ===\n');
    
    try {
        // Get all organisations
        const organisations = await prisma.organisation.findMany({
            include: {
                users: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                },
                _count: {
                    select: {
                        users: true,
                        leads: true,
                        products: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log(`Found ${organisations.length} organisations:\n`);

        organisations.forEach((org, index) => {
            console.log(`${index + 1}. ${org.name}`);
            console.log(`   ID: ${org.id}`);
            console.log(`   Status: ${org.status}`);
            console.log(`   Created: ${org.createdAt.toISOString()}`);
            console.log(`   Users: ${org._count.users}`);
            console.log(`   Leads: ${org._count.leads}`);
            console.log(`   Products: ${org._count.products}`);
            
            if (org.users.length > 0) {
                console.log(`   Team Members:`);
                org.users.forEach(user => {
                    console.log(`     - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
                });
            }
            console.log('');
        });

        // Check for users with similar emails
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                organisationId: true,
                role: true,
                organisation: {
                    select: {
                        name: true
                    }
                }
            },
            orderBy: { email: 'asc' }
        });

        console.log('\n=== ALL USERS ===\n');
        allUsers.forEach(user => {
            console.log(`${user.email}`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Name: ${user.firstName} ${user.lastName}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Org: ${user.organisation?.name || 'No Organisation'} (${user.organisationId || 'NULL'})`);
            console.log('');
        });

        // Check for duplicate emails
        const emailCounts = allUsers.reduce((acc, user) => {
            acc[user.email] = (acc[user.email] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const duplicates = Object.entries(emailCounts).filter(([_, count]) => count > 1);
        
        if (duplicates.length > 0) {
            console.log('\n⚠️  WARNING: DUPLICATE EMAILS FOUND!\n');
            duplicates.forEach(([email, count]) => {
                console.log(`${email} appears ${count} times`);
                const dupeUsers = allUsers.filter(u => u.email === email);
                dupeUsers.forEach(u => {
                    console.log(`  - User ID: ${u.id}, Org: ${u.organisation?.name} (${u.organisationId})`);
                });
                console.log('');
            });
        } else {
            console.log('\n✅ No duplicate emails found\n');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrganisations();
