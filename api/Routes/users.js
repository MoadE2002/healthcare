const express = require('express');
const router = express.Router();
const { getUserById, upload , updateUserDetails, getAppointments ,  updateUserPassword, updateUserEmail } = require('../controllers/userController');

// Route to get user by ID
router.get('/:userId', getUserById);

router.get('/appointments/:userId', getAppointments);


// Route to update user details
router.put('/:userId/details', updateUserDetails);

// Route to update user password
router.put('/:userId/password/',upload ,  updateUserPassword);

// Route to update user email
router.put('/:userId/email/', updateUserEmail);



module.exports = router;
