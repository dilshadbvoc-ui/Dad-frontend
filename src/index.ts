import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initSocket } from './socket';
import { generalLimiter } from './middleware/rateLimiter';

dotenv.config();



import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import leadRoutes from './routes/leadRoutes';
import contactRoutes from './routes/contactRoutes';
import accountRoutes from './routes/accountRoutes';
import opportunityRoutes from './routes/opportunityRoutes';
import campaignRoutes from './routes/campaignRoutes';
import emailListRoutes from './routes/emailListRoutes';
import interactionRoutes from './routes/interactionRoutes';
import eventRoutes from './routes/eventRoutes';
import taskRoutes from './routes/taskRoutes';
import workflowRoutes from './routes/workflowRoutes';
import productRoutes from './routes/productRoutes';
import quoteRoutes from './routes/quoteRoutes';

import caseRoutes from './routes/caseRoutes';
import goalRoutes from './routes/goalRoutes';
import territoryRoutes from './routes/territoryRoutes';
import roleRoutes from './routes/roleRoutes';
import userRoutes from './routes/userRoutes';
import customFieldRoutes from './routes/customFieldRoutes';
import webhookRoutes from './routes/webhookRoutes';
import profileRoutes from './routes/profileRoutes';
import assignmentRuleRoutes from './routes/assignmentRuleRoutes';
import hierarchyRoutes from './routes/hierarchyRoutes';
import organisationRoutes from './routes/organisationRoutes';
import apiKeyRoutes from './routes/apiKeyRoutes';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes';
import licenseRoutes from './routes/licenseRoutes';
import notificationRoutes from './routes/notificationRoutes';
import superAdminRoutes from './routes/superAdminRoutes';
import salesTargetRoutes from './routes/salesTargetRoutes';
import callRoutes from './routes/callRoutes';
import callSettingsRoutes from './routes/callSettingsRoutes';
import reportRoutes from './routes/reportRoutes';
import importRoutes from './routes/importRoutes';
import aiRoutes from './routes/aiRoutes';
import emailRoutes from './routes/emailRoutes';
import searchRoutes from './routes/searchRoutes';

import adRoutes from './routes/adRoutes';
import pipelineRoutes from './routes/pipelineRoutes';
import webFormRoutes from './routes/webFormRoutes';
import smsCampaignRoutes from './routes/smsCampaignRoutes';
import whatsAppCampaignRoutes from './routes/whatsAppCampaignRoutes';
import whatsAppRoutes from './routes/whatsAppRoutes';
import commissionRoutes from './routes/commissionRoutes';
import landingPageRoutes from './routes/landingPageRoutes';
import bulkRoutes from './routes/bulkRoutes';
import publicRoutes from './routes/publicRoutes';
import teamRoutes from './routes/teamRoutes';
import path from 'path';

// import { dataIsolation } from './middleware/dataIsolation';

import compression from 'compression';

import { initCronJobs } from './services/cronService';
import session from 'express-session';
import passport from 'passport';
import { setupPassport } from './services/SSOService';

const app = express();
const httpServer = createServer(app);

// Initialize Passport/SSO
setupPassport();

app.use(session({
    secret: process.env.JWT_SECRET || 'secret_sso_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set true if https
}));

app.use(passport.initialize());
app.use(passport.session());

// Start Cron Jobs
initCronJobs();

const PORT = process.env.PORT || 5000;

console.log('------------------------------------------------');
console.log(`   STARTING SERVER (NODE_ENV=${process.env.NODE_ENV})      `);
console.log(`   PORT env: ${process.env.PORT}`);
console.log('------------------------------------------------');

app.use(compression()); // Enable gzip compression

// Apply rate limiting
app.use('/api/', generalLimiter);

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'https://dad-frontend-psi.vercel.app'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Initialize Socket.io
const io = initSocket(httpServer);
app.set('io', io);

// Debug Middleware: Log all requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (Object.keys(req.body).length > 0) {
        console.log('Body:', JSON.stringify(req.body, null, 2));
    }
    next();
});

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
    console.log('Health check ping received at /');
    res.send('API is running...');
});

app.get('/health', (req, res) => {
    console.log('Health check ping received at /health');
    res.status(200).send('OK');
});



// Public Routes (No Auth)
app.use('/api/public', publicRoutes);

