import express from 'express';
import { authUser, registerUser, forgotPassword, resetPassword, getMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);
router.get('/me', protect, getMe);

import { initSSO, ssoLogin, ssoCallback } from '../controllers/ssoController';

router.post('/sso/init', initSSO);
router.get('/sso/login/:orgId', ssoLogin);
router.post('/sso/callback/:orgId', ssoCallback);

export default router;
