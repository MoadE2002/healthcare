const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { translateText } = require("./translationService"); 

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

// Store room participants
const rooms = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle joining a room
  socket.on("join-room", ({ roomId }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    // Prevent duplicate entries
    if (!rooms[roomId].includes(socket.id)) {
      rooms[roomId].push(socket.id);
    }

    console.log(`User ${socket.id} joining appointment ${roomId}`);

    // Notify the user about the room's current participants
    io.to(socket.id).emit("room-participants", rooms[roomId]);

    // Join the room
    socket.join(roomId);

    console.log(`Room ${roomId} participants: ${rooms[roomId].length}`);
  });

  // Handle offer
  socket.on("offer", ({ sdp, roomId }) => {
    const otherParticipants = rooms[roomId]?.filter((id) => id !== socket.id);
    if (otherParticipants && otherParticipants.length > 0) {
      socket.to(otherParticipants[0]).emit("offer", { sdp });
    }
  });

  // Handle answer
  socket.on("answer", ({ sdp, roomId }) => {
    const otherParticipants = rooms[roomId]?.filter((id) => id !== socket.id);
    if (otherParticipants && otherParticipants.length > 0) {
      socket.to(otherParticipants[0]).emit("answer", { sdp });
    }
  });

  // Handle ICE candidates
  socket.on("ice-candidate", ({ candidate, roomId }) => {
    const otherParticipants = rooms[roomId]?.filter((id) => id !== socket.id);
    if (otherParticipants && otherParticipants.length > 0) {
      socket.to(otherParticipants[0]).emit("ice-candidate", { candidate });
    }
  });

  // Handle call end
  socket.on("end-call", ({ roomId, reason }) => {
    // Broadcast end-call event to all participants in the room
    socket.to(roomId).emit("end-call", { reason });
  });

  // Handle resume call
  socket.on("resume-call", ({ roomId }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    // Ensure the socket joining is not duplicated
    if (!rooms[roomId].includes(socket.id)) {
      rooms[roomId].push(socket.id);
    }

    // Notify all participants in the room about the call resumption
    io.to(roomId).emit("call-resumed", {
      resumedBy: socket.id,
      participants: rooms[roomId]
    });
  });

  socket.on("message" , ({ message, roomId})=> { 
    const otherParticipants = rooms[roomId]?.filter((id) => id !== socket.id);
    if (otherParticipants && otherParticipants.length > 0) {
      socket.to(otherParticipants[0]).emit("new-message", { message });
    }
  })

  // send to other user target language i want 
  socket.on("set-targetLang", ({ message, roomId }) => {
    const otherParticipants = rooms[roomId]?.filter((id) => id !== socket.id);
    if (otherParticipants && otherParticipants.length > 0) {
      socket.to(otherParticipants[0]).emit("new-targetLang", { 
        message 
      });
    }
  });


  socket.on("translation", async ({ message, roomId, targetLang }) => { 
    try {
      // Translate the speech transcript
      const translatedText = await translateText(message, targetLang);
      
      // Send translated text to other participants
      const otherParticipants = rooms[roomId]?.filter((id) => id !== socket.id);
      if (otherParticipants && otherParticipants.length > 0) {
        socket.to(otherParticipants[0]).emit("new-translation", { 
          message: translatedText 
        });
      }
    } catch (error) {
      console.error('Translation error:', error);
      socket.emit("new-translation", { message }); // Return original text on error
    }
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      console.log(`Room ${roomId} participants: ${rooms[roomId].length}`);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      }
    }
  });
});

// Start the server
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});