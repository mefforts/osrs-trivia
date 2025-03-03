// public/js/offline-mode.js (enhanced version)
/**
 * Enhanced Offline Mode Handler
 * Provides seamless offline experience with local storage backup
 */

(function() {
    // State variables
    let isOffline = false;
    let offlineAlert = null;
    let offlineStorageAvailable = typeof localStorage !== 'undefined';
    
    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      initOfflineMode();
      checkServerStatus();
      
      // Listen for online/offline events from service worker
      window.addEventListener('app-online', handleOnline);
      window.addEventListener('app-offline', handleOffline);
      
      // Also listen for browser online/offline events
      window.addEventListener('online', checkServerStatus);
      window.addEventListener('offline', function() {
        handleOffline();
      });
    });
    
    // Initialize offline mode UI elements
    function initOfflineMode() {
      // Create offline alert if it doesn't exist
      if (!document.querySelector('.offline-alert')) {
        offlineAlert = document.createElement('div');
        offlineAlert.className = 'offline-alert';
        offlineAlert.style.display = 'none';
        offlineAlert.innerHTML = `
          <div class="offline-alert-content">
            <strong>📡 Offline Mode:</strong> You're currently offline. You can still play the game,
            but progress won't be saved to your account until connection is restored.
            <button class="offline-close-btn">✕</button>
          </div>
        `;
        
        // Insert after header
        const header = document.querySelector('header');
        if (header && header.nextSibling) {
          header.parentNode.insertBefore(offlineAlert, header.nextSibling);
        } else {
          document.body.insertBefore(offlineAlert, document.body.firstChild);
        }
        
        // Add close button handler
        const closeBtn = offlineAlert.querySelector('.offline-close-btn');
        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            offlineAlert.style.display = 'none';
          });
        }
      } else {
        offlineAlert = document.querySelector('.offline-alert');
      }
      
      // Initialize offline question data if not already done
      if (!window.localQuestionData) {
        // Check if we have cached questions in localStorage
        if (offlineStorageAvailable && localStorage.getItem('osrs-trivia-questions')) {
          try {
            window.localQuestionData = JSON.parse(localStorage.getItem('osrs-trivia-questions'));
            console.log('Loaded questions from localStorage');
          } catch (e) {
            console.error('Error parsing localStorage questions:', e);
            initializeDefaultQuestions();
          }
        } else {
          initializeDefaultQuestions();
        }
      }
    }
    
    // Initialize default offline questions
    function initializeDefaultQuestions() {
      // Basic set of questions for offline mode
      window.localQuestionData = {
        'Beginner': [
          {
            _id: 'local1',
            text: "What Attack level is required to wear Adamant Weaponry?",
            answers: ["30", "25", "40", "35"],
            correctAnswer: "30",
            difficulty: "Beginner",
            category: "Items",
            area: "Combat",
            imageUrl: "/images/items/adamant_scimitar.png",
            explanation: "Adamant weaponry requires 30 Attack to wield."
          },
          {
            _id: 'local2',
            text: "What skill allows you to craft runes?",
            answers: ["Runecraft", "Magic", "Crafting", "Mining"],
            correctAnswer: "Runecraft",
            difficulty: "Beginner",
            category: "Skills",
            area: "Runecraft",
            imageUrl: "/images/skills/runecraft.png",
            explanation: "Runecraft is the skill used to create runes for spellcasting."
          }
        ],
        'Easy': [
          {
            _id: 'local3',
            text: "What is the name of the quest that awards the Ghostspeak Amulet?",
            answers: ["The Restless Ghost", "Ghosts Ahoy", "Creature of Fenkenstrain", "Spirit of the Elid"],
            correctAnswer: "The Restless Ghost",
            difficulty: "Easy",
            category: "Quests",
            area: "Lumbridge",
            imageUrl: "/images/items/ghostspeak_amulet.png",
            explanation: "The Restless Ghost is a novice quest that awards the Ghostspeak Amulet."
          }
        ],
        'Medium': [
          {
            _id: 'local4',
            text: "What is the name of the Magic and Academia zone of Zeah?",
            answers: ["Arceuus", "Lovakengj", "Hosidius", "Piscarilius"],
            correctAnswer: "Arceuus",
            difficulty: "Medium",
            category: "Locations",
            area: "Great Kourend",
            imageUrl: "/images/locations/arceuus.png",
            explanation: "Arceuus is the house in Great Kourend that specializes in magic and academia."
          }
        ],
        'Hard': [
          {
            _id: 'local5',
            text: "What weapon is needed to kill Vampyres?",
            answers: ["Blisterwood weapons", "Silver weapons", "Wolfbane dagger", "Ivandis flail"],
            correctAnswer: "Blisterwood weapons",
            difficulty: "Hard",
            category: "Items",
            area: "Combat",
            imageUrl: "/images/items/blisterwood_flail.png",
            explanation: "Blisterwood weapons are the most effective against higher level Vampyres."
          }
        ],
        'Elite': [
          {
            _id: 'local6',
            text: "What is the only item in the game to offer a negative Prayer Bonus?",
            answers: ["Ancient Staff", "Dragonbone Necklace", "Spined Helm", "Black Demon Mask"],
            correctAnswer: "Ancient Staff",
            difficulty: "Elite",
            category: "Items",
            area: "Magic",
            imageUrl: "/images/items/ancient_staff.png",
            explanation: "The Ancient Staff is the only item in OSRS that gives a negative Prayer bonus (-1)."
          }
        ],
        'Master': [
          {
            _id: 'local7',
            text: "Which Gnomish Delicacy became a high-end currency during RuneScape's infamous trade restrictions?",
            answers: ["Mint Cake", "Toad Crunchies", "Worm Crunchies", "Blurberry Special"],
            correctAnswer: "Mint Cake",
            difficulty: "Master",
            category: "Items",
            area: "History",
            imageUrl: "/images/items/mint_cake.png",
            explanation: "The Gnome Mint Cake was used as a high-value currency during the trade restrictions era."
          }
        ]
      };
      
      // Cache in localStorage for future offline sessions
      if (offlineStorageAvailable) {
        localStorage.setItem('osrs-trivia-questions', JSON.stringify(window.localQuestionData));
      }
    }
    
    // Check server status
    async function checkServerStatus() {
      if (!navigator.onLine) {
        handleOffline();
        return;
      }
      
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(3000) // 3 second timeout
        });
        
        if (!response.ok) {
          handleOffline();
        } else {
          // Server is online, check database status
          const data = await response.json();
          if (data.database !== 'connected') {
            handleOffline();
          } else {
            handleOnline();
            
            // Update offline question cache when online
            updateOfflineQuestionCache();
          }
        }
      } catch (error) {
        console.log('Server or network error:', error);
        handleOffline();
      }
    }
    
    // Update offline question cache from server
    async function updateOfflineQuestionCache() {
      if (!offlineStorageAvailable) return;
      
      try {
        // Fetch questions for offline use (limited set)
        const difficulties = ['Beginner', 'Easy', 'Medium', 'Hard', 'Elite', 'Master'];
        const offlineQuestions = {};
        
        for (const difficulty of difficulties) {
          const response = await fetch(`/api/questions?difficulty=${difficulty}&limit=5`);
          if (response.ok) {
            const questions = await response.json();
            
            // Need to add correct answers for offline mode
            const questionsWithAnswers = await Promise.all(questions.map(async q => {
              // For simplicity in this example, we'll just use the first answer as correct
              // In a real implementation, you'd need to fetch the correct answers securely
              return {
                ...q,
                correctAnswer: q.answers[0]
              };
            }));
            
            offlineQuestions[difficulty] = questionsWithAnswers;
          }
        }
        
        // Only save if we got at least some questions
        if (Object.keys(offlineQuestions).some(key => offlineQuestions[key].length > 0)) {
          localStorage.setItem('osrs-trivia-questions', JSON.stringify(offlineQuestions));
          console.log('Updated offline question cache');
        }
      } catch (error) {
        console.error('Error updating offline questions:', error);
      }
    }
    
    // Handle offline mode
    function handleOffline() {
      if (isOffline) return; // Already in offline mode
      
      isOffline = true;
      
      // Show the offline alert
      if (offlineAlert) {
        offlineAlert.style.display = 'block';
      }
      
      // Update UI elements for offline mode
      document.body.classList.add('offline-mode');
      
      // Disable features that require server connection
      const loginButtons = document.querySelectorAll('#login-btn, #login-register, #prompt-login-btn');
      loginButtons.forEach(btn => {
        btn.classList.add('disabled');
        btn.setAttribute('data-original-text', btn.textContent);
        btn.textContent = 'Offline Mode';
        
        // Prevent click
        btn.addEventListener('click', preventClick);
      });
      
      // Update leaderboard if exists
      const leaderboardBody = document.querySelector('#leaderboard-body');
      if (leaderboardBody) {
        leaderboardBody.innerHTML = `
          <tr class="leaderboard-offline">
            <td colspan="7">Leaderboard unavailable in offline mode</td>
          </tr>
        `;
      }
      
      // Store offline progress in localStorage
      if (offlineStorageAvailable) {
        // Get existing progress
        const userData = localStorage.getItem('userData') ? 
          JSON.parse(localStorage.getItem('userData')) : null;
        
        if (userData) {
          // Flag as offline data
          userData.offline = true;
          localStorage.setItem('userData', JSON.stringify(userData));
        }
        
        // Initialize offline progress tracking
        if (!localStorage.getItem('offline-progress')) {
          localStorage.setItem('offline-progress', JSON.stringify({
            questionsAnswered: 0,
            correctAnswers: 0,
            xp: 0,
            pendingSync: false
          }));
        }
      }
      
      // Set global flag for other scripts
      window.OFFLINE_MODE = true;
      
      console.log('Offline mode activated');
    }
    
    // Handle online mode
    function handleOnline() {
      if (!isOffline) return; // Already in online mode
      
      isOffline = false;
      
      // Hide the offline alert
      if (offlineAlert) {
        offlineAlert.style.display = 'none';
      }
      
      // Update UI elements for online mode
      document.body.classList.remove('offline-mode');
      
      // Re-enable features that require server connection
      const loginButtons = document.querySelectorAll('#login-btn, #login-register, #prompt-login-btn');
      loginButtons.forEach(btn => {
        btn.classList.remove('disabled');
        const originalText = btn.getAttribute('data-original-text');
        if (originalText) {
          btn.textContent = originalText;
        }
        
        // Remove click prevention
        btn.removeEventListener('click', preventClick);
      });
      
      // Sync offline progress if available
      if (offlineStorageAvailable) {
        syncOfflineProgress();
      }
      
      // Turn off global flag
      window.OFFLINE_MODE = false;
      
      console.log('Online mode restored');
    }
    
    // Sync offline progress when back online
    async function syncOfflineProgress() {
        if (!offlineStorageAvailable) return;
        
        const offlineProgress = localStorage.getItem('offline-progress') ? 
          JSON.parse(localStorage.getItem('offline-progress')) : null;
        
        if (offlineProgress && offlineProgress.pendingSync) {
          const token = localStorage.getItem('token');
          
          if (token) {
            try {
              // Send offline progress to server
              const response = await fetch('/api/sync-offline-progress', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-auth-token': token
                },
                body: JSON.stringify({
                  questionsAnswered: offlineProgress.questionsAnswered,
                  correctAnswers: offlineProgress.correctAnswers,
                  xp: offlineProgress.xp
                })
              });
              
              if (response.ok) {
                // Reset offline progress
                localStorage.setItem('offline-progress', JSON.stringify({
                  questionsAnswered: 0,
                  correctAnswers: 0,
                  xp: 0,
                  pendingSync: false
                }));
                
                console.log('Offline progress synced successfully');
                
                // Refresh user data
                fetchUserData();
              }
            } catch (error) {
              console.error('Error syncing offline progress:', error);
            }
          } else {
            console.log('Cannot sync offline progress: User not logged in');
          }
        }
      }
      
      // Prevent click and show tooltip
      function preventClick(e) {
        e.preventDefault();
        e.stopPropagation();
        
        alert('This feature is unavailable in offline mode. Please try again later when you\'re online.');
        return false;
      }
      
      // Record offline game progress
      window.recordOfflineProgress = function(isCorrect, xpGained) {
        if (!offlineStorageAvailable) return;
        
        try {
          const offlineProgress = localStorage.getItem('offline-progress') ? 
            JSON.parse(localStorage.getItem('offline-progress')) : {
              questionsAnswered: 0,
              correctAnswers: 0,
              xp: 0,
              pendingSync: false
            };
          
          // Update progress
          offlineProgress.questionsAnswered += 1;
          if (isCorrect) {
            offlineProgress.correctAnswers += 1;
            offlineProgress.xp += xpGained;
          }
          
          // Mark for sync when back online
          offlineProgress.pendingSync = true;
          
          // Save updated progress
          localStorage.setItem('offline-progress', JSON.stringify(offlineProgress));
          
          console.log('Offline progress updated:', offlineProgress);
        } catch (error) {
          console.error('Error recording offline progress:', error);
        }
      };
      
      // Get offline game progress for display
      window.getOfflineProgress = function() {
        if (!offlineStorageAvailable) return null;
        
        try {
          return localStorage.getItem('offline-progress') ? 
            JSON.parse(localStorage.getItem('offline-progress')) : null;
        } catch (error) {
          console.error('Error getting offline progress:', error);
          return null;
        }
      };
      
      // Helper function to fetch user data (used after syncing)
      async function fetchUserData() {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        try {
          const response = await fetch('/auth/user', {
            headers: {
              'x-auth-token': token
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Update UI with user data if needed
            const event = new CustomEvent('user-data-updated', { detail: userData });
            window.dispatchEvent(event);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      
      // Check offline mode on page load
      try {
        if (localStorage.getItem('offline-mode') === 'true') {
          // If we were in offline mode before, initialize that way
          window.OFFLINE_MODE = true;
          
          // Still schedule a check to see if we're back online
          setTimeout(checkServerStatus, 1000);
        }
      } catch (e) {
        // Ignore storage errors
      }
    })();