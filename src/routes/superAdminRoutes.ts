import express from 'express';
import {
    getAllOrganisations,
    createOrganisation,
    updateOrganisationAdmin,
    suspendOrganisation,
    getOrganisationStats
} from '../controllers/superAdminController';
import { deleteOrganisation, restoreOrganisation, permanentlyDeleteOrganisation } from '../controllers/organisationController';
import {
    getPlans,
    createPlan,
    updatePlan,
    deletePlan
} from '../controllers/subscriptionPlanController';
import { protect } from '../middleware/authMiddleware';
import { getSystemSettings, updateSystemSettings } from '../controllers/systemSettingsController';

const router = express.Router();

// System Settings
router.get('/settings', protect, getSystemSettings);
router.put('/settings', protect, updateSystemSettings);

// Organisation Management
router.get('/organisations', protect, getAllOrganisations);
router.post('/organisations', protect, createOrganisation);
router.put('/organisations/:id', protect, updateOrganisationAdmin);
router.delete('/organisations/:id', protect, deleteOrganisation); // Soft delete
router.delete('/organisations/:id/permanent', protect, permanentlyDeleteOrganisation); // Permanent delete (super admin only)
router.post('/organisations/:id/restore', protect, restoreOrganisation); // Restore deleted org
router.post('/organisations/:id/suspend', protect, suspendOrganisation);

// License Plans Management
router.get('/plans', protect, getPlans);
router.post('/plans', protect, createPlan);
router.put('/plans/:id', protect, updatePlan);
router.delete('/plans/:id', protect, deletePlan);

router.get('/stats', protect, getOrganisationStats);

export default router;
