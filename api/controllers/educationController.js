const Education = require('../models/Education');

exports.createEducation = async (req, res) => {
  try {
    const { doctor, school, fieldOfStudy, startYear, endYear } = req.body;
    const newEducation = new Education({
      doctor,
      school,
      fieldOfStudy,
      startYear,
      endYear
    });
    const savedEducation = await newEducation.save();
    res.status(201).json(savedEducation);
  } catch (error) {
    console.error('Error creating education:', error);
    res.status(500).json({ message: 'An error occurred while creating the education record' });
  }
};

exports.getEducationForDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const education = await Education.find({ doctor: doctorId });
    res.status(200).json(education);
  } catch (error) {
    console.error('Error fetching education records:', error);
    res.status(500).json({ message: 'An error occurred while fetching the education records' });
  }
};

// Update an education record by ID
exports.updateEducation = async (req, res) => {
  try {
    const { educationId } = req.params;
    const updatedEducation = await Education.findByIdAndUpdate(educationId, req.body, { new: true });
    res.status(200).json(updatedEducation);
  } catch (error) {
    console.error('Error updating education:', error);
    res.status(500).json({ message: 'An error occurred while updating the education record' });
  }
};

// Delete an education record by ID
exports.deleteEducation = async (req, res) => {
  try {
    const { educationId } = req.params;
    await Education.findByIdAndDelete(educationId);
    res.status(200).json({ message: 'Education record deleted successfully' });
  } catch (error) {
    console.error('Error deleting education record:', error);
    res.status(500).json({ message: 'An error occurred while deleting the education record' });
  }
};
