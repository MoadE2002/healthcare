"use client";

import { useState, FormEvent } from 'react';
import axiosInstance from '../../../apicalls/axiosInstance';
import { useAuthContext } from '../../../hooks/useAuthContext';
import { Box, TextField, Typography, Button, Alert, Container, Paper, Grid } from '@mui/material';
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined';

const FeedbackForm: React.FC = () => {
  const { user } = useAuthContext();
  const [text, setText] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const userId = user?._id ; 

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
  
    try {
      const response = await axiosInstance.post('/feedback', {
        reviewer: userId,
        text,
        // Optional: Add appointmentfeeded or doctorId if applicable
      });
      setSuccess(response.data.message);
      setText('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Feedback submission error:', err.response?.data);
    }
  };

  return (
    <Container maxWidth="md" className=" mt-10 w-3/5">
      <Paper elevation={4} sx={{ p: 4, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 150,
            height: 150,
            backgroundColor: 'primary.main',
            borderRadius: '50%',
            opacity: 0.1,
          }}
        ></Box>
        <Box textAlign="center" mb={3}>
          <FeedbackOutlinedIcon color="primary" sx={{ fontSize: 60, mb: 1 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Share Your Feedback
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your feedback helps us improve our services!
          </Typography>
        </Box>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Your Feedback"
                multiline
                rows={4}
                fullWidth
                value={text}
                onChange={(e) => setText(e.target.value)}
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} textAlign="center">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                sx={{ textTransform: 'uppercase', fontWeight: 'bold', px: 5 }}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
        {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 3 }}>{success}</Alert>}
      </Paper>
    </Container>
  );
};

export default FeedbackForm;
