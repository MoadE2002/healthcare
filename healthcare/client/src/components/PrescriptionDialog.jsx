import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Typography,
  IconButton,
  CircularProgress,
  Box,
} from "@mui/material";
import axiosInstance from '../apicalls/axiosInstance'
import { Add, Delete } from "@mui/icons-material";

const PrescriptionDialog = ({ open, onClose, appointmentId }) => {
  const [formData, setFormData] = useState({
    description: "",
    medication: [
      {
        name: "",
        dosage: "",
        duration: "",
        frequency: "",
      },
    ],
    additionalInstructions: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleMedicationChange = (index, field, value) => {
    const updatedMedication = [...formData.medication];
    updatedMedication[index][field] = value;
    setFormData({ ...formData, medication: updatedMedication });
  };

  const addMedication = () => {
    setFormData({
      ...formData,
      medication: [
        ...formData.medication,
        { name: "", dosage: "", duration: "", frequency: "" },
      ],
    });
  };

  const removeMedication = (index) => {
    const updatedMedication = formData.medication.filter((_, i) => i !== index);
    setFormData({ ...formData, medication: updatedMedication });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await axiosInstance.post("/prescription", {
        ...formData,
        appointmentId,
      });
  
      if (response.status === 201) {
        setLoading(false);
        onClose(); 
      } else {
        setLoading(false);
        setErrorMessage("There was an issue saving the prescription. Please try again.");
      }
    } catch (error) {
      setLoading(false);
      setErrorMessage(
        error.response?.data?.message || "An unexpected error occurred. Please try again."
      );
    }
  };
  

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Prescription Form</DialogTitle>
      <DialogContent>

        <Box sx={{ mb: 2 }}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            required
            multiline
            rows={2}
          />
        </Box>

        {formData.medication.map((med, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Medication Name"
                value={med.name}
                onChange={(e) => handleMedicationChange(index, "name", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Dosage"
                value={med.dosage}
                onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Duration"
                value={med.duration}
                onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Frequency"
                value={med.frequency}
                onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <IconButton color="error" onClick={() => removeMedication(index)}>
                <Delete />
              </IconButton>
            </Grid>
          </Grid>
        ))}

        <Button variant="outlined" onClick={addMedication} startIcon={<Add />} sx={{ mt: 2 }}>
          Add Medication
        </Button>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Additional Instructions"
            name="additionalInstructions"
            value={formData.additionalInstructions}
            onChange={handleInputChange}
            multiline
            rows={3}
          />
        </Box>

        {errorMessage && (
          <Typography color="error" sx={{ mt: 2 }}>
            {errorMessage}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {loading ? (
          <CircularProgress size={24} />
        ) : (
          <>
            <Button onClick={onClose} color="secondary">
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Submit
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PrescriptionDialog;
