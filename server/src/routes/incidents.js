import express from 'express';
import { createIncident, getIncidents, getIncidentById, updateIncidentStatus, exportIncidentsCsv } from '../controllers/incidentController.js';
import { createAction, getIncidentActions } from '../controllers/actionController.js';
import { validate } from '../middleware/validate.js';
import { createIncidentSchema, listIncidentsSchema } from '../validators/incidentValidator.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

router.post('/', upload.array('attachments', 5), validate(createIncidentSchema), createIncident);
router.get('/', validate(listIncidentsSchema), getIncidents);
router.get('/export.csv', exportIncidentsCsv);
router.get('/:id', getIncidentById);

router.patch('/:id/status', authorize('safety_officer', 'admin'), updateIncidentStatus);
router.post('/:id/actions', authorize('safety_officer', 'admin'), createAction);
router.get('/:id/actions', getIncidentActions);

export default router;
