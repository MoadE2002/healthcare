const { socketManager } = require('./app');
const Notification = require('./models/Notification');
const Appointment = require('./models/Appointement');

class NotificationService {
  constructor(socketManager) {
    this.socketManager = socketManager;
  }
  
  static setSocketManager(socketManager) {
    this._socketManager = socketManager;
  }

  static getSocketManager() {
    if (!this._socketManager) {
      throw new Error('Socket manager not initialized');
    }
    return this._socketManager;
  }
  
  static async sendPrescriptionNotification(patientId, prescription_id) {
    try {
      const notification = new Notification({
        user: patientId,
        prescription_id: prescription_id,
        type: 'PRESCRIPTION_PDF',
        title: 'New Prescription Available',
        message: 'Your doctor has uploaded a new prescription PDF',
        data: {
          prescriptionId: prescription_id,  // Explicitly name this
          type: 'PRESCRIPTION_PDF'
        }
      });
      await notification.save();
  
      const socketManager = this.getSocketManager();
      socketManager.handleNotification({
        recipientId: patientId,
        type: 'PRESCRIPTION_PDF',
        message: 'New prescription PDF is available',
        data: {
          _id: notification._id,
          prescription_id: prescription_id,
          prescriptionId: prescription_id,
          type: 'PRESCRIPTION_PDF'
        }
      });
    } catch (error) {
      console.error('Prescription Notification Error:', error);
    }
  }
  static async sendBookedAppointmentNotification(appointmentId , doctor_id , date , start_time , end_time ){ 

    try {
      const notification = new Notification({
        user: doctor_id,
        appointmentId: appointmentId,
        type: 'APPOINTMENT_REMINDER',
        title: `new patient booked  Appointment for ${date} at time ${start_time}`,
        message: `new patient booked  Appointment for ${date} at time ${start_time} `,
        data: {
          appointmentId: appointmentId,  // Explicitly name this
          type: 'APPOINTMENT_REMINDER'
        }
      });
      await notification.save();
  
      const socketManager = this.getSocketManager();
      socketManager.handleNotification({
        recipientId: doctor_id,
        type: 'APPOINTMENT_REMINDER',
        message: `new patient booked  Appointment for ${date} at time ${start_time}`,
        data: {
          _id: notification._id,
          appointmentId: appointmentId,
          type: 'APPOINTMENT_REMINDER'
        }
      });
    } catch (error) {
      console.error('Appointmenet Notification Error:', error);
    }

  }

  static async sendBookedAppointmentforuserNotification(appointmentId , patient_id , date , start_time , end_time ){ 

    try {
      const notification = new Notification({
        user: patient_id,
        appointmentId: appointmentId,
        type: 'APPOINTMENT_REMINDER',
        title: `you booke  Appointment for ${date} at time ${start_time}`,
        message: `you booke  Appointment for ${date} at time ${start_time} `,
        data: {
          appointmentId: appointmentId,  // Explicitly name this
          type: 'APPOINTMENT_REMINDER'
        }
      });
      await notification.save();
  
      const socketManager = this.getSocketManager();
      socketManager.handleNotification({
        recipientId: patient_id,
        type: 'APPOINTMENT_REMINDER',
        message: `you booke  Appointment for ${date} at time ${start_time}`,
        data: {
          _id: notification._id,
          appointmentId: appointmentId,
          type: 'APPOINTMENT_REMINDER'
        }
      });
    } catch (error) {
      console.error('Appointmenet Notification Error:', error);
    }

  }

  static async sendYouAreVerifiedNotification( doctor_id , verification_id ){ 

    try {
      const notification = new Notification({
        user: doctor_id,
        verification_id : verification_id , 
        type: 'VERIFIED',
        title: `your verification accepted`,
        message: `your verification accepted`,
        data: {
          verification_id : verification_id , 
          type: 'VERIFIED'
        }
      });
      await notification.save();
  
      const socketManager = this.getSocketManager();
      socketManager.handleNotification({
        recipientId: doctor_id,
        type: 'VERIFIED',
        message: `your verification accepted`,
        data: {
          _id: notification._id,
          verification_id : verification_id , 
          type: 'your verification accepted'
        }
      });
    } catch (error) {
      console.error('accepted verification Notification Error:', error);
    }

  }

