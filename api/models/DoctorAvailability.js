const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true,
  },
  available_slots: [
    {
      date: { type: Date, required: true }, 
      time_slots: [
        {
          start_time: { type: String, required: true },
          end_time: { type: String, required: true },   
        },
      ],
    },
  ],
  booked_slots: [
    {
      date: { type: Date, required: true }, // Specific date for the booking
      start_time: { type: String, required: true },
      end_time: { type: String, required: true },
      patient_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      status: {
        type: String,
        enum: ['Confirmed', 'Pending', 'Cancelled'],
        default: 'Pending',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field before saving
AvailabilitySchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Availability', AvailabilitySchema);
