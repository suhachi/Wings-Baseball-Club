import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  Trophy,
  CheckCircle2,
  Mail,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import {
  type InviteCodeData,
  checkUserExists
} from '../../lib/firebase/auth.service';

type LoginStep = 'code' | 'method' | 'email-signup' | 'email-login' | 'additional-info';

export const LoginPage: React.FC = () => {
  const {
    checkInviteCode,
    registerWithEmail,
    createMsgAccount
  } = useAuth();

  const [step, setStep] = useState<LoginStep>('method'); // Start at Method Selection
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState(''); // Optional now
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

  // Detail Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState('');

  const handleAdditionalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser) return;

    if (!realName.trim() || !phone.trim()) {
      toast.error('이름과 전화번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // Import dynamically to avoid circular dependency issues if any
      const { createAccount } = await import('../../lib/firebase/auth.service');
      // Pass inviteCode (can be empty string, createAccount handles it)
      await createAccount(
        pendingGoogleUser,
        inviteCode || null,
        realName,
        nickname,
        phone
      );
      toast.success('회원가입이 완료되었습니다! (관리자 승인 대기중)');
      // App.tsx will redirect to Pending Page based on new status
    } catch (error: any) {
      console.error('Account creation failed:', error);
      toast.error(error.message || '가입 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 2-A. Google Sign In
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { loginWithGoogle } = await import('../../lib/firebase/auth.service');
      // 1. Google Auth Login (gets firebase user)
      const firebaseUser = await loginWithGoogle();

      // 2. Check if user profile exists
      const exists = await checkUserExists(firebaseUser.uid);

      if (exists) {
        // User exists -> Login success (Global AuthContext will pick it up)
        toast.success(`환영합니다, ${firebaseUser.displayName}님!`);
        // Navigation handled by App.tsx based on user state
      } else {
        // User does NOT exist -> Go to Additional Info Step
        setPendingGoogleUser(firebaseUser);
        setRealName(firebaseUser.displayName || ''); // Pre-fill name if available
        setStep('additional-info');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error('로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Email Sign Up
  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Auth User
      const user = await registerWithEmail(email, password, realName);
      // 2. Create Firestore Doc & Link Invite (Optional)
      await createMsgAccount(user, inviteCode || null, realName, nickname, phone);
      toast.success('가입이 완료되었습니다!');
      // Redirection happens automatically as user state updates
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
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
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">

            {/* STEP 2: METHOD SELECTION (Now Step 1) */}
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

                  <Button
                    variant="outline"
                    onClick={() => setStep('email-login')}
                    className="w-full h-12 bg-transparent border-white/30 text-white hover:bg-white/10 flex items-center justify-center gap-2"
                  >
                    <Mail className="w-5 h-5" />
                    이메일로 로그인
                  </Button>
                </div>

                <div className="pt-4 border-t border-white/10 text-center">
                  <button
                    onClick={() => setStep('email-signup')}
                    className="text-white/70 text-sm hover:text-white underline"
                  >
                    계정이 없으신가요? 이메일로 회원가입
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP: EMAIL LOGIN */}
            {step === 'email-login' && (
              <motion.div
                key="step-email-login"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    try {
                      const { loginWithEmail } = await import('../../lib/firebase/auth.service');
                      await loginWithEmail(email, password);
                      toast.success('로그인 성공!');
                    } catch (err: any) {
                      setError(err.message);
                      toast.error('로그인 실패');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label className="text-white">이메일</Label>
                    <Input
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      type="email"
                      required
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">비밀번호</Label>
                    <Input
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      type="password"
                      required
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : "로그인"}
                  </Button>
                </form>
                <Button
                  variant="ghost"
                  onClick={() => setStep('method')}
                  className="w-full text-blue-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  뒤로 가기
                </Button>
              </motion.div>
            )}


            {/* STEP 3: EMAIL SIGNUP FORM */}
            {step === 'email-signup' && (
              <motion.form
                key="step-email-signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailSignup}
                className="space-y-4"
              >
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                  <div className="space-y-1">
                    <Label className="text-white text-xs">이메일</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} type="email" required className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white text-xs">비밀번호</Label>
                    <Input value={password} onChange={e => setPassword(e.target.value)} type="password" required className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white text-xs">실명</Label>
                    <Input value={realName} onChange={e => setRealName(e.target.value)} placeholder="홍길동" required className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-white text-xs">닉네임</Label>
                      <Input value={nickname} onChange={e => setNickname(e.target.value)} className="bg-white/10 border-white/20 text-white" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-white text-xs">연락처</Label>
                      <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-white/10 border-white/20 text-white" />
                    </div>
                  </div>
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <Label className="text-white text-xs flex items-center gap-2">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      초대코드 (선택)
                    </Label>
                    <Input
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      placeholder="있으신 경우 입력해주세요"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    />
                    <p className="text-[10px] text-blue-100/70">
                      * 초대코드가 없으면 '가입 승인 대기' 상태로 시작됩니다.
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "가입하기"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep('method')}
                  className="w-full text-blue-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  뒤로 가기
                </Button>
              </motion.form>
            )}

            {/* STEP: ADDITIONAL INFO (For Google Signup) */}
            {step === 'additional-info' && (
              <motion.form
                key="step-additional"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleAdditionalInfoSubmit}
                className="space-y-4"
              >
                <div className="text-center mb-4">
                  <h3 className="text-white font-bold text-lg">추가 정보 입력</h3>
                  <p className="text-blue-100 text-xs">원활한 활동을 위해 추가 정보를 입력해주세요.</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-white text-xs">실명</Label>
                    <Input value={realName} onChange={e => setRealName(e.target.value)} required className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white text-xs">연락처</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} required placeholder="010-0000-0000" className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-white text-xs">닉네임 (선택)</Label>
                    <Input value={nickname} onChange={e => setNickname(e.target.value)} className="bg-white/10 border-white/20 text-white" />
                  </div>
                  <div className="space-y-1 pt-2 border-t border-white/10">
                    <Label className="text-white text-xs flex items-center gap-2">
                      <Trophy className="w-3 h-3 text-yellow-400" />
                      초대코드 (선택)
                    </Label>
                    <Input
                      value={inviteCode}
                      onChange={e => setInviteCode(e.target.value)}
                      placeholder="있으신 경우 입력해주세요"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold mt-4"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "가입 완료"}
                </Button>
              </motion.form>
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