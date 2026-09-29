import mongoose from 'mongoose';

const actionSchema = new mongoose.Schema({
  incidentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident', required: true },
  orgId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dueDate: { type: Date, required: true },
  status: {
    type: String,
    required: true,
    enum: ['open', 'done', 'overdue'],
    default: 'open',
  },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

actionSchema.index({ incidentId: 1 });
actionSchema.index({ orgId: 1, assignedTo: 1 });

actionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export const Action = mongoose.model('Action', actionSchema);
