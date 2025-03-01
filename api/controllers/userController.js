const bcrypt = require('bcrypt');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointement')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Ensure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);  // Set a unique file name
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB file size limit
  },
  fileFilter: (req, file, cb) => {
    // Accept image files only
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const extname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedFileTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
}).single('photoDeProfile');

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user and exclude password
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prepare user data
    const userData = user.toObject();

    // Handle profile image
    if (userData.photoDeProfile) {
      const imagePath = path.join(__dirname, '..', userData.photoDeProfile);
      
      // Check if image file exists
      if (fs.existsSync(imagePath)) {
        // Read image file
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Convert to base64
        userData.photoDeProfile = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
      } else {
        // If file not found, set to null or a default image
        userData.photoDeProfile = null;
      }
    }

    res.status(200).json(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'An error occurred while fetching the user' });
  }
};

// Update user details
const updateUserDetails = async (req, res) => {
  upload(req, res, async (uploadErr) => {
    // Check for Multer upload errors
    if (uploadErr) {
      return res.status(400).json({ 
        message: 'File upload error', 
        error: uploadErr.message 
      });
    }

    try {
      const { userId } = req.params;
      const { 
        username, 
        phone, 
        address, 
        city, 
        age, 
        gender 
      } = req.body;

      // Prepare update object
      const updates = {};

      // Add user details to the update object if provided
      if (username) updates.username = username;
      if (phone) updates.phone = phone;
      if (address) updates.address = address;
      if (city) updates.city = city;
      if (age) updates.age = parseInt(age);
      if (gender) updates.gender = gender;

      // Handle profile photo upload
      if (req.file) {
        // Find existing user to handle old photo
        const user = await User.findById(userId);

        // Remove old photo if exists
        if (user && user.photoDeProfile) {
          const oldPhotoPath = path.join(__dirname, '..', user.photoDeProfile);
          if (fs.existsSync(oldPhotoPath)) {
            fs.unlinkSync(oldPhotoPath);
          }
        }

        // Store relative path to the uploaded file
        updates.photoDeProfile = `/uploads/${req.file.filename}`;
      }

      // Update the user document
      const updatedUser = await User.findByIdAndUpdate(
        userId, 
        updates, 
        { 
          new: true,  // Return the updated document
          runValidators: true  // Run model validations
        }
      );

      // Check if user was found and updated
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Prepare response (optionally remove sensitive data)
      const responseUser = updatedUser.toObject();
      delete responseUser.password;

      res.status(200).json({ 
        message: 'User details updated successfully', 
        user: responseUser 
      });

    } catch (error) {
      console.error('Error updating user details:', error);
      
      // Handle specific validation errors
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          message: 'Validation Error', 
          errors: Object.values(error.errors).map(err => err.message)
        });
      }

      res.status(500).json({ 
        message: 'An error occurred while updating user details',
        error: error.message 
      });
    }
  });
};


const updateUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Both old and new passwords are required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Old password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({ message: 'An error occurred while updating the password' });
  }
};

const updateUserEmail = async (req, res) => {
  try {
    const { userId } = req.params;
    const { password, newEmail } = req.body;

    if (!password || !newEmail) {
      return res.status(400).json({ message: 'Password and new email are required' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Password is incorrect' });
    }

    user.email = newEmail;
    await user.save();

    res.status(200).json({ message: 'Email updated successfully' });
  } catch (error) {
    console.error('Error updating email:', error);
    res.status(500).json({ message: 'An error occurred while updating the email' });
  }
};


const getAppointments = async (req, res) => {
  const { userId } = req.params;
  try {
    const appointments = await Appointment.find({ patient_id: userId })
      .populate({
        path: 'doctor_id',
        model: 'Doctor',
        populate: {
          path: 'user',
          model: 'User'
        }
      });

    // Format the appointments with doctor details
    const formattedAppointments = appointments.map(appointment => ({
      _id: appointment._id,
      purpose: appointment.purpose,
      date: appointment.date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      status: appointment.status,
      doctor_id: appointment.doctor_id._id,
      doctor: {
        userId: appointment.doctor_id.user._id,
        name: appointment.doctor_id.user.username,
        appointmentPrice: appointment.doctor_id.appointmentPrice,
        durationOfAppointment: appointment.doctor_id.durationOfAppointment
      }
    }));
    res.status(200).json(formattedAppointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Server error while fetching appointments" });
  }
};


module.exports = {getAppointments, upload ,  getUserById, updateUserDetails, updateUserPassword, updateUserEmail };
