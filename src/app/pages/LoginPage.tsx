import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import {
  isInAppBrowser,
  getBreakoutUrl,
  isAndroid
} from '../../lib/utils/userAgent';
import { SignupPage } from './SignupPage';

type LoginStep = 'login' | 'signup';

interface LoginPageProps {
  initialStep?: LoginStep;
}

export const LoginPage: React.FC<LoginPageProps> = ({ initialStep = 'login' }) => {
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

  const [step, setStep] = useState<LoginStep>(initialStep);

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const { signInWithEmailPassword } = await import('../../lib/firebase/auth.service');
      await signInWithEmailPassword(email, password);
      // Success is handled by AuthContext state change
    } catch (err: any) {
      console.error('Login Error:', err);
      toast.error('로그인 실패: 이메일 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      const { loginWithGoogle } = await import('../../lib/firebase/auth.service');
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Login Error:', err);
      toast.error('구글 로그인 실패');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'signup') {
    return <SignupPage onBack={() => setStep('login')} />;
  }

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
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-blue-50">이메일</Label>
              <Input
                type="email"
                placeholder="email@example.com"
                className="bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 focus:bg-white/30"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-blue-50">비밀번호</Label>
              <Input
                type="password"
                placeholder="비밀번호 입력"
                className="bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 focus:bg-white/30"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg mt-4"
            >
              {loading ? <Loader2 className="animate-spin" /> : '로그인'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
            <button
              onClick={() => setStep('signup')}
              className="text-white/80 hover:text-white text-sm hover:underline underline-offset-4"
            >
              계정이 없으신가요? 회원가입하기
            </button>

            <div className="pt-2 border-t border-white/10 w-full"></div>

            <button
              onClick={handleLoginWithGoogle}
              type="button"
              disabled={loading}
              className="text-blue-100/70 hover:text-white text-xs hover:underline underline-offset-4 flex items-center justify-center gap-2 w-full"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
              </svg>
              기존 구글 계정으로 로그인 (유지보수용)
            </button>

            {/* Password Reset Link Placeholder */}
            {/* <div className="text-xs text-blue-200/60">
              비밀번호를 잊으셨나요?
            </div> */}
          </div>
        </div>
        <div className="p-4 text-center text-xs text-gray-400 bg-black/10">
          &copy; 2024 Wings Baseball Club (v2.0)
        </div>
      </motion.div>
    </div>
  );
};