import prisma from './src/config/prisma';

/**
 * Debug script to check user data and organisation associations
 * Run with: npx ts-node debug-user-data.ts <email>
 */

async function debugUserData(email: string) {
    console.log('\n=== USER DATA DEBUG ===\n');
    
    try {
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                organisation: true,
                reportsTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        if (!user) {
            console.log(`❌ User not found with email: ${email}`);
            return;
        }

        console.log('✅ User Found:');
        console.log('  ID:', user.id);
        console.log('  Name:', `${user.firstName} ${user.lastName}`);
        console.log('  Email:', user.email);
        console.log('  Role:', user.role);
        console.log('  Organisation ID:', user.organisationId);
        console.log('  Reports To:', user.reportsTo ? `${user.reportsTo.firstName} ${user.reportsTo.lastName} (${user.reportsTo.email})` : 'None');
        
        if (user.organisation) {
            console.log('\n📊 Organisation Details:');
            console.log('  ID:', user.organisation.id);
            console.log('  Name:', user.organisation.name);
            console.log('  Subscription:', user.organisation.subscriptionStatus);
        } else {
            console.log('\n⚠️  No organisation associated!');
        }

        // Count leads for this user's organisation
        if (user.organisationId) {
            const leadCount = await prisma.lead.count({
                where: {
                    organisationId: user.organisationId,
                    isDeleted: false
                }
            });

            console.log('\n📋 Leads in Organisation:');
            console.log('  Total Leads:', leadCount);

            // Get recent leads
            const recentLeads = await prisma.lead.findMany({
                where: {
                    organisationId: user.organisationId,
                    isDeleted: false
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    status: true,
                    createdAt: true,
                    assignedTo: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: 5
            });

            if (recentLeads.length > 0) {
                console.log('\n  Recent Leads:');
                recentLeads.forEach((lead, index) => {
                    console.log(`  ${index + 1}. ${lead.firstName} ${lead.lastName} (${lead.email})`);
                    console.log(`     Status: ${lead.status}`);
                    console.log(`     Assigned: ${lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : 'Unassigned'}`);
                    console.log(`     Created: ${lead.createdAt.toISOString()}`);
                });
            }
        }

        // Check for multiple users with same email (shouldn't happen but let's verify)
        const duplicateUsers = await prisma.user.findMany({
            where: { email },
            select: {
                id: true,
                email: true,
                organisationId: true,
                role: true
            }
        });

        if (duplicateUsers.length > 1) {
            console.log('\n⚠️  WARNING: Multiple users found with same email!');
            duplicateUsers.forEach((u, index) => {
                console.log(`  ${index + 1}. ID: ${u.id}, Org: ${u.organisationId}, Role: ${u.role}`);
            });
        }

        // Check all organisations
        const allOrgs = await prisma.organisation.findMany({
            select: {
                id: true,
                name: true,
                subscriptionStatus: true,
                _count: {
                    select: {
                        users: true,
                        leads: true
                    }
                }
            }
        });

        console.log('\n🏢 All Organisations in Database:');
        allOrgs.forEach((org, index) => {
            console.log(`  ${index + 1}. ${org.name}`);
            console.log(`     ID: ${org.id}`);
            console.log(`     Users: ${org._count.users}`);
            console.log(`     Leads: ${org._count.leads}`);
            console.log(`     Status: ${org.subscriptionStatus}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
    console.log('Usage: npx ts-node debug-user-data.ts <email>');
    process.exit(1);
}

debugUserData(email);
