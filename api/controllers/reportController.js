const Report = require('../models/Report');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointement');
const User = require('../models/User');
const mongoose = require('mongoose');


// Create a new report
const createReport = async (req, res) => {
  const { userId, reportedDoctor, reportedAppointment, feedback, reportReason } = req.body;

  try {
    const reportedDoctorId = reportedDoctor 
      ? await Doctor.findById(reportedDoctor).select('_id') 
      : null;


    const reportedAppointmentId = reportedAppointment
      ? await Appointment.findById(reportedAppointment)
      : null;

    // Check if a report already exists for the given appointment
    if (reportedAppointmentId) {
      const existingReport = await Report.findOne({ reportedAppointment: reportedAppointmentId._id });
      if (existingReport) {
        return res.status(400).json({ error: 'A report already exists for this appointment.' });
      }
    }

    const report = new Report({
      reporter: userId,
      reportedDoctor: reportedDoctorId ? reportedDoctorId._id : undefined,
      reportedAppointment: reportedAppointmentId ? reportedAppointmentId._id : undefined,
      feedback,
      reportReason,
    });

    await report.save();

    res.status(201).json({ message: 'Report created successfully', report });
  } catch (error) {
    console.error('Report Creation Error:', error);
    res.status(500).json({ 
      error: 'Something went wrong. Please try again.', 
      details: error.message 
    });
  }
};


// Get all reports
const getReports = async (req, res) => {
  try {
    // Destructure query parameters with default values
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      reportReason,
      resolved,
      startDate,
      endDate,
      searchQuery
    } = req.query;

    // Build filter object
    const filter = {};

    // Filter by report reason
    if (reportReason) {
      filter.reportReason = reportReason;
    }

    // Filter by resolved status
    if (resolved !== undefined) {
      filter.resolved = resolved === 'true';
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Aggregation pipeline for detailed reports
    const reports = await Report.aggregate([
      { $match: filter },
      { $sort: sort },
      { $skip: skip },
      { $limit: limitNumber },
      {
        $lookup: {
          from: 'users',
          localField: 'reporter',
          foreignField: '_id',
          as: 'reporterDetails'
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'reportedDoctor',
          foreignField: '_id',
          as: 'doctorDetails'
        }
      },
      {
        $unwind: '$reporterDetails'
      },
      {
        $unwind: { 
          path: '$doctorDetails', 
          preserveNullAndEmptyArrays: true 
        }
      },
      {
        $project: {
          reporter: {
            _id: '$reporterDetails._id',
            username: '$reporterDetails.username',
            email: '$reporterDetails.email'
          },
          reportedDoctor: {
            _id: { $ifNull: ['$doctorDetails._id', null] },
            username: { $ifNull: ['$doctorDetails.user.username', null] }
          },
          reportReason: 1,
          feedback: 1,
          createdAt: 1,
          resolved: 1
        }
      }
    ]);

    // Get total count for pagination
    const totalReports = await Report.countDocuments(filter);

    // Additional insights
    const reportInsights = await Report.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$reportReason',
          count: { $sum: 1 },
          unresolvedCount: { 
            $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] } 
          }
        }
      }
    ]);

    // Most reported doctors
    const mostReportedDoctors = await Report.aggregate([
      { $match: { reportedDoctor: { $ne: null } } },
      {
        $group: {
          _id: '$reportedDoctor',
          totalReports: { $sum: 1 },
          unresolvedReports: { 
            $sum: { $cond: [{ $eq: ['$resolved', false] }, 1, 0] } 
          }
        }
      },
      { $sort: { totalReports: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctorDetails'
        }
      },
      {
        $unwind: '$doctorDetails'
      }
    ]);

    res.status(200).json({
      reports,
      pagination: {
        currentPage: pageNumber,
        totalPages: Math.ceil(totalReports / limitNumber),
        totalReports
      },
      insights: {
        reportReasonBreakdown: reportInsights,
        mostReportedDoctors
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      message: 'Error fetching reports', 
      error: error.message 
    });
  }
};


// Additional helper method to resolve a report
const resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const updatedReport = await Report.findByIdAndUpdate(
      reportId, 
      { 
        resolved: true,
      }, 
      { new: true }
    );

    if (!updatedReport) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.status(200).json({
      message: 'Report resolved successfully',
      report: updatedReport
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ 
      message: 'Error resolving report', 
      error: error.message 
    });
  }
};

// Get unresolved reports
const getUnresolvedReports = async (req, res) => {
  try {
    const unresolvedReports = await Report.find({ resolved: false }).populate('reporter reportedDoctor reportedAppointment');
    
    res.status(200).json({ unresolvedReports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch unresolved reports.' });
  }
};

// Get reports by a specific user (either reporter, doctor, or appointment)
const getUserReports = async (req, res) => {
  const { userId } = req.params;

  try {
    const reports = await Report.find({
      $or: [{ reporter: userId }, { reportedDoctor: userId }, { reportedAppointment: userId }],
    }).populate('reporter reportedDoctor reportedAppointment');
    
    res.status(200).json({ reports });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unable to fetch user reports.' });
  }
};


const getDoctorUsernamesForUserAppointments = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verify if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Find appointments for the user
    const appointments = await Appointment.find({ 
      patient_id: userId,
      status: { $in: ['confirmed', 'completed'] } 
    }).populate({
      path: 'doctor_id',
      populate: { path: 'user', select: 'username' }
    });

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({ doctors: [] });
    }

    // Extract unique doctors (usernames and IDs)
    const doctors = [...new Set(
      appointments
        .map(appointment => {
          if (appointment.doctor_id && appointment.doctor_id.user) {
            return {
              id: appointment.doctor_id._id,
              username: appointment.doctor_id.user.username
            };
          }
          return null;
        })
        .filter(doctor => doctor)
    )];

    return res.status(200).json({ doctors });
  } catch (error) {
    console.error('Error in getDoctorUsernamesForUserAppointments:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};


// Get confirmed or canceled appointments for a user
const getOrCanceledOrCompletedAppointments = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Find appointments with confirmed, canceled, or completed status for the specific user
    const appointments = await Appointment.find({
      patient_id: userId,
      status: { $in: [ 'canceled', 'completed'] }
    }).select('_id date start_time end_time status');
    
    if (!appointments.length) {
      return res.status(200).json({ appointments: [] });
    }

    // Format appointment details
    const appointmentDetails = appointments.map((appointment) => ({
      appointmentId: appointment._id,
      date: appointment.date,
      startTime: appointment.start_time,
      endTime: appointment.end_time,
      status: appointment.status,
    }));

    return res.status(200).json({ appointments: appointmentDetails });
  } catch (error) {
    console.error('Error in getConfirmedOrCanceledOrCompletedAppointments:', error);
    return res.status(500).json({ 
      message: 'Server error', 
      error: error.message 
    });
  }
};



module.exports = {
  createReport,
  getReports,
  getUnresolvedReports,
  resolveReport,
  getUserReports,
  getDoctorUsernamesForUserAppointments , 
  getOrCanceledOrCompletedAppointments,
};
