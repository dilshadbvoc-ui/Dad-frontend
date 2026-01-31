import express from 'express';
import { protect } from '../middleware/authMiddleware';
import {
    getCampaigns,
    getAdSets,
    getAds,
    getInsights,
    testConnection,
    syncCampaigns,
    getCampaignInsights,
    getAccountInsights
} from '../controllers/adController';
import { metaLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// Meta Ads API endpoints with rate limiting
router.get('/meta/campaigns', protect, metaLimiter, getCampaigns as any);
router.get('/meta/adsets', protect, metaLimiter, getAdSets as any);
router.get('/meta/ads', protect, metaLimiter, getAds as any);
router.get('/meta/insights', protect, metaLimiter, getInsights as any);
router.post('/meta/test', protect, metaLimiter, testConnection as any);

// Campaign sync and insights
router.post('/meta/sync-campaigns', protect, metaLimiter, syncCampaigns as any);
router.get('/meta/campaigns/:campaignId/insights', protect, metaLimiter, getCampaignInsights as any);
router.get('/meta/account/insights', protect, metaLimiter, getAccountInsights as any);

export default router;
