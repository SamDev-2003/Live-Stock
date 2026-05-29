const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'animal_issue',         // farmer reports animal disease -> vets notified
      'feeding_reminder',     // time to give medicine
      'medicine_expiry',      // medicine expiring soon
      'withdrawal_active',    // animal is under withdrawal restriction
      'withdrawal_lifted',    // restriction lifted
      'treatment_record',     // vet recorded treatment
      'new_stakeholder',      // center approved a farmer
      'inspection_alert',     // inspector flagged something
      'general'
    ],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedAnimal: { type: mongoose.Schema.Types.ObjectId, ref: 'Animal', default: null },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  isRead: { type: Boolean, default: false },
  emailSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
