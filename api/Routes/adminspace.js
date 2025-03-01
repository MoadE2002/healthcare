const express = require('express');
const { 
  getAppointmentsByUserId, 
  getAllDoctors, 
  getDoctorById, 
  cancelAppointmentByAdmin, 
  getAllPatients, 
  deleteDoctor, 
  updateDoctorAvailability,
  getAllDoctorsAppointmentData,  // New method
  getAllDoctorsRevenueData,      // New method
  getAllDoctorsStats             // New method
} = require('../controllers/adminController');

const router = express.Router();

// Existing routes
router.get('/appointments/user', getAppointmentsByUserId);
router.get('/doctors', getAllDoctors);
router.get('/doctor/:doctor_id', getDoctorById);
router.post('/appointment/cancel', cancelAppointmentByAdmin);
router.get('/patients', getAllPatients);
router.delete('/doctor', deleteDoctor);
router.put('/doctor/availability', updateDoctorAvailability);

// New routes
router.get('/appointments/doctors/stats', getAllDoctorsAppointmentData); // Appointments grouped by weekday
router.get('/revenue/doctors', getAllDoctorsRevenueData);                // Revenue grouped by month
router.get('/stats/doctors', getAllDoctorsStats);                        // Overall stats for all doctors

module.exports = router;
