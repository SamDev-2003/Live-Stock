const mongoose = require('mongoose');

const animalSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  animalType: { type: String, required: true, trim: true }, // e.g. "cow"
  breed: { type: String, trim: true },                       // e.g. "Jersey", "Guernsey"
  profileImage: { type: String, default: null },
  tagNumber: { type: String, trim: true },                   // optional ear tag
  gender: { type: String, enum: ['male', 'female', 'unknown'], default: 'unknown' },
  dateOfBirth: { type: Date },
  status: {
    type: String,
    enum: ['healthy', 'under_treatment', 'restricted', 'deceased', 'sold'],
    default: 'healthy'
  },
  // restriction details
  restrictionReason: { type: String, default: null },
  restrictionUntil: { type: Date, default: null },
  // Issue reports
  issueReports: [{
    reportedAt: { type: Date, default: Date.now },
    description: { type: String },
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolved: { type: Boolean, default: false }
  }],
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Animal', animalSchema);
