// public/js/game.js

// DOM elements
const elements = {
  // Game setup
  gameSetup: document.getElementById('game-setup'),
  difficultyOptions: document.querySelectorAll('input[name="difficulty"]'),
  categorySelect: document.getElementById('category-select'),
  questionCount: document.getElementById('question-count'),
  startGameBtn: document.getElementById('start-game'),
  loginPrompt: document.getElementById('login-prompt'),
  
  // Game play
  gamePlay: document.getElementById('game-play'),
  questionCounter: document.getElementById('question-counter'),
  progressBar: document.querySelector('.progress-bar'),
  currentDifficulty: document.getElementById('current-difficulty'),
  questionImage: document.getElementById('question-image'),
  questionText: document.getElementById('question-text'),
  answersContainer: document.getElementById('answers-container'),
  currentScore: document.getElementById('current-score'),
  currentStreak: document.getElementById('current-streak'),
  
  // Game results
  gameResults: document.getElementById('game-results'),
  finalScore: document.getElementById('final-score'),
  xpGained: document.getElementById('xp-gained'),
  levelProgress: document.getElementById('level-progress'),
  playAgainBtn: document.getElementById('play-again'),
  viewLeaderboardBtn: document.getElementById('view-leaderboard'),
  
  // Feedback modal
  feedbackModal: document.getElementById('feedback-modal'),
  feedbackCorrect: document.getElementById('feedback-correct'),
  feedbackIncorrect: document.getElementById('feedback-incorrect'),
  correctAnswerText: document.getElementById('correct-answer-text'),
  correctAnswer: document.getElementById('correct-answer'),
  explanationText: document.getElementById('explanation-text'),
  xpAmount: document.getElementById('xp-amount'),
  nextQuestionBtn: document.getElementById('next-question')
};

// Game state
const gameState = {
  difficulty: 'Beginner',
  category: '',
  totalQuestions: 10,
  questions: [],
  currentQuestion: 0,
  score: 0,
  streak: 0,
  xpGained: 0,
  quizStartTime: 0
};

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
  // Add event listeners
  elements.startGameBtn.addEventListener('click', startGame);
  elements.nextQuestionBtn.addEventListener('click', nextQuestion);
  elements.playAgainBtn.addEventListener('click', resetGame);
  elements.viewLeaderboardBtn.addEventListener('click', function() {
      window.location.href = '/leaderboard';
  });
  
  // Initialize difficulty from radio buttons
  elements.difficultyOptions.forEach(option => {
      option.addEventListener('change', function() {
          gameState.difficulty = this.value;
      });
  });
  
  // Initialize category from select
  elements.categorySelect.addEventListener('change', function() {
      gameState.category = this.value;
  });
  
  // Initialize question count from select
  elements.questionCount.addEventListener('change', function() {
      gameState.totalQuestions = parseInt(this.value);
  });
  
  // Check if user is logged in
  if (localStorage.getItem('token')) {
      elements.loginPrompt.style.display = 'none';
  }
  
  // Listen for offline/online events
  window.addEventListener('app-online', handleOnlineStatus);
  window.addEventListener('app-offline', handleOfflineStatus);
});

// Handle online status change
function handleOnlineStatus() {
  if (elements.gamePlay.classList.contains('active')) {
      const notification = document.createElement('div');
      notification.className = 'online-notification';
      notification.textContent = 'You are back online! Your progress will be synced when the quiz is complete.';
      
      // Add to game container
      document.querySelector('.game-container').appendChild(notification);
      
      // Remove after 5 seconds
      setTimeout(() => {
          if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
          }
      }, 5000);
  }
}

// Handle offline status change
function handleOfflineStatus() {
  if (elements.gamePlay.classList.contains('active')) {
      const notification = document.createElement('div');
      notification.className = 'offline-notification';
      notification.textContent = 'You are now offline. You can continue playing, but progress will be saved locally until you reconnect.';
      
      // Add to game container
      document.querySelector('.game-container').appendChild(notification);
      
      // Remove after 5 seconds
      setTimeout(() => {
          if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
          }
      }, 5000);
  }
}

