// server/middleware/validate.js
/**
 * Request validation middleware
 * Validates request data before processing
 */

/**
 * Validate registration request
 */
exports.validateRegistration = (req, res, next) => {
  const { username, email, password } = req.body;
  const errors = [];
  
  // Validate username
  if (!username) {
    errors.push('Username is required');
  } else if (username.length < 3) {
    errors.push('Username must be at least 3 characters');
  } else if (username.length > 20) {
    errors.push('Username cannot exceed 20 characters');
  } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }
  
  // Validate email
  if (!email) {
    errors.push('Email is required');
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('Please provide a valid email address');
  }
  
  // Validate password
  if (!password) {
    errors.push('Password is required');
  } else if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  } else if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else if (!/[a-zA-Z]/.test(password)) {
    errors.push('Password must contain at least one letter');
  }
  
  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

/**
 * Validate login request
 */
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];
  
  // Validate email
  if (!email) {
    errors.push('Email is required');
  }
  
  // Validate password
  if (!password) {
    errors.push('Password is required');
  }
  
  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

/**
 * Validate check-answer request
 */
exports.validateCheckAnswer = (req, res, next) => {
  const { questionId, answer } = req.body;
  const errors = [];
  
  // Validate questionId
  if (!questionId) {
    errors.push('Question ID is required');
  } else if (!/^[0-9a-fA-F]{24}$/.test(questionId) && questionId !== 'local') {
    errors.push('Invalid question ID format');
  }
  
  // Validate answer
  if (answer === undefined || answer === null) {
    errors.push('Answer is required');
  }
  
  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

/**
 * Validate question filters
 */
exports.validateQuestionFilters = (req, res, next) => {
  // Valid difficulty values
  const validDifficulties = ['Beginner', 'Easy', 'Medium', 'Hard', 'Elite', 'Master'];
  
  // Valid category values
  const validCategories = ['Items', 'NPCs', 'Locations', 'Quests', 'Skills', 'Lore'];
  
  // Check difficulty
  if (req.query.difficulty && !validDifficulties.includes(req.query.difficulty)) {
    return res.status(400).json({
      message: 'Invalid difficulty',
      validValues: validDifficulties
    });
  }
  
  // Check category
  if (req.query.category && !validCategories.includes(req.query.category)) {
    return res.status(400).json({
      message: 'Invalid category',
      validValues: validCategories
    });
  }
  
  // Check limit is a number
  if (req.query.limit) {
    const limit = parseInt(req.query.limit);
    if (isNaN(limit) || limit < 1 || limit > 50) {
      return res.status(400).json({
        message: 'Limit must be a number between 1 and 50'
      });
    }
  }
  
  next();
};
