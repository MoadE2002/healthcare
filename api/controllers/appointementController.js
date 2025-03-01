const Availability = require('../models/DoctorAvailability');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointement');
const NotificationService = require('../notificationService')
const mongoose = require('mongoose');


const parseDuration = (duration) => {
  const match = duration.match(/^(\d+)\s*(min|hour)?$/i);
  if (!match) {
    throw new Error('Invalid duration format');
  }

  const value = parseInt(match[1]);
  const unit = (match[2] || '').toLowerCase();

  switch (unit) {
    case 'min':
      return value * 60000; // minutes to milliseconds
    case 'hour':
      return value * 3600000; // hours to milliseconds
    default:
      return value; // assume milliseconds
  }
};

function splitTimeSlots(startTime, endTime, duration) {
  const slots = [];
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const durationMinutes = parseInt(duration);

  let current = new Date(0, 0, 0, startHour, startMinute);
  const end = new Date(0, 0, 0, endHour, endMinute);

  while (current < end) {
    const next = new Date(current.getTime() + durationMinutes * 60000);
    if (next > end) break;

    slots.push({
      start_time: current.toTimeString().slice(0, 5),
      end_time: next.toTimeString().slice(0, 5),
    });

    current = next;
  }

  return slots;
}

// Controller function
const getAvailableSlots = async (req, res) => {
  try {
    const { doctor_id, startDate, endDate } = req.body;

    if (!doctor_id || !startDate || !endDate) {
      return res.status(400).json({ message: 'doctor_id, startDate, and endDate are required.' });
    }

    // Fetch the doctor and their duration of appointment
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' });
    }

    const duration = parseInt(doctor.durationOfAppointment.replace('min', ''));

    // Fetch availability for the doctor within the date range
    const availability = await Availability.findOne({
      doctor_id,
      'available_slots.date': { $gte: new Date(startDate), $lte: new Date(endDate) },
    });

    if (!availability) {
      return res.status(404).json({ message: 'No availability found for this doctor.' });
    }

    const bookedSlots = availability.booked_slots.filter(slot =>
      new Date(slot.date) >= new Date(startDate) && new Date(slot.date) <= new Date(endDate)
    );

    // Build the available time slots, excluding booked slots
    const result = availability.available_slots
      .filter(slot =>
        new Date(slot.date) >= new Date(startDate) && new Date(slot.date) <= new Date(endDate)
      )
      .map(slot => {
        const date = slot.date;

        // Split available time slots by the doctor's appointment duration
        let timeSlots = [];
        slot.time_slots.forEach(timeSlot => {
          const splitSlots = splitTimeSlots(timeSlot.start_time, timeSlot.end_time, duration);
          timeSlots.push(...splitSlots);
        });

        // Remove booked slots
        bookedSlots
          .filter(bookedSlot => bookedSlot.date.toISOString().slice(0, 10) === date.toISOString().slice(0, 10))
          .forEach(bookedSlot => {
            timeSlots = timeSlots.filter(
              slot =>
                !(
                  slot.start_time >= bookedSlot.start_time &&
                  slot.end_time <= bookedSlot.end_time
                )
            );
          });

        return {
          date,
          time_slots: timeSlots,
        };
      });

    return res.status(200).json({ available_slots: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};



// Method to book an appointment
const bookAppointment = async (req, res) => {
  const { doctor_id, patient_id, date, start_time, end_time, purpose } = req.body;

  try {
    // Check if the availability exists for the doctor
    const availability = await Availability.findOne({ doctor_id });

    if (!availability) {
      return res.status(404).json({ message: 'Doctor availability not found' });
    }

    // Check if the slot is already booked
    const isSlotBooked = availability.booked_slots.some(
      (slot) =>
        slot.date.toISOString().split('T')[0] === date &&
        slot.start_time === start_time &&
        slot.end_time === end_time
    );

    if (isSlotBooked) {
      return res.status(400).json({ message: 'Time slot is already booked' });
    }

    // Add the new booked slot
    const newBookedSlot = {
      date: new Date(date),
      start_time,
      end_time,
      patient_id,
      status: 'Pending',
    };

    availability.booked_slots.push(newBookedSlot);
    await availability.save();

    // Create a new appointment
    const newAppointment = new Appointment({
      doctor_id,
      patient_id,
      date: new Date(date),
      start_time,
      end_time,
      purpose,
      status: 'pending',
    });

    const savedAppointment = await newAppointment.save();

    const doctor = await Doctor.findById(savedAppointment.doctor_id).populate('user');
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    const formattedDate = savedAppointment.date.toLocaleDateString('en-GB');



    await NotificationService.sendBookedAppointmentNotification(
      savedAppointment._id , 
      doctor.user._id, formattedDate ,  savedAppointment.start_time , savedAppointment.end_time
    ) ; 
    await NotificationService.sendBookedAppointmentforuserNotification(
      savedAppointment._id , 
      savedAppointment.patient_id, formattedDate ,  savedAppointment.start_time , savedAppointment.end_time
    ) ; 

    res.status(201).json({
      message: 'Booking and appointment created successfully',
      booked_slot: newBookedSlot,
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing your request', error });
  }
};

// Method to cancel an appointment
const cancelAppointment = async (req, res) => {
  const { appointment_id, cancel_by } = req.body;

  try {
    // Check if the appointment exists
    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Calculate the time difference between now and the appointment time
    const currentTime = new Date();
    const appointmentTime = new Date(appointment.date);
    const timeDifference = appointmentTime - currentTime;

    // Check if the appointment time is less than 36 hours away
    if (timeDifference < 36 * 60 * 60 * 1000) {
      return res.status(400).json({ error: 'You cannot cancel the appointment within 36 hours of its scheduled time.' });
    }

    // Update the appointment status
    appointment.status = 'canceled';
    appointment.canceled_by = cancel_by;
    await appointment.save();

    // Update the availability: remove the canceled slot
    const availability = await Availability.findOne({ doctor_id: appointment.doctor_id });
    if (!availability) {
      return res.status(404).json({ error: 'Doctor availability not found.' });
    }

    // Find and remove the canceled time slot from booked slots
    availability.booked_slots = availability.booked_slots.filter(
      (slot) => !(new Date(slot.date).getTime() === appointmentTime.getTime() &&
                  slot.start_time === appointment.start_time && 
                  slot.end_time === appointment.end_time)
    );
    await availability.save();

    res.status(200).json({ message: 'Appointment canceled successfully.', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



// Method to confirm an appointment
const confirmAppointment = async (req, res) => {
  const { appointment_id } = req.body;

  try {
    // Check if the appointment exists
    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Update the appointment status to confirmed
    appointment.status = 'confirmed';
    await appointment.save();

    res.status(200).json({ message: 'Appointment confirmed successfully.', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Method to complete an appointment
const completeAppointment = async (req, res) => {
  const { appointment_id } = req.body;

  try {
    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Check if appointment status is confirmed before marking it as completed
    if (appointment.status !== 'confirmed') {
      return res.status(400).json({ error: 'Appointment must be confirmed before it can be completed.' });
    }

    appointment.status = 'completed';
    appointment.updatedAt = Date.now(); // Set the updated time when the appointment is completed
    await appointment.save();

    res.status(200).json({ message: 'Appointment completed successfully.', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




const updateAppointmentDetails = async (req, res) => {
  const { appointment_id, start_time, end_time, purpose } = req.body;

  try {
    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Check if the new time slot is available
    const doctor = await Doctor.findById(appointment.doctor_id);
    const appointmentDuration = parseDuration(doctor.durationOfAppointment);
    const newStartTime = new Date(`${appointment.date}T${start_time}`);
    const newEndTime = new Date(newStartTime.getTime() + appointmentDuration);

    const availability = await Availability.findOne({ doctor_id: appointment.doctor_id });
    const slotAlreadyBooked = availability.booked_slots.some(
      (slot) => new Date(`${appointment.date}T${slot.start_time}`).getTime() <= newStartTime.getTime() &&
                new Date(`${appointment.date}T${slot.end_time}`).getTime() > newStartTime.getTime()
    );

    if (slotAlreadyBooked) {
      return res.status(400).json({ error: 'The selected time slot is already booked.' });
    }

    // Update the appointment details
    appointment.start_time = start_time;
    appointment.end_time = end_time;
    appointment.purpose = purpose;

    await appointment.save();
    res.status(200).json({ message: 'Appointment details updated successfully.', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAppointmentsByDateRange = async (req, res) => {
  const { doctor_id, startDate, endDate } = req.query;  // Assuming date range is passed as query parameters

  try {
    const doctor = await Doctor.findById(doctor_id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found.' });
    }

    const appointments = await Appointment.find({
      doctor_id,
      date: { $gte: new Date(startDate), $lte: new Date(endDate) },
    }).populate('patient_id', 'name email');

    if (appointments.length === 0) {
      return res.status(404).json({ error: 'No appointments found for this doctor in the given date range.' });
    }

    res.status(200).json({ appointments });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const rescheduleAppointment = async (req, res) => {
  const { appointment_id, new_start_time, new_end_time } = req.body;

  try {
    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found.' });
    }

    // Parse new time
    const doctor = await Doctor.findById(appointment.doctor_id);
    const appointmentDuration = parseDuration(doctor.durationOfAppointment);
    const newStartDate = new Date(new_start_time);
    const newEndDate = new Date(newStartDate.getTime() + appointmentDuration);

    // Check availability
    const availability = await Availability.findOne({ doctor_id: appointment.doctor_id });
    const isSlotAvailable = !availability.booked_slots.some(
      (slot) => new Date(`${appointment.date}T${slot.start_time}`).getTime() <= newStartDate.getTime() &&
                new Date(`${appointment.date}T${slot.end_time}`).getTime() > newStartDate.getTime()
    );

    if (!isSlotAvailable) {
      return res.status(400).json({ error: 'The selected time slot is already booked.' });
    }

    // Update the appointment time
    appointment.start_time = new_start_time;
    appointment.end_time = new_end_time;

    await appointment.save();
    res.status(200).json({ message: 'Appointment rescheduled successfully.', appointment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


const createOrUpdateAvailability = async (req, res) => {
  try {
    const { doctor_id, date, time_slots } = req.body;
    console.log("hahiya date " +date)

    // Validate input
    if (!doctor_id || !date || !time_slots || time_slots.length === 0) {
      return res.status(400).json({ message: 'Invalid input data' });
    }

    // Convert date to start of day for consistent matching
    const formattedDate = new Date(date);
    formattedDate.setDate(formattedDate.getDate() + 1);
    formattedDate.setHours(0, 0, 0, 0);



    // Find existing availability for the doctor
    let availability = await Availability.findOne({ doctor_id });

    if (!availability) {
      // Create new availability if not exists
      availability = new Availability({
        doctor_id,
        available_slots: [{
          date: formattedDate,
          time_slots: time_slots
        }]
      });
    } else {
      // Find if availability for this date already exists
      const existingDateIndex = availability.available_slots.findIndex(
        slot => new Date(slot.date).getTime() === formattedDate.getTime()
      );

      if (existingDateIndex !== -1) {
        // Update existing date's time slots
        availability.available_slots[existingDateIndex].time_slots = time_slots;
      } else {
        // Add new date availability
        availability.available_slots.push({
          date: formattedDate,
          time_slots: time_slots
        });
      }
    }

    // Save the updated or new availability
    await availability.save();

    res.status(200).json({
      message: 'Availability updated successfully',
      availability
    });
  } catch (error) {
    console.error('Error in creating/updating availability:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};

const getAvailabilityByDoctor = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!mongoose.Types.ObjectId.isValid(doctorId)) {
      return res.status(400).json({ 
        message: 'Invalid doctor ID'
      });
    }

    console.log("Request date: " + date);

    // If a date is provided in query params, use it; otherwise, default to today's date.
    const formattedDate = date ? new Date(date) : new Date();

    // Convert the formattedDate to the next day (UTC)
    formattedDate.setUTCDate(formattedDate.getUTCDate() + 1);  // Add 1 day
    formattedDate.setUTCHours(0, 0, 0, 0);  // Set to midnight (00:00:00) in UTC

    console.log("Formatted date (next day, UTC): " + formattedDate);

    // Fetch the availability from the database.
    const availability = await Availability.findOne({ 
      doctor_id: doctorId
    });

    if (!availability) {
      return res.status(200).json({ 
        available_slots: []
      });
    }

    // Filter available slots for the selected date.
    const dateSlots = availability.available_slots.filter(slot => {
      // Convert the database slot date to UTC and set time to midnight.
      const slotDate = new Date(slot.date);
      slotDate.setUTCHours(0, 0, 0, 0);  // Set to midnight (00:00:00) in UTC.

      // Compare the dates in UTC, ignoring time.
      return slotDate.getTime() === formattedDate.getTime();
    });
    console.log(JSON.stringify(dateSlots, null, 2));

    res.status(200).json({
      available_slots: dateSlots
    });
  } catch (error) {
    console.error('Error in fetching availability:', error);
    res.status(500).json({ 
      message: 'Server error',
      details: error.toString()
    });
  }
};




const getUpcomingAppointments = async (req, res) => {
  const { doctor_id } = req.params;

  try {
    if (!doctor_id) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }

    const currentDateTime = new Date();

    const upcomingAppointments = await Appointment.find({
      doctor_id: doctor_id,
      date: { $gte: currentDateTime },
      status: { $ne: 'canceled' }
    })
    .populate('patient_id', 'username email') 
    .sort({ date: 1, start_time: 1 }) 
    .limit(3); 

    if (upcomingAppointments.length === 0) {
      return res.status(404).json({ message: 'No upcoming appointments found' });
    }

    res.status(200).json({
      count: upcomingAppointments.length,
      appointments: upcomingAppointments
    });
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const getAppointmentDetails = async (req, res) => {
  const { appointmentId } = req.params; // Extracting appointmentId from request parameters

  try {
    // Fetching appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate({
        path: 'doctor_id',
        model: 'Doctor',
        populate: {
          path: 'user', // Populating the user information of the doctor
          model: 'User',
        },
      })
      .populate({
        path: 'patient_id',
        model: 'User', // Populating patient details
      })
      .populate('feedback_id')
      .populate('prescription_id');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const response = {
      appointmentId: appointment._id,
      date: appointment.date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      doctor: {
        id: appointment.doctor_id._id,
        userId: appointment.doctor_id.user._id,
        username: appointment.doctor_id.user.username,
        address: appointment.doctor_id.user.address,
      },
      patient: {
        id: appointment.patient_id._id,
        name: appointment.patient_id.username,
        email: appointment.patient_id.email,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching appointment details:', error);
    res.status(500).json({ message: 'Internal server error', error });
  }
};




module.exports = { 
  getAvailableSlots , 
  bookAppointment,
  cancelAppointment,
  confirmAppointment,
  completeAppointment,
  createOrUpdateAvailability,
  getAvailabilityByDoctor , 
  rescheduleAppointment , 
  getAppointmentsByDateRange ,
  updateAppointmentDetails ,
  getUpcomingAppointments , 
  getAppointmentDetails
};