// Auth & Core
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/import', importRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/email', emailRoutes);


app.use('/api/profile', profileRoutes);

// Sales
app.use('/api/leads', leadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/opportunities', opportunityRoutes);

// Marketing
app.use('/api/campaigns', campaignRoutes);
app.use('/api/marketing/lists', emailListRoutes);

// Communications
app.use('/api/interactions', interactionRoutes);
import telephonyRoutes from './routes/telephonyRoutes';
app.use('/api/calls', callRoutes);
app.use('/api/call-settings', callSettingsRoutes);
app.use('/api/telephony', telephonyRoutes);



// Operations
import checkInRoutes from './routes/checkInRoutes';
app.use('/api/checkins', checkInRoutes);
app.use('/api/calendar', eventRoutes);
app.use('/api/tasks', taskRoutes);

// Commerce
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);

// Field & Support

app.use('/api/cases', caseRoutes);

// Advanced
app.use('/api/goals', goalRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/pipelines', pipelineRoutes);
app.use('/api/web-forms', webFormRoutes);
app.use('/api/sms-campaigns', smsCampaignRoutes);
// WhatsApp Campaigns (re-enabled after schema fix)
app.use('/api/whatsapp-campaigns', whatsAppCampaignRoutes);
app.use('/api/whatsapp', whatsAppRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/landing-pages', landingPageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/sales-targets', salesTargetRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/ads', adRoutes);

// Meta OAuth
import metaAuthRoutes from './routes/metaAuthRoutes';
app.use('/api/meta', metaAuthRoutes);

// Admin & Settings
app.use('/api/users', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/territories', territoryRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/assignment-rules', assignmentRuleRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/organisation', organisationRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/bulk', bulkRoutes);

// Licensing & Multi-tenancy
app.use('/api/plans', subscriptionPlanRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/super-admin', superAdminRoutes);

import auditRoutes from './routes/auditRoutes';
app.use('/api/audit-logs', auditRoutes);

import timelineRoutes from './routes/timelineRoutes';
app.use('/api/timeline', timelineRoutes);

import apiRoutes from './routes/apiRoutes';
app.use('/api/v1', apiRoutes);

import stripeRoutes from './routes/stripeRoutes';
app.use('/api/stripe', stripeRoutes);

// Debug Routes
import debugRoutes from './routes/debugRoutes';
app.use('/api/debug', debugRoutes);

import fs from 'fs';
app.get('/debug-files', (req, res) => {
    try {
        const currentDir = fs.readdirSync(__dirname);
        const parentDir = fs.readdirSync(path.join(__dirname, '..'));
        res.json({
            current: __dirname,
            files: currentDir,
            parentFiles: parentDir
        });
    } catch (e: any) {
        res.status(500).json({ error: e.message });
    }
});

// Upload Routes (Call Recordings)
import uploadRoutes from './routes/uploadRoutes';
app.use('/api/upload', uploadRoutes);

// Meeting Reminder Job
import { generateMeetingReminders } from './services/meetingReminderService';

// Debug: Log all registered routes
const logRoutes = (stack: any[], parentPath: string = '') => {
    stack.forEach(r => {
        if (r.route && r.route.path) {
            console.log(`[Route] ${Object.keys(r.route.methods).join(',').toUpperCase()} ${parentPath}${r.route.path}`);
        } else if (r.name === 'router' && r.handle.stack) {
            const nestedPath = r.regexp.source.replace('^\\', '').replace('\\/?(?=\\/|$)', '').replace(/\\\//g, '/');
            logRoutes(r.handle.stack, parentPath + nestedPath);
        }
    });
};

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Log routes after short delay to ensure all are mounted
    setTimeout(() => {
        console.log('--- Registered Routes ---');
        logRoutes(app._router.stack);
        console.log('-------------------------');
    }, 1000);

    // Run meeting reminder check on startup
    generateMeetingReminders().then(count => {
        console.log(`[Startup] Checked ${count} meetings for reminders`);
    }).catch(err => {
        console.error('[Startup] Meeting reminder error:', err);
    });

    // Run every hour
    setInterval(() => {
        generateMeetingReminders().catch(err => {
            console.error('[Interval] Meeting reminder error:', err);
        });
    }, 60 * 60 * 1000); // 1 hour
});
// Forced restart v2
// restart 