  static async sendVerificationDeclinedNotification( doctor_id , reason , verification_id ){ 

    try {
      const notification = new Notification({
        user: doctor_id,
        verification_id :verification_id , 
        type: 'VERIFICATION_DECLINED',
        title: `your verification declined`,
        message: `your verification declined for reason ${reason}`,
        data: {
          verification_id:verification_id, 
          type: 'VERIFICATION_DECLINED'
        }
      });
      await notification.save();
  
      const socketManager = this.getSocketManager();
      socketManager.handleNotification({
        recipientId: doctor_id,
        type: 'VERIFICATION_DECLINED',
        message: `your verification declined for reason ${reason}`,
        data: {
          _id: notification._id,
          verification_id:verification_id, 
          type: 'your verification declined'
        }
      });
    } catch (error) {
      console.error('accepted verification Notification Error:', error);
    }

  }
  

  // Update other methods to include navigation-supporting data
  static async sendAppointmentReminderNotification(appointmentId) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patient')
        .populate('doctor');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const notification = new Notification({
        user: appointment.patient._id,
        type: 'APPOINTMENT_REMINDER',
        title: 'Upcoming Appointment',
        appointmentId : appointmentId,  
        message: `Appointment with Dr. ${appointment.doctor.user.username} is coming soon`,
        data: {
          appointmentId: appointment._id,
          appointmentTime: appointment.start_time
        }
      });
      await notification.save();

      socketManager.handleNotification({
        recipientId: appointment.patient._id,
        type: 'APPOINTMENT_REMINDER',
        message: `Your appointment starts in ${appointment.start_time} minutes`,
        data: notification
      });
    } catch (error) {
      console.error('Appointment Reminder Notification Error:', error);
    }
  }

  static async sendVideoCallInvitation(appointmentId, callRoomId, userId) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patient')
        .populate('doctor');
  
      if (!appointment) {
        throw new Error('Appointment not found');
      }
  
      let notification;
      if (userId === appointment.patient._id) { 
        notification = new Notification({
          user: appointment.doctor.user._id,
          type: 'CALL_INVITATION',
          title: 'Video Call Invitation',
          appointmentId : appointmentId,  
          message: `Your patient is ready to start the video consultation`,
          data: {
            appointmentId: appointment._id,
            callRoomId: callRoomId
          }
        });
      } else { 
        notification = new Notification({
          user: appointment.patient._id,
          type: 'CALL_INVITATION',
          title: 'Video Call Invitation',
          message: `Your doctor is ready to start the video consultation`,
          data: {
            appointmentId: appointment._id,
            callRoomId: callRoomId
          }
        });
      }
      
      await notification.save();

      socketManager.handleNotification({
        recipientId: notification.user,
        type: 'CALL_INVITATION',
        message: 'Click to join video consultation',
        data: notification
      });
    } catch (error) {
      console.error('Video Call Invitation Error:', error);
    }
  }

  static async sendAppointmentConfirmedNotification(appointmentId) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patient')
        .populate('doctor');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const notification = new Notification({
        user: appointment.patient._id,
        type: 'APPOINTMENT_CONFIRMED',
        title: 'Appointment confirmed',
        appointmentId : appointmentId,  
        message: `Appointment with Dr. ${appointment.doctor.user.username} is confirmed`,
        data: {
          appointmentId: appointment._id,
          appointmentTime: appointment.start_time
        }
      });
      await notification.save();

      socketManager.handleNotification({
        recipientId: appointment.patient._id,
        type: 'APPOINTMENT_CONFIRMED',
        message: `Your appointment at date ${appointment.date} at time ${appointment.start_time} confirmed by doctor`,
        data: notification
      });
    } catch (error) {
      console.error('Appointment confirmed Notification Error:', error);
    }
  }

  static async sendAppointmentCancledNotification(appointmentId) {
    try {
      const appointment = await Appointment.findById(appointmentId)
        .populate('patient')
        .populate('doctor');

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      const notification = new Notification({
        user: appointment.patient._id,
        type: 'APPOINTMENT_CANCLED',
        title: 'Your Appointment is Canceled',
        appointmentId : appointmentId,  
        message: `Appointment with Dr. ${appointment.doctor.user.username} is canceled`,
        data: {
          appointmentId: appointment._id
        }
      });
      await notification.save();

      socketManager.handleNotification({
        recipientId: appointment.patient._id,
        type: 'APPOINTMENT_CANCLED',
        message: `Your appointment at date ${appointment.date} at time ${appointment.start_time} canceled by doctor`,
        data: notification
      });
    } catch (error) {
      console.error('Appointment canceled Notification Error:', error);
    }
  }
}

module.exports = NotificationService;