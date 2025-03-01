const mongoose = require('mongoose');
const PrescriptionSchema = new mongoose.Schema({
    appointement_id : { 
        type: mongoose.Schema.Types.ObjectId , 
        ref: 'Appointment',
        require: true 
    } , 
    description: { 
        type: String , 
        require: true 
    } , 
    medication: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        duration: { type: String, required: true },
      },
    ],
    additional_instructions: { type: String },
    issued_at: {
      type: Date,
      default: Date.now,
    },
});
  
  module.exports = mongoose.model('Prescription', PrescriptionSchema);
  