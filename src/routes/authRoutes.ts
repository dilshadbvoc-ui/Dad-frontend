import express from 'express';
import { authUser, registerUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser);

import { initSSO, ssoLogin, ssoCallback } from '../controllers/ssoController';

router.post('/sso/init', initSSO);
router.get('/sso/login/:orgId', ssoLogin);
router.post('/sso/callback/:orgId', ssoCallback);

export default router;
