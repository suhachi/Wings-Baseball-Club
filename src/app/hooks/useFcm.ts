import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';
import {
  getNotificationPermission,
  requestNotificationPermission,
  registerFcmToken,
  onForegroundMessage,
} from '../../lib/firebase/messaging.service';
import { toast } from 'sonner';

/**
 * FCM 훅 (ATOM-13)
 * 
 * 기능:
 * - 알림 권한 확인/요청
 * - FCM 토큰 발급 및 등록
 * - Foreground 메시지 수신 핸들러
 * - 토큰 등록 상태 관리
 */
export function useFcm() {
  const { user } = useAuth();
  const { currentClubId } = useClub();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [tokenRegistered, setTokenRegistered] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  // 권한 상태 확인
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    getNotificationPermission().then(setPermission);
  }, []);

  // 토큰 등록 (내부 함수)
  const registerToken = useCallback(async (): Promise<boolean> => {
    if (!user || !currentClubId) {
      return false;
    }

    if (permission !== 'granted') {
      console.warn('알림 권한이 허용되지 않아 토큰을 등록할 수 없습니다');
      return false;
    }

    try {
      setTokenError(null);
      const token = await registerFcmToken(currentClubId);

      if (token) {
        setTokenRegistered(true);
        console.log('FCM 토큰 등록 완료');
        return true;
      } else {
        setTokenRegistered(false);
        setTokenError('토큰 발급 실패');
        return false;
      }
    } catch (error: any) {
      console.error('FCM 토큰 등록 실패:', error);
      setTokenRegistered(false);
      setTokenError(error.message || '토큰 등록 실패');
      toast.error('푸시 알림 등록에 실패했습니다');
      return false;
    }
  }, [user, currentClubId, permission]);

  // 권한 요청
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('이 브라우저는 알림을 지원하지 않습니다');
      return false;
    }

    try {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);

      if (newPermission === 'granted') {
        toast.success('알림 권한이 허용되었습니다');
        // 권한 허용 후 자동으로 토큰 등록 시도
        await registerToken();
        return true;
      } else if (newPermission === 'denied') {
        toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요');
        return false;
      }

      return false;
    } catch (error: any) {
      console.error('알림 권한 요청 실패:', error);
      toast.error('알림 권한 요청 중 오류가 발생했습니다');
      return false;
    }
  }, [registerToken]);

  // 재시도
  const retryRegister = useCallback(async (): Promise<boolean> => {
    return await registerToken();
  }, [registerToken]);

  // 사용자가 로그인하고 권한이 허용되면 자동으로 토큰 등록
  useEffect(() => {
    if (user && permission === 'granted' && !tokenRegistered && !tokenError) {
      registerToken();
    }
  }, [user, permission, tokenRegistered, tokenError, registerToken]);

  // Foreground 메시지 수신 핸들러 등록
  useEffect(() => {
    if (permission !== 'granted') {
      return;
    }

    const unsubscribe = onForegroundMessage((payload) => {
      // Foreground에서 메시지 수신 시 토스트 표시
      if (payload.title || payload.body) {
        toast.info(payload.body || payload.title || '새 알림', {
          description: payload.title && payload.body ? payload.title : undefined,
          duration: 5000,
        });
      }

      // 데이터가 있으면 추가 처리 (예: 게시글로 이동 등)
      if (payload.data?.postId) {
        // 필요시 라우팅 처리
        console.log('알림 데이터:', payload.data);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [permission]);

  return {
    permission,
    tokenRegistered,
    tokenError,
    requestPermission,
    retryRegister,
  };
}
