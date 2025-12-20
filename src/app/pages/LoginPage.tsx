import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  checkUserExists
} from '../../lib/firebase/auth.service';

import {
  isInAppBrowser,
  getBreakoutUrl,
  isAndroid
} from '../../lib/utils/userAgent';

type LoginStep = 'method';

export const LoginPage: React.FC = () => {
  // WebView Detection
  if (isInAppBrowser()) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <img src="/wingslogo.jpg" alt="Logo" className="w-20 h-20 rounded-full object-cover" />
        </div>
        <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
          외부 브라우저로 열어주세요
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 whitespace-pre-wrap">
          구글 보안 정책으로 인해{'\n'}
          카카오톡/인스타그램 등 인앱 브라우저에서는{'\n'}
          로그인이 불가능합니다.
        </p>

        {isAndroid() ? (
          <Button
            className="w-full h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
            onClick={() => {
              window.location.href = getBreakoutUrl();
            }}
          >
            Chrome으로 열기
          </Button>
        ) : (
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl text-left w-full text-sm space-y-2">
            <p className="font-bold flex items-center gap-2">
              <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs">1</span>
              우측 하단/상단 점 3개 메뉴 클릭
            </p>
            <p className="font-bold flex items-center gap-2">
              <span className="w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs">2</span>
              '다른 브라우저로 열기' 선택
            </p>
          </div>
        )}
      </div>
    );
  }

  const [step] = useState<LoginStep>('method');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Google Sign In
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { loginWithGoogle } = await import('../../lib/firebase/auth.service');
      // Google Auth Login (gets firebase user)
      const firebaseUser = await loginWithGoogle();

      // Check if user profile exists
      const exists = await checkUserExists(firebaseUser.uid);

      if (exists) {
        toast.success(`환영합니다, ${firebaseUser.displayName}님!`);
      } else {
        // [NOTICE] 신규 유저 자동 가입 신청 (pending 생성)
        const { createAccount } = await import('../../lib/firebase/auth.service');
        await createAccount(firebaseUser, firebaseUser.displayName || '이름 없음');
        toast.info('가입 신청 되었습니다. 관리자 승인 후 이용 가능합니다.');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20"
      >
        {/* Header */}
        <div className="p-8 pb-0 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center justify-center w-24 h-24 mb-6 bg-white/20 rounded-full shadow-lg border-4 border-white/30 overflow-hidden"
          >
            <img src="/wingslogo.jpg" alt="Wings Logo" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-2xl font-bold text-white mb-2">WINGS</h1>
          <p className="text-blue-100 text-sm">야구동호회 커뮤니티</p>
          <p className="text-[10px] text-blue-200/60 mt-2">
            * 로그인 오류 시 Chrome/Safari 브라우저를 이용해주세요.
          </p>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {step === 'method' && (
              <motion.div
                key="step-method"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full h-12 bg-white text-gray-800 hover:bg-gray-50 border-0 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.05H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.95l2.84-2.84z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51z" fill="#EA4335" />
                        </svg>
                        Google로 계속하기
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Global Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-sm text-center"
            >
              {error}
            </motion.div>
          )}
        </div>
        <div className="mt-8 text-center text-xs text-gray-400">
          &copy; 2024 Wings Baseball Club (v1.1)
        </div>
      </motion.div >
    </div >
  );
};