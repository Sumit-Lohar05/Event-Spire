const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // Get token from the Authorization header (Expected format: "Bearer <token>")
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token exists
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Add user payload (like { id: user._id }) to the request object
        next(); // Move on to the actual route handler
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
