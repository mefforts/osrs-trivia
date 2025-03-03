// public/js/main.js

// DOM elements
let heroElement = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners and initialize UI
    setupUI();
    
    // Check for server status
    checkServerStatus();
});

// Setup UI elements
function setupUI() {
    // Get hero element
    heroElement = document.querySelector('.hero-content');
    
    // Add any global event listeners here
}

// Add this to public/js/main.js after the setupUI function

/**
 * Handles image loading errors by providing fallback images
 * Ensures users don't see broken image icons
 */
function setupImageErrorHandling() {
    // Add event listener to handle image loading errors
    document.addEventListener('error', function(event) {
      // Only handle image loading errors
      if (event.target.tagName.toLowerCase() === 'img') {
        console.warn(`Failed to load image: ${event.target.src}`);
        
        // Extract image type from path
        const path = event.target.src;
        let fallbackImage = '/images/ui/placeholder.png'; // Default fallback
        
        // Set appropriate fallback based on image path
        if (path.includes('/items/')) {
          fallbackImage = '/images/ui/item_placeholder.png';
        } else if (path.includes('/npcs/')) {
          fallbackImage = '/images/ui/npc_placeholder.png';
        } else if (path.includes('/locations/')) {
          fallbackImage = '/images/ui/location_placeholder.png';
        } else if (path.includes('/skills/')) {
          fallbackImage = '/images/ui/skill_placeholder.png';
        }
        
        // Set fallback image and add error class for styling
        event.target.src = fallbackImage;
        event.target.classList.add('image-error');
        
        // Add title to explain the issue
        event.target.title = 'Original image could not be loaded';
      }
    }, true); // Capture phase to catch all image errors
  }
  
  // Update the setupUI function to include image error handling
  function setupUI() {
    // Get hero element
    heroElement = document.querySelector('.hero-content');
    
    // Add image error handling
    setupImageErrorHandling();
    
    // Add any global event listeners here
  }

// Check server status
async function checkServerStatus() {
    try {
        const response = await fetch('/api/health', { 
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            // Short timeout to detect issues quickly
            signal: AbortSignal.timeout(3000)
        });
        
        if (!response.ok) {
            showOfflineMode();
        }
    } catch (error) {
        console.log('Server may be offline or experiencing issues:', error);
        showOfflineMode();
    }
}

// Show offline mode message
function showOfflineMode() {
    // Only add the message if on the home page and the hero element exists
    if (window.location.pathname === '/' && heroElement) {
        const offlineAlert = document.createElement('div');
        offlineAlert.className = 'offline-alert';
        offlineAlert.innerHTML = `
            <p>⚠️ The server is currently in offline mode. Some features like user accounts and leaderboards may be unavailable, but you can still play the game!</p>
        `;
        
        // Insert after the first paragraph
        const firstParagraph = heroElement.querySelector('p');
        if (firstParagraph) {
            firstParagraph.after(offlineAlert);
        } else {
            heroElement.appendChild(offlineAlert);
        }
    }
}