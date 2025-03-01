"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../../../hooks/useAuthContext";
import axiosInstance from "../../../../apicalls/axiosInstance";
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Button,
  Pagination,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";

const AppointmentsPage = () => {
  const { user } = useAuthContext();
  const [appointments, setAppointments] = useState([]);
  const [searchDate, setSearchDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const router = useRouter();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const resultsPerPage = 10;


  
  useEffect(() => {
    if (!user) {
      router.push("/user/login");
      return;
    }

    if (!user.doctorId && user.role !== "DOCTOR" && user.role !== "ADMIN") {
      router.push("/home"); 
      return;
    }
 }, [user, router]);

 if (!user) {
    return null;
  }

  const fetchAppointments = async (page = 1) => {
    try {
      const response = await axiosInstance.get(
        `/doctor/appointments/${user.doctorId}`,
        {
          params: {
            page,
            limit: resultsPerPage,
          },
        }
      );

      setAppointments(response.data.appointments);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      console.error("Error fetching appointments:", error);
    }
  };

  useEffect(() => {
    fetchAppointments(currentPage);
  }, [user.doctorId, currentPage]);

  // Handle date search
  const handleSearchDate = (e) => {
    const date = e.target.value;
    setSearchDate(date);
  };

  // Handle sort order
  const handleSortOrder = (e) => {
    const order = e.target.value;
    setSortOrder(order);
  };

  // Handle status filter
  const handleStatusFilter = (e) => {
    const status = e.target.value;
    setStatusFilter(status);
  };

  // Apply filters locally
  const filteredAppointments = appointments
    .filter(appointment =>
      (!searchDate || new Date(appointment.date).toLocaleDateString() === new Date(searchDate).toLocaleDateString()) &&
      (!statusFilter || appointment.status === statusFilter)
    )
    .sort((a, b) => sortOrder === "asc"
      ? new Date(a.date) - new Date(b.date)
      : new Date(b.date) - new Date(a.date)
    );

  // Handle page change
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  return (
    <Box sx={{ p: 4}}>
      <Typography variant="h4" gutterBottom>
        Doctor's Appointments
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {/* Search by Date */}
        <TextField
          label="Search by Date"
          type="date"
          value={searchDate}
          onChange={handleSearchDate}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: "180px" }}
        />

        {/* Sort by Date */}
        <Select value={sortOrder} onChange={handleSortOrder} displayEmpty sx={{ minWidth: "180px" }}>
          <MenuItem value="asc">Sort by Date (Ascending)</MenuItem>
          <MenuItem value="desc">Sort by Date (Descending)</MenuItem>
        </Select>

        {/* Filter by Status */}
        <Select value={statusFilter} onChange={handleStatusFilter} displayEmpty sx={{ minWidth: "180px" }}>
          <MenuItem value="">All Status</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="confirmed">Confirmed</MenuItem>
          <MenuItem value="completed">Completed</MenuItem>
          <MenuItem value="canceled">Canceled</MenuItem>
        </Select>
      </Box>

      {/* Appointments Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Purpose</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage).map((appointment) => (
                <TableRow key={appointment._id}>
                  <TableCell>{appointment.patient_id?.username || "N/A"}</TableCell>
                  <TableCell>{appointment.patient_id?.email || "N/A"}</TableCell>
                  <TableCell>{new Date(appointment.date).toLocaleDateString()}</TableCell>
                  <TableCell>{appointment.start_time}</TableCell>
                  <TableCell>{appointment.end_time}</TableCell>
                  <TableCell>{appointment.status}</TableCell>
                  <TableCell>{appointment.purpose}</TableCell>
                  <TableCell>
                    <Link href={`/appointment/${appointment._id}`} passHref>
                      <Button variant="contained" color="primary">
                        See Appointment
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Pagination
          count={Math.ceil(filteredAppointments.length / resultsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default AppointmentsPage;
