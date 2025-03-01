const User = require('../models/User');
const Doctor = require('../models/Doctor');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');


require('dotenv').config();

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: '3d' });
};

// Login user
const loginUser = async (req, res) => {
  const { email, password: userPassword } = req.body;
  try {
    const user = await User.login(email, userPassword);
    const token = createToken(user._id);

    // Prepare user data without password
    const { password: hashedPassword, ...userData } = user._doc;

    let doctorDetails = null;
    let haveEducation = false;
    let photoDeProfile = null;

    // Fetch profile photo if it exists
    if (user.photoDeProfile) {
      try {
      

        const imagePath = path.join(__dirname, '..', user.photoDeProfile);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
            photoDeProfile = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
        }else { 
          photoDeProfile = null;
        }

        
        
      } catch (photoError) {
        console.error('Error reading profile photo:', photoError);
      }
    }

    if (user.role === 'DOCTOR' || user.role === 'ADMIN') {
      doctorDetails = await Doctor.findOne({ user: user._id });

      if (doctorDetails) {
        try {
          // Check for education details safely
          const educationCount = await Education.countDocuments({ doctor: doctorDetails._id });
          haveEducation = educationCount > 0;
        } catch (err) {
          // If checking education fails, set haveEducation to false
          haveEducation = false;
        }
      }
    }

    // Return user data with token, doctor details, and education info if applicable
    res.status(200).json({ 
      ...userData, 
      token,
      photoDeProfile, // Add profile photo to response
      ...(doctorDetails && { 
        doctorId: doctorDetails._id, 
        accepted: doctorDetails.accepted,
        haveEducation
      })
    });
  } catch (error) {
    // Distinguish between different types of errors
    if (error.message === 'Account not verified. A new verification email has been sent.') {
      return res.status(403).json({ error: error.message });
    }
    res.status(400).json({ error: error.message });
  }
};



// Signup user (remains the same)
const signupUser = async (req, res) => {
  const { username, email, gender, age, password, phone, role, address, city, doctorDetails } = req.body;

  try {
    const user = await User.signup(username, email, gender, age, password, phone, role, address, city, doctorDetails);

    if (role === 'DOCTOR') {
      const doctor = await Doctor.findOne({ user: user.user._id });
      const token = createToken(user.user._id);

      return res.status(200).json({
        _id: user.user._id,
        email: user.user.email,
        username: user.user.username,
        role: user.user.role,
        token,
        doctorId: doctor._id,
      });
    } else {
      const token = createToken(user._id);
      return res.status(200).json({ 
        _id: user._id, 
        email: user.email, 
        username: user.username, 
        role: user.role, 
        token 
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(400).json({ error: error.message });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params ;
  try {
    const decoded = jwt.verify(token, process.env.SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      throw Error('Invalid verification token');
    }

    user.isverified = true;
    user.verificationCode = undefined;
    user.verificationExpires = undefined;

    await user.save();
    res.status(200).json({ message: 'Email successfully verified' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const resendVerification = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      throw Error('User not found');
    }

    if (user.isverified) {
      return res.status(400).json({ error: 'User is already verified' });
    }

    const verificationToken = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '3m' });
    const verificationLink = `https://localhost:3000/user/verify/${verificationToken}`;

    await User.sendVerificationEmail(user);
    res.status(200).json({ message: 'Verification email resent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = { signupUser, loginUser, resendVerification, verifyEmail };