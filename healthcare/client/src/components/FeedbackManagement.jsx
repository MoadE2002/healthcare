"use client";
import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  Check, 
  Trash2, 
  MoreHorizontal 
} from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import axiosInstance from '../apicalls/axiosInstance'; 

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUnseen: 0
  });

  // Fetch unseen feedbacks
  const fetchFeedbacks = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/feedback/unseen', {
        params: { page, limit: 10 }
      });

      setFeedbacks(response.data.feedbacks);
      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        totalUnseen: response.data.totalUnseen
      });
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark feedback as seen
  const handleMarkAsSeen = async (feedbackId) => {
    try {
        console.log(feedbackId)
      await axiosInstance.patch('/feedback/mark-seen', { 
        feedbackIds: [feedbackId] 
      });
      fetchFeedbacks(pagination.currentPage);
    } catch (error) {
      console.error('Failed to mark feedback as seen:', error);
    }
  };

  // Approve feedback
  const handleApproveFeedback = async (feedbackId) => {
    try {
      await axiosInstance.patch('/feedback/approve', { 
        feedbackIds: [feedbackId] 
      });
      fetchFeedbacks(pagination.currentPage);
    } catch (error) {
      console.error('Failed to approve feedback:', error);
    }
  };

  // Delete feedback (add this route in your backend if needed)
  const handleDeleteFeedback = async (feedbackId) => {
    try {
      await axiosInstance.delete(`/feedback/${feedbackId}`);
      fetchFeedbacks(pagination.currentPage);
    } catch (error) {
      console.error('Failed to delete feedback:', error);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Feedback Management 
          <span className="text-sm text-muted-foreground ml-2">
            ({pagination.totalUnseen} unseen)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-[500px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : feedbacks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No feedbacks available
                  </TableCell>
                </TableRow>
              ) : (
                feedbacks.map((feedback) => (
                  <TableRow key={feedback._id}>
                    <TableCell>
                      {feedback.reviewer.username}
                    </TableCell>
                    <TableCell>
                      {feedback.doctor?.name || 'N/A'}
                      <br />
                      <span className="text-xs text-muted-foreground">
                        {feedback.doctor?.speciality || ''}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {feedback.text}
                    </TableCell>
                    <TableCell>
                      {new Date(feedback.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onSelect={() => handleMarkAsSeen(feedback._id)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Mark as Seen
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onSelect={() => handleApproveFeedback(feedback._id)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onSelect={() => handleDeleteFeedback(feedback._id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <Button 
            variant="outline"
            onClick={() => fetchFeedbacks(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
          >
            Previous
          </Button>
          <span>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          <Button 
            variant="outline"
            onClick={() => fetchFeedbacks(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackManagement;
