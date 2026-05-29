const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['admin', 'farmer', 'pharmacist', 'vet', 'inspector', 'slaughterhouse', 'milk_center'],
    required: true
  },
  profileImage: { type: String, default: null },
  location: {
    sector: { type: mongoose.Schema.Types.ObjectId, ref: 'Sector' },
    cell:   { type: mongoose.Schema.Types.ObjectId, ref: 'Cell' },
    village:{ type: mongoose.Schema.Types.ObjectId, ref: 'Village' },
    address: { type: String }
  },
  isActive: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false }, // Admin approves inspectors; others auto-approved
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
