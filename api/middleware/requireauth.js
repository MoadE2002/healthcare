const User = require('../models/User');
const jwt = require('jsonwebtoken');

const requireAuth = async (req, res, next) => {
    // Verify authentication
    const { authorization } = req.headers;

    if (!authorization) {
        return res.status(401).json({ error: 'Authorization token required' });
    }

    const token = authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Invalid authorization format' });
    }

    try {
        const { _id } = jwt.verify(token, process.env.SECRET);

        // Find the user by ID and attach it to the request object
        req.user = await User.findOne({ _id }).select('_id role name email');  // Adjust fields as needed

        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Request is not authorized' });
    }
};

module.exports = requireAuth;
