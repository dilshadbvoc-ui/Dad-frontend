import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { initSocket } from './socket';
import { generalLimiter, authLimiter } from './middleware/rateLimiter';
import { auditSecurity, detectBruteForce } from './middleware/securityAudit';
import { setCSRFToken, verifyCSRFToken } from './middleware/csrfProtection';
import { EnvironmentValidator } from './utils/envValidator';

dotenv.config();

// Validate environment variables on startup
EnvironmentValidator.initializeValidation();



import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import leadRoutes from './routes/leadRoutes';
import contactRoutes from './routes/contactRoutes';
import accountRoutes from './routes/accountRoutes';
import opportunityRoutes from './routes/opportunityRoutes';
import campaignRoutes from './routes/campaignRoutes';
import marketingRoutes from './routes/marketingRoutes';
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

// Trust Proxy for Render/Vercel
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'", "https://api.facebook.com", "https://graph.facebook.com"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
        },
    },
    crossOriginEmbedderPolicy: false, // Disable for Meta integration
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

app.use(session({
    secret: process.env.JWT_SECRET || 'secret_sso_key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true in prod, false in dev
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' requires secure:true
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
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

// CORS Configuration - Allow production frontend
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://dad-frontend-psi.vercel.app',
    'https://dad-frontend.vercel.app',
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin only in development (mobile apps, Postman, etc.)
        if (!origin && process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }

        // Check if origin is in allowed list or matches allowed origins env var
        const allowedOriginsArray = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
            : [];

        const allOrigins = [...allowedOrigins, ...allowedOriginsArray];

        if (origin && allOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS policy'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400 // 24 hours
}));

// Meta webhook - NO AUTH, needs raw body for signature verification
// This must be placed BEFORE app.use(express.json())
// Meta webhook - NO AUTH, needs raw body for signature verification
// This must be placed BEFORE app.use(express.json())
app.use('/api/meta/callback', express.raw({ type: 'application/json' }), (req, res, next) => {
    // Check if we have a buffer and save it for signature verification
    if (Buffer.isBuffer(req.body)) {
        (req as any).rawBody = req.body;
        // Parse the body manually for the controller to use
        try {
            req.body = JSON.parse(req.body.toString());
        } catch (e) {
            console.error('Error parsing Meta webhook body JSON:', e);
            // proceed, let controller handle bad json or it might be a verify request
        }
    }
    next();
});

// Handle preflight requests
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security Middleware
app.use(auditSecurity); // Security audit logging
app.use(setCSRFToken); // CSRF token generation
app.use(generalLimiter); // General rate limiting

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

// CSRF Token endpoint
app.get('/api/csrf-token', setCSRFToken, (req: any, res) => {
    res.json({
        csrfToken: req.csrfToken || req.session?.csrfToken,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
});



// Public Routes (No Auth)
app.use('/api/public', publicRoutes);

// Auth & Core (with enhanced security)
app.use('/api/auth', authLimiter, detectBruteForce, authRoutes);
app.use('/api/analytics', verifyCSRFToken, analyticsRoutes);
app.use('/api/workflow', verifyCSRFToken, workflowRoutes);
app.use('/api/import', verifyCSRFToken, importRoutes);
app.use('/api/ai', verifyCSRFToken, aiRoutes);
app.use('/api/email', verifyCSRFToken, emailRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', verifyCSRFToken, reportRoutes);

app.use('/api/profile', profileRoutes);

// Sales
app.use('/api/leads', leadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/opportunities', opportunityRoutes);

// Marketing
app.use('/api/campaigns', campaignRoutes);
app.use('/api/marketing', marketingRoutes);
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
import shareRoutes from './routes/shareRoutes';
app.use('/api/share', shareRoutes);

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

