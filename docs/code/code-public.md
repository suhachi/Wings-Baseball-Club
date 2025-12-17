# public – PWA & 정적 자산 관련 코드

> 이 문서는 `public` 그룹에 속한 모든 파일의 실제 코드를 100% 포함합니다.

## public/icon-192.png

```
<!-- PNG 파일은 텍스트로 생성할 수 없습니다 -->
<!-- 실제 프로젝트에서는 /public/icon.svg를 PNG로 변환하거나 -->
<!-- https://realfavicongenerator.net/ 같은 서비스를 사용하세요 -->
<!-- 임시 방편: manifest.json에서 SVG 사용 -->
```

## public/icon.svg

```
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" fill="#2563EB" rx="100"/>
  <!-- Baseball -->
  <circle cx="256" cy="220" r="140" fill="white"/>
  <!-- Baseball stitching -->
  <path d="M 160 180 Q 180 160, 200 180 T 240 180"
        stroke="#DC2626" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M 272 180 Q 292 160, 312 180 T 352 180"
        stroke="#DC2626" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M 160 260 Q 180 280, 200 260 T 240 260"
        stroke="#DC2626" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M 272 260 Q 292 280, 312 260 T 352 260"
        stroke="#DC2626" stroke-width="4" fill="none" stroke-linecap="round"/>
  <!-- Text WINGS -->
  <text x="256" y="430" font-family="Arial, sans-serif" font-size="80" font-weight="bold"
        fill="white" text-anchor="middle">WINGS</text>
</svg>
```

## public/manifest.json

```json
{
  "name": "WINGS BASEBALL CLUB",
  "short_name": "WINGS",
  "description": "윙스 야구동호회 커뮤니티",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#2563eb",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any maskable"
    },
    {
      "src": "/icon.svg",
      "sizes": "192x192",
      "type": "image/svg+xml"
    },
    {
      "src": "/icon.svg",
      "sizes": "512x512",
      "type": "image/svg+xml"
    }
  ],
  "categories": ["sports", "social"],
  "shortcuts": [
    {
      "name": "일정",
      "short_name": "일정",
      "description": "일정 확인하기",
      "url": "/?tab=schedule",
      "icons": [{ "src": "/icon.svg", "sizes": "192x192" }]
    },
    {
      "name": "게시판",
      "short_name": "게시판",
      "description": "게시판 보기",
      "url": "/?tab=boards",
      "icons": [{ "src": "/icon.svg", "sizes": "192x192" }]
    }
  ]
}
```

## public/sw.js

```js
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
```
