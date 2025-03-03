// server/routes/api.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Question = require('../db/models/Question');
const User = require('../db/models/User');
const auth = require('../middleware/auth');
const { validateCheckAnswer, validateQuestionFilters } = require('../middleware/validate');

// Health check endpoint
router.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Get questions based on difficulty and category
router.get('/questions', validateQuestionFilters, async (req, res) => {
  try {
    const { difficulty, category, limit = 10 } = req.query;
    
    // Build query based on provided parameters
    const query = {};
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    
    // Get random questions matching the query
    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: parseInt(limit) } },
      { $project: { correctAnswer: 0 } } // Don't send correct answer to client
    ]);
    
    res.json(questions);
  } catch (err) {
    console.error('Error fetching questions:', err.message);
    res.status(500).json({ message: 'Error fetching questions' });
  }
});

// Check answer
router.post('/check-answer', auth, validateCheckAnswer, async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    
    // Special case for local questions during offline mode
    if (questionId === 'local') {
      return res.json({
        isCorrect: true, // Always treat as correct in offline mode
        explanation: 'Answer processed in offline mode',
        xpGained: 25, // Default XP reward in offline mode
        userLevel: 1,
        userXp: 0
      });
    }
    
    const question = await Question.findById(questionId);
    
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    const isCorrect = question.correctAnswer.toLowerCase() === answer.toLowerCase();
    
    // Update user stats
    const user = await User.findById(req.user.id);
    
    if (user) {
      user.questionsAnswered += 1;
      
      if (isCorrect) {
        user.correctAnswers += 1;
        user.streak += 1;
        user.xp += question.xpReward;
        
        // Check if user leveled up
        const newLevel = user.calculateLevel();
        const didLevelUp = newLevel > user.level;
        user.level = newLevel;
        
        // Add to completed questions
        if (!user.completedQuestions.includes(questionId)) {
          user.completedQuestions.push(questionId);
        }
      } else {
        user.streak = 0;
      }
      
      user.lastActive = Date.now();
      await user.save();
      
      return res.json({
        isCorrect,
        correctAnswer: isCorrect ? null : question.correctAnswer,
        explanation: question.explanation,
        xpGained: isCorrect ? question.xpReward : 0,
        userLevel: user.level,
        userXp: user.xp,
        didLevelUp: didLevelUp || false
      });
    }
    
    // Return response without user data if not logged in
    res.json({
      isCorrect,
      correctAnswer: isCorrect ? null : question.correctAnswer,
      explanation: question.explanation,
      xpGained: isCorrect ? question.xpReward : 0
    });
  } catch (err) {
    console.error('Error checking answer:', err.message);
    res.status(500).json({ message: 'Error checking answer' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { timeframe = 'all-time', sortBy = 'xp' } = req.query;
    
    // Create date filter based on timeframe
    const dateFilter = {};
    if (timeframe === 'this-week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter.lastActive = { $gte: oneWeekAgo };
    } else if (timeframe === 'this-month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      dateFilter.lastActive = { $gte: oneMonthAgo };
    }
    
    // Determine sort field
    let sortField = { xp: -1 };
    if (sortBy === 'level') {
      sortField = { level: -1, xp: -1 };
    } else if (sortBy === 'correct') {
      sortField = { correctAnswers: -1 };
    } else if (sortBy === 'questions') {
      sortField = { questionsAnswered: -1 };
    }
    
    const leaderboard = await User.find(dateFilter)
      .sort(sortField)
      .limit(100)
      .select('username level xp questionsAnswered correctAnswers -_id');
    
    res.json(leaderboard);
  } catch (err) {
    console.error('Error fetching leaderboard:', err.message);
    res.status(500).json({ message: 'Error fetching leaderboard' });
  }
});

// Get user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error('Error fetching profile:', err.message);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// Get difficulty stats for user
router.get('/profile/difficulty-stats', auth, async (req, res) => {
  try {
    // Mock data for now - in a production app, this would query a UserStats collection
    const difficultyStats = [
      { difficulty: 'Beginner', totalQuestions: 20, correctAnswers: 18, accuracy: 90 },
      { difficulty: 'Easy', totalQuestions: 15, correctAnswers: 12, accuracy: 80 },
      { difficulty: 'Medium', totalQuestions: 10, correctAnswers: 7, accuracy: 70 },
      { difficulty: 'Hard', totalQuestions: 5, correctAnswers: 3, accuracy: 60 },
      { difficulty: 'Elite', totalQuestions: 3, correctAnswers: 1, accuracy: 33 },
      { difficulty: 'Master', totalQuestions: 1, correctAnswers: 0, accuracy: 0 }
    ];
    
    res.json(difficultyStats);
  } catch (err) {
    console.error('Error fetching difficulty stats:', err.message);
    res.status(500).json({ message: 'Error fetching difficulty stats' });
  }
});

