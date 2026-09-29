import { Action } from '../models/Action.js';
import { Incident } from '../models/Incident.js';
import { AuditLog } from '../models/AuditLog.js';
import { NotFoundError, UnauthorizedError } from '../utils/errors.js';

export async function createAction(req, res, next) {
  try {
    const { incidentId } = req.params;
    const { assignedTo, dueDate, notes } = req.body;

    // Verify incident exists and belongs to org
    const incident = await Incident.findOne({ _id: incidentId, orgId: req.user.orgId });
    if (!incident) throw new NotFoundError('Incident not found');

    const action = await Action.create({
      incidentId,
      orgId: req.user.orgId,
      assignedTo,
      dueDate,
      notes,
      createdBy: req.user.userId,
    });

    await AuditLog.create({
      entityType: 'Action',
      entityId: action._id,
      actorId: req.user.userId,
      field: 'create',
      oldValue: null,
      newValue: { assignedTo, dueDate, status: 'open' },
    });

    // Also log on the incident that an action was added
    await AuditLog.create({
      entityType: 'Incident',
      entityId: incidentId,
      actorId: req.user.userId,
      field: 'action_added',
      oldValue: null,
      newValue: { actionId: action._id },
    });

    import('../socket.js').then(({ emitToOrg }) => {
      emitToOrg(req.user.orgId, 'action_assigned', {
        actionId: action._id,
        incidentTitle: incident.title,
        assignedTo,
        message: `A new corrective action was assigned.`,
      });
    });

    res.status(201).json({ status: 'success', data: { action } });
  } catch (error) {
    next(error);
  }
}

export async function updateActionStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const action = await Action.findOne({ _id: id, orgId: req.user.orgId });
    if (!action) throw new NotFoundError('Action not found');

    const oldStatus = action.status;
    action.status = status;
    if (notes) action.notes = notes;
    await action.save();

    await AuditLog.create({
      entityType: 'Action',
      entityId: action._id,
      actorId: req.user.userId,
      field: 'status',
      oldValue: oldStatus,
      newValue: status,
    });

    res.json({ status: 'success', data: { action } });
  } catch (error) {
    next(error);
  }
}

export async function getIncidentActions(req, res, next) {
  try {
    const { incidentId } = req.params;
    const actions = await Action.find({ incidentId, orgId: req.user.orgId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ status: 'success', data: { actions } });
  } catch (error) {
    next(error);
  }
}
