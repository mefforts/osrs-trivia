// server/middleware/rate-limit.js
/**
 * Rate limiting middleware to protect against brute force attacks
 * Uses in-memory storage for simplicity, consider using Redis for production
 */

// Simple in-memory store for rate limiting
const ipRequestCounts = new Map();
const authFailCounts = new Map();

// Clear counters periodically to prevent memory leaks
setInterval(() => {
  ipRequestCounts.clear();
  authFailCounts.clear();
}, 60 * 60 * 1000); // Clear every hour

/**
 * Global rate limiter for all routes
 * Limits requests based on IP address
 */
exports.globalLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const maxRequests = process.env.RATE_LIMIT_MAX || 100;
  const window = process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000; // 15 minutes
  
  // Get current count for this IP
  const currentTime = Date.now();
  const ipData = ipRequestCounts.get(ip) || { count: 0, resetTime: currentTime + window };
  
  // Check if window has passed and reset if needed
  if (currentTime > ipData.resetTime) {
    ipData.count = 0;
    ipData.resetTime = currentTime + window;
  }
  
  // Increment count
  ipData.count += 1;
  ipRequestCounts.set(ip, ipData);
  
  // Add headers about rate limit status
  res.setHeader('X-RateLimit-Limit', maxRequests);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - ipData.count));
  res.setHeader('X-RateLimit-Reset', ipData.resetTime);
  
  // Check if rate limit exceeded
  if (ipData.count > maxRequests) {
    return res.status(429).json({
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil((ipData.resetTime - currentTime) / 1000)
    });
  }
  
  next();
};

/**
 * Stricter rate limiter for authentication routes
 * Implements increasing delays for failed attempts
 */
exports.authLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const maxAttempts = 5;
  const authData = authFailCounts.get(ip) || { count: 0, lastAttempt: 0 };
  const currentTime = Date.now();
  
  // Only apply to POST requests (login/register)
  if (req.method === 'POST') {
    // Check if we need to enforce a delay
    if (authData.count >= maxAttempts) {
      // Calculate delay based on number of failures (exponential backoff)
      // Minimum 1 second, increasing with each failure
      const requiredDelay = Math.min(30000, Math.pow(2, authData.count - maxAttempts) * 1000);
      const timeElapsed = currentTime - authData.lastAttempt;
      
      if (timeElapsed < requiredDelay) {
        return res.status(429).json({
          message: 'Too many failed attempts, please try again later',
          retryAfter: Math.ceil((requiredDelay - timeElapsed) / 1000)
        });
      }
    }
    
    // Track this attempt time
    authData.lastAttempt = currentTime;
    authFailCounts.set(ip, authData);
    
    // Store the original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override send
    res.send = function(body) {
      // Successful auth resets counter
      if (res.statusCode < 400) {
        authFailCounts.delete(ip);
      } else {
        // Failed auth increments counter
        authData.count += 1;
        authFailCounts.set(ip, authData);
      }
      return originalSend.call(this, body);
    };
    
    // Override json
    res.json = function(body) {
      // Successful auth resets counter
      if (res.statusCode < 400) {
        authFailCounts.delete(ip);
      } else {
        // Failed auth increments counter
        authData.count += 1;
        authFailCounts.set(ip, authData);
      }
      return originalJson.call(this, body);
    };
  }
  
  next();
};
