"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuthContext } from "../hooks/useAuthContext";
import axiosInstance from "../apicalls/axiosInstance";

interface Appointment {
  _id: string;
  patient_id: {
    username: string;
    email?: string;
  };
  date: string;
  start_time: string;
  end_time: string;
  purpose: string;
}

const UpcomingAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuthContext();

  // Format date and time
  const formatDateTime = (dateString: string, startTime: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    return `${formattedDate} at ${startTime}`;
  };

  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      if (!user || !user.doctorId) {
        setError('No user found');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await axiosInstance.get(`/appointment/upcoming-appointments/${user.doctorId}`);
        setAppointments(response.data.appointments);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Error fetching upcoming appointments:', err);
        if (err.response && err.response.status === 404 && err.response.data.message === "No upcoming appointments found") {
          setError('No upcoming appointments found');
        } else {
          setError('Failed to fetch appointments');
        }
        setIsLoading(false);
      }
    };

    fetchUpcomingAppointments();
  }, [user]);

  if (isLoading) {
    return (
      <div className='w-full'>
        <p className='text-xl font-bold'>Upcoming Appointments</p>
        <div className="flex justify-center items-center h-48">
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='w-full'>
        <p className='text-xl font-bold'>Upcoming Appointments</p>
        <div className="flex justify-center items-center h-48 text-red-500">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full'>
      <p className='text-xl font-bold'>Upcoming Appointments</p>
      <Link href="/doctor/upcomingappointments">
        <div className='flex justify-end pb-5 text-green-500 cursor-pointer'>
          <p>View All</p>
          <ArrowForwardIcon className='text-green-500' />
        </div>
      </Link>
      <div className="flex flex-col gap-4 justify-center items-center">
        {appointments.length === 0 ? (
          <p className="text-gray-500">No upcoming appointments</p>
        ) : (
          appointments.slice(0, 3).map((appointment) => (
            <Link 
              href={`/doctor/appointment/${appointment._id}`} 
              key={appointment._id} 
              passHref 
              className='w-full'
            >
              <div className="flex items-center ps-5 gap-5 h-24 w-full rounded-lg bg-blue-50 cursor-pointer transition-transform duration-400 hover:scale-105">
                <CalendarTodayIcon className="text-blue-500 mb-1" />
                <div className='flex flex-col gap-2'> 
                  <p className="text-lg font-bold">{appointment.patient_id.username}</p>
                  <p className="text-sm">
                    {formatDateTime(appointment.date, appointment.start_time)}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default UpcomingAppointments;