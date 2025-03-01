"use client"
import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import axiosInstance from '../../../../apicalls/axiosInstance';
import { useRouter } from "next/navigation";
import { useAuthContext } from "../../../../hooks/useAuthContext";

// Enum for Report Reasons
enum ReportReason {
  ALL = 'ALL',
  UNPROFESSIONAL_BEHAVIOR = 'UNPROFESSIONAL_BEHAVIOR',
  MISDIAGNOSIS = 'MISDIAGNOSIS',
  APPOINTMENT_ISSUE = 'APPOINTMENT_ISSUE',
  OTHER = 'OTHER'
}

// Enum for Resolved Status
enum ResolvedStatus {
  ALL = 'ALL',
  RESOLVED = 'RESOLVED',
  UNRESOLVED = 'UNRESOLVED'
}

// Types for reports and insights
interface ReportUser {
  _id: string;
  username: string;
  email: string;
}

interface ReportedDoctor {
  _id?: string;
  name?: string;
  speciality?: string[];
}

interface Report {
  _id: string;
  reporter: ReportUser;
  reportedDoctor?: ReportedDoctor;
  reportReason: ReportReason;
  feedback?: string;
  createdAt: string;
  resolved: boolean;
}

interface ReportInsight {
  _id: string;
  count: number;
  unresolvedCount: number;
}

interface MostReportedDoctor {
  _id: string;
  totalReports: number;
  unresolvedReports: number;
  name: string ;
  speciality: [string] ;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalReports: number;
}

const ReportsManagementPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthContext();

  // Authentication check effect
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

  // State declarations - moved after auth check hooks
  const [reports, setReports] = useState<Report[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalReports: 0
  });
  const [insights, setInsights] = useState<{
    reportReasonBreakdown: ReportInsight[];
    mostReportedDoctors: MostReportedDoctor[];
  }>({
    reportReasonBreakdown: [],
    mostReportedDoctors: []
  });

  // Filtering states
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    reportReason: ReportReason.ALL,
    resolved: ResolvedStatus.ALL,
    startDate: null as Date | null,
    endDate: null as Date | null
  });

  // Selected report for details/resolution
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Fetch reports function
  const fetchReports = async () => {
    try {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== ReportReason.ALL && value !== ResolvedStatus.ALL) {
          if (value instanceof Date) {
            queryParams.append(key, value.toISOString());
          } else {
            queryParams.append(key, value.toString());
          }
        }
      });

      const response = await axiosInstance.get(`/reports?${queryParams.toString()}`);
      
      setReports(response.data.reports);
      setInsights(response.data.insights);
      setPagination({
        currentPage: response.data.pagination.currentPage,
        totalPages: response.data.pagination.totalPages,
        totalReports: response.data.pagination.totalReports
      });
    } catch (error) {
      console.error('Error fetching reports', error);
    }
  };

  // Resolve report function
  const resolveReport = async (reportId: string) => {
    try {
      await axiosInstance.patch(`/reports/${reportId}/resolve`, {
        resolution: 'Reviewed and addressed'
      });
      fetchReports();
    } catch (error) {
      console.error('Error resolving report', error);
    }
  };

  // Pagination handler
  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  // Effect to fetch reports on filter changes
  useEffect(() => {
    if (user && user.role === "ADMIN") {
      fetchReports();
    }
  }, [filters, user]);

  // Early return with loading state or null
  if (!user || user.role !== "ADMIN") {
    return null;
  }

  return (
    <div className="p-6 space-y-6 w-full">
      <h1 className="text-2xl font-bold">Reports Management</h1>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex space-x-4">
          {/* Report Reason Filter */}
          <Select 
            value={filters.reportReason} 
            onValueChange={(value: ReportReason) => setFilters(prev => ({ ...prev, reportReason: value }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Report Reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ReportReason.ALL}>All Reasons</SelectItem>
              <SelectItem value={ReportReason.UNPROFESSIONAL_BEHAVIOR}>
                Unprofessional Behavior
              </SelectItem>
              <SelectItem value={ReportReason.MISDIAGNOSIS}>
                Misdiagnosis
              </SelectItem>
              <SelectItem value={ReportReason.APPOINTMENT_ISSUE}>
                Appointment Issue
              </SelectItem>
              <SelectItem value={ReportReason.OTHER}>
                Other
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Resolved Status Filter */}
          <Select 
            value={filters.resolved} 
            onValueChange={(value: ResolvedStatus) => setFilters(prev => ({ ...prev, resolved: value }))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Resolved Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ResolvedStatus.ALL}>All Status</SelectItem>
              <SelectItem value={ResolvedStatus.RESOLVED}>Resolved</SelectItem>
              <SelectItem value={ResolvedStatus.UNRESOLVED}>Unresolved</SelectItem>
            </SelectContent>
          </Select>

          {/* Date Range Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className=" justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.startDate ? (
                  filters.endDate ? (
                    `${format(filters.startDate, 'PPP')} - ${format(filters.endDate, 'PPP')}`
                  ) : (
                    format(filters.startDate, 'PPP')
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="range"
                selected={{
                  from: filters.startDate,
                  to: filters.endDate
                }}
                onSelect={(range) => setFilters(prev => ({
                  ...prev, 
                  startDate: range?.from, 
                  endDate: range?.to
                }))}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <div className='overflow-auto w-full'>
      <Card>
        <CardHeader>
          <CardTitle>Reports List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reporter</TableHead>
                <TableHead>Reported Doctor</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.map(report => (
                <TableRow key={report._id}>
                  <TableCell>{report.reporter.username}</TableCell>
                  <TableCell>
                    {report.reportedDoctor?.name || 'N/A'}
                  </TableCell>
                  <TableCell>{report.reportReason}</TableCell>
                  <TableCell>
                    {new Date(report.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={
                      report.resolved 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }>
                      {report.resolved ? 'Resolved' : 'Unresolved'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedReport(report)}
                      className="mr-2"
                    >
                      View Details
                    </Button>
                    {!report.resolved && (
                      <Button 
                        variant="destructive"
                        onClick={() => resolveReport(report._id)}
                      >
                        Resolve
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <span>
              Page {pagination.currentPage} of {pagination.totalPages} 
              (Total Reports: {pagination.totalReports})
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
      

      {/* Insights Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Report Reason Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Report Reason Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.reportReasonBreakdown.map(insight => (
              <div key={insight._id} className="flex justify-between mb-2">
                <span>{insight._id}</span>
                <span>
                  Total: {insight.count} 
                  (Unresolved: {insight.unresolvedCount})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Most Reported Doctors */}
        <Card>
          <CardHeader>
            <CardTitle>Most Reported Doctors</CardTitle>
          </CardHeader>
          <CardContent>
            {insights.mostReportedDoctors.map(doctor => (
              <div key={doctor._id} className="flex justify-between mb-2">
                <span>{doctor.name}</span>
                <span>
                  Total Reports: {doctor.totalReports}
                  (Unresolved: {doctor.unresolvedReports})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Report Details Dialog */}
      {selectedReport && (
        <Dialog 
          open={!!selectedReport} 
          onOpenChange={() => setSelectedReport(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Details</DialogTitle>
              <DialogDescription>
                Detailed information about the report
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p><strong>Reporter:</strong> {selectedReport.reporter.username}</p>
              <p><strong>Reporter Email:</strong> {selectedReport.reporter.email}</p>
              {selectedReport.reportedDoctor && (
                <p>
                  <strong>Reported Doctor:</strong> {selectedReport.reportedDoctor.name}
                </p>
              )}
              <p><strong>Reason:</strong> {selectedReport.reportReason}</p>
              {selectedReport.feedback && (
                <p><strong>Feedback:</strong> {selectedReport.feedback}</p>
              )}
              <p>
                <strong>Status:</strong> 
                <span className={
                  selectedReport.resolved 
                    ? 'text-green-600 ml-2' 
                    : 'text-red-600 ml-2'
                }>
                  {selectedReport.resolved ? 'Resolved' : 'Unresolved'}
                </span>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ReportsManagementPage;