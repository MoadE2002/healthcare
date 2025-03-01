const requireAuth = require('./requireauth');

const authorize = (roles = ["ADMIN"]) => {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    });
  };
};

module.exports = authorize;
