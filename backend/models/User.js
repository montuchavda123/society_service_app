const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['SuperAdmin', 'Secretary', 'Member', 'Mechanic'], 
    default: 'Member' 
  },
  societyCode: { type: String },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society' },
  companyName: { type: String }, // For Secretary role
  phone: { type: String },
  flatNumber: { type: String }, // e.g., 'A-101'
  skills: [{ type: String }], // e.g., ['Plumbing', 'Electrical']
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
