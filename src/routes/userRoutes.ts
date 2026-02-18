import express from 'express';
import { getUsers, getUserById, updateUser, inviteUser, deactivateUser, getUserStats, getMyTeam } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { checkPlanLimits } from '../middleware/subscriptionMiddleware';
import { protectSuperAdmin, verifySuperAdminSecret } from '../middleware/superAdminProtection';

const router = express.Router();

router.get('/', protect, getUsers);
router.get('/my-team', protect, getMyTeam);
router.get('/:id', protect, getUserById);
router.get('/:id/stats', protect, getUserStats);
router.put('/:id', protect, verifySuperAdminSecret, protectSuperAdmin, updateUser);
router.post('/invite', protect, checkPlanLimits('users'), inviteUser);
router.post('/:id/deactivate', protect, verifySuperAdminSecret, protectSuperAdmin, deactivateUser);

export default router;
