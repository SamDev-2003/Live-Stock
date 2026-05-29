const mongoose = require('mongoose');

const treatmentSchema = new mongoose.Schema({
  animal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', required: true },
  vet: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  diagnosis: { type: String, required: true },
  symptoms: [String],
  medications: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine' },
    medicineName: String, // fallback name if not in system
    dosage: String,
    administrationRoute: {
      type: String,
      enum: ['oral', 'injection', 'topical', 'intravenous', 'intramuscular', 'other'],
      default: 'oral'
    },
    frequency: String,  // e.g. "twice daily"
    duration: String    // e.g. "5 days"
  }],
  treatmentDate: { type: Date, default: Date.now },
  followUpDate: { type: Date },
  withdrawalPeriodDays: { type: Number, default: 0 },
  withdrawalEndDate: { type: Date },
  notes: { type: String },
  status: {
    type: String,
    enum: ['ongoing', 'completed', 'follow_up_required'],
    default: 'ongoing'
  },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Treatment', treatmentSchema);
