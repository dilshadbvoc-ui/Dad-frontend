import express from 'express';
import { getUsers, getUserById, updateUser, inviteUser, deactivateUser, getUserStats } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { checkPlanLimits } from '../middleware/subscriptionMiddleware';
import { protectSuperAdmin } from '../middleware/superAdminProtection';

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.get('/:id/stats', protect, getUserStats);
router.put('/:id', protect, protectSuperAdmin, updateUser);
router.post('/invite', protect, checkPlanLimits('users'), inviteUser);
router.post('/:id/deactivate', protect, protectSuperAdmin, deactivateUser);

export default router;
