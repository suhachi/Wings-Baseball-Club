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

// μATOM-0511: SW 존재/등록 상태 점검(메시징 SW)
// FCM Background 메시지 수신 핸들러
// Firebase Messaging Service Worker 설정은 firebase-messaging-sw.js에서 처리하거나
// 여기에 직접 추가 가능 (현재는 기본 구조만 유지)
//
// Background 메시지 수신 시:
// - 알림 표시 (기본 알림 표시)
// - 클릭 시 앱으로 이동
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received:', event);

  const data = event.data ? event.data.json() : {};
  const title = data.title || '새 알림';
  const body = data.body || '알림이 도착했습니다';
  const options = {
    body: body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: data.data || {},
    tag: data.tag || 'default',
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 알림 클릭 핸들러
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click:', event);

  event.notification.close();

  // 클라이언트로 이동
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 클라이언트가 있으면 포커스
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});