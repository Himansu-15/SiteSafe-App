import { Incident } from '../models/Incident.js';
import { AuditLog } from '../models/AuditLog.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { NotFoundError } from '../utils/errors.js';

export async function createIncident(req, res, next) {
  try {
    const { title, description, type, severity, siteId } = req.body;
    
    let attachmentUrls = [];
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map(file => uploadToCloudinary(file.buffer));
      const results = await Promise.all(uploadPromises);
      attachmentUrls = results.map(result => result.secure_url);
    }

    const incident = await Incident.create({
      title,
      description,
      type,
      severity,
      siteId,
      reportedBy: req.user.userId,
      orgId: req.user.orgId,
      attachments: attachmentUrls,
      status: 'reported',
    });

    await AuditLog.create({
      entityType: 'Incident',
      entityId: incident._id,
      actorId: req.user.userId,
      field: 'create',
      oldValue: null,
      newValue: { title, status: 'reported' },
    });

    import('../socket.js').then(({ emitToOrg }) => {
      emitToOrg(req.user.orgId, 'incident_updated', {
        incidentId: incident._id,
        title: incident.title,
        status: 'reported',
        message: `New incident reported: "${incident.title}"`,
      });
    });

    res.status(201).json({
      status: 'success',
      data: { incident },
    });
  } catch (error) {
    next(error);
  }
}

export async function getIncidents(req, res, next) {
  try {
    const { status, severity, siteId, from, to, cursor, limit } = req.query;
    
    // ORG SCOPING - Essential for multi-tenancy
    const query = { orgId: req.user.orgId };

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (siteId) query.siteId = siteId;
    
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    // Cursor Pagination (based on createdAt)
    if (cursor) {
      query.createdAt = { ...query.createdAt, $lt: new Date(cursor) };
    }

    const limitNum = parseInt(limit, 10) || 10;

    const incidents = await Incident.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .populate('reportedBy', 'name email')
      .lean();

    const nextCursor = incidents.length === limitNum ? incidents[incidents.length - 1].createdAt : null;

    res.json({
      status: 'success',
      data: {
        incidents,
        nextCursor,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getIncidentById(req, res, next) {
  try {
    const { id } = req.params;
    
    const incident = await Incident.findOne({ _id: id, orgId: req.user.orgId })
      .populate('reportedBy', 'name email')
      .lean();

    if (!incident) {
      throw new NotFoundError('Incident not found');
    }

    res.json({
      status: 'success',
      data: { incident },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateIncidentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const incident = await Incident.findOne({ _id: id, orgId: req.user.orgId });
    if (!incident) throw new NotFoundError('Incident not found');

    const validTransitions = {
      'reported': 'investigating',
      'investigating': 'action_pending',
      'action_pending': 'closed',
    };

    if (validTransitions[incident.status] !== status) {
      return res.status(400).json({
        status: 'error',
        code: 'INVALID_TRANSITION',
        message: `Cannot transition from ${incident.status} to ${status}`,
      });
    }

    const oldStatus = incident.status;
    incident.status = status;
    await incident.save();

    await AuditLog.create({
      entityType: 'Incident',
      entityId: incident._id,
      actorId: req.user.userId,
      field: 'status',
      oldValue: oldStatus,
      newValue: status,
    });

    import('../socket.js').then(({ emitToOrg }) => {
      emitToOrg(req.user.orgId, 'incident_updated', {
        incidentId: incident._id,
        title: incident.title,
        status,
        message: `Incident "${incident.title}" is now ${status}.`,
      });
    });

    res.json({ status: 'success', data: { incident } });
  } catch (error) {
    next(error);
  }
}

export async function exportIncidentsCsv(req, res, next) {
  try {
    const incidents = await Incident.find({ orgId: req.user.orgId })
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const headers = ['ID', 'Title', 'Type', 'Severity', 'Status', 'Reported By', 'Date'];
    const rows = incidents.map(inc => [
      inc._id,
      `"${inc.title.replace(/"/g, '""')}"`,
      inc.type,
      inc.severity,
      inc.status,
      `"${inc.reportedBy?.name || 'Unknown'}"`,
      new Date(inc.createdAt).toISOString()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=incidents.csv');
    res.send(csvContent);
  } catch (error) {
    next(error);
  }
}
