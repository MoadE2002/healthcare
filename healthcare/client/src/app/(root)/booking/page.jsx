"use client";
import React, { useState, useEffect } from "react";
import axiosInstance from "../../../apicalls/axiosInstance";
import Imagefade from "../../../components/Imagefade/Imagefade";
import DoctorCard from "../../../components/DoctorCard/DoctorCard";
import SearchDoctor from "../../../components/SearchDoctor/SearchDoctor";
import { CircularProgress } from "@mui/material";
import Link from "next/link";
import { Typography } from "@mui/material";

const Page = () => {
  const [currentDoctors, setCurrentDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 10;
  
  // Filter states
  const [filters, setFilters] = useState({
    name: "",
    specialization: [],
    priceRange: [0, 10000],
  });

  useEffect(() => {
    // Reset doctors and page when filters change
    setCurrentDoctors([]);
    setPage(1);
    setHasMore(true);
    loadDoctors(1);
  }, [filters]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.scrollHeight - 100 &&
        !loading &&
        hasMore &&
        page < totalPages
      ) {
        loadDoctors(page + 1);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [loading, hasMore, page, totalPages]);

  const loadDoctors = async (currentPage) => {
    if (loading) return;
    setLoading(true);
  
    try {
      const response = await axiosInstance.get(`/doctor`, {
        params: {
          page: currentPage,
          limit: itemsPerPage,
          name: filters.name,
          speciality: filters.specialization.join(','),
          minPrice: filters.priceRange[0],
          maxPrice: filters.priceRange[1],
        },
      });
  
      if (response.data?.doctors?.length) {
        setCurrentDoctors(prevDoctors => 
          currentPage === 1 
            ? response.data.doctors 
            : [...prevDoctors, ...response.data.doctors]
        );
        setPage(currentPage);
        setTotalPages(response.data.totalPages);
        setHasMore(currentPage < response.data.totalPages);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  return (
    <>
      <Imagefade />
      <div className="container mx-auto px-4 bg-gray-100">
        <div className="grid grid-cols-12 gap-4 h-full">
          <div className="col-span-12 lg:col-span-3 border-x-1 border-gray-600 order-1 lg:order-none">
            <div className="w-full me-5 sticky top-4">
                <SearchDoctor 
                onFilterChange={handleFilterChange} 
                initialFilters={{
                  name: filters.name,
                  specialization: filters.specialization,
                  priceRange: filters.priceRange
                }}
              />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9 grid grid-cols-12 gap-3 order-2 lg:order-none mt-16">
            {currentDoctors.map((doctor) => (
              <div key={doctor.id} className="col-span-12 sm:col-span-4 mb-10">
                <Link href={`/booking/profile/${doctor.id}`} passHref>
                  <div className="cursor-pointer">
                    <DoctorCard
                      id={doctor.id}
                      username={doctor.username}
                      about={doctor.about}
                      appointmentPrice={doctor.appointmentPrice}
                      rating={doctor.rating}
                      speciality={doctor.speciality}
                      completedAppointments={doctor.completedAppointments}
                    />
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {loading && (
            <div className="col-span-12 text-center mt-4">
              <CircularProgress />
            </div>
          )}

          {!hasMore && currentDoctors.length === 0 && (
            <div className="col-span-12 text-center mt-4 text-gray-500">
              <Typography variant="h6">
                No doctors found matching your search criteria.
              </Typography>
            </div>
          )}

          {hasMore === false && currentDoctors.length > 0 && (
            <div className="col-span-12 text-center mt-4 text-gray-500">
              <Typography variant="body2">
                You've reached the end of the search results.
              </Typography>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Page;