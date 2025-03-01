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
  IconButton,
} from "@mui/material";
import { Search, Visibility } from "@mui/icons-material";
import Link from "next/link";
import { useRouter } from "next/navigation";

const PrescriptionsPage = () => {
  const { user } = useAuthContext();
  const [prescriptions, setPrescriptions] = useState([]);
  const [searchPatientName, setSearchPatientName] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const router = useRouter();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const resultsPerPage = 10;

  const fetchPrescriptions = async (page = 1) => {
    if (!user?.doctorId) return; // Early return if no doctorId

    try {
      const response = await axiosInstance.get(
        `/prescription/doctor/${user.doctorId}`,
        {
          params: {
            page,
            limit: resultsPerPage,
          },
        }
      );

      setPrescriptions(response.data.prescriptions);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.page);
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
      // Handle unauthorized access
      if (error.response?.status === 401) {
        router.push("/user/login");
      }
    }
  };

  // Authentication check effect
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

  // Fetch prescriptions effect
  useEffect(() => {
    // Only fetch if user and doctorId exist
    if (user?.doctorId) {
      fetchPrescriptions(currentPage);
    }
  }, [user, currentPage]); // Remove doctorId from dependency array since we're using user

  // Rest of the component remains the same...
  const handleSearchPatientName = (e) => {
    setSearchPatientName(e.target.value);
  };

  const handleSearchDate = (e) => {
    setSearchDate(e.target.value);
  };

  const handleSortOrder = (e) => {
    setSortOrder(e.target.value);
  };

  const filteredPrescriptions = prescriptions
    .filter((prescription) =>
      (!searchPatientName ||
        prescription.patientName
          .toLowerCase()
          .includes(searchPatientName.toLowerCase())) &&
      (!searchDate ||
        new Date(prescription.date).toLocaleDateString() ===
          new Date(searchDate).toLocaleDateString())
    )
    .sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a.date) - new Date(b.date)
        : new Date(b.date) - new Date(a.date)
    );

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    fetchPrescriptions(value);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        All Created Prescriptions
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <TextField
          label="Search by Patient Name"
          value={searchPatientName}
          onChange={handleSearchPatientName}
          InputProps={{
            startAdornment: <Search />,
          }}
          sx={{ minWidth: "200px" }}
        />

        <TextField
          label="Search by Date"
          type="date"
          value={searchDate}
          onChange={handleSearchDate}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: "200px" }}
        />

        <Select value={sortOrder} onChange={handleSortOrder} displayEmpty sx={{ minWidth: "200px" }}>
          <MenuItem value="asc">Sort by Date (Ascending)</MenuItem>
          <MenuItem value="desc">Sort by Date (Descending)</MenuItem>
        </Select>
      </Box>

      {/* Prescriptions Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Start Time</TableCell>
              <TableCell>End Time</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPrescriptions.length > 0 ? (
              filteredPrescriptions
                .slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage)
                .map((prescription) => (
                  <TableRow key={prescription.prescriptionId}>
                    <TableCell>{prescription.patientName}</TableCell>
                    <TableCell>{prescription.patientEmail}</TableCell>
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
                <TableCell colSpan={6} align="center">
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
          count={totalPages}
          page={currentPage}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>
    </Box>
  );
};

export default PrescriptionsPage;