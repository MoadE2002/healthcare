const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

router.get('/:roomId', requireAuth, (req, res) => {
  const { roomId } = req.params;
  
  try {
    // Optional: Add any room validation logic
    
    // When a client connects, we'll set up WebRTC handlers
    req.socketManager.getIO().on('connection', (socket) => {
      // Setup WebRTC specific handlers for this room
      req.socketManager.setupWebRTCHandlers(socket, roomId);
    });

    res.status(200).json({ 
      message: 'Video call room ready', 
      roomId 
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error setting up video call', 
      error: error.message 
    });
  }
});

module.exports = router;