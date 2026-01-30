
import express from 'express';
import { getWhatsAppCampaigns, createWhatsAppCampaign, updateWhatsAppCampaign, deleteWhatsAppCampaign } from '../controllers/whatsAppCampaignController-simple';
import { protect } from '../middleware/authMiddleware';
import { campaignLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.get('/', protect, getWhatsAppCampaigns);
router.post('/', protect, campaignLimiter, createWhatsAppCampaign);
router.put('/:id', protect, updateWhatsAppCampaign);
router.delete('/:id', protect, deleteWhatsAppCampaign);

export default router;
