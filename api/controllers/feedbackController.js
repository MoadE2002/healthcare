const Feedback = require('../models/Feedback');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const mongoose = require('mongoose');
const Appointment = require('../models/Appointement')

exports.getUnseenFeedbacks = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skipIndex = (page - 1) * limit;

    // Aggregation pipeline to fetch unseen feedbacks with detailed information
    const feedbacks = await Feedback.aggregate([
      // Filter for unseen and can show feedbacks
      { 
        $match: { 
          seen: false, 
          // If canshow is not explicitly set, assume it should be true
          $or: [
            { canshow: false },
            { canshow: { $exists: false } }
          ]
        } 
      },
      // Lookup to get reviewer details
      {
        $lookup: {
          from: 'users',
          localField: 'reviewer',
          foreignField: '_id',
          as: 'reviewerDetails'
        }
      },
      // Unwind reviewer details
      {
        $unwind: {
          path: '$reviewerDetails',
          preserveNullAndEmptyArrays: false // Ensure reviewer exists
        }
      },
      // Optional lookup for doctor details if doctorId exists
      {
        $lookup: {
          from: 'doctors',
          localField: 'doctorId',
          foreignField: '_id',
          as: 'doctorDetails'
        }
      },
      // Unwind doctor details (preserve null if no doctor)
      {
        $unwind: {
          path: '$doctorDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Lookup user details for doctor
      {
        $lookup: {
          from: 'users',
          localField: 'doctorDetails.user',
          foreignField: '_id',
          as: 'doctorUserDetails'
        }
      },
      // Unwind doctor user details (preserve null if no doctor)
      {
        $unwind: {
          path: '$doctorUserDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Project the final structure
      {
        $project: {
          _id: 1,
          text: 1,
          createdAt: 1,
          reviewer: {
            _id: '$reviewerDetails._id',
            username: '$reviewerDetails.username',
            email: '$reviewerDetails.email'
          },
          doctor: {
            _id: '$doctorDetails._id',
            name: '$doctorUserDetails.username',
            speciality: '$doctorDetails.speciality'
          }
        }
      },
      // Sort by creation date (newest first)
      { $sort: { createdAt: -1 } },
      // Pagination
      { $skip: skipIndex },
      { $limit: limit }
    ]);

    // Count total unseen feedbacks
    const totalUnseen = await Feedback.countDocuments({ 
      seen: false, 
      $or: [
        { canshow: false },
        { canshow: { $exists: false } }
      ]
    });

    res.status(200).json({
      feedbacks,
      currentPage: page,
      totalPages: Math.ceil(totalUnseen / limit),
      totalUnseen
    });
  } catch (error) {
    console.error('Error fetching unseen feedbacks:', error);
    res.status(500).json({
      message: 'Error fetching unseen feedbacks',
      error: error.message
    });
  }
};

exports.markFeedbackAsSeen = async (req, res) => {
  try {
    const { feedbackIds } = req.body;

    // Validate input
    if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
      return res.status(400).json({ message: 'Invalid feedback IDs' });
    }

    // Convert string IDs to ObjectId
    const objectIds = feedbackIds.map(id => new mongoose.Types.ObjectId(id));

    // Update multiple feedbacks
    const result = await Feedback.updateMany(
      { 
        _id: { $in: objectIds },
        seen: false 
      },
      { 
        $set: { seen: true } 
      }
    );

    res.status(200).json({
      message: 'Feedbacks marked as seen',
      updatedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error marking feedbacks as seen',
      error: error.message
    });
  }
};

exports.createFeedback = async (req, res) => {
  try {
    const { reviewer, text, appointmentfeeded, doctorId } = req.body;

    if (!reviewer) {
      return res.status(400).json({ message: 'Reviewer is required' });
    }

    if (!text) {
      return res.status(400).json({ message: 'Feedback text is required' });
    }

    // Validate that reviewer is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(reviewer)) {
      return res.status(400).json({ message: 'Invalid reviewer ID' });
    }

    // Optional: Validate that reviewer exists in User collection
    const userExists = await User.findById(reviewer);
    if (!userExists) {
      return res.status(400).json({ message: 'Reviewer not found' });
    }

    // Validate optional fields if provided
    if (appointmentfeeded && !(await Appointment.findById(appointmentfeeded))) {
      return res.status(400).json({ message: 'Invalid appointment ID' });
    }

    if (doctorId && !(await Doctor.findById(doctorId))) {
      return res.status(400).json({ message: 'Invalid doctor ID' });
    }

    // Create feedback object
    const newFeedback = new Feedback({
      reviewer,
      text,
      ...(appointmentfeeded && { appointmentfeeded }),
      ...(doctorId && { doctorId }),
    });

    // Save the feedback
    await newFeedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: newFeedback
    });
  } catch (error) {
    console.error('Detailed error creating feedback:', error);
    
    // More specific error handling
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation Error',
        details: error.errors
      });
    }

    res.status(500).json({
      message: 'Error creating feedback',
      error: error.message
    });
  }
};




exports.approveFeedback = async (req, res) => {
  try {
    const { feedbackIds } = req.body;

    // Validate input
    if (!feedbackIds || !Array.isArray(feedbackIds) || feedbackIds.length === 0) {
      return res.status(400).json({ message: 'Invalid feedback IDs' });
    }

    // Convert string IDs to ObjectId
    const objectIds = feedbackIds.map(id => new mongoose.Types.ObjectId(id));

    // Update multiple feedbacks
    const result = await Feedback.updateMany(
      { 
        _id: { $in: objectIds },
        canshow: false 
      },
      { 
        $set: { 
          canshow: true,
          seen: true 
        } 
      }
    );

    res.status(200).json({
      message: 'Feedbacks approved',
      approvedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error approving feedbacks',
      error: error.message
    });
  }
};


exports.deleteFeedback = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate input
    if (!id) {
      return res.status(400).json({ message: 'Feedback ID is required' });
    }

    // Convert string ID to ObjectId
    const objectId = new mongoose.Types.ObjectId(id);

    // Delete the feedback
    const result = await Feedback.deleteOne({ _id: objectId });

    // Check if feedback was actually deleted
    if (result.deletedCount === 0) {
      return res.status(404).json({ 
        message: 'Feedback not found or already deleted' 
      });
    }

    res.status(200).json({
      message: 'Feedback deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting feedback',
      error: error.message
    });
  }
};

exports.getFeedbacksBydoctor = async (req, res) => {
  const { doctor_id } = req.params;
  try {
    const feedbacks = await Feedback.find({ doctorId: doctor_id, canshow: true })
      .limit(6)
      .populate({
        path: 'reviewer',
        select: 'username photoDeProfile', 
      })
      .lean(); // Use lean for performance

    if (feedbacks.length === 0) {
      return res.status(404).json({ error: 'No feedbacks found.' });
    }

    res.status(200).json({ feedbacks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
