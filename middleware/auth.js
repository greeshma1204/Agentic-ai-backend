const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'mission-critical-secret';

// Simple Auth Middleware
// NOTE: For this implementation, we will simulate user attachment if no token is present 
// to ensure the demo/dev environment continues to function while supporting the new logic.
const auth = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findOne({ userId: decoded.userId });

            if (!user) throw new Error();
            req.user = user;
            req.token = token;
        } else {
            // SIMULATION: Default to the 'default_operator' if no auth header
            // This allows the existing frontend (without login flow) to work.
            const user = await User.findOne({ userId: 'default_operator' });
            if (!user) {
                // Should exist from initial app setup
                return res.status(401).json({ error: 'System Identity Required' });
            }
            req.user = user;
        }
        next();
    } catch (err) {
        res.status(401).json({ error: 'Mission Clearance Denied. Please authenticate.' });
    }
};

module.exports = auth;
