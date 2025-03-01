const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const validator = require('validator');
const crypto = require('crypto'); 
const nodemailer = require('nodemailer');
const Doctor = require('./Doctor');
const jwt = require('jsonwebtoken');
require("dotenv").config();



const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    min: 3,
    max: 20,
  },
  phone: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    max: 50,
    unique: true,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
  },
  role: {
    type: String,
    enum: ["PATIENT", "DOCTOR", "ADMIN"],
    required: true,
    default: 'PATIENT',
  },
  photoDeProfile: {
    type: String,
    required: false,
  },
  password: {
    type: String,
    required: true,
    min: 8,
  },
  reports: {
    type: Number,
    default: 0,
  },
  address: {
    type: String,
  },
  isverified: {
    type: Boolean,
    default: false,
  },
  city: { 
    type: String 
  },
  verificationCode: {
    type: String,
    required: false,
  },
  verificationExpires: {
    type: Date,
    required: false,
  }
});

// Static method to send verification email
userSchema.statics.sendVerificationEmail = async function(user) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false, 
      auth: {
        user: process.env.FROM_EMAIL, 
        pass: process.env.SMTP_PASS, 
      },
    });


  // Generate the verification token
  const verificationToken = jwt.sign({ id: user._id }, process.env.SECRET, { expiresIn: '3m' });

  // Include the email as a query parameter
  const verificationLink = http://localhost:3000/user/verify/${verificationToken}?email=${encodeURIComponent(user.email)};

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: user.email,
    subject: 'Email Verification',
    text: Please use the following link to verify your email: ${verificationLink},
  };

  await transporter.sendMail(mailOptions);
};


// Static method for signup
userSchema.statics.signup = async function (username, email, gender , age ,  password, phone, role, address, city, doctorDetails) {
  // Validation
  if (!email || !password || !username) {
    throw Error('All fields must be filled');
  }

  if (!validator.isEmail(email)) {
    throw Error('Email is not valid');
  }

  if (!validator.isStrongPassword(password)) {
    throw Error('Password not strong enough');
  }

  const usernameWords = username.trim().split(/\s+/);
  if (usernameWords.length !== 2) {
    throw Error('Enter correct name');
  }

  const exists = await this.findOne({ email });
  if (exists) {
    throw Error('Email already in use');
  }

  // Hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // Generate verification code
  const verificationCode = crypto.randomBytes(20).toString('hex');
  const verificationExpires = Date.now() + 3 * 60 * 1000; // Code expires in 3 minutes

  const user = await this.create({
    username,
    email,
    password: hash,
    phone,
    gender, 
    age,
    city,
    role,
    address,
    verificationCode,
    verificationExpires,
  });

  // Send verification email
  await this.sendVerificationEmail(user);

  if (role === 'DOCTOR') {
    const doctor = await Doctor.create({
      user: user._id,
      appointmentPrice: doctorDetails?.appointmentPrice || 5,
      durationOfAppointment: doctorDetails?.durationOfAppointment || "15min",
      speciality: doctorDetails?.speciality || ["general"],
    });

    return { user, doctor };
  }

  return user;
};

// Method to verify the code
userSchema.statics.verifyEmail = async function (verificationCode) {
  const user = await this.findOne({ verificationCode });

  if (!user) {
    throw Error('Invalid verification code');
  }

  if (user.verificationExpires < Date.now()) {
    throw Error('Verification code has expired');
  }

  user.isverified = true;
  user.verificationCode = undefined;
  user.verificationExpires = undefined;

  await user.save();
  return user;
};

// Static login method

userSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw Error('All fields must be filled');
  }

  const user = await this.findOne({ email });
  if (!user) {
    throw Error('Incorrect email');
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw Error('Incorrect password');
  }

  // If user is not verified, generate a new verification code and send email
  if (!user.isverified) {
    // Generate new verification code
    const verificationCode = crypto.randomBytes(20).toString('hex');
    const verificationExpires = Date.now() + 3 * 60 * 1000; // Code expires in 3 minutes

    user.verificationCode = verificationCode;
    user.verificationExpires = verificationExpires;

    await user.save();

    // Send verification email
    await this.sendVerificationEmail(user);

    // Throw an error to indicate that verification is required
    throw Error('Account not verified. A new verification email has been sent.');
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);