// public/service-worker.js
/**
 * Service Worker for OSRS Trivia Game
 * Provides offline support and caching
 */

const CACHE_NAME = 'osrs-trivia-cache-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/play.html',
  '/profile.html',
  '/leaderboard.html',
  '/css/main.css',
  '/css/mobile.css',
  '/css/fonts.css',
  '/js/main.js',
  '/js/auth.js',
  '/js/game.js',
  '/js/profile.js',
  '/js/leaderboard.js',
  '/js/font-loader.js',
  '/js/local-questions.js',
  '/js/offline-mode.js',
  '/fonts/runescape.woff2',
  '/fonts/runescape.woff',
  '/fonts/runescape_bold.woff2',
  '/fonts/runescape_bold.woff',
  // Add UI images
  '/images/ui/clue_scroll.png',
  '/images/ui/beginner_clue.png',
  '/images/ui/easy_clue.png',
  '/images/ui/medium_clue.png',
  '/images/ui/hard_clue.png',
  '/images/ui/elite_clue.png',
  '/images/ui/master_clue.png',
  '/images/ui/correct_icon.png',
  '/images/ui/incorrect_icon.png',
  '/images/ui/level_icon.png',
  '/images/ui/xp_icon.png',
  '/images/ui/questions_icon.png',
  '/images/ui/xp_lamp.png',
  '/images/ui/level_up.png',
  '/images/ui/placeholder.png',
  '/images/ui/item_placeholder.png',
  '/images/ui/npc_placeholder.png',
  '/images/ui/location_placeholder.png',
  '/images/ui/skill_placeholder.png',
  '/images/ui/background.jpg',
  '/images/ui/wise_old_man.png'
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Take control of all clients
  self.clients.claim();
});

// Fetch event - network-first strategy for API, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
    // Network-first strategy for API requests
    event.respondWith(
      fetch(event.request)
        .catch((error) => {
          console.log('Service Worker: Network request failed:', error.message);
          
          // Check the request header Accept type
          const acceptHeader = event.request.headers.get('accept') || '';
          const wantsJSON = acceptHeader.includes('application/json');
          
          // If it's a questions request, return local fallback
          if (url.pathname === '/api/questions') {
            return new Response(
              JSON.stringify([
                {
                  _id: 'local1',
                  text: "What Attack level is required to wear Adamant Weaponry?",
                  answers: ["30", "25", "40", "35"],
                  difficulty: "Beginner",
                  category: "Items",
                  area: "Combat",
                  imageUrl: "/images/items/adamant_scimitar.png"
                },
                // More questions could be added here as needed
              ]),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 200
              }
            );
          }
          
          // Handle other API requests with appropriate JSON response
          if (wantsJSON) {
            return new Response(
              JSON.stringify({
                offline: true,
                error: 'Network request failed',
                message: 'You are currently offline. Please try again when your connection is restored.'
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          }
          
          // Default generic response for non-JSON API requests
          return new Response(
            'You are currently offline. Please try again when your connection is restored.',
            {
              headers: { 'Content-Type': 'text/plain' },
              status: 503
            }
          );
        })
    );
  } else {
    // Cache-first strategy for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Not in cache, fetch from network and cache for next time
        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response since it can only be used once
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        }).catch((error) => {
          console.log('Network request failed for static asset:', error.message);
          
          // If network fails and we don't have a cache match, return the appropriate fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
          
          // For image requests, return a placeholder
          if (event.request.destination === 'image') {
            return caches.match('/images/ui/placeholder.png');
          }
          
          // For CSS or JavaScript
          if (event.request.destination === 'style') {
            return new Response('/* Offline stylesheet */');
          }
          
          if (event.request.destination === 'script') {
            return new Response('console.log("Offline script");');
          }
          
          // Default fallback
          return new Response('Offline content not available');
        });
      })
    );
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification from OSRS Trivia',
      icon: '/images/ui/clue_scroll.png',
      badge: '/images/ui/clue_scroll.png',
      data: {
        url: data.url || '/'
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'OSRS Trivia Game', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});