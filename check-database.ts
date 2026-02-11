import prisma from './src/config/prisma';

async function checkDatabase() {
    try {
        console.log('=== DATABASE CHECK ===\n');

        // Check Users
        const userCount = await prisma.user.count();
        const users = await prisma.user.findMany({
            take: 5,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                organisationId: true,
            }
        });
        console.log(`Users: ${userCount} total`);
        console.log('Sample users:', JSON.stringify(users, null, 2));
        console.log('');

        // Check Organisations
        const orgCount = await prisma.organisation.count();
        const orgs = await prisma.organisation.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                currency: true,
                _count: {
                    select: {
                        users: true,
                        leads: true,
                        products: true,
                    }
                }
            }
        });
        console.log(`Organisations: ${orgCount} total`);
        console.log('Sample organisations:', JSON.stringify(orgs, null, 2));
        console.log('');

        // Check Leads
        const leadCount = await prisma.lead.count();
        const leads = await prisma.lead.findMany({
            take: 3,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
                organisationId: true,
            }
        });
        console.log(`Leads: ${leadCount} total`);
        console.log('Sample leads:', JSON.stringify(leads, null, 2));
        console.log('');

        // Check Products
        const productCount = await prisma.product.count();
        const products = await prisma.product.findMany({
            take: 3,
            select: {
                id: true,
                name: true,
                basePrice: true,
                brochureUrl: true,
                organisationId: true,
            }
        });
        console.log(`Products: ${productCount} total`);
        console.log('Sample products:', JSON.stringify(products, null, 2));
        console.log('');

        // Check Product Shares
        const shareCount = await prisma.productShare.count();
        const shares = await prisma.productShare.findMany({
            take: 3,
            select: {
                id: true,
                slug: true,
                views: true,
                product: {
                    select: {
                        name: true,
                        brochureUrl: true,
                    }
                }
            }
        });
        console.log(`Product Shares: ${shareCount} total`);
        console.log('Sample shares:', JSON.stringify(shares, null, 2));
        console.log('');

        // Check Interactions (includes calls)
        const interactionCount = await prisma.interaction.count();
        const interactions = await prisma.interaction.findMany({
            take: 3,
            where: {
                type: 'call'
            },
            select: {
                id: true,
                type: true,
                direction: true,
                duration: true,
                createdAt: true,
            }
        });
        console.log(`Interactions (calls): ${interactionCount} total`);
        console.log('Sample call interactions:', JSON.stringify(interactions, null, 2));

    } catch (error) {
        console.error('Error checking database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDatabase();
