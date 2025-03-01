const { Server } = require("socket.io");
const Notification = require("./models/Notification");
const User = require("./models/User");
const Appointment = require("./models/Appointement"); 
const Feedback = require("./models/Feedback")

class SocketManager {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization"],
        credentials: true
      },
    });

    this.rooms = new Map();
    this.userSockets = new Map();
    this.setupSocketEvents();
  }

  getIO() {
    if (!this.io) {
      throw new Error('Socket.IO not initialized');
    }
    return this.io;
  }

  setupSocketEvents() {
    this.io.on("connection", (socket) => {
      console.log(`User connected: ${socket.id}`);
      
      // Register user and device token
      socket.on("register-user", async ({ userId, deviceToken }) => {
        await this.registerUser(socket, userId, deviceToken);
      });

      // Join a room (for video calls)
      socket.on("join-room", async ({ roomId, userId }) => {
        await this.joinRoom(socket, roomId, userId);
      });

      // Send call invitation
      socket.on("send-call", async ({roomId, receivedId, senderId}) => { 
        await this.newCall(roomId, receivedId, senderId);
      });

      // Handle call rejection
      socket.on("rejected", async ({roomId, decliner, caller}) => {
        await this.sendCallRejected(roomId, decliner, caller);
      });

      socket.on("leave-room", async ({roomId, socketId}) => {
        await this.leaveRoom(roomId, socketId);
      });
      

      socket.on("end-call", async ({ roomId, userId }) => {
        try {
          const recipientSocketId = this.userSockets.get(userId.toString());
          if(recipientSocketId){
            this.io.to(recipientSocketId).emit("call-ended", { userId });
          }
          await Appointment.findByIdAndUpdate(roomId, { status: "completed" });
      
        } catch (error) {
          console.error("Error ending call:", error);
        }
      });
      

      socket.on("send_message", ({ message, roomId, userId }) => {
        try {
          const room = this.rooms.get(roomId);
          if (!room) {
            console.error(`Room not found: ${roomId}`);
            return;
          }
          const recipient = room.users.find(user => user.userId !== userId);
          if (recipient) {
            this.io.to(recipient.socketId).emit("receive_message", {
              message,
              roomId,
              userId 
            });
            console.log(`Message sent to user ${recipient.userId} in room ${roomId}`);
          } else {
            console.log(`No other participants found in room ${roomId} for user ${userId}`);
          }
        } catch (error) {
          console.error("Error sending message:", error);
        }
      });
      

      socket.on("call-feedback", async ({ roomId, userId, feedback , doctorId}) => {
        try {
          await this.saveFeedback(roomId, userId, feedback  , doctorId);
        } catch (error) {
          console.error("Error saving call feedback:", error);
        }
      });


      socket.on("notification", async (notificationData) => {
        await this.handleNotification(notificationData);
      });

      // Handle disconnect
      socket.on("disconnect", async () => {
        await this.handleDisconnect(socket);
      });
    });
  }

  async registerUser(socket, userId, deviceToken) {
    try {
      if (!userId) {
        console.error('Invalid userId during registration');
        return;
      }
  
      this.userSockets.set(userId.toString(), socket.id);
      console.log(`User ${userId} registered with socket ${socket.id}`);
    } catch (error) {
      console.error('Error registering user:', error);
    }
  }

  async newCall(roomId, recipientId, senderId) { 
    if (!recipientId) { 
      console.log("Missing recipient ID");
      return; 
    }
    
    const recipientSocketId = this.userSockets.get(recipientId.toString());
    const senderSocketId = this.userSockets.get(senderId.toString());
    if (recipientSocketId) {
      // Ensure room has space for only two participants
      const room = this.rooms.get(roomId);
        if (!room || room.users.length < 2) {
          this.io.to(recipientSocketId).emit('send-call', { roomId, senderId });
          this.io.to(senderSocketId).emit('calling', {message: "calling "});
        }
        else {
        
        this.io.to(senderSocketId).emit('rejected', { 
          message: "Call room is already full" 
        });
      }
    } else {
      const senderSocketId = this.userSockets.get(senderId.toString());
      this.io.to(senderSocketId).emit('rejected', { 
        message: "User is offline" 
      });
    }
  }

  async sendCallRejected(roomId, decliner, caller) { 
    if (!caller) { 
      console.log("Missing caller ID");
      return; 
    }
    
    const callerSocketId = this.userSockets.get(caller.toString());
    if (callerSocketId) { 
      this.io.to(callerSocketId).emit('rejected-call', { message: "Your call was declined"});
    }
  }

  async joinRoom(socket, roomId, userId) {
    try {
      // Initialize room if not exists
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, { users: [{ userId, socketId: socket.id }] });
      } else {
        const room = this.rooms.get(roomId);
        const userExists = room.users.some(user => user.userId === userId);
        if (userExists) {
          console.log(`User ${userId} is already in room ${roomId}.`);
        } else {
          
          room.users.push({ userId, socketId: socket.id });
          console.log(`User ${userId} added to room ${roomId}.`);
          if(room.users.length==2){ 
            console.log("can offre")
            this.io.to(socket.id).emit('can-offre');
          }else{ 
            this.io.to(socket.id).emit('can-initiate')
          }
        }
      }
  
      // Join the room
      socket.join(roomId);
  
      // // Notify all users in the room about the new participant
      // this.io.to(roomId).emit("room-participants", this.rooms.get(roomId).users);

  
      // // Notify all users (including the new user) about the new participant
      // this.io.to(roomId).emit("new-participant", { userId, socketId: socket.id });
  
      console.log(`User ${userId} joined room ${roomId}`);
    } catch (error) {
      console.error("Error joining room:", error);
    }
  }
  
  leaveRoom(roomId, socketId) {
    if (this.rooms.has(roomId)) {
      const room = this.rooms.get(roomId);
      const initialLength = room.users.length;

      const leavingUser = room.users.find(user => user.socketId === socketId);
      // Remove the user from the room
      room.users = room.users.filter(user => user.socketId !== socketId);
      console.log(`User with socketId ${socketId} removed from room ${roomId}.`);

      this.io.to(roomId).emit('room-left', {
        userId: leavingUser.userId, 
        roomId: roomId,
        participants: room.users.length
      });
  
      // Clean up empty rooms
      if (room.users.length === 0) {
        this.rooms.delete(roomId);
        console.log(`Room ${roomId} deleted as it is empty.`);
      }
  
      
      if (room.users.length !== initialLength) {
        room.users.forEach(user => {
          this.io.to(user.socketId).emit("room-participants", room.users);
        });
        this.io.to(roomId).emit("new-participant", { userId: room.users.userId, socketId: room.users.socketId });
      }
    }
  }
  
  async handleDisconnect(socket) {
    try {
      for (const [roomId, room] of this.rooms.entries()) {
        const initialParticipantsCount = room.users.length;
        
        this.leaveRoom(roomId, socket.id);
        
        if (room.users.length !== initialParticipantsCount) {
          room.users.forEach(user => {
            this.io.to(user.socketId).emit("room-participants", room.users.length);
          });
        }
      }
  
      const userId = Array.from(this.userSockets.entries()).find(
        ([_, socketId]) => socketId === socket.id
      )?.[0];
  
      if (userId) {
        this.userSockets.delete(userId);
      }
  
      console.log(`User disconnected: ${socket.id}`);
    } catch (error) {
      console.error("Error handling disconnect:", error);
    }
  }

  
  async saveFeedback(roomId, userId, feedback ,  doctorId) {
    // try {
    //   // if(rating){ 
    //   //   await Appointment.findByIdAndUpdate(roomId, { rating:  rating}
    //   //   );
    //   }
      if(feedback){ 
        try { 
          const feedback = new Feedbacks({
            appointmentfeeded: roomId,
            reviewer : userId,
            doctorId: doctorId , 
            text: feedback,
          });
          await feedback.save();
          return feedback;
        
      }catch (error) {
      console.error("Error saving feedback:", error);
    }
  }
}

  async createNotification(userId, type, data) {
    try {
      const notification = new Notification({
        user: userId,
        type,
        title: data?.title || 'Notification',
        message: data.message,
        data: data || {}
      });
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }

  async handleNotification(notificationData) {
    try {
      const { 
        recipientId, 
        type, 
        message, 
        data 
      } = notificationData;
  
      console.log("Notification Data:", JSON.stringify(data, null, 2));
  
      const recipientSocketId = this.userSockets.get(recipientId.toString());
  
      if (recipientSocketId) {
        this.io.to(recipientSocketId).emit('notification', {
          _id: data._id || null,  
          type,
          message,
          data: {
            prescriptionId: data.prescription_id || data.prescriptionId || null,
            appointmentId: data.appointmentId || data.data?.appointmentId || null,
            verification_id: data.verification_id || data.data?.verification_id || null ,  
            type: type
          }
        });
      }
  
      await this.sendPushNotificationIfOffline(recipientId, {
        _id: data._id,
        type,
        message,
        data: {
          ...data,
          prescriptionId: data.prescription_id || data.prescriptionId
        }
      });
  
      console.log(`Notification sent to user ${recipientId}`);
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  }

  async sendPushNotificationIfOffline(userId, notification) {
    try {
      const user = await User.findById(userId);
      
      if (user && user.deviceTokens && user.deviceTokens.length > 0) {
        console.log('Potential push notification for offline user:', {
          userId,
          deviceTokens: user.deviceTokens.map(dt => dt.token),
          notification
        });
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}

module.exports = SocketManager;