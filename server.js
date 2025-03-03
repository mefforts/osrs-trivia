// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('./server/db/index');
const cors = require('cors');
const morgan = require('morgan');

// Import routes
const apiRoutes = require('./server/routes/api');
const authRoutes = require('./server/routes/auth');
const pageRoutes = require('./server/routes/pages');

// Import middleware
const { globalLimiter } = require('./server/middleware/rate-limit');
const checkDatabase = require('./server/middleware/database');

// Initialize app
const app = express();
const port = process.env.PORT || 3000;

// Connect to database (but don't crash if connection fails)
connectDB().catch(err => {
  console.error('Database connection failed:', err.message);
  console.log('App will continue without database functionality');
});

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev')); // Request logging

// Apply global rate limiter to all requests
app.use(globalLimiter);

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true    // Enable ETag for caching
}));

// Use database connection check middleware
app.use(checkDatabase);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: Math.floor(process.uptime()),
    memoryUsage: process.memoryUsage()
  });
});

// Routes
app.use('/api', apiRoutes);
app.use('/auth', authRoutes);
app.use('/', pageRoutes);

// Default route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  // Log error details (but not in tests)
  if (process.env.NODE_ENV !== 'test') {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
  
  // Send appropriate response based on environment
  res.status(err.status || 500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? null : err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
  });
});

// Only start the server if this file is run directly (not required in tests)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`Server listening at http://localhost:${port}`);
  });
}

// Export for testing
module.exports = app;