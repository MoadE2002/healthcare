const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reportedDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'doctor',
    required: false, 
  },
  reportedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: false, 
  },
  feedback: {
    type: String,
    required: false,
  },
  reportReason: {
    type: String,
    required: true, 
    enum: [
      'UNPROFESSIONAL_BEHAVIOR',
      'MISDIAGNOSIS',
      'APPOINTMENT_ISSUE',
      'OTHER',
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resolved: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model('Report', reportSchema);
