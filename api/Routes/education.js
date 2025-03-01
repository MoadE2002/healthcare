const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');

// Create a new education record
router.post('/', educationController.createEducation);

// Get all education records for a specific doctor
router.get('/doctor/:doctorId', educationController.getEducationForDoctor);

// Update an education record by ID
router.put('/:educationId', educationController.updateEducation);

// Delete an education record by ID
router.delete('/:educationId', educationController.deleteEducation);

module.exports = router;
