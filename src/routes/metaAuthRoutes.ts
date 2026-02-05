import { Router, Response } from 'express';
import prisma from '../config/prisma';
import { AuthRequest, protect } from '../middleware/authMiddleware';
import axios from 'axios';
import { MetaLeadService } from '../services/MetaLeadService'; // Service for handling Meta leads

const router = Router();

// Meta OAuth Configuration
const META_API_VERSION = 'v18.0';
const META_GRAPH_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Required permissions for Ads and WhatsApp
const OAUTH_SCOPES = [
    'ads_read',
    'ads_management',
    'business_management',
    'pages_read_engagement',
    'whatsapp_business_management',
    'whatsapp_business_messaging'
].join(',');

/**
 * GET /api/meta/auth
 * Redirects user to Facebook OAuth login
 */
router.get('/auth', protect, (req: AuthRequest, res: Response) => {
    const appId = process.env.META_APP_ID;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';

    if (!appId) {
        return res.status(500).json({
            error: 'META_APP_ID not configured',
            message: 'Please add META_APP_ID to your environment variables'
        });
    }

    // Store org ID in state parameter for the callback
    const state = Buffer.from(JSON.stringify({
        orgId: req.user?.organisationId,
        userId: req.user?.id,
        returnUrl: `${clientUrl}/settings/integrations`
    })).toString('base64');

    const redirectUri = `${serverUrl}/api/meta/callback`;

    const authUrl = `https://www.facebook.com/${META_API_VERSION}/dialog/oauth?` +
        `client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=${encodeURIComponent(OAUTH_SCOPES)}` +
        `&state=${state}` +
        `&response_type=code`;

    res.json({ url: authUrl });
});

/**
 * GET /api/meta/callback
 * Handles the OAuth callback from Facebook
 */
