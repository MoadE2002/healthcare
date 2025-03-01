const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  doctor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  front_identity_card: {
    type: String,
    required: true
  },
  back_identity_card: {
    type: String,
    required: true
  },
  images: [{
    type: String
  }],
  description: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  number_of_time_sent: {
    type: Number,
    default: 1
  },
  last_verification_attempt: {
    type: Date,
    default: Date.now
  },
  verified_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verification_date: Date,
  decline_reason: String,
  seen: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Verification = mongoose.model('Verification', verificationSchema);

module.exports = Verification;
