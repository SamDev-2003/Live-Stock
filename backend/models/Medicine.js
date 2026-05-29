const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // pharmacist
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['medicine', 'food', 'supplement', 'vaccine'], default: 'medicine' },
  description: { type: String },
  manufacturer: { type: String },
  batchNumber: { type: String },
  stockQuantity: { type: Number, default: 0 },
  unit: { type: String, default: 'units' }, // ml, tablets, kg, etc.
  expirationDate: { type: Date, required: true },
  withdrawalPeriodDays: { type: Number, default: 0 }, // days animal is restricted after use
  feedingInstructions: { type: String }, // e.g. "Feed twice daily for 5 days"
  feedingIntervalHours: { type: Number, default: 24 }, // hours between doses
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Medicine', medicineSchema);
