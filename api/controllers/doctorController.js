const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Experience = require('../models/Experience');
const Education = require('../models/Education');
const Appointment = require('../models/Appointement'); 

//getDoctors  
const getDoctors = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const nameSearch = req.query.name || '';
    const specialitySearch = req.query.speciality || '';
    const minPrice = parseFloat(req.query.minPrice) || 0; 
    const maxPrice = parseFloat(req.query.maxPrice) || 10000; 

    const filters = { accepted: true };
    if (nameSearch) {
      const searchRegex = new RegExp(nameSearch, 'i'); // Case-insensitive regex for partial matches
      filters.$or = [
        { 'user.username': searchRegex }, // Adjust to search within username field for substrings
        { fullName: searchRegex },
        { email: searchRegex }, 
        { 'profile.bio': searchRegex }, 
      ];
    }

    if (specialitySearch) {
      const specialityTerms = specialitySearch.split(',')
        .map(spec => spec.trim())
        .filter(spec => spec.length > 0);

      if (specialityTerms.length > 0) {
        filters.speciality = {
          $elemMatch: {
            $regex: specialityTerms.join('|'),
            $options: 'i'
          }
        };
      }
    }

    // Price range filter remains the same
    if (minPrice || maxPrice) {
      filters.appointmentPrice = { $gte: minPrice, $lte: maxPrice };
    }

    // Perform the query with flexible matching
    const doctors = await Doctor.find(filters)
      .populate('user', 'username')
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    // Count total matching doctors for pagination
    const totalDoctors = await Doctor.countDocuments(filters);

    const formattedDoctors = doctors.map((doctor) => ({
      id: doctor._id,
      username: doctor.user.username,
      about: doctor.about || 'No description available.',
      appointmentPrice: `$${doctor.appointmentPrice.toFixed(2)}`,
      rating: doctor.rating,
      speciality: doctor.speciality.join(', '),
      completedAppointments: doctor.completedAppointments,
    }));

    res.status(200).json({ 
      success: true, 
      doctors: formattedDoctors,
      totalDoctors,
      currentPage: page,
      totalPages: Math.ceil(totalDoctors / limit)
    });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch doctors' });
  }
};


const getAppointmentsByDoctorId = async (req, res) => {
  const { doctor_id } = req.params;
  const { page = 1, limit = 10 } = req.query; 

  try {
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // Calculate the skip value
    const skip = (page - 1) * limit;

    // Retrieve paginated appointments
    const appointments = await Appointment.find({ doctor_id })
      .populate('patient_id', 'username email')
      .skip(skip)
      .limit(Number(limit));

    // Total appointments count
    const totalAppointments = await Appointment.countDocuments({ doctor_id });

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'No appointments found for this doctor.' });
    }


    res.status(200).json({
      appointments,
      totalAppointments,
      currentPage: Number(page),
      totalPages: Math.ceil(totalAppointments / limit),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const getDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params; 

    const doctor = await Doctor.findById(doctorId)
      .populate({ path: 'user', model: 'User', select: 'username email phone photoDeProfile address' });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const experiences = await Experience.find({ doctor: doctorId });
    const education = await Education.find({ doctor: doctorId });

    const profile = {
      username: doctor.user.username, 
      email: doctor.user.email,
      phone: doctor.user.phone, 
      profilePicture: doctor.user.photoDeProfile ? doctor.user.photoDeProfile.toString('base64') : null,
      address: doctor.user.address, 
      about: doctor.about,
      appointmentPrice: doctor.appointmentPrice, 
      speciality : doctor.speciality, 
      experiences: experiences,
      education: education,
    };

    res.status(200).json(profile);
  } catch (error) {
    console.error('Error fetching doctor profile:', error);
    res.status(500).json({ message: 'An error occurred while fetching the doctor profile' });
  }
};


