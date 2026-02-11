import express from 'express';
import { authUser, registerUser, forgotPassword, resetPassword } from '../controllers/authController';


const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser);
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:resetToken', resetPassword);

import { initSSO, ssoLogin, ssoCallback } from '../controllers/ssoController';

router.post('/sso/init', initSSO);
router.get('/sso/login/:orgId', ssoLogin);
router.post('/sso/callback/:orgId', ssoCallback);

export default router;
