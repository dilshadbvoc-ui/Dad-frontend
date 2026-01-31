import dotenv from 'dotenv';
import path from 'path';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seed = async () => {
    try {
        console.log('Connecting to PostgreSQL via Prisma...');
        await prisma.$connect();

        // 1. Seed Subscription Plans
        const plans = [
            {
                name: 'Starter',
                description: 'Perfect for small teams getting started.',
                price: 29,
                durationDays: 30,
                maxUsers: 5,
                maxLeads: 1000,
                maxContacts: 2500,
                maxStorage: 5000, // 5GB
                features: ['Basic CRM', 'Email Integration', '5 Users']
            },
            {
                name: 'Pro',
                description: 'For growing businesses needing automation.',
                price: 79,
                durationDays: 30,
                maxUsers: 15,
                maxLeads: 10000,
                maxContacts: 25000,
                maxStorage: 20000, // 20GB
                features: ['Advanced Workflows', 'Sales Automation', '15 Users', 'Priority Support']
            },
            {
                name: 'Enterprise',
                description: 'Unlimited power for large organizations.',
                price: 299,
                durationDays: 30,
                maxUsers: 100,
                maxLeads: 100000,
                maxContacts: 100000,
                maxStorage: 100000, // 100GB
                features: ['Unlimited Users', 'Dedicated Account Manager', 'Custom API Limits', 'SSO']
            }
        ];

        for (const plan of plans) {
            await prisma.subscriptionPlan.upsert({
                where: { name: plan.name },
                update: plan,
                create: plan
            });
        }
        console.log('Seeded Subscription Plans');

        // Create Default Organisation
        let org = await prisma.organisation.findFirst({ where: { slug: 'demo-corp' } });
        if (!org) {
            org = await prisma.organisation.create({
                data: {
                    name: 'Demo Corp',
                    slug: 'demo-corp',
                    domain: 'demo.com',
                    contactEmail: 'admin@demo.com',
                    contactPhone: '555-0123',
                    address: '123 Demo St',
                    status: 'active',
                    subscription: {
                        status: 'active',
                        startDate: new Date().toISOString(),
                        autoRenew: true
                    }
                }
            });
            console.log('Created Default Organisation: Demo Corp');
        } else {
            console.log('Default Organisation already exists');
        }

        // Create Super Admin
        const superAdminEmail = 'superadmin@crm.com';
        const superAdminPassword = 'password123';
        const hashedPassword = await bcrypt.hash(superAdminPassword, 10);

        let superAdmin = await prisma.user.findUnique({ where: { email: superAdminEmail } });
        if (!superAdmin) {
            superAdmin = await prisma.user.create({
                data: {
                    firstName: 'Super',
                    lastName: 'Admin',
                    email: superAdminEmail,
                    password: hashedPassword,
                    role: 'super_admin',
                    // No organisationId for Super Admin
                    // organisationId: null, 
                    isActive: true
                }
            });
            console.log('Created Super Admin User');
        } else {
            // Update password and ensure no org
            await prisma.user.update({
                where: { email: superAdminEmail },
                data: {
                    password: hashedPassword,
                    organisationId: null
                }
            });
            console.log('Updated Super Admin: Password reset & detached from Organisation');
        }

        console.log('\n-----------------------------------');
        console.log('SEEDING COMPLETE');
        console.log('-----------------------------------');
        console.log('Organisation: Demo Corp');
        console.log(`User:         ${superAdminEmail}`);
        console.log(`Password:     ${superAdminPassword}`);
        console.log('-----------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seed();
