const express = require('express');
const router = express.Router();
const {
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorRevenueData ,
  getDoctorAppointmentData , 
  getDoctors ,
  getDoctorStats,
  getAppointmentsByDoctorId
} = require('../controllers/doctorController');

const requireAuth = require('../middleware/requireAuth');
const authorize = require('../middleware/requireDoctor');
const checkIdMatchesToken = require('../middleware/checkIdMatchesToken');

router.get('/', getDoctors);
// Route for getting a doctor's profile by ID
router.get('/doc/:doctorId', getDoctorProfile);

// Route for updating a doctor's profile with authentication and authorization checks
router.put('/:doctorId', updateDoctorProfile);

router.get("/appointments/:doctor_id",getAppointmentsByDoctorId)

//route for getting the doctor's appointment data by doctor ID
router.get('/appointments/data/:doctorId', getDoctorAppointmentData);

//route for getting the doctor's revenue data by doctor ID
router.get('/revenue/data/:doctorId', getDoctorRevenueData);

router.get('/stats/:doctorId', getDoctorStats);

module.exports = router;
