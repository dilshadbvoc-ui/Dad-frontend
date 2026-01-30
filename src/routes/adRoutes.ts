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
router.get('/meta/campaigns', protect, metaLimiter, getCampaigns);
router.get('/meta/adsets', protect, metaLimiter, getAdSets);
router.get('/meta/ads', protect, metaLimiter, getAds);
router.get('/meta/insights', protect, metaLimiter, getInsights);
router.post('/meta/test', protect, metaLimiter, testConnection);

// Campaign sync and insights
router.post('/meta/sync-campaigns', protect, metaLimiter, syncCampaigns);
router.get('/meta/campaigns/:campaignId/insights', protect, metaLimiter, getCampaignInsights);
router.get('/meta/account/insights', protect, metaLimiter, getAccountInsights);

export default router;
