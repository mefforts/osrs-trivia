// server/middleware/auth.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Auth middleware
module.exports = function(req, res, next) {
  // Check if database is connected
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      message: 'Authentication unavailable',
      error: 'Database is currently disconnected'
    });
  }

  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({
      message: 'No token, authorization denied'
    });
  }
  
  try {
    // Verify token using environment variable instead of hardcoded value
    // This ensures consistency across the application
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user from payload
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({
      message: 'Token is not valid'
    });
  }
};