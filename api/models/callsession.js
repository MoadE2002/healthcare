const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['PATIENT', 'DOCTOR'],
      required: true
    },
    joinedAt: Date,
    leftAt: Date
  }],
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'ENDED'],
    default: 'PENDING'
  },
  startTime: Date,
  endTime: Date,
  duration: Number
}, { 
  timestamps: true 
});

module.exports = mongoose.model('CallSession', callSessionSchema);