import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { generalLimiter } from '../middleware/rateLimiter';
import { 
  bulkLeadOperations, 
  bulkContactOperations, 
  bulkOpportunityOperations 
} from '../controllers/bulkOperationsController';

const router = express.Router();

// Apply authentication and rate limiting to all bulk routes
router.use(protect);
router.use(generalLimiter);

// Bulk operations for different entities
router.post('/leads', bulkLeadOperations);
router.post('/contacts', bulkContactOperations);
router.post('/opportunities', bulkOpportunityOperations);

export default router;