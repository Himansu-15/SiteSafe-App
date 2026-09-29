import express from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Restricted to managers, safety_officers, and admins
router.get('/summary', authorize('manager', 'safety_officer', 'admin'), getDashboardSummary);

export default router;
