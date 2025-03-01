const express = require('express');
const router = express.Router();
const experienceController = require('../controllers/experienceController');

router.post('/', experienceController.createExperience);

// Get all experiences for a specific doctor
router.get('/doctor/:doctorId', experienceController.getExperiencesForDoctor);

// Update an experience by ID
router.put('/:experienceId', experienceController.updateExperience);

// Delete an experience by ID
router.delete('/:experienceId', experienceController.deleteExperience);

module.exports = router;