// Start the game
async function startGame() {
  // Show loading state
  elements.startGameBtn.textContent = 'Loading...';
  elements.startGameBtn.disabled = true;
  
  try {
      // Check if we're in offline mode
      const isOffline = window.OFFLINE_MODE || !navigator.onLine;
      
      if (!isOffline) {
          // Try to fetch from API when online
          try {
              const response = await fetch(`/api/questions?difficulty=${gameState.difficulty}&category=${gameState.category}&limit=${gameState.totalQuestions}`);
              
              if (response.ok) {
                  gameState.questions = await response.json();
                  console.log('Using server data');
              } else {
                  // If API fails, throw error to trigger fallback
                  throw new Error('API unavailable');
              }
          } catch (apiError) {
              console.log('API error, using fallback data:', apiError);
              useOfflineQuestions();
          }
      } else {
          // Use offline questions immediately if we're offline
          useOfflineQuestions();
      }
      
      if (!gameState.questions || gameState.questions.length === 0) {
          alert('No questions available for the selected criteria. Try a different difficulty or category.');
          elements.startGameBtn.textContent = 'Start Game';
          elements.startGameBtn.disabled = false;
          return;
      }
      
      // Reset game state
      gameState.currentQuestion = 0;
      gameState.score = 0;
      gameState.streak = 0;
      gameState.xpGained = 0;
      gameState.quizStartTime = Date.now();
      
      // Switch to game play view
      switchSection(elements.gameSetup, elements.gamePlay);
      
      // Load the first question
      loadQuestion();
  } catch (error) {
      console.error('Error starting game:', error);
      alert(error.message || 'Failed to start the game. Please try again.');
      elements.startGameBtn.textContent = 'Start Game';
      elements.startGameBtn.disabled = false;
  }
}

