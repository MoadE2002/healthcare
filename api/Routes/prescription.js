const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');

// Route to create a new prescription
router.post('/', prescriptionController.createPrescription);

// Route to get all prescriptions
router.get('/', prescriptionController.getPrescriptions);

// Route to get a single prescription by ID
router.get('/:prescriptionId', prescriptionController.getPrescriptionById);



// Route to get prescriptions by doctor ID
router.get('/doctor/:doctorId', prescriptionController.getPrescriptionsByDoctorId);


// Route to get prescriptions by patientid ID
router.get('/patient/:patientId', prescriptionController.getPrescriptionsByPatientId);

// Route to update an existing prescription
router.put('/:prescriptionId', prescriptionController.updatePrescription);

// Route to delete a prescription
router.delete('/:prescriptionId', prescriptionController.deletePrescription);

module.exports = router;