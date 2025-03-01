"use client"
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSocket } from '../../../../context/SocketProvider';
import axiosInstance from "../../../../apicalls/axiosInstance"; 
import { useAuthContext } from "../../../../hooks/useAuthContext"; 
import { useParams } from "next/navigation";

import { 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle
} from '@mui/material';
import moment from 'moment';

const AppointmentDetails = () => {
  const router = useRouter();
  const { socket } = useSocket();
  const { user } = useAuthContext();
  const params = useParams();
  const appointmentId = params?.appointmentId;

  const [timeRemaining, setTimeRemaining] = useState('');
  const [canJoin, setCanJoin] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);


 

  useEffect(() => {
    if (appointmentId) {
      const fetchAppointmentDetails = async () => {
        try {
          const response = await axiosInstance.get(`/appointment/${appointmentId}`);
          setAppointmentDetails(response.data);
        } catch (error) {
          console.error('Error fetching appointment details:', error);
        }
      };

      fetchAppointmentDetails();
    }
  }, [appointmentId]);

  

  useEffect(() => {
    if (appointmentDetails) {
      const interval = setInterval(() => {
        const now = moment();
        const appointmentDate = moment(appointmentDetails.date);
        const startTime = moment(`${appointmentDate.format('YYYY-MM-DD')} ${appointmentDetails.start_time}`);
        const endTime = moment(`${appointmentDate.format('YYYY-MM-DD')} ${appointmentDetails.end_time}`);
        
        // Check if current time is between start and end time
        const isWithinAppointmentTime = now.isBetween(startTime, endTime);
        setCanJoin(isWithinAppointmentTime);

        // Calculate time difference to appointment
        const duration = moment.duration(startTime.diff(now));

        // Calculate time components
        const daysLeft = Math.floor(duration.asDays());
        const hoursLeft = Math.floor(duration.asHours() % 24);
        const minutesLeft = Math.floor(duration.asMinutes() % 60);
        const secondsLeft = Math.floor(duration.asSeconds() % 60);

        // Update time remaining
        setTimeRemaining(
          `${daysLeft > 0 ? `${daysLeft} day(s) ` : ''}${hoursLeft > 0 ? `${hoursLeft} hour(s) ` : ''}${minutesLeft} min ${secondsLeft} sec`
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [appointmentDetails]);


  useEffect(() => {
    if (!user) {
      router.push("/user/login");
      return;
    }

 }, [user, router]);

  if (!user) {
      return null;
    }

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (socket && user._id && appointmentId && canJoin) {
      setIsRedirecting(true);
      try {
        router.push(`/appointment/${appointmentId}/call/${appointmentId}`);
      } catch (error) {
        console.error('Navigation error:', error);
        setIsRedirecting(false);
      }
    }
  };

  const handleCancel = async () => {
    try {
      await axiosInstance.put(`/appointment/${appointmentId}/cancel`);
      router.push('/home');
    } catch (error) {
      console.error('Error canceling appointment:', error);
    }
  };

  const handleJoinRoomClick = () => {
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  if (!appointmentDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading appointment details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Appointment Details</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <p className="font-semibold text-gray-600">Patient Name:</p>
            <p className="text-gray-800">{appointmentDetails.patient.name}</p>
            
            <p className="font-semibold text-gray-600">Patient Email:</p>
            <p className="text-gray-800">{appointmentDetails.patient.email}</p>
            
            <p className="font-semibold text-gray-600">Doctor:</p>
            <Link 
              href={`/booking/profil/${appointmentDetails.doctor.userId}`} 
              className="text-blue-600 hover:underline"
            >
              {appointmentDetails.doctor.username}
            </Link>
            
            <p className="font-semibold text-gray-600">Doctor Address:</p>
            <p className="text-gray-800">{appointmentDetails.doctor.address}</p>
            
            <p className="font-semibold text-gray-600">Date:</p>
            <p className="text-gray-800">{moment(appointmentDetails.date).format('MMMM Do YYYY')}</p>
            
            <p className="font-semibold text-gray-600">Time:</p>
            <p className="text-gray-800">{appointmentDetails.start_time} - {appointmentDetails.end_time}</p>
            
            <p className="font-semibold text-gray-600">Time Remaining:</p>
            <p className={`${canJoin ? 'text-green-500 font-bold' : 'text-gray-800'}`}>
              {canJoin ? 'Ready to Join' : timeRemaining}
            </p>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Button 
            variant="outlined" 
            color="error" 
            fullWidth 
            onClick={handleCancel}
            disabled={isRedirecting}
          >
            Cancel Appointment
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            fullWidth 
            onClick={handleJoinRoomClick}
            disabled={isRedirecting || !socket || !canJoin}
          >
            {isRedirecting ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </div>

      <Dialog open={showDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {!canJoin ? 'Cannot Join Room' : 'Confirm Room Join'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {!canJoin 
              ? 'You can only join the room during the scheduled appointment time.' 
              : 'Are you sure you want to join the appointment room?'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog} 
            color="primary" 
            variant="outlined"
            disabled={isRedirecting}
          >
            Cancel
          </Button>
          {canJoin && (
            <Button 
              onClick={handleSubmitForm}
              color="primary" 
              variant="contained"
              disabled={isRedirecting || !socket}
            >
              {isRedirecting ? 'Joining...' : 'Confirm'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AppointmentDetails;