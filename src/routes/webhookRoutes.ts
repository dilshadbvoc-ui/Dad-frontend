import express from 'express';
import { getWebhooks, createWebhook, updateWebhook, deleteWebhook } from '../controllers/webhookController';
import { protect } from '../middleware/authMiddleware';
import { MetaIntegrationService } from '../services/MetaIntegrationService-simple';
import { WhatsAppIntegrationService } from '../services/WhatsAppIntegrationService';
import { webhookLimiter } from '../middleware/rateLimiter';
import { WebhookSecurity } from '../utils/webhookSecurity';

const router = express.Router();

router.get('/', protect, getWebhooks);
router.post('/', protect, createWebhook);
router.put('/:id', protect, updateWebhook);
router.delete('/:id', protect, deleteWebhook);

// Meta Integration Routes (Public) - with rate limiting
router.get('/meta', webhookLimiter, (req, res) => MetaIntegrationService.verifyWebhook(req, res));

router.post('/meta', webhookLimiter, express.raw({ type: 'application/json' }), async (req, res) => {
    // Send 200 OK immediately to acknowledge receipt to Meta
    res.sendStatus(200);
    
    try {
        const signature = req.headers['x-hub-signature-256'] as string;
        const payload = req.body.toString();
        
        // Verify signature if provided (recommended for production)
        if (signature && process.env.META_WEBHOOK_SECRET) {
            const isValid = WebhookSecurity.verifyMetaSignature(
                payload, 
                signature, 
                process.env.META_WEBHOOK_SECRET
            );
            
            if (!isValid) {
                console.error('[MetaWebhook] Invalid signature');
                return;
            }
        }
        
        const parsedPayload = JSON.parse(payload);
        await MetaIntegrationService.handleWebhook(parsedPayload);
    } catch (error) {
        console.error('Error processing Meta webhook:', error);
    }
});

// WhatsApp Integration Routes (Public) - with rate limiting
router.get('/whatsapp', webhookLimiter, (req, res) => WhatsAppIntegrationService.verifyWebhook(req, res));

router.post('/whatsapp', webhookLimiter, express.raw({ type: 'application/json' }), async (req, res) => {
    // Send 200 OK immediately to acknowledge receipt to WhatsApp
    res.sendStatus(200);
    
    try {
        const signature = req.headers['x-hub-signature-256'] as string;
        const payload = req.body.toString();
        
        // Verify signature if provided (recommended for production)
        if (signature && process.env.WHATSAPP_WEBHOOK_SECRET) {
            const isValid = WebhookSecurity.verifyWhatsAppSignature(
                payload, 
                signature, 
                process.env.WHATSAPP_WEBHOOK_SECRET
            );
            
            if (!isValid) {
                console.error('[WhatsAppWebhook] Invalid signature');
                return;
            }
        }
        
        const parsedPayload = JSON.parse(payload);
        await WhatsAppIntegrationService.handleWebhook(parsedPayload);
    } catch (error) {
        console.error('Error processing WhatsApp webhook:', error);
    }
});

export default router;
