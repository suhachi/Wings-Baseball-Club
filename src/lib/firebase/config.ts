// Firebase Configuration
// 
// ⚠️ 중요: 실제 Firebase 프로젝트 설정 값으로 교체하세요
// Firebase Console (https://console.firebase.google.com)에서
// 프로젝트 설정 > 일반 > 내 앱 > Firebase SDK snippet > 구성에서 확인할 수 있습니다

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

const firebaseConfig = {
  // 우선순위: .env 값 > 아래 기본값 (사용자가 제공한 Firebase 설정)
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyACk1-QVyol4r6TKmNcDXHbuv3NwWbjmJU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wings-baseball-club.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wings-baseball-club',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wings-baseball-club.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '951671719712',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:951671719712:web:9f2b4fb521ec546d43f945',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-HHQYWBCLG4'
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-northeast3'); // 서울 리전

// Firestore 오프라인 persistence 활성화 (PWA 지원)
// 단, 개발 환경에서는 여러 탭이 열려있을 수 있으므로 에러를 무시합니다
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      // 여러 탭이 열려있을 때
      console.warn('⚠️ Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // 브라우저가 지원하지 않을 때
      console.warn('⚠️ Firestore persistence not supported');
    } else {
      // 기타 에러는 무시 (예: 오프라인 상태)
      console.warn('⚠️ Firestore persistence warning:', err.code);
    }
  });
}

// 전역 Firebase 에러 핸들러
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Firebase 오프라인 관련 에러는 경고로 변경
  const errorMessage = args[0]?.toString() || '';
  if (
    errorMessage.includes('Failed to get document because the client is offline') ||
    errorMessage.includes('[code=unavailable]') ||
    errorMessage.includes('AbortError')
  ) {
    console.warn('⚠️ Firebase offline warning (suppressed):', ...args);
    return;
  }
  originalConsoleError.apply(console, args);
};

export default app;