"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuthContext } from "../../../../hooks/useAuthContext";
import axiosInstance from "../../../../apicalls/axiosInstance";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const UserAppointments: React.FC = () => {
  const { user } = useAuthContext();
  const userId = user?._id;
  const [appointments, setAppointments] = useState<any[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [doctorSearch, setDoctorSearch] = useState<string>("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axiosInstance.get(`/users/appointments/${userId}`);
        setAppointments(response.data);
        setFilteredAppointments(response.data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };

    if (userId) fetchAppointments();
  }, [userId]);

  useEffect(() => {
    let filteredData = appointments;

    // Filter by status
    if (statusFilter !== "all") {
      filteredData = filteredData.filter(
        (appointment) => appointment.status === statusFilter
      );
    }

    // Filter by date
    if (dateFilter) {
      filteredData = filteredData.filter(
        (appointment) =>
          new Date(appointment.date).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()
      );
    }

    // Filter by doctor's name
    if (doctorSearch) {
      filteredData = filteredData.filter((appointment) =>
        appointment.doctor.name.toLowerCase().includes(doctorSearch.toLowerCase())
      );
    }

    setFilteredAppointments(filteredData);
  }, [statusFilter, dateFilter, doctorSearch, appointments]);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Appointments</h2>

      <div className="mb-4 flex gap-4">
        {/* Filter by status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="canceled">Canceled</option>
        </select>

        {/* Filter by date */}
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="p-2 border rounded-md"
        />

        {/* Search by doctor */}
        <input
          type="text"
          placeholder="Search by doctor name"
          value={doctorSearch}
          onChange={(e) => setDoctorSearch(e.target.value)}
          className="p-2 border rounded-md w-64"
        />
      </div>

      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="text-left text-sm text-gray-500">Doctor</TableHead>
            <TableHead className="text-left text-sm text-gray-500">Purpose</TableHead>
            <TableHead className="text-left text-sm text-gray-500">Date & Time</TableHead>
            <TableHead className="text-left text-sm text-gray-500">Price</TableHead> {/* New Price Column */}
            <TableHead className="text-left text-sm text-gray-500">Status</TableHead>
            <TableHead className="text-left text-sm text-gray-500">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredAppointments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500 py-4"> {/* Updated colSpan */}
                No appointments found.
              </TableCell>
            </TableRow>
          ) : (
            filteredAppointments.map((appointment) => (
              <TableRow key={appointment._id} className="border-b hover:bg-gray-50">
                <TableCell className="flex items-center gap-3 py-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={`data:image/jpeg;base64,${appointment.doctor.photoDeProfile}`} />
                    <AvatarFallback>{appointment.doctor.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href={`/booking/profile/${appointment.doctor_id}`} passHref>
                      <p className="font-medium text-gray-800 hover:text-blue-500 cursor-pointer">
                        {appointment.doctor.name}
                      </p>
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="text-gray-700">{appointment.purpose}</TableCell>
                <TableCell className="text-gray-700">
                  {new Date(appointment.date).toLocaleDateString()} - {appointment.start_time} - {appointment.end_time}
                </TableCell>
                <TableCell className="text-gray-700"> {/* New Cell for Price */}
                  ${appointment.doctor.appointmentPrice}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      appointment.status === "confirmed"
                        ? "default"
                        : appointment.status === "pending"
                        ? "secondary"
                        : appointment.status === "completed"
                        ? "success"
                        : "danger"
                    }
                    className="capitalize"
                  >
                    {appointment.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" className="gap-2 px-4 py-2 text-white bg-blue-500 hover:bg-blue-600">
                    <Link href={`/appointment/${appointment._id}`} passHref>
                      <span>View Details</span>
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserAppointments;

