const mongoose = require('mongoose');

const stakeholderSchema = new mongoose.Schema({
  center: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // milk center or slaughterhouse
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
  approvedAt: { type: Date, default: null },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

stakeholderSchema.index({ center: 1, farmer: 1 }, { unique: true });

module.exports = mongoose.model('Stakeholder', stakeholderSchema);
