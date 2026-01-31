
import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { syncData } from '../controllers/syncController';

const router = express.Router();

router.get('/', protect, syncData);

export default router;
