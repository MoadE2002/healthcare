const express = require('express');
const router = express.Router();
const {
  getAvailableSlots,
  bookAppointment,
  cancelAppointment,
  confirmAppointment,
  completeAppointment , 
  getUpcomingAppointments , 
  getAppointmentDetails
} = require('../controllers/appointementController');

// Route to get available time slots for a doctor
router.post('/available-slots', getAvailableSlots);

// Route to book an appointment
router.post('/book-appointment', bookAppointment);

// Route to cancel an appointment
router.post('/cancel-appointment', cancelAppointment);

// Route to confirm an appointment
router.post('/confirm-appointment', confirmAppointment);

// Route to complete an appointment
router.post('/complete-appointment', completeAppointment);

// Route to get close 3 appoinmenet by doctos id 
router.get('/upcoming-appointments/:doctor_id', getUpcomingAppointments);


router.get('/:appointmentId', getAppointmentDetails);


module.exports = router;
