const CACHE_NAME = 'wings-baseball-v1.1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // 즉시 활성화
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
          .map((cacheName) => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => self.clients.claim()) // 즉시 제어권 획득
  );
});

// Fetch event - Network first for API, Cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Firebase API 요청은 네트워크 우선
  if (url.hostname.includes('firebaseapp.com') || 
      url.hostname.includes('googleapis.com') ||
      url.hostname.includes('firestore.googleapis.com')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
    return;
  }

  // 정적 자산은 캐시 우선
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // 성공적인 응답만 캐싱
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            // 동적 캐시에 저장
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // 오프라인 시 기본 응답
            if (request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});