const updateDoctorProfile = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { 
      about, 
      address, 
      appointmentPrice, 
      experienceIdsToDelete, 
      educationIdsToDelete, 
      newExperiences, 
      newEducation,
      specialities 
    } = req.body;

    // Validate specialities if provided
    if (specialities) {
      if (!Array.isArray(specialities)) {
        return res.status(400).json({ 
          message: 'Specialities must be provided as an array' 
        });
      }

      if (specialities.length > 3) {
        return res.status(400).json({ 
          message: 'A doctor can have a maximum of 3 specialities' 
        });
      }

      // Remove duplicates and ensure all values are strings
      const uniqueSpecialities = [...new Set(specialities)].map(s => String(s));
      if (uniqueSpecialities.length === 0) {
        return res.status(400).json({ 
          message: 'At least one speciality is required' 
        });
      }
    }

    // Update fields in Doctor model
    const updates = {};
    if (about) updates.about = about;
    if (address) updates['doctor.address'] = address;
    if (appointmentPrice) updates.appointmentPrice = appointmentPrice;
    if (specialities) updates.speciality = [...new Set(specialities)].map(s => String(s));

    // Update basic fields
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      doctorId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedDoctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Handle deletion of experiences
    if (experienceIdsToDelete && experienceIdsToDelete.length > 0) {
      await Experience.deleteMany({ _id: { $in: experienceIdsToDelete } });
      await Doctor.updateOne(
        { _id: doctorId },
        { $pull: { experience: { $in: experienceIdsToDelete } } }
      );
    }

    // Handle deletion of education
    if (educationIdsToDelete && educationIdsToDelete.length > 0) {
      await Education.deleteMany({ _id: { $in: educationIdsToDelete } });
      await Doctor.updateOne(
        { _id: doctorId },
        { $pull: { education: { $in: educationIdsToDelete } } }
      );
    }

    // Add new experiences
    if (newExperiences && newExperiences.length > 0) {
      const experiences = await Experience.insertMany(
        newExperiences.map((exp) => ({ ...exp, doctor: doctorId }))
      );
      await Doctor.updateOne(
        { _id: doctorId },
        { $push: { experience: { $each: experiences.map((exp) => exp._id) } } }
      );
    }

    // Add new education
    if (newEducation && newEducation.length > 0) {
      const educationEntries = await Education.insertMany(
        newEducation.map((edu) => ({ ...edu, doctor: doctorId }))
      );
      await Doctor.updateOne(
        { _id: doctorId },
        { $push: { education: { $each: educationEntries.map((edu) => edu._id) } } }
      );
    }

    // Fetch updated doctor with populated fields
    const populatedDoctor = await Doctor.findById(doctorId)
      .populate('experience')
      .populate('education');

    res.status(200).json({ 
      message: 'Profile updated successfully', 
      updatedDoctor: populatedDoctor 
    });
  } catch (error) {
    console.error('Error updating doctor profile:', error);
    res.status(500).json({ 
      message: 'An error occurred while updating the profile' 
    });
  }
};

  
const getDoctorAppointmentData = async (req, res) => {
    try {
      const doctorId = req.params.doctorId;
  
      // Fetch appointments for the doctor with the specified statuses
      const appointments = await Appointment.find({
        doctor_id: doctorId,
        status: { $in: ['confirmed', 'completed', 'pending'] },
      });
  
      // Initialize the weekdays array
      const weekDays = [
        { name: 'Sun', appointments: 0 },
        { name: 'Mon', appointments: 0 },
        { name: 'Tue', appointments: 0 },
        { name: 'Wed', appointments: 0 },
        { name: 'Thu', appointments: 0 },
        { name: 'Fri', appointments: 0 },
        { name: 'Sat', appointments: 0 },
      ];
  
      // Count the appointments for each day
      appointments.forEach((appointment) => {
        const dayOfWeek = new Date(appointment.date).getDay();
        weekDays[dayOfWeek].appointments++;
      });
  
      // Send the response
      res.json(weekDays);
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  

  // Get revenue of doctor splited by mount 
  const getDoctorRevenueData = async (req, res) => {
    try {
      const doctorId = req.params.doctorId;
  
      // Fetch the doctor's details to get the appointment price
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      const appointmentPrice = doctor.appointmentPrice;
  
      // Fetch appointments for the doctor with the specified statuses
      const appointments = await Appointment.find({
        doctor_id: doctorId,
        status: { $in: ['confirmed', 'completed','pending'] },
      });
  
      // Initialize the revenue data array
      const revenueData = [
        { name: 'Jan', revenue: 0 },
        { name: 'Feb', revenue: 0 },
        { name: 'Mar', revenue: 0 },
        { name: 'Apr', revenue: 0 },
        { name: 'May', revenue: 0 },
        { name: 'Jun', revenue: 0 },
        { name: 'Jul', revenue: 0 },
        { name: 'Aug', revenue: 0 },
        { name: 'Sep', revenue: 0 },
        { name: 'Oct', revenue: 0 },
        { name: 'Nov', revenue: 0 },
        { name: 'Dec', revenue: 0 },
      ];
  
      // Calculate the revenue for each month
      appointments.forEach((appointment) => {
        const month = new Date(appointment.date).getMonth();
        revenueData[month].revenue += appointmentPrice * 0.95; // Subtracting 5% from the appointment price
      });
  
      // Send the response
      res.json(revenueData);
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };

  // get doctor stats : 
  const getDoctorStats = async (req, res) => {
    try {
      const doctorId = req.params.doctorId;
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of the day (midnight)
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of the day (just before midnight)
  
      // Fetch the doctor's details to get the appointment price
      const doctor = await Doctor.findById(doctorId);
      if (!doctor) {
        return res.status(404).json({ message: 'Doctor not found' });
      }
      const appointmentPrice = doctor.appointmentPrice;
  
      // Fetch total appointments with 'pending' and 'confirmed' statuses
      const totalAppointments = await Appointment.countDocuments({
        doctor_id: doctorId,
        status: { $in: ['pending', 'confirmed'] },
      });
  
      // Fetch total patients (unique patient IDs with the same doctor ID)
      const totalPatients = await Appointment.countDocuments({
        doctor_id: doctorId,
      });
  
      // Fetch upcoming appointments today with 'pending' and 'confirmed' statuses
      const upcomingAppointmentsToday = await Appointment.countDocuments({
        doctor_id: doctorId,
        date: { $gte: startOfDay, $lt: endOfDay },
        status: { $in: ['pending', 'confirmed'] },
      });
  
      // Fetch completed appointments to calculate revenue
      const completedAppointments = await Appointment.countDocuments({
        doctor_id: doctorId,
        status: 'completed',
      });
  
      // Calculate total revenue
      const totalRevenue = completedAppointments * appointmentPrice * 0.95; // Subtracting 5%
  
      const stats = {
        totalAppointments,
        totalPatients,
        upcomingAppointmentsToday,
        totalRevenue,
      };
  
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  

module.exports = { 
    getDoctorProfile,
    updateDoctorProfile,
    getDoctorAppointmentData,
    getDoctorRevenueData , 
    getDoctors , 
    getDoctorStats,
    getAppointmentsByDoctorId
 };