// Helper function to use offline questions
function useOfflineQuestions() {
  if (!window.localQuestionData || !window.localQuestionData[gameState.difficulty]) {
      throw new Error('No offline questions available for this difficulty');
  }
  
  gameState.questions = window.localQuestionData[gameState.difficulty];
  
  // Filter by category if specified
  if (gameState.category && gameState.category !== '') {
      gameState.questions = gameState.questions.filter(q => q.category === gameState.category);
  }
  
  // Shuffle questions
  gameState.questions = shuffleArray(gameState.questions);
  
  // Limit to requested number
  if (gameState.questions.length > gameState.totalQuestions) {
      gameState.questions = gameState.questions.slice(0, gameState.totalQuestions);
  }
  
  console.log('Using offline questions');
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Load question
function loadQuestion() {
  // Check if we've reached the end of questions
  if (gameState.currentQuestion >= gameState.questions.length) {
      showResults();
      return;
  }
  
  // Check if questions array is valid
  if (!gameState.questions || !gameState.questions.length) {
      console.error('No questions available');
      
      // Show error message
      elements.questionText.textContent = 'No questions available for this selection.';
      elements.answersContainer.innerHTML = '';
      elements.questionImage.innerHTML = '';
      
      // Add button to go back to setup
      const setupButton = document.createElement('button');
      setupButton.className = 'btn primary-btn';
      setupButton.textContent = 'Back to Setup';
      setupButton.addEventListener('click', () => {
          switchSection(elements.gamePlay, elements.gameSetup);
      });
      
      elements.answersContainer.appendChild(setupButton);
      return;
  }
  
  // Get current question
  const question = gameState.questions[gameState.currentQuestion];
  
  // Update question counter
  elements.questionCounter.textContent = `Question ${gameState.currentQuestion + 1} of ${gameState.totalQuestions}`;
  
  // Update progress bar
  const progressPercent = ((gameState.currentQuestion + 1) / gameState.totalQuestions) * 100;
  elements.progressBar.querySelector('.progress').style.width = `${progressPercent}%`;
  
  // Update difficulty badge
  elements.currentDifficulty.textContent = question.difficulty;
  elements.currentDifficulty.className = `difficulty-badge ${question.difficulty.toLowerCase()}`;
  
  // Set question text
  elements.questionText.textContent = question.text;
  
  // Set question image
  if (question.imageUrl) {
      elements.questionImage.innerHTML = `<img src="${question.imageUrl}" alt="Question Image" onerror="this.src='/images/ui/placeholder.png'">`;
  } else {
      elements.questionImage.innerHTML = ''; // No image
  }
  
  // Generate answer buttons
  generateAnswerButtons(question);
}

// Generate answer buttons
function generateAnswerButtons(question) {
  // Clear previous answers
  elements.answersContainer.innerHTML = '';
  
  // Shuffle answers for randomization
  const shuffledAnswers = shuffleArray(question.answers);
  
  // Create buttons
  shuffledAnswers.forEach(answer => {
      const button = document.createElement('button');
      button.className = 'answer-btn';
      button.textContent = answer;
      button.addEventListener('click', function() {
          submitAnswer(answer);
      });
      
      elements.answersContainer.appendChild(button);
  });
}

// Submit answer
async function submitAnswer(answer) {
  // Disable all answer buttons
  const answerButtons = elements.answersContainer.querySelectorAll('.answer-btn');
  answerButtons.forEach(btn => {
      btn.disabled = true;
  });
  
  try {
      const currentQuestion = gameState.questions[gameState.currentQuestion];
      
      // Check if we're offline
      const isOffline = window.OFFLINE_MODE || !navigator.onLine;
      
      let result;
      
      if (isOffline) {
          // Handle answer checking locally in offline mode
          const isCorrect = currentQuestion.correctAnswer && 
              currentQuestion.correctAnswer.toLowerCase() === answer.toLowerCase();
          
          // Calculate XP reward based on difficulty
          const xpRewards = {
              'Beginner': 10,
              'Easy': 25,
              'Medium': 50,
              'Hard': 100,
              'Elite': 200,
              'Master': 500
          };
          
          const xpGained = isCorrect ? (xpRewards[currentQuestion.difficulty] || 50) : 0;
          
          // Record progress for sync later
          if (window.recordOfflineProgress) {
              window.recordOfflineProgress(isCorrect, xpGained);
          }
          
          result = {
              isCorrect,
              correctAnswer: isCorrect ? null : currentQuestion.correctAnswer,
              explanation: currentQuestion.explanation || 'No explanation available in offline mode',
              xpGained: xpGained
          };
      } else {
          // Online mode - check answer with server
          try {
              const response = await fetch('/api/check-answer', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'x-auth-token': localStorage.getItem('token') || ''
                  },
                  body: JSON.stringify({
                      questionId: currentQuestion._id,
                      answer: answer
                  })
              });
              
              if (!response.ok) {
                  throw new Error('Failed to check answer');
              }
              
              result = await response.json();
          } catch (error) {
              console.error('Error checking answer with server:', error);
              
              // Fallback to offline checking if server request fails
              const isCorrect = currentQuestion.correctAnswer && 
                  currentQuestion.correctAnswer.toLowerCase() === answer.toLowerCase();
              
              // Use default XP values
              const xpRewards = {
                  'Beginner': 10,
                  'Easy': 25,
                  'Medium': 50,
                  'Hard': 100,
                  'Elite': 200,
                  'Master': 500
              };
              
              const xpGained = isCorrect ? (xpRewards[currentQuestion.difficulty] || 50) : 0;
              
              result = {
                  isCorrect,
                  correctAnswer: isCorrect ? null : currentQuestion.correctAnswer,
                  explanation: currentQuestion.explanation || 'No explanation available',
                  xpGained: xpGained
              };
              
              // Record as offline progress
              if (window.recordOfflineProgress) {
                  window.recordOfflineProgress(isCorrect, xpGained);
              }
          }
      }
      
      // Update game state
      if (result.isCorrect) {
          gameState.score += 1;
          gameState.streak += 1;
          gameState.xpGained += result.xpGained;
      } else {
          gameState.streak = 0;
      }
      
      // Show feedback modal
      showFeedback(result);
      
      // Update UI
      elements.currentScore.textContent = gameState.score;
      elements.currentStreak.textContent = gameState.streak;
      
  } catch (error) {
      console.error('Error submitting answer:', error);
      alert('Failed to submit answer. Please try again.');
      
      // Re-enable answer buttons
      answerButtons.forEach(btn => {
          btn.disabled = false;
      });
  }
}

// Show feedback modal
function showFeedback(result) {
  // Hide both feedback types first
  elements.feedbackCorrect.style.display = 'none';
  elements.feedbackIncorrect.style.display = 'none';
  
  if (result.isCorrect) {
      // Show correct feedback
      elements.feedbackCorrect.style.display = 'block';
      elements.correctAnswerText.textContent = result.explanation || 'Good job!';
      elements.xpAmount.textContent = result.xpGained;
  } else {
      // Show incorrect feedback
      elements.feedbackIncorrect.style.display = 'block';
      elements.correctAnswer.textContent = result.correctAnswer;
      elements.explanationText.textContent = result.explanation || 'Better luck next time!';
  }
  
  // Show modal
  elements.feedbackModal.style.display = 'block';
}

// Next question
function nextQuestion() {
  // Hide feedback modal
  elements.feedbackModal.style.display = 'none';
  
  // Move to next question
  gameState.currentQuestion++;
  
  // Load next question
  loadQuestion();
}

