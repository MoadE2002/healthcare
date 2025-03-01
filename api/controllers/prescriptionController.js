const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointement');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const NotificationService = require('../notificationService'); 


// Create a new prescription
const createPrescription = async (req, res) => {
  const { appointmentId, description, medication, additionalInstructions } = req.body;

  try {
    // Find the appointment to ensure it exists
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    // Create the prescription
    const prescription = new Prescription({
      appointement_id: appointmentId,
      description,
      medication,
      additional_instructions: additionalInstructions,
    });

    await prescription.save();

    // Update the appointment with prescription ID
    appointment.prescription_id = prescription._id;
    await appointment.save();

    // Send prescription notification to patient
    await NotificationService.sendPrescriptionNotification(
      appointment.patient_id, 
      prescription._id
    );

    res.status(201).json({ message: 'Prescription created successfully', prescription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to create prescription.' });
  }
};

const populatePrescriptionDetails = async (prescription) => {
  try {
    return await Prescription.findById(prescription._id)
      .populate({
        path: 'appointement_id',
        populate: [
          {
            path: 'doctor_id',
            model: 'Doctor',
            populate: {
              path: 'user',
              model: 'User',
              select: '-password' 
            }
          },
          {
            path: 'patient_id',
            model: 'User',
            select: '-password' 
          }
        ]
      });
  } catch (error) {
    console.error('Error populating prescription details:', error);
    throw error;
  }
};

// Update an existing prescription
const updatePrescription = async (req, res) => {
  const { prescriptionId } = req.params;
  const { description, medication, additionalInstructions } = req.body;

  try {
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Update prescription fields
    prescription.description = description || prescription.description;
    prescription.medication = medication || prescription.medication;
    prescription.additional_instructions = additionalInstructions || prescription.additional_instructions;

    await prescription.save();

    // Populate to get the associated appointment and patient
    const populatedPrescription = await populatePrescriptionDetails(prescription);

    // Send prescription update notification to patient
    await NotificationService.sendPrescriptionNotification(
      populatedPrescription.appointement_id.patient_id, 
      prescription._id
    );

    res.status(200).json({ 
      message: 'Prescription updated successfully', 
      prescription: populatedPrescription 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to update prescription.' });
  }
};
// Get all prescriptions
const getPrescriptions = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  try {
    const prescriptions = await Prescription.find()
      .populate({
        path: 'appointement_id',
        select: 'doctor_id start_time end_time',
        populate: [
          { path: 'doctor_id', select: '_id user', populate: { path: 'user', select: 'username' } },
          { path: 'patient_id', select: 'username' },
        ],
      })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('appointement_id issued_at');
    
    const result = prescriptions.map((prescription) => ({
      appointmentId: prescription.appointement_id._id,
      prescriptionId: prescription._id,
      date: prescription.issued_at,
      doctorId: prescription.appointement_id.doctor_id._id,
      doctorUsername: prescription.appointement_id.doctor_id.user.username,
      patientUsername: prescription.appointement_id.patient_id.username,
      startTime: prescription.appointement_id.start_time,
      endTime: prescription.appointement_id.end_time,
    }));

    res.status(200).json({ prescriptions: result, page, limit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch prescriptions.' });
  }
};

const getPrescriptionsByDoctorId = async (req, res) => {
  const { doctorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const appointments = await Appointment.find({ doctor_id: doctorId })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('_id prescription_id patient_id start_time end_time')
      .populate({ path: 'patient_id', select: 'username email' });

    const prescriptionIds = appointments.map(app => app.prescription_id).filter(Boolean);

    const prescriptions = await Prescription.find({ _id: { $in: prescriptionIds } })
      .select('_id appointement_id issued_at');

    const result = prescriptions.map((prescription) => {
      const appointment = appointments.find(app => app.prescription_id?.toString() === prescription._id.toString());
      return {
        appointmentId: prescription.appointement_id._id,
        prescriptionId: prescription._id,
        date: prescription.issued_at,
        patientName: appointment.patient_id.username,
        patientEmail: appointment.patient_id.email,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
      };
    });

    res.status(200).json({ prescriptions: result, page, limit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch prescriptions.' });
  }
};

const getPrescriptionsByPatientId = async (req, res) => {
  const { patientId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  try {
    const appointments = await Appointment.find({ patient_id: patientId })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('_id prescription_id doctor_id start_time end_time')
      .populate({
        path: 'doctor_id',
        select: '_id user',
        populate: { path: 'user', select: 'username' },
      });

    const prescriptionIds = appointments.map(app => app.prescription_id).filter(Boolean);

    const prescriptions = await Prescription.find({ _id: { $in: prescriptionIds } })
      .select('_id appointement_id issued_at');

    const result = prescriptions.map((prescription) => {
      const appointment = appointments.find(app => app.prescription_id?.toString() === prescription._id.toString());
      return {
        appointmentId: prescription.appointement_id._id,
        prescriptionId: prescription._id,
        date: prescription.issued_at,
        doctorId: appointment.doctor_id._id, // Include doctor ID
        doctorUsername: appointment.doctor_id.user.username,
        startTime: appointment.start_time,
        endTime: appointment.end_time,
      };
    });

    res.status(200).json({ prescriptions: result, page, limit });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch prescriptions.' });
  }
};

// Get a single prescription by ID
const getPrescriptionById = async (req, res) => {
  const { prescriptionId } = req.params;

  try {
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Populate prescription with full details
    const populatedPrescription = await populatePrescriptionDetails(prescription);

    res.status(200).json({ prescription: populatedPrescription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch prescription.' });
  }
};

// Delete a prescription
const deletePrescription = async (req, res) => {
  const { prescriptionId } = req.params;

  try {
    const prescription = await Prescription.findById(prescriptionId);
    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    // Remove prescription ID from associated appointment
    await Appointment.findByIdAndUpdate(
      prescription.appointement_id, 
      { $unset: { prescription_id: 1 } }
    );

    await Prescription.findByIdAndDelete(prescriptionId);

    res.status(200).json({ message: 'Prescription deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to delete prescription.' });
  }
};

module.exports = {
  createPrescription,
  getPrescriptionById,
  getPrescriptions,
  getPrescriptionsByPatientId,
  getPrescriptionsByDoctorId , 
  updatePrescription,
  deletePrescription,
};