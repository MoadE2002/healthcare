const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path as needed

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET);
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }

    const user = await User.findById(decoded._id);
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    socket.user = user;
    next();
  } catch (error) {
    console.log("not working")
    console.error('Socket authentication middleware error:', error);
    next(new Error('Internal server error during authentication'));
  }
};

module.exports = socketAuthMiddleware;