const mongoose = require('mongoose');

const experienceSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  title: String,
  company: String,
  startDate: Date,
  endDate: Date,
  currentlyWorking: Boolean,
  description: String,
});

module.exports = mongoose.model('Experience', experienceSchema);
