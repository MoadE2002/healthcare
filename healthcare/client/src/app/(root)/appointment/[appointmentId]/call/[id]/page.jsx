"use client";

import React, { useState, useEffect } from 'react';
import VideoCall from '../../../../../../components/VideoCall/VideoCall';
import axiosInstance from '../../../../../../apicalls/axiosInstance';
import { useParams } from 'next/navigation';
import { useAuthContext } from '../../../../../../hooks/useAuthContext';
import { useRouter } from "next/navigation";

const Page = () => {
  const params = useParams();
  const { user } = useAuthContext();
  const router = useRouter();
  const appointmentId = params.id;
  const [appointmentDetails, setAppointmentDetails] = useState(null);



  useEffect(() => {
    if (appointmentId && user) {
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
  }, [appointmentId, user]);

  useEffect(() => {
    if (!user) {
      router.push("/user/login");
      return;
    }

}, [user, router]);

  if (!user) {
      return null;
  }

  if (!appointmentDetails) {
    return <div>Loading...</div>;
  }

  const { doctor, patient, end_time } = appointmentDetails;
  const isDoctor = user._id === doctor.userId;
  const senderId = user._id;
  const recipientId = isDoctor ? patient.id : doctor.userId;

  return (
    <VideoCall
      isDoctor={isDoctor}
      senderId={senderId}
      recipientId={recipientId}
      endTime={end_time}
      appointmentId={appointmentId}
    />
  );
};

export default Page;
