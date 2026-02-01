import express from 'express';
import { createOrganisation, getAllOrganisations, getOrganisation, updateOrganisation, sendTestReport } from '../controllers/organisationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/send-test-report', protect, sendTestReport);
router.post('/', protect, createOrganisation);
router.get('/all', protect, getAllOrganisations);
router.get('/:id', protect, getOrganisation);
router.put('/:id', protect, updateOrganisation);
router.get('/', protect, getOrganisation);
router.put('/', protect, updateOrganisation);

export default router;
