const Appointment = require('../models/Appointment');
const CallSession = require('../models/callsession');
const NotificationService = require('../notificationService');
const User = require('../models/User');

class VideoCallController {
  // Start a video call for a specific appointment
  static async startVideoCall(req, res) {
    try {
      const { appointmentId } = req.params;
      const doctorId = req.user._id; // Authenticated doctor's ID

      // Find the appointment and validate
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctor')
        .populate('patient');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Ensure only the assigned doctor can start the call
      if (appointment.doctor._id.toString() !== doctorId.toString()) {
        return res.status(403).json({ message: 'Unauthorized to start this call' });
      }

      // Check if call is within appropriate time window
      const now = new Date();
      const appointmentStart = new Date(appointment.startTime);
      const appointmentEnd = new Date(appointment.endTime);

      if (now < appointmentStart || now > appointmentEnd) {
        return res.status(400).json({ 
          message: 'Call can only be started during the appointment time' 
        });
      }

      // Create call session
      const callSession = new CallSession({
        appointmentId: appointment._id,
        participants: [
          {
            user: appointment.doctor._id,
            role: 'DOCTOR',
            joinedAt: now
          },
          {
            user: appointment.patient._id,
            role: 'PATIENT'
            // joinedAt will be set when patient joins
          }
        ],
        roomId: appointmentId,
        status: 'PENDING',
        startTime: now
      });

      await callSession.save();

      // Send video call invitation notifications
      await NotificationService.sendVideoCallInvitation(appointmentId);

      res.status(200).json({
        message: 'Video call initiated',
        appointmentId,
        callSessionId: callSession._id
      });
    } catch (error) {
      console.error('Start Video Call Error:', error);
      res.status(500).json({ message: 'Error starting video call', error: error.message });
    }
  }

  // Join an existing video call
  static async joinVideoCall(req, res) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user._id;

      // Find the appointment
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctor')
        .populate('patient');

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' });
      }

      // Validate user is either patient or doctor for this appointment
      const isPatient = appointment.patient._id.toString() === userId.toString();
      const isDoctor = appointment.doctor._id.toString() === userId.toString();

      if (!isPatient && !isDoctor) {
        return res.status(403).json({ message: 'Unauthorized to join this call' });
      }

      // Find the active call session
      const callSession = await CallSession.findOne({ 
        appointmentId: appointment._id,
        status: { $in: ['PENDING', 'ACTIVE'] }
      });

      if (!callSession) {
        return res.status(404).json({ message: 'No active call session found' });
      }

      // Update participant's join time
      const participantRole = isPatient ? 'PATIENT' : 'DOCTOR';
      await CallSession.findOneAndUpdate(
        { 
          _id: callSession._id, 
          'participants.user': userId 
        },
        { 
          $set: { 
            'participants.$.joinedAt': new Date(),
            status: 'ACTIVE' 
          }
        }
      );

      res.status(200).json({
        message: 'Joined video call',
        appointmentId,
        callSessionId: callSession._id,
        role: participantRole
      });
    } catch (error) {
      console.error('Join Video Call Error:', error);
      res.status(500).json({ message: 'Error joining video call', error: error.message });
    }
  }

  // End a video call
  static async endVideoCall(req, res) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user._id;

      // Find the active call session
      const callSession = await CallSession.findOne({ 
        appointmentId,
        status: { $in: ['PENDING', 'ACTIVE'] }
      });

      if (!callSession) {
        return res.status(404).json({ message: 'No active call session found' });
      }

      // Validate user's right to end the call
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctor')
        .populate('patient');

      const isAuthorizedUser = 
        userId.toString() === appointment.doctor._id.toString() || 
        userId.toString() === appointment.patient._id.toString();

      if (!isAuthorizedUser) {
        return res.status(403).json({ message: 'Unauthorized to end this call' });
      }

      // Update call session
      const endTime = new Date();
      await CallSession.findByIdAndUpdate(callSession._id, {
        status: 'ENDED',
        endTime: endTime,
        duration: endTime - callSession.startTime
      });

      // Notify both participants about call end
      await NotificationService.sendToUser(
        appointment.doctor._id, 
        'CALL_ENDED', 
        'Video consultation has ended'
      );

      await NotificationService.sendToUser(
        appointment.patient._id, 
        'CALL_ENDED', 
        'Video consultation has ended'
      );

      res.status(200).json({
        message: 'Video call ended',
        appointmentId,
        duration: endTime - callSession.startTime
      });
    } catch (error) {
      console.error('End Video Call Error:', error);
      res.status(500).json({ message: 'Error ending video call', error: error.message });
    }
  }

  // Get call session details
  static async getVideoCallDetails(req, res) {
    try {
      const { appointmentId } = req.params;
      const userId = req.user._id;

      // Find the call session
      const callSession = await CallSession.findOne({ 
        appointmentId,
        status: { $in: ['PENDING', 'ACTIVE'] }
      }).populate('participants.user');

      if (!callSession) {
        return res.status(404).json({ message: 'No active call session found' });
      }

      // Validate user's access
      const appointment = await Appointment.findById(appointmentId)
        .populate('doctor')
        .populate('patient');

      const isAuthorizedUser = 
        userId.toString() === appointment.doctor._id.toString() || 
        userId.toString() === appointment.patient._id.toString();

      if (!isAuthorizedUser) {
        return res.status(403).json({ message: 'Unauthorized to view call details' });
      }

      // Prepare participant details
      const participants = callSession.participants.map(p => ({
        userId: p.user._id,
        name: p.user.name,
        role: p.role,
        joinedAt: p.joinedAt
      }));

      res.status(200).json({
        appointmentId,
        callSessionId: callSession._id,
        status: callSession.status,
        startTime: callSession.startTime,
        participants
      });
    } catch (error) {
      console.error('Get Video Call Details Error:', error);
      res.status(500).json({ message: 'Error retrieving call details', error: error.message });
    }
  }

  // List recent call sessions for a user
  static async listUserCallSessions(req, res) {
    try {
      const userId = req.user._id;
      const { page = 1, limit = 10 } = req.query;

      // Find appointments where user is either patient or doctor
      const appointments = await Appointment.find({
        $or: [
          { patient: userId },
          { doctor: userId }
        ]
      });

      const appointmentIds = appointments.map(a => a._id);

      // Find call sessions for these appointments
      const callSessions = await CallSession.find({
        appointmentId: { $in: appointmentIds }
      })
      .populate({
        path: 'appointmentId',
        populate: [
          { path: 'patient', select: 'name' },
          { path: 'doctor', select: 'name' }
        ]
      })
      .sort({ startTime: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

      // Count total sessions
      const total = await CallSession.countDocuments({
        appointmentId: { $in: appointmentIds }
      });

      res.status(200).json({
        callSessions: callSessions.map(session => ({
          callSessionId: session._id,
          appointmentId: session.appointmentId._id,
          patientName: session.appointmentId.patient.name,
          doctorName: session.appointmentId.doctor.name,
          status: session.status,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalSessions: total
        }
      });
    } catch (error) {
      console.error('List Call Sessions Error:', error);
      res.status(500).json({ message: 'Error listing call sessions', error: error.message });
    }
  }
}

module.exports = VideoCallController;