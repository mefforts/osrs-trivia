// server/db/index.js
const mongoose = require('mongoose');
require('dotenv').config();

// Create a more resilient MongoDB connection
const connectDB = async () => {
  try {
    // If no MongoDB URI is provided, don't attempt to connect
    if (!process.env.MONGODB_URI) {
      console.log('No MongoDB URI provided. Skipping database connection.');
      return null;
    };

    // Log connection attempt (hide password in logs)
    const connectionString = process.env.MONGODB_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`Connecting to MongoDB: ${connectionString}`);

    // Use MongoDB connection options for better reliability
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      connectTimeoutMS: 10000, // Connection timeout
      retryWrites: true, // Automatic retry for write operations
      w: 'majority', // Write concern
      maxPoolSize: 10, // Connection pool size limit
      minPoolSize: 1, // Minimum connections maintained
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add connection event listeners for better monitoring
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination');
      process.exit(0);
    });

    return conn;
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    
    // Provide specific error messages for common connection issues
    if (error.message.includes('ENOTFOUND')) {
      console.log('Error: Database host not found - check your connection string');
    } else if (error.message.includes('Authentication failed')) {
      console.log('Error: Authentication failed - check your username and password');
    } else if (error.message.includes('not authorized')) {
      console.log('Error: Not authorized - check user permissions for this database');
    } else if (error.message.includes('bad auth')) {
      console.log('Error: Bad auth authentication - check if the authentication database is correctly specified');
    } else if (error.message.includes('timed out')) {
      console.log('Error: Connection timed out - check network connectivity and firewall settings');
    } else if (error.message.includes('EPIPE') || error.message.includes('ECONNRESET')) {
      console.log('Error: Connection reset - network issues or MongoDB server restarted');
    } else if (error.message.includes('whitelist')) {
      console.log('Error: IP not whitelisted - add your current IP to MongoDB Atlas whitelist');
      console.log('When deploying to Heroku, you need to whitelist all IPs (0.0.0.0/0)');
    }

    // For Heroku - don't crash the server if database is unavailable
    if (process.env.NODE_ENV === 'production') {
      console.log('Running in production mode - continuing without database');
      return null;
    }
    
    // Only exit the process in development to make debugging easier
    if (process.env.NODE_ENV === 'development') {
      console.log('Running in development mode - exiting process');
      process.exit(1);
    }
    
    return null;
  }
};
module.exports = connectDB;