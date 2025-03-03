// public/js/sw-register.js
/**
 * Service Worker Registration
 * Registers the service worker for offline support
 */

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              showUpdateNotification();
            }
          });
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
    
    // Handle controller change (service worker update)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      window.location.reload();
      refreshing = true;
    });
  });
  
  // Variable to prevent multiple refreshes
  let refreshing = false;
  
  // Function to show update notification
  function showUpdateNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
      <div class="update-notification-content">
        <p>A new version is available!</p>
        <button id="update-btn">Update Now</button>
      </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Add event listener to update button
    document.getElementById('update-btn').addEventListener('click', () => {
      // Reload page to use new service worker
      window.location.reload();
    });
  }
  
  // Check if we're online
  window.addEventListener('online', () => {
    console.log('Application is online. Syncing data...');
    // Dispatch custom event for app components to handle
    window.dispatchEvent(new CustomEvent('app-online'));
  });
  
  window.addEventListener('offline', () => {
    console.log('Application is offline. Using cached data...');
    // Dispatch custom event for app components to handle
    window.dispatchEvent(new CustomEvent('app-offline'));
  });
  
  // Initial check
  if (!navigator.onLine) {
    console.log('Application loaded offline. Using cached data...');
    window.dispatchEvent(new CustomEvent('app-offline'));
  }
} else {
  console.log('Service Workers not supported in this browser');
}