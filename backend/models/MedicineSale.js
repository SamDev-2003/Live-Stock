const mongoose = require('mongoose');

const medicineSaleSchema = new mongoose.Schema({
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  pharmacist: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal' }, // optional — specific animal
  quantity: { type: Number, required: true },
  totalDoses: { type: Number, required: true },      // total number of doses
  dosesGiven: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  nextFeedingTime: { type: Date },
  feedingSchedule: [{
    scheduledAt: { type: Date },
    givenAt: { type: Date, default: null },
    reminderSent: { type: Boolean, default: false }
  }],
  expirationDate: { type: Date, required: true },    // copy from medicine
  withdrawalPeriodDays: { type: Number, default: 0 },
  withdrawalEndDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired', 'cancelled'],
    default: 'active'
  },
  notes: { type: String },
  saleDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('MedicineSale', medicineSaleSchema);
