const express = require('express');
const router = express.Router();
const {
  createReport,
  getReports,
  getUnresolvedReports,
  resolveReport,
  getUserReports,
  getDoctorUsernamesForUserAppointments,
  getOrCanceledOrCompletedAppointments
} = require('../controllers/reportController');


router.post('/', createReport);

// Get all reports (admin access)
router.get('/', getReports);

// Get unresolved reports (admin access)
router.get('/unresolved', getUnresolvedReports);

// Mark a report as resolved (admin access)
router.patch('/resolve/:reportId', resolveReport);

// Get reports for a specific user
router.get('/user/:userId', getUserReports);

// Get doctor usernames for a user's appointments
router.get('/doctors/:userId', getDoctorUsernamesForUserAppointments);

// Get confirmed or canceled appointments for a user
router.get('/appointments/:userId', getOrCanceledOrCompletedAppointments);

module.exports = router;