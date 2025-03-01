const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  about: { type: String, maxLength: 1000 },
  appointmentPrice: { type: Number, default: 5 },
  rating: { type: Number, default: 5 , min: 1 , max:5 },
  experience: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Experience' }],
  education: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Education' }],
  accepted: { type: Boolean, default: false },
  completedAppointments: { type: Number, default: 0 },
  durationOfAppointment: { type: String, default: '15min' },
  speciality: { type: [String], default: ['general'], required: true }, 
});

module.exports = mongoose.model('Doctor', doctorSchema);
