"use client"
import React, { useState, useEffect } from 'react';
import axiosInstance from '../../../../apicalls/axiosInstance' ; 
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../../../hooks/useAuthContext";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Eye, 
  SortAsc, 
  SortDesc, 
  Filter, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import Link from 'next/link';

const VerificationListPage = () => {
    const [verifications, setVerifications] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('lastVerificationAttempt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterStatus, setFilterStatus] = useState('all');
    const { user } = useAuthContext();
    const router = useRouter();

  

  
    useEffect(() => {
      fetchVerifications();
    }, [page, sortField, sortOrder, filterStatus, searchTerm]);

    useEffect(() => {
      if (!user) {
        router.push("/user/login");
        return;
      }
  
      if (user.role !== "ADMIN") {
        router.push("/home"); 
        return;
      }
   }, [user, router]);
  
   if (!user) {
      return null;
    }
  
    const fetchVerifications = async () => {
        try {
          const response = await axiosInstance.get('/verification/list', {
            params: {
              page: page,
              limit: 10,
              search: searchTerm,
              sortField: sortField,
              sortOrder: sortOrder,
              status: filterStatus
            }
          });
      
          const data = response.data;
          setVerifications(data.verifications);
          setTotalPages(data.totalPages);
        } catch (error) {
          console.error('Error fetching verifications:', error);
        }
      };
      
  
    const handleSort = (field) => {
      if (sortField === field) {
        // Toggle sort order if same field is clicked
        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        // Set new sort field and default to descending
        setSortField(field);
        setSortOrder('desc');
      }
    };
  
    return (
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Doctor Verification Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex mb-4 space-x-4">
              {/* Search Input */}
              <Input 
                placeholder="Search doctors..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow"
              />
  
              {/* Status Filter */}
              <Select 
                value={filterStatus} 
                onValueChange={setFilterStatus}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter Status">
                    <Filter className="mr-2 h-4 w-4" />
                    {filterStatus === 'all' ? 'All Statuses' : filterStatus}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="recent">Recent Attempts</SelectItem>
                  <SelectItem value="multiple">Multiple Attempts</SelectItem>
                </SelectContent>
              </Select>
            </div>
  
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('doctorName')}
                  >
                    <div className="flex items-center">
                      Doctor Name 
                      {sortField === 'doctorName' && 
                        (sortOrder === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />)
                      }
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('doctorEmail')}
                  >
                    <div className="flex items-center">
                      Email 
                      {sortField === 'doctorEmail' && 
                        (sortOrder === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />)
                      }
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('numberOfTimesSent')}
                  >
                    <div className="flex items-center">
                      Verification Attempts 
                      {sortField === 'numberOfTimesSent' && 
                        (sortOrder === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />)
                      }
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastVerificationAttempt')}
                  >
                    <div className="flex items-center">
                      Last Attempt 
                      {sortField === 'lastVerificationAttempt' && 
                        (sortOrder === 'asc' ? <SortAsc className="ml-2 h-4 w-4" /> : <SortDesc className="ml-2 h-4 w-4" />)
                      }
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map((verification) => (
                  <TableRow key={verification.verificationId}>
                    <TableCell 
                      className="cursor-pointer hover:text-blue-600"
                    >
                      <Link href={`/booking/profile/${verification.doctorId}`}>
                        {verification.doctorName}
                      </Link>
                    </TableCell>
                    <TableCell>{verification.doctorEmail}</TableCell>
                    <TableCell>{verification.numberOfTimesSent}</TableCell>
                    <TableCell>
                      {new Date(verification.lastVerificationAttempt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link href={`/verification/${verification.verificationId}`}>
                        <Button 
                          variant="outline" 
                          size="sm"
                        >
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
  
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                >
                  Next <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  export default VerificationListPage;
  