import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { 
    sendMessage, 
    getMessages, 
    testConnection, 
    getTemplates, 
    createTemplate,
    sendMediaMessage,
    getMessageStatus,
    markMessageAsRead,
    getConversationAnalytics,
    getMessageStatistics
} from '../controllers/whatsAppController';
import { whatsappLimiter } from '../middleware/rateLimiter';
import { 
    validate, 
    whatsappMessageSchema, 
    whatsappMediaMessageSchema, 
    whatsappTemplateSchema, 
    markReadSchema 
} from '../middleware/validation';

const router = express.Router();

// WhatsApp messaging endpoints with rate limiting and validation
router.post('/send', protect, whatsappLimiter, validate(whatsappMessageSchema), sendMessage);
router.post('/send-media', protect, whatsappLimiter, validate(whatsappMediaMessageSchema), sendMediaMessage);
router.get('/messages', protect, whatsappLimiter, getMessages);
router.get('/messages/statistics', protect, whatsappLimiter, getMessageStatistics);
router.get('/messages/:messageId/status', protect, whatsappLimiter, getMessageStatus);
router.post('/messages/mark-read', protect, whatsappLimiter, validate(markReadSchema), markMessageAsRead);
router.get('/templates', protect, whatsappLimiter, getTemplates);
router.post('/templates', protect, whatsappLimiter, validate(whatsappTemplateSchema), createTemplate);
router.get('/analytics', protect, whatsappLimiter, getConversationAnalytics);
router.post('/test', protect, whatsappLimiter, testConnection);

export default router;