// Show results
function showResults() {
  // Switch to results section
  switchSection(elements.gamePlay, elements.gameResults);
  
  // Update results summary
  elements.finalScore.textContent = `${gameState.score}/${gameState.totalQuestions}`;
  elements.xpGained.textContent = `+${gameState.xpGained} XP`;
  
  // Check if user is logged in
  const userData = localStorage.getItem('userData') ? 
      JSON.parse(localStorage.getItem('userData')) : null;
  
  if (userData) {
      // If we're offline, use cached user data + offline progress
      if (window.OFFLINE_MODE || !navigator.onLine) {
          const offlineProgress = window.getOfflineProgress ? 
              window.getOfflineProgress() : null;
          
          if (offlineProgress) {
              // Add current game's progress to total
              userData.xp += gameState.xpGained;
              
              // Update level progress display with offline data
              updateLevelProgress(userData);
              
              // Add notice about offline mode
              const levelProgressElem = document.getElementById('level-progress');
              if (levelProgressElem) {
                  const offlineNotice = document.createElement('div');
                  offlineNotice.className = 'offline-notice';
                  offlineNotice.textContent = 'Playing in offline mode. Progress will be synced when you reconnect.';
                  levelProgressElem.appendChild(offlineNotice);
              }
          } else {
              updateLevelProgress(userData);
          }
      } else {
          // Online mode - update with fresh user data
          userData.xp += gameState.xpGained;
          updateLevelProgress(userData);
      }
  } else {
      // Not logged in
      elements.levelProgress.innerHTML = `
          <div class="level-info not-logged-in">
              <p>Log in to track your progress and compete on the leaderboard!</p>
              <button id="results-login-btn" class="btn secondary-btn">Login / Register</button>
          </div>
      `;
      
      // Add event listener to login button
      document.getElementById('results-login-btn').addEventListener('click', () => {
          document.getElementById('auth-modal').style.display = 'block';
      });
  }
  
  // Save game completion to recent activity
  saveGameCompletion();
}

// Save game completion to recent activity
function saveGameCompletion() {
  if (!navigator.onLine || !localStorage.getItem('token')) {
      return; // Skip if offline or not logged in
  }
  
  try {
      fetch('/api/save-activity', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'x-auth-token': localStorage.getItem('token')
          },
          body: JSON.stringify({
              type: 'quiz',
              difficulty: gameState.difficulty,
              score: gameState.score,
              total: gameState.totalQuestions,
              xp: gameState.xpGained,
              duration: Math.floor((Date.now() - gameState.quizStartTime) / 1000)
          })
      }).catch(error => {
          console.error('Error saving activity:', error);
          // Non-critical, so just log the error
      });
  } catch (error) {
      console.error('Error in saveGameCompletion:', error);
  }
}

// Update level progress bar
function updateLevelProgress(userData) {
  // Calculate XP for current and next level
  const currentLevelXp = calculateLevelXp(userData.level);
  const nextLevelXp = calculateLevelXp(userData.level + 1);
  const xpForNextLevel = nextLevelXp - currentLevelXp;
  const userXpInLevel = userData.xp - currentLevelXp;
  const progressPercent = Math.min(100, (userXpInLevel / xpForNextLevel) * 100);
  
  // Update level progress display
  elements.levelProgress.innerHTML = `
      <div class="level-info">
          <span class="level-number">Level ${userData.level}</span>
          <div class="level-bar">
              <div class="level-fill" style="width: ${progressPercent}%"></div>
          </div>
          <span class="xp-info">${userXpInLevel.toLocaleString()} / ${xpForNextLevel.toLocaleString()} XP to level ${userData.level + 1}</span>
      </div>
  `;
}

// Calculate XP required for a specific level (OSRS formula)
function calculateLevelXp(level) {
  let points = 0;
  
  for (let i = 1; i < level; i++) {
      points += Math.floor(i + 300 * Math.pow(2, i / 7));
  }
  
  return Math.floor(points / 4);
}

// Reset game
function resetGame() {
  // Reset game state
  gameState.currentQuestion = 0;
  gameState.score = 0;
  gameState.streak = 0;
  gameState.xpGained = 0;
  
  // Switch back to setup section
  switchSection(elements.gameResults, elements.gameSetup);
  
  // Reset UI elements
  elements.progressBar.querySelector('.progress').style.width = '0%';
  elements.currentScore.textContent = '0';
  elements.currentStreak.textContent = '0';
  elements.startGameBtn.textContent = 'Start Game';
  elements.startGameBtn.disabled = false;
}

// Switch between sections
function switchSection(fromSection, toSection) {
  fromSection.classList.remove('active');
  toSection.classList.add('active');
}