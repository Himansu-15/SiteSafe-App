import mongoose from 'mongoose';

const incidentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ['injury', 'near_miss', 'hazard'],
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
  },
  siteId: { type: String, required: true, trim: true },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  status: {
    type: String,
    required: true,
    enum: ['reported', 'investigating', 'action_pending', 'closed'],
    default: 'reported',
  },
  attachments: [{ type: String }], // Array of Cloudinary URLs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index for efficient multi-tenant queries and cursor pagination
incidentSchema.index({ orgId: 1, status: 1, createdAt: -1 });
// Index for cursor pagination without status
incidentSchema.index({ orgId: 1, createdAt: -1 });

incidentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Incident = mongoose.model('Incident', incidentSchema);