router.get('/callback', async (req, res) => {
    const { code, state, error, error_description } = req.query;

    // Decode state to get org info
    let stateData: { orgId: string; userId: string; returnUrl: string };
    try {
        stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch {
        return res.redirect(`${process.env.CLIENT_URL}/settings/integrations?error=invalid_state`);
    }

    const { orgId, returnUrl } = stateData;

    // Handle OAuth errors
    if (error) {
        console.error('[Meta OAuth] Error:', error, error_description);
        return res.redirect(`${returnUrl}?error=${error}&message=${encodeURIComponent(error_description as string || 'OAuth failed')}`);
    }

    if (!code) {
        return res.redirect(`${returnUrl}?error=no_code`);
    }

    try {
        const appId = process.env.META_APP_ID;
        const appSecret = process.env.META_APP_SECRET;
        const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
        const redirectUri = `${serverUrl}/api/meta/callback`;

        if (!appId || !appSecret) {
            throw new Error('META_APP_ID or META_APP_SECRET not configured');
        }

        // Exchange code for access token
        const tokenResponse = await axios.get(`${META_GRAPH_URL}/oauth/access_token`, {
            params: {
                client_id: appId,
                client_secret: appSecret,
                redirect_uri: redirectUri,
                code: code
            }
        });

        const { access_token: shortLivedToken } = tokenResponse.data;

        // Exchange for long-lived token (60 days)
        const longLivedTokenResponse = await axios.get(`${META_GRAPH_URL}/oauth/access_token`, {
            params: {
                grant_type: 'fb_exchange_token',
                client_id: appId,
                client_secret: appSecret,
                fb_exchange_token: shortLivedToken
            }
        });

        const longLivedToken = longLivedTokenResponse.data.access_token;

        // Get user's ad accounts
        const adAccountsResponse = await axios.get(`${META_GRAPH_URL}/me/adaccounts`, {
            params: {
                access_token: longLivedToken,
                fields: 'id,name,account_status'
            }
        });

        const adAccounts = adAccountsResponse.data.data || [];
        const primaryAdAccount = adAccounts[0]; // Use first ad account

        // Get user's pages (for Page ID)
        const pagesResponse = await axios.get(`${META_GRAPH_URL}/me/accounts`, {
            params: {
                access_token: longLivedToken,
                fields: 'id,name,access_token'
            }
        });

        const pages = pagesResponse.data.data || [];
        const primaryPage = pages[0];

        // Try to get WhatsApp Business Account
        let wabaId = null;
        let phoneNumberId = null;

        try {
            // List WABA accounts the user has access to via business
            const businessResponse = await axios.get(`${META_GRAPH_URL}/me/businesses`, {
                params: {
                    access_token: longLivedToken,
                    fields: 'id,name,owned_whatsapp_business_accounts{id,name}'
                }
            });

            const businesses = businessResponse.data.data || [];
            for (const business of businesses) {
                const wabas = business.owned_whatsapp_business_accounts?.data || [];
                if (wabas.length > 0) {
                    wabaId = wabas[0].id;

                    // Get phone numbers for this WABA
                    const phoneResponse = await axios.get(`${META_GRAPH_URL}/${wabaId}/phone_numbers`, {
                        params: {
                            access_token: longLivedToken,
                            fields: 'id,display_phone_number,verified_name'
                        }
                    });

                    const phones = phoneResponse.data.data || [];
                    if (phones.length > 0) {
                        phoneNumberId = phones[0].id;
                    }
                    break;
                }
            }
        } catch (wabaError) {
            console.log('[Meta OAuth] No WhatsApp Business Account found (this is okay):', (wabaError as any).message);
        }

        // Get the current org
        const org = await prisma.organisation.findUnique({
            where: { id: orgId }
        });

        if (!org) {
            throw new Error('Organisation not found');
        }

        // Update organisation with Meta integration data
        const currentIntegrations = (org.integrations as any) || {};
        const metaAccounts = currentIntegrations.metaAccounts || [];

        const newAccount = {
            connected: true,
            accessToken: longLivedToken,
            adAccountId: primaryAdAccount?.id || null,
            adAccountName: primaryAdAccount?.name || null,
            pageId: primaryPage?.id || null,
            pageName: primaryPage?.name || null,
            appId: appId,
            connectedAt: new Date().toISOString()
        };

        // Check if account already exists (by Ad Account ID or Page ID)
        const accountIndex = metaAccounts.findIndex((acc: any) =>
            (newAccount.adAccountId && acc.adAccountId === newAccount.adAccountId) ||
            (newAccount.pageId && acc.pageId === newAccount.pageId)
        );

        if (accountIndex >= 0) {
            metaAccounts[accountIndex] = newAccount; // Update
        } else {
            metaAccounts.push(newAccount); // Add new
        }

        await prisma.organisation.update({
            where: { id: orgId },
            data: {
                integrations: {
                    ...currentIntegrations,
                    meta: newAccount, // Keep latest as primary for legacy compatibility
                    metaAccounts: metaAccounts, // Array of all accounts
                    whatsapp: {
                        connected: !!wabaId && !!phoneNumberId,
                        accessToken: longLivedToken,
                        wabaId: wabaId,
                        phoneNumberId: phoneNumberId,
                        appId: appId,
                        connectedAt: wabaId ? new Date().toISOString() : null
                    }
                }
            }
        });

        console.log(`[Meta OAuth] Successfully connected org ${orgId}`);
        console.log(`  - Ad Account: ${primaryAdAccount?.name || 'None'}`);
        console.log(`  - WhatsApp: ${wabaId ? 'Connected' : 'Not available'}`);

        res.redirect(`${returnUrl}?success=true&meta=connected${wabaId ? '&whatsapp=connected' : ''}`);

    } catch (err: any) {
        console.error('[Meta OAuth] Callback error:', err.response?.data || err.message);
        res.redirect(`${returnUrl}?error=callback_failed&message=${encodeURIComponent(err.message)}`);
    }
});

/**
 * POST /api/meta/disconnect
 * Disconnects Meta integration
 */
router.post('/disconnect', protect, async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.organisationId!;
        const { type } = req.body; // 'meta', 'whatsapp', or 'both'

        const org = await prisma.organisation.findUnique({
            where: { id: orgId }
        });

        if (!org) {
            return res.status(404).json({ error: 'Organisation not found' });
        }

        const currentIntegrations = (org.integrations as any) || {};

        if (type === 'meta' || type === 'both') {
            const accountIdToRemove = req.body.adAccountId;

            if (accountIdToRemove) {
                // Remove specific account
                if (currentIntegrations.metaAccounts) {
                    currentIntegrations.metaAccounts = currentIntegrations.metaAccounts.filter(
                        (acc: any) => acc.adAccountId !== accountIdToRemove
                    );
                }
                // Check if primary is the one being removed
                if (currentIntegrations.meta?.adAccountId === accountIdToRemove) {
                    // Promote another one or clear
                    currentIntegrations.meta = currentIntegrations.metaAccounts[0] || {
                        connected: false,
                        disconnectedAt: new Date().toISOString()
                    };
                }
            } else {
                // Disconnect ALL
                currentIntegrations.meta = {
                    connected: false,
                    disconnectedAt: new Date().toISOString()
                };
                currentIntegrations.metaAccounts = [];
            }
        }

        if (type === 'whatsapp' || type === 'both') {
            currentIntegrations.whatsapp = {
                connected: false,
                disconnectedAt: new Date().toISOString()
            };
        }

        await prisma.organisation.update({
            where: { id: orgId },
            data: { integrations: currentIntegrations }
        });

        res.json({ success: true, message: `${type} disconnected` });

    } catch (err: any) {
        console.error('[Meta] Disconnect error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/meta/status
 * Gets current Meta/WhatsApp connection status
 */
router.get('/status', protect, async (req: AuthRequest, res: Response) => {
    try {
        const orgId = req.user?.organisationId!;

        const org = await prisma.organisation.findUnique({
            where: { id: orgId },
            select: { integrations: true }
        });

        const integrations = (org?.integrations as any) || {};

        res.json({
            meta: {
                connected: integrations.meta?.connected || false,
                adAccountName: integrations.meta?.adAccountName || null,
                pageName: integrations.meta?.pageName || null,
                connectedAt: integrations.meta?.connectedAt || null,
                accounts: integrations.metaAccounts || [] // Return list
            },
            whatsapp: {
                connected: integrations.whatsapp?.connected || false,
                wabaId: integrations.whatsapp?.wabaId || null,
                connectedAt: integrations.whatsapp?.connectedAt || null
            }
        });

    } catch (err: any) {
        console.error('[Meta] Status error:', err);
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/meta/webhook
 * Webhook verification for Meta
 */
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_VERIFY_TOKEN || 'my_secure_token';

    if (mode && token) {
        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[Meta Webhook] Verified!');
            res.status(200).send(challenge);
        } else {
            console.warn('[Meta Webhook] Verification failed. Tokens do not match.');
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400);
    }
});

/**
 * POST /api/meta/webhook
 * Handles incoming events from Meta (Leads, etc.)
 */
router.post('/webhook', async (req, res) => {
    const body = req.body;

    // Check if this is an event from a page subscription
    if (body.object === 'page') {
        // Iterate over each entry
        // Meta may batch multiple events into a single heartbeat
        for (const entry of body.entry) {
            const changes = entry.changes;
            const pageId = entry.id;

            for (const change of changes) {
                if (change.field === 'leadgen') {
                    const { leadgen_id, ad_id, form_id } = change.value;
                    console.log(`[Meta Webhook] Received new lead: ${leadgen_id} from Page: ${pageId}`);

                    // Process lead asynchronously
                    MetaLeadService.processIncomingLead(leadgen_id, pageId, ad_id, form_id).catch((err: Error) => {
                        console.error('[Meta Webhook] Error processing lead:', err);
                    });
                }
            }
        }
        res.status(200).send('EVENT_RECEIVED');
    } else {
        // Not a page event
        res.sendStatus(404);
    }
});

export default router;
