const Experience = require('../models/Experience');

exports.createExperience = async (req, res) => {
  try {
    const { doctor, title, company, startDate, endDate, description, currentlyWorking } = req.body;
    const newExperience = new Experience({
      doctor,
      title,
      company,
      startDate,
      endDate,
      description,
      currentlyWorking
    });
    const savedExperience = await newExperience.save();
    res.status(201).json(savedExperience);
  } catch (error) {
    console.error('Error creating experience:', error);
    res.status(500).json({ message: 'An error occurred while creating the experience' });
  }
};

// Get all experiences for a specific doctor
exports.getExperiencesForDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const experiences = await Experience.find({ doctor: doctorId });
    res.status(200).json(experiences);
  } catch (error) {
    console.error('Error fetching experiences:', error);
    res.status(500).json({ message: 'An error occurred while fetching the experiences' });
  }
};

// Update an experience by ID
exports.updateExperience = async (req, res) => {
  try {
    const { experienceId } = req.params;
    const updatedExperience = await Experience.findByIdAndUpdate(experienceId, req.body, { new: true });
    res.status(200).json(updatedExperience);
  } catch (error) {
    console.error('Error updating experience:', error);
    res.status(500).json({ message: 'An error occurred while updating the experience' });
  }
};

// Delete an experience by ID
exports.deleteExperience = async (req, res) => {
  try {
    const { experienceId } = req.params;
    await Experience.findByIdAndDelete(experienceId);
    res.status(200).json({ message: 'Experience deleted successfully' });
  } catch (error) {
    console.error('Error deleting experience:', error);
    res.status(500).json({ message: 'An error occurred while deleting the experience' });
  }
};
