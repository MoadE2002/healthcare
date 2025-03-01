const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  appointmentfeeded: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
  },
  reviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: false,
  },
  text: {
    type: String,
    required: true,
  },
  seen: { 
    type: Boolean, 
    default : false 
  }, 
  canshow: {  
    type: Boolean , 
    default : false 
  }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
