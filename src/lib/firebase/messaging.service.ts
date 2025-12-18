// Firebase Cloud Messaging Service
// ATOM-13: FCM 클라이언트 구현

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { httpsCallable } from 'firebase/functions';
import app, { functions } from './config';
// Note: toast는 foreground 메시지 핸들러에서만 사용

// FCM 토큰 등록 Function
const registerFcmTokenFn = httpsCallable<{
  clubId: string;
  token: string;
  platform?: 'web' | 'android' | 'ios';
  requestId?: string;
}, { success: boolean; tokenId: string }>(functions, 'registerFcmToken');

// VAPID 키 (Firebase Console > 프로젝트 설정 > 클라우드 메시징에서 확인)
// 실제 프로젝트에서는 환경 변수로 관리 권장
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || '';

let messagingInstance: Messaging | null = null;

/**
 * FCM Messaging 인스턴스 초기화
 */
export function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 null 반환
    return null;
  }

  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch (error) {
      console.error('FCM 초기화 실패:', error);
      return null;
    }
  }

  return messagingInstance;
}

/**
 * 알림 권한 상태 조회
 */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  return Notification.permission;
}

/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return 'denied';
  }
}

/**
 * FCM 토큰 발급 및 등록
 */
export async function registerFcmToken(clubId: string): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  const messaging = getMessagingInstance();
  if (!messaging) {
    console.error('FCM Messaging 인스턴스를 초기화할 수 없습니다');
    return null;
  }

  // 권한 확인
  const permission = await getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('알림 권한이 허용되지 않았습니다:', permission);
    return null;
  }

  // VAPID 키 확인
  if (!VAPID_KEY) {
    console.warn('VAPID 키가 설정되지 않았습니다. 환경 변수 VITE_FCM_VAPID_KEY를 설정하세요');
    return null;
  }

  try {
    // FCM 토큰 발급
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });

    if (!token) {
      console.warn('FCM 토큰을 발급받을 수 없습니다');
      return null;
    }

    // 플랫폼 감지 (간단한 방법)
    const platform = detectPlatform();

    // 서버에 토큰 등록
    try {
      await registerFcmTokenFn({
        clubId,
        token,
        platform,
        requestId: `client-${Date.now()}`,
      });
      console.log('FCM 토큰 등록 완료:', token.substring(0, 20) + '...');
    } catch (error: any) {
      console.error('FCM 토큰 등록 실패:', error);
      // 토큰은 반환하되 등록은 실패 (나중에 재시도 가능)
    }

    return token;
  } catch (error: any) {
    console.error('FCM 토큰 발급 실패:', error);
    if (error.code === 'messaging/permission-blocked') {
      console.error('알림 권한이 차단되었습니다');
    } else if (error.code === 'messaging/unsupported-browser') {
      console.error('FCM을 지원하지 않는 브라우저입니다');
    }
    return null;
  }
}

/**
 * 플랫폼 감지 (간단한 방법)
 */
function detectPlatform(): 'web' | 'android' | 'ios' {
  if (typeof window === 'undefined') {
    return 'web';
  }

  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }
  
  return 'web';
}

/**
 * Foreground 메시지 수신 핸들러 등록
 */
export function onForegroundMessage(
  callback: (payload: {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  }) => void
): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) {
    return () => {};
  }

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground 메시지 수신:', payload);

      const notification = payload.notification;
      if (notification) {
        callback({
          title: notification.title,
          body: notification.body,
          data: payload.data as Record<string, string> | undefined,
        });

        // 토스트 알림은 useFcm에서 처리하도록 콜백 전달
        // toast는 클라이언트 코드에서 직접 사용
      }
    });

    return unsubscribe;
  } catch (error) {
    console.error('Foreground 메시지 핸들러 등록 실패:', error);
    return () => {};
  }
}

