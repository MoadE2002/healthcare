"use client";

import React, { useEffect, useState } from "react";
import { useAuthContext } from "../../../hooks/useAuthContext";
import axiosInstance from "../../../apicalls/axiosInstance";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Pagination,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from "@mui/material";
import { Visibility } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";

const DoctorPrescriptionsPage = () => {
  const { user } = useAuthContext();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  const [doctorFilter, setDoctorFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortByDate, setSortByDate] = useState("asc");

  // Authentication check
  useEffect(() => {
    if (!user) {
      router.push("/user/login");
    }
  }, [user, router]);

  // Fetch prescriptions for the doctor
  const fetchPrescriptions = async (page = 1) => {
    try {
      if (!user?._id) return;
      
      const response = await axiosInstance.get(
        `/prescription/patient/${user._id}`,
        {
          params: {
            page,
            limit: resultsPerPage,
          },
        }
      );

      setPrescriptions(response.data.prescriptions);
      setFilteredPrescriptions(response.data.prescriptions);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchPrescriptions(currentPage);
    }
  }, [user?._id, currentPage]);

  // Handle page change for pagination
  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  // Handle filter change for doctor name
  const handleDoctorFilterChange = (event) => {
    setDoctorFilter(event.target.value);
  };

  // Handle filter change for date
  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value);
  };

  // Handle sort by date
  const handleSortByDateChange = (event) => {
    setSortByDate(event.target.value);
  };

  // Filter and sort prescriptions based on user input
  useEffect(() => {
    let filteredData = prescriptions;

    if (doctorFilter) {
      filteredData = filteredData.filter((prescription) =>
        prescription.doctorUsername.toLowerCase().includes(doctorFilter.toLowerCase())
      );
    }

    if (dateFilter) {
      filteredData = filteredData.filter((prescription) =>
        new Date(prescription.date).toLocaleDateString() === new Date(dateFilter).toLocaleDateString()
      );
    }

    if (sortByDate) {
      filteredData = filteredData.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return sortByDate === "asc" ? dateA - dateB : dateB - dateA;
      });
    }

    setFilteredPrescriptions(filteredData);
  }, [doctorFilter, dateFilter, sortByDate, prescriptions]);

  if (!user) {
    return null;
  }

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Appointments Prescriptions
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
        <TextField
          label="Doctor Name"
          variant="outlined"
          value={doctorFilter}
          onChange={handleDoctorFilterChange}
          fullWidth
        />

        <TextField
          type="date"
          label="Date"
          variant="outlined"
          value={dateFilter}
          onChange={handleDateFilterChange}
          InputLabelProps={{
            shrink: true,
          }}
          fullWidth
        />

        <FormControl fullWidth>
          <InputLabel>Sort by Date</InputLabel>
          <Select
            value={sortByDate}
            onChange={handleSortByDateChange}
            label="Sort by Date"
            fullWidth
          >
            <MenuItem value="asc">Ascending</MenuItem>
            <MenuItem value="desc">Descending</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Prescriptions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Doctor Name</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrescriptions.length > 0 ? (
              filteredPrescriptions.map((prescription) => (
                <TableRow key={prescription.prescriptionId}>
                  <TableCell>{prescription.doctorUsername}</TableCell>
                  <TableCell>{new Date(prescription.date).toLocaleDateString()}</TableCell>
                  <TableCell>{prescription.startTime}</TableCell>
                  <TableCell>{prescription.endTime}</TableCell>
                  <TableCell>
                    <Link href={`/prescription/${prescription.prescriptionId}`} passHref>
                      <IconButton color="primary">
                        <Visibility />
                      </IconButton>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No prescriptions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <Pagination
          count={Math.ceil(filteredPrescriptions.length / resultsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default DoctorPrescriptionsPage;