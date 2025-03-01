const Appointment = require('../models/Appointement');
const Doctor = require('../models/Doctor');
const User = require('../models/User');  // Use User model instead of Patient
const Availability = require('../models/DoctorAvailability');

const getAppointmentsByUserId = async (req, res) => {
  const { user_id } = req.query;

  try {
    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required.' });
    }

    // Find the user with the given user_id and check if they are a patient
    const user = await User.findById(user_id);
    if (!user || user.role !== 'PATIENT') {
      return res.status(404).json({ error: 'User is not a patient or does not exist.' });
    }

    // Find appointments associated with this user (patient)
    const appointments = await Appointment.find({ patient_id: user_id });

    if (!appointments || appointments.length === 0) {
      return res.status(404).json({ error: 'No appointments found for this patient.' });
    }

    res.status(200).json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Method to get all doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find({ accepted: true }) // Ensure only accepted doctors are fetched
      .populate('user', 'username email') // Populate username and email fields from User
      .exec();

    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      user: {
        username: doctor.user.username,
        email: doctor.user.email,
      },
      appointmentPrice: doctor.appointmentPrice,
      completedAppointments: doctor.completedAppointments,
      durationOfAppointment: doctor.durationOfAppointment,
      speciality: doctor.speciality,
    }));

    res.status(200).json(formattedDoctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

module.exports = {
  getAllDoctors,
};


// Method to get a specific doctor by ID
const getDoctorById = async (req, res) => {
  const { doctor_id } = req.params;

  try {
    const doctor = await Doctor.findById(doctor_id).populate('user');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    res.status(200).json({ doctor });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Method to cancel an appointment by admin
const cancelAppointmentByAdmin = async (req, res) => {
  const { appointment_id } = req.body;

  try {
    const appointment = await Appointment.findById(appointment_id);

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Update the appointment status
    appointment.status = 'canceled';
    await appointment.save();

    // Remove the canceled slot from doctor availability
    const availability = await Availability.findOne({ doctor_id: appointment.doctor_id });
    if (availability) {
      availability.booked_slots = availability.booked_slots.filter(
        (slot) => !(new Date(`${appointment.date}T${slot.start_time}`).getTime() === new Date(appointment.date).getTime())
      );
      await availability.save();
    }

    res.status(200).json({ message: 'Appointment canceled successfully.', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Method to get all patients (users with role 'PATIENT')
const getAllPatients = async (req, res) => {
  try {
    const patients = await User.find({ role: 'PATIENT' });

    if (!patients || patients.length === 0) {
      return res.status(404).json({ error: 'No patients found.' });
    }

    res.status(200).json({ patients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteDoctor = async (req, res) => {
  const { doctor_id } = req.body;

  try {
    const doctor = await Doctor.findById(doctor_id);

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    // Remove the doctor from the database
    await Doctor.findByIdAndDelete(doctor_id);

    // Remove the doctor’s availability
    await Availability.findOneAndDelete({ doctor_id });

    // Optionally, remove appointments related to the doctor (you can choose to leave these in the system)
    await Appointment.deleteMany({ doctor_id });

    res.status(200).json({ message: 'Doctor deleted successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Method to update doctor availability
const updateDoctorAvailability = async (req, res) => {
  const { doctor_id, available_slots } = req.body;

  try {
    const availability = await Availability.findOne({ doctor_id });

    if (!availability) {
      return res.status(404).json({ error: 'Doctor availability not found.' });
    }

    // Update available slots
    availability.available_slots = available_slots;
    await availability.save();

    res.status(200).json({ message: 'Doctor availability updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllDoctorsAppointmentData = async (req, res) => {
  try {
    // Fetch appointments for all doctors with the specified statuses
    const appointments = await Appointment.find({
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


const getAllDoctorsRevenueData = async (req, res) => {
  try {
    // Fetch all doctors to get their appointment prices
    const doctors = await Doctor.find({});
    if (!doctors.length) {
      return res.status(404).json({ message: 'No doctors found' });
    }

    // Create a map of doctor IDs to their appointment prices
    const doctorPriceMap = doctors.reduce((map, doctor) => {
      map[doctor._id] = doctor.appointmentPrice;
      return map;
    }, {});

    // Fetch appointments for all doctors with the specified statuses
    const appointments = await Appointment.find({
      status: { $in: [ 'completed'] },
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
      const appointmentPrice = doctorPriceMap[appointment.doctor_id];
      if (appointmentPrice) {
        revenueData[month].revenue += appointmentPrice * 0.95; // Subtracting 5%
      }
    });

    // Send the response
    res.json(revenueData);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error' });
  }
};


const getAllDoctorsStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Fetch all doctors to calculate revenue
    const doctors = await Doctor.find({});
    if (!doctors.length) {
      return res.status(404).json({ message: 'No doctors found' });
    }

    const doctorPriceMap = doctors.reduce((map, doctor) => {
      map[doctor._id] = doctor.appointmentPrice;
      return map;
    }, {});

    // Fetch total appointments with 'pending' and 'confirmed' statuses
    const totalAppointments = await Appointment.countDocuments({
      status: { $in: ['pending', 'confirmed'] },
    });

    // Fetch total patients (unique patient IDs across all appointments)
    const totalPatients = await Appointment.distinct('patient_id').countDocuments();

    // Fetch upcoming appointments today with 'pending' and 'confirmed' statuses
    const upcomingAppointmentsToday = await Appointment.countDocuments({
      date: { $gte: startOfDay, $lt: endOfDay },
      status: { $in: ['pending', 'confirmed'] },
    });

    // Fetch completed appointments to calculate revenue
    const completedAppointments = await Appointment.find({
      status: 'completed',
    });

    // Calculate total revenue
    const totalRevenue = completedAppointments.reduce((total, appointment) => {
      const appointmentPrice = doctorPriceMap[appointment.doctor_id];
      if (appointmentPrice) {
        total += appointmentPrice * 0.95; // Subtracting 5%
      }
      return total;
    }, 0);

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
  getAppointmentsByUserId,
  getAllDoctors,
  getDoctorById,
  cancelAppointmentByAdmin,
  getAllPatients,
  deleteDoctor,
  updateDoctorAvailability,
  getAllDoctorsAppointmentData,
  getAllDoctorsRevenueData , 
  getAllDoctorsStats
};
