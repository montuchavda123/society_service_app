const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String },
  priority: { 
    type: String, 
    enum: ['Urgent', 'High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Assigned', 'Accepted', 'In Progress', 'Completed', 'Closed'], 
    default: 'Pending' 
  },
  voiceNoteUrl: { type: String },
  aiTranscription: { type: String },
  feedback: { type: String },
  rating: { type: Number, min: 1, max: 5 },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
