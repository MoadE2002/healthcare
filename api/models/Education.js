const mongoose = require('mongoose');

const educationSchema = new mongoose.Schema({
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  school: String,
  fieldOfStudy: String,
  startYear: Number,
  endYear: Number,
});

module.exports = mongoose.model('Education', educationSchema);