// Get category stats for user
router.get('/profile/category-stats', auth, async (req, res) => {
  try {
    // Mock data for now - in a production app, this would query a UserStats collection
    const categoryStats = [
      { category: 'Items', progress: 75 },
      { category: 'NPCs', progress: 60 },
      { category: 'Locations', progress: 45 },
      { category: 'Quests', progress: 30 },
      { category: 'Skills', progress: 80 },
      { category: 'Lore', progress: 25 }
    ];
    
    res.json(categoryStats);
  } catch (err) {
    console.error('Error fetching category stats:', err.message);
    res.status(500).json({ message: 'Error fetching category stats' });
  }
});

// Get recent activity for user
router.get('/profile/recent-activity', auth, async (req, res) => {
  try {
    // Mock data for now - in a production app, this would query a UserActivity collection
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    
    const recentActivity = [
      {
        type: 'quiz',
        difficulty: 'Medium',
        score: 8,
        total: 10,
        xp: 400,
        date: new Date(now - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        type: 'level-up',
        level: 5,
        date: new Date(now - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        type: 'quiz',
        difficulty: 'Hard',
        score: 5,
        total: 10,
        xp: 500,
        date: new Date(now - 1 * day) // 1 day ago
      },
      {
        type: 'quiz',
        difficulty: 'Easy',
        score: 9,
        total: 10,
        xp: 225,
        date: new Date(now - 3 * day) // 3 days ago
      },
      {
        type: 'level-up',
        level: 4,
        date: new Date(now - 3 * day) // 3 days ago
      }
    ];
    
    res.json(recentActivity);
  } catch (err) {
    console.error('Error fetching recent activity:', err.message);
    res.status(500).json({ message: 'Error fetching recent activity' });
  }
});

// Update user profile
router.put('/profile/update', auth, async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    
    // Get user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update email if provided
    if (email && email !== user.email) {
      // Check if email is already in use
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      user.email = email;
    }
    
    // Update password if provided
    if (currentPassword && newPassword) {
      // Check current password
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      // Validate new password
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters' });
      }
      
      user.password = newPassword;
    }
    
    await user.save();
    
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err.message);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get user rank in leaderboard
router.get('/leaderboard/rank', auth, async (req, res) => {
  try {
    const { timeframe = 'all-time', sortBy = 'xp' } = req.query;
    
    // Create date filter based on timeframe
    const dateFilter = {};
    if (timeframe === 'this-week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      dateFilter.lastActive = { $gte: oneWeekAgo };
    } else if (timeframe === 'this-month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      dateFilter.lastActive = { $gte: oneMonthAgo };
    }
    
    // Determine sort field
    let sortField = {};
    if (sortBy === 'xp') {
      sortField.xp = -1;
    } else if (sortBy === 'level') {
      sortField.level = -1;
      sortField.xp = -1;
    } else if (sortBy === 'correct') {
      sortField.correctAnswers = -1;
    } else if (sortBy === 'questions') {
      sortField.questionsAnswered = -1;
    }
    
    // Get current user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Count users with better stats
    let rank;
    
    if (sortBy === 'xp') {
      rank = await User.countDocuments({
        ...dateFilter,
        xp: { $gt: user.xp }
      });
    } else if (sortBy === 'level') {
      rank = await User.countDocuments({
        ...dateFilter,
        $or: [
          { level: { $gt: user.level } },
          { level: user.level, xp: { $gt: user.xp } }
        ]
      });
    } else if (sortBy === 'correct') {
      rank = await User.countDocuments({
        ...dateFilter,
        correctAnswers: { $gt: user.correctAnswers }
      });
    } else if (sortBy === 'questions') {
      rank = await User.countDocuments({
        ...dateFilter,
        questionsAnswered: { $gt: user.questionsAnswered }
      });
    }
    
    // Rank is count + 1 (1-indexed)
    res.json({ rank: rank + 1 });
  } catch (err) {
    console.error('Error fetching user rank:', err.message);
    res.status(500).json({ message: 'Error fetching user rank' });
  }
});

// Sync offline progress
router.post('/sync-offline-progress', auth, async (req, res) => {
  try {
    const { questionsAnswered, correctAnswers, xp } = req.body;
    
    // Validate input
    if (questionsAnswered === undefined || correctAnswers === undefined || xp === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Validate numbers
    if (isNaN(questionsAnswered) || isNaN(correctAnswers) || isNaN(xp)) {
      return res.status(400).json({ message: 'Invalid data format' });
    }
    
    // Get user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Apply offline progress
    user.questionsAnswered += parseInt(questionsAnswered);
    user.correctAnswers += parseInt(correctAnswers);
    user.xp += parseInt(xp);
    
    // Recalculate level
    const newLevel = user.calculateLevel();
    const didLevelUp = newLevel > user.level;
    user.level = newLevel;
    
    user.lastActive = Date.now();
    await user.save();
    
    res.json({
      message: 'Offline progress synced successfully',
      questionsAnswered: user.questionsAnswered,
      correctAnswers: user.correctAnswers,
      xp: user.xp,
      level: user.level,
      didLevelUp
    });
  } catch (err) {
    console.error('Error syncing offline progress:', err.message);
    res.status(500).json({ message: 'Error syncing offline progress' });
  }
});

module.exports = router;