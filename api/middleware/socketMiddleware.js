module.exports = (socketManager) => {
    return (req, res, next) => {
      // Attach socket manager to the request
      req.socketManager = socketManager;
      
      // Optional: Attach io instance directly if needed
      req.io = socketManager.getIO();
      
      next();
    };
  };