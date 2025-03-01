const express = require('express');
const router = express.Router();
// controller functions 
const { signupUser , loginUser , verifyEmail , resendVerification} = require('../controllers/authController');

//login route
router.post('/login',loginUser)

// signup route 
router.post('/signup',signupUser)

router.post('/resend-verification', resendVerification);

router.get('/verify/:token', verifyEmail);



module.exports = router ; 