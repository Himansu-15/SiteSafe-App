import mongoose from 'mongoose';

const siteSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
}, { _id: true });

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  sites: [siteSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

organizationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

organizationSchema.index({ name: 1 }, { unique: true });

export const Organization = mongoose.model('Organization', organizationSchema);