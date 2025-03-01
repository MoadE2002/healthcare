const express = require('express');
const router = express.Router();

// Import the controller functions
const {
  cancelAppointment,
  completeAppointment,
} = require('../controllers/appointementController');

// Define routes
router.post('/cancel', cancelAppointment);
router.post('/complete', completeAppointment);

module.exports = router;
