// Update to the startGame function in game.js

async function startGame() {
    // Show loading state
    elements.startGameBtn.textContent = 'Loading...';
    elements.startGameBtn.disabled = true;
    
    try {
        // First try to fetch from API
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
            // Use fallback data
            if (window.localQuestionData && window.localQuestionData[gameState.difficulty]) {
                gameState.questions = window.localQuestionData[gameState.difficulty];
                // Filter by category if specified
                if (gameState.category) {
                    gameState.questions = gameState.questions.filter(q => q.category === gameState.category);
                }
                console.log('Using local fallback data');
            } else {
                throw new Error('No fallback data available');
            }
        }
        
        if (gameState.questions.length === 0) {
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
// Update startGame function to better handle offline mode
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
      
      if (gameState.questions.length === 0) {
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
      throw new Error('No offline questions available');
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
  
  // Update submitAnswer function to handle offline mode
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
        const isCorrect = currentQuestion.correctAnswer.toLowerCase() === answer.toLowerCase();
        
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
  
  // Update end of game to handle offline mode
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
  }
  
  // Listen for online/offline events
  window.addEventListener('app-online', function() {
    // Refresh the page if we were previously offline
    if (window.OFFLINE_MODE) {
      const wasInGame = elements.gamePlay.classList.contains('active');
      
      if (!wasInGame) {
        // Only reload if not in the middle of a game
        window.location.reload();
      } else {
        // Show a notification
        const notification = document.createElement('div');
        notification.className = 'online-notification';
        notification.innerHTML = `
          <div class="online-notification-content">
            <p>You're back online! Your progress will be saved.</p>
            <button class="online-close-btn">✕</button>
          </div>
        `;
        
        document.body.appendChild(notification);
        
        // Add close button handler
        notification.querySelector('.online-close-btn').addEventListener('click', function() {
          notification.remove();
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
          if (document.body.contains(notification)) {
            notification.remove();
          }
        }, 5000);
      }
    }
  });
  
  window.addEventListener('app-offline', function() {
    // Show notification if we just went offline
    if (!window.OFFLINE_MODE) {
      const notification = document.createElement('div');
      notification.className = 'offline-notification';
      notification.innerHTML = `
        <div class="offline-notification-content">
          <p>You're offline! You can continue playing, but progress will be saved locally until you reconnect.</p>
          <button class="offline-close-btn">✕</button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Add close button handler
      notification.querySelector('.offline-close-btn').addEventListener('click', function() {
        notification.remove();
      });
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (document.body.contains(notification)) {
          notification.remove();
        }
      }, 5000);
    }
  });
  