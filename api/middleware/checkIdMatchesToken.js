const jwt = require('jsonwebtoken');

const checkIdMatchesToken = (req, res, next) => {
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

        if (req.params.id !== _id) {
            return res.status(403).json({ error: 'Forbidden: ID mismatch' });
        }

        next(); 
    } catch (error) {
        console.error(error);
        res.status(401).json({ error: 'Request is not authorized' });
    }
};

module.exports = checkIdMatchesToken;
