import express from 'express';
import { updateActionStatus } from '../controllers/actionController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

// Only safety_officer and admin can update actions (or maybe assigned user, but prompt implies officer/admin)
router.patch('/:id', authorize('safety_officer', 'admin', 'manager'), updateActionStatus);

export default router;
