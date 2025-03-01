"use client"
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from '@/components/ui/card';
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import axiosInstance from '../apicalls/axiosInstance'; // Adjust the import path as needed

// TypeScript interfaces
interface Doctor {
  _id: string;
  user: {
    username: string;
    email: string;
  };
  appointmentPrice: number;
  completedAppointments: number;
  durationOfAppointment: string;
  speciality: string[];
}

const DoctorsList: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'appointments'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch doctors on component mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/admin-space/doctors');
        setDoctors(response.data);
        setIsLoading(false);
      } catch (err) {
        setError('Failed to fetch doctors');
        setIsLoading(false);
        console.error('Error fetching doctors:', err);
      }
    };

    fetchDoctors();
  }, []);

  // Sort doctors based on selected criteria
  const sortedDoctors = [...doctors].sort((a, b) => {
    let comparison = 0;
    switch(sortBy) {
      case 'name':
        comparison = a.user.username.localeCompare(b.user.username);
        break;
      case 'price':
        comparison = a.appointmentPrice - b.appointmentPrice;
        break;
      case 'appointments':
        comparison = a.completedAppointments - b.completedAppointments;
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Filter doctors based on search query
  const filteredDoctors = sortedDoctors.filter(doctor => 
    doctor.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render sorting dropdown
  const renderSortDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="mr-2 h-4 w-4" /> Sort
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem 
          onClick={() => {
            setSortBy('name');
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
        >
          Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            setSortBy('price');
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
        >
          Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => {
            setSortBy('appointments');
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          }}
        >
          Appointments {sortBy === 'appointments' && (sortOrder === 'asc' ? '↑' : '↓')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  // Render loading state
  if (isLoading) {
    return (
      <Card className="h-[500px] overflow-y-scroll">
        <CardHeader>
          <CardTitle>Doctors List</CardTitle>
        </CardHeader>
        <CardContent>Loading doctors...</CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="h-[500px] overflow-y-scroll">
        <CardHeader>
          <CardTitle>Doctors List</CardTitle>
        </CardHeader>
        <CardContent>{error}</CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[500px] overflow-y-scroll">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Doctors List</CardTitle>
        {renderSortDropdown()}
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <input 
            type="text" 
            placeholder="Search by name" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="border-none border-b-2 border-gray-300 p-2 rounded-none "
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Speciality</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Appointment Duration</TableHead>
              <TableHead>Completed Appointments</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDoctors.map((doctor) => (
              <TableRow  
              key={doctor._id}
              className="cursor-pointer hover:bg-gray-100"
              >
                <Link  href={`/booking/profile/${doctor._id}`}>
                  <TableCell>{doctor.user.username}</TableCell>
                </Link>
                  <TableCell>{doctor.user.email}</TableCell>
                  <TableCell>{doctor.speciality.join(', ')}</TableCell>
                  <TableCell>${doctor.appointmentPrice}</TableCell>
                  <TableCell>{doctor.durationOfAppointment}</TableCell>
                  <TableCell>{doctor.completedAppointments}</TableCell>
                
              </TableRow>
              
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default DoctorsList;
