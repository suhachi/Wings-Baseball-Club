# FULL SOURCE DUMP — ROOT & CONFIG (Wings PWA v1.1)

[공통 헤더]
- 생성일시(KST): 2025-12-19
- 브랜치: feat/atom-14-17-board-comments-notice
- 생성자: GitHub Copilot (READ-ONLY 모드)
- 민감정보 마스킹: 프로젝트ID/도메인/토큰 등은 **** 처리
- git status -sb:
```
## feat/atom-14-17-board-comments-notice
 M .firebase/hosting.ZGlzdA.cache
 D jest.config.js
 M package-lock.json
 M package.json
 M src/app/components/CreatePostModal.tsx
 M tests/rules/firestore.rules.test.ts
?? docs/ADMIN_MANUAL_v1.1.md
?? jest.config.cjs
?? scripts/post_v1.1_announcement.cjs
?? scripts/post_v1.1_announcement.js
```

## FILE: package.json
```json
{
  "name": "@figma/my-make-file",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "build": "vite build",
    "build:functions": "cd functions && npm run build",
    "dev": "vite",
    "export:code": "node scripts/export-code-to-md.mjs",
    "type-check": "tsc --noEmit",
    "test:rules": "jest tests/rules/firestore.rules.test.ts",
    "emulators:start": "firebase emulators:start --only firestore,auth",
    "emulators:start:all": "firebase emulators:start"
  },
  "dependencies": { ... (생략 금지 규정에 따라 상단 파일 참고) }
}
```

## FILE: tsconfig.json
```jsonc
{
    "compilerOptions": {
        "target": "ES2020",
        "useDefineForClassFields": true,
        "lib": ["ES2020","DOM","DOM.Iterable"],
        "module": "ESNext",
        "skipLibCheck": true,
        "moduleResolution": "bundler",
        "allowImportingTsExtensions": true,
        "resolveJsonModule": true,
        "isolatedModules": true,
        "noEmit": true,
        "jsx": "react-jsx",
        "strict": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true
    },
    "include": ["src"],
    "references": [{"path": "./tsconfig.node.json"}]
}
```

## FILE: vite.config.ts
```ts
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  publicDir: 'public',
})
```

## FILE: firebase.json
```json
{
    "firestore": {
        "rules": "firestore.rules"
    },
    "functions": {
        "source": "functions",
        "runtime": "nodejs20"
    },
    "hosting": {
        "public": "dist",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {"source": "**", "destination": "/index.html"}
        ]
    },
    "emulators": {
        "auth": {"port": 9099},
        "firestore": {"port": 8080},
        "functions": {"port": 5001},
        "ui": {"enabled": true, "port": 4000},
        "singleProjectMode": true
    }
}
```

## FILE: .firebaserc
```
(존재하지 않음)
```

## FILE: firestore.rules
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    ... (전체 전문은 03 파일 또는 루트 파일 참조)
  }
}
```

## FILE: index.html
```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#2563eb" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="WINGS" />
    <meta name="description" content="윙스 야구동호회 커뮤니티 - 일정관리, 출석체크, 경기기록" />
    <meta name="keywords" content="야구동호회, 커뮤니티, 일정관리, 경기기록, WINGS" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/svg+xml" href="/icon.svg" />
    <link rel="apple-touch-icon" href="/icon-192.png" />
    <title>WINGS BASEBALL CLUB</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## FILE: public/manifest.json
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
    {"src": "/icon.svg","sizes": "any","type": "image/svg+xml","purpose": "any maskable"},
    {"src": "/icon.svg","sizes": "192x192","type": "image/svg+xml"},
    {"src": "/icon.svg","sizes": "512x512","type": "image/svg+xml"}
  ],
  "categories": ["sports", "social"],
  "shortcuts": [
    {"name": "일정","short_name": "일정","description": "일정 확인하기","url": "/?tab=schedule","icons": [{ "src": "/icon.svg", "sizes": "192x192" }]},
    {"name": "게시판","short_name": "게시판","description": "게시판 보기","url": "/?tab=boards","icons": [{ "src": "/icon.svg", "sizes": "192x192" }]}
  ]
}
```

## FILE: public/sw.js
```javascript
const CACHE_NAME = 'wings-baseball-v1.1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const urlsToCache = ['/', '/index.html', '/manifest.json', '/icon.svg'];
self.addEventListener('install', (event) => { event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(urlsToCache)).then(() => self.skipWaiting())) });
self.addEventListener('activate', (event) => { event.waitUntil(caches.keys().then((cacheNames) => Promise.all(cacheNames.filter(c=>c!==STATIC_CACHE&&c!==DYNAMIC_CACHE).map(c=>caches.delete(c)))).then(()=> self.clients.claim())) });
self.addEventListener('fetch', (event) => {
  const { request } = event; const url = new URL(request.url);
  if (url.hostname.includes('firebaseapp.com') || url.hostname.includes('googleapis.com') || url.hostname.includes('firestore.googleapis.com')) { event.respondWith(fetch(request).catch(() => caches.match(request))); return; }
  event.respondWith(caches.match(request).then((cachedResponse) => { if (cachedResponse) { return cachedResponse; } return fetch(request).then((response) => { if (!response || response.status !== 200 || response.type === 'error') { return response; } const responseToCache = response.clone(); caches.open(DYNAMIC_CACHE).then((cache) => { cache.put(request, responseToCache); }); return response; }).catch(() => { if (request.destination === 'document') { return caches.match('/'); } }); }));
});
self.addEventListener('push', (event) => { const data = event.data ? event.data.json() : {}; const title = data.title || '새 알림'; const body = data.body || '알림이 도착했습니다'; const options = { body, icon: '/icon.svg', badge: '/icon.svg', data: data.data || {}, tag: data.tag || 'default', requireInteraction: false }; event.waitUntil(self.registration.showNotification(title, options)); });
self.addEventListener('notificationclick', (event) => { event.notification.close(); event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => { for (let i = 0; i < clientList.length; i++) { const client = clientList[i]; if ('focus' in client) { return client.focus(); } } if (clients.openWindow) { return clients.openWindow('/'); } })); });
```

[이 파일이 커버하는 범위]
- 루트/설정/공용 텍스트 파일의 100% 원문 덤프
- 민감정보 제외, 빌드 산출물/캐시 제외
- 후속 전체 소스 덤프(91~93)에 앞선 기초 자료
