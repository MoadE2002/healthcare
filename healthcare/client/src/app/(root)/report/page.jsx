"use client";
// pages/report.js

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../apicalls/axiosInstance';
import {
  Container,
  Typography,
  TextField,
  Button,
  MenuItem,
  Box,
  Alert,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import { useAuthContext } from '../../../hooks/useAuthContext';

const ReportForm = () => {
  const [reportReason, setReportReason] = useState('');
  const [reportedDoctor, setReportedDoctor] = useState('');
  const [reportedAppointment, setReportedAppointment] = useState('');
  const [feedback, setFeedback] = useState('');
  const [message, setMessage] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchDoctorsAndAppointments = async () => {
      try {
        const doctorsResponse = await axiosInstance.get(`/reports/doctors/${user._id}`);
        const appointmentsResponse = await axiosInstance.get(`/reports/appointments/${user._id}`);
        
        setDoctors(doctorsResponse.data.doctors || []); // Array of { id, username }
        setAppointments(appointmentsResponse.data.appointments || []);
      } catch (error) {
        console.error('Error fetching data', error);
        setMessage('Error fetching doctors or appointments');
      }
    };
  
    if (user && user._id) {
      fetchDoctorsAndAppointments();
    }
  }, [user]);
  

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Add validation checks
    if (!reportReason || !user._id) {
      setMessage('Please fill in all required fields');
      return;
    }
  
    try {
      const response = await axiosInstance.post('/reports', {
        userId: user._id,
        reportReason,
        reportedDoctor, // Send the username
        reportedAppointment, // Send the full appointment object or ID
        feedback
      });
      
      setMessage('Report submitted successfully');
      // Reset form after successful submission
      setReportReason('');
      setReportedDoctor('');
      setReportedAppointment('');
      setFeedback('');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error submitting report');
      console.error(error);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, p: 4, boxShadow: 3, borderRadius: 2, bgcolor: 'background.paper' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Submit a Report
        </Typography>
        <form onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Report Reason</InputLabel>
            <Select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              required
            >
              <MenuItem value="UNPROFESSIONAL_BEHAVIOR">Unprofessional Behavior</MenuItem>
              <MenuItem value="MISDIAGNOSIS">Misdiagnosis</MenuItem>
              <MenuItem value="APPOINTMENT_ISSUE">Appointment Issue</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Reported Doctor</InputLabel>
            <Select
                value={reportedDoctor}
                onChange={(e) => setReportedDoctor(e.target.value)}
                disabled={doctors.length === 0}
            >
                {doctors.map((doctor) => (
                <MenuItem key={doctor.id} value={doctor.id}>
                    {doctor.username}
                </MenuItem>
                ))}
            </Select>
            </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Reported Appointment</InputLabel>
            <Select
              value={reportedAppointment}
              onChange={(e) => setReportedAppointment(e.target.value)}
              disabled={appointments.length === 0}
            >
              {appointments.map((appointment) => (
                <MenuItem key={appointment.appointmentId} value={appointment.appointmentId}>
                  {appointment.date} - {appointment.startTime} to {appointment.endTime} ({appointment.status})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Description"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            fullWidth
            margin="normal"
            multiline
            rows={4}
          />
          <Button 
            type="submit" 
            variant="contained" 
color="primary" 
            fullWidth 
            sx={{ mt: 2 }}
            disabled={!reportReason}
          >
            Submit Report
          </Button>
        </form>
        {message && (
          <Alert severity={message.includes('successfully') ? 'success' : 'error'} sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default ReportForm;