import { AuditLog } from '../models/AuditLog.js';

export async function getAuditLogs(req, res, next) {
  try {
    const { entityType, entityId } = req.params;

    const logs = await AuditLog.find({ entityType, entityId })
      .populate('actorId', 'name role')
      .sort({ timestamp: -1 });

    res.json({ status: 'success', data: { logs } });
  } catch (error) {
    next(error);
  }
}
