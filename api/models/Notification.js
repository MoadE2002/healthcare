const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, 
  },
  prescription_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Prescription',
  },
  appointmentId :{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  verification_id: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Verification',
  } , 
  type: {
    type: String,
    enum: [
      'PRESCRIPTION_PDF', 
      'APPOINTMENT_REMINDER', 
      'APPOINTMENT_START', 
      'CALL_INVITATION', 
      'VIDEO_CALL',
      'APPOINTMENT_CONFIRMED' , 
      'APPOINTMENT_CANCLED',
      'CALL_ENDED',
      'INCOMING_CALL',
      'VERIFIED',
      'VERIFICATION_DECLINED' ,
    ],
    required: true,
  },
  title: {
    type: String,
    required: true, 
  },
  message: {
    type: String,
    required: true,
  },
  data: {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    pdfUrl: String,
    callRoomId: String,
    additionalDetails: Object
  },
  isRead: {
    type: Boolean,
    default: false, 
  },
  createdAt: {
    type: Date,
    default: Date.now, 
  },
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Notification', notificationSchema);