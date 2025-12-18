// Firebase Cloud Messaging Service Worker
// ATOM-13: Background 메시지 수신 처리

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Firebase 설정 (VAPID 키는 Service Worker에서도 필요)
const firebaseConfig = {
  apiKey: 'AIzaSyACk1-QVyol4r6TKmNcDXHbuv3NwWbjmJU',
  authDomain: 'wings-baseball-club.firebaseapp.com',
  projectId: 'wings-baseball-club',
  storageBucket: 'wings-baseball-club.firebasestorage.app',
  messagingSenderId: '951671719712',
  appId: '1:951671719712:web:9f2b4fb521ec546d43f945',
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Messaging 인스턴스
const messaging = firebase.messaging();

// Background 메시지 수신 핸들러
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '알림';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data || {},
    tag: payload.data?.postId || 'default', // 같은 태그의 알림은 하나로 합침
    requireInteraction: false,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 핸들러
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] 알림 클릭:', event);

  event.notification.close();

  // 알림 데이터에서 URL 추출 (예: postId가 있으면 해당 게시글로 이동)
  const data = event.notification.data || {};
  let url = '/';

  if (data.postId) {
    // 게시글로 이동 (실제 구현에서는 라우터 경로 사용)
    url = `/?postId=${data.postId}`;
  } else if (data.type === 'notice') {
    url = '/boards?type=notice';
  } else if (data.type === 'event') {
    url = '/schedule';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 클라이언트가 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(url) && 'focus' in client) {
          return client.focus();
        }
      }
      // 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

