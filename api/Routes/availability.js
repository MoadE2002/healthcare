const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/appointementController');

router.post('/', availabilityController.createOrUpdateAvailability);

router.get('/:doctorId', availabilityController.getAvailabilityByDoctor);

module.exports = router;