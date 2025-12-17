import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, Trophy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [realName, setRealName] = useState('');
  const [nickname, setNickname] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode || !realName) {
      setError('초대코드와 실명은 필수입니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Firebase 초대코드 검증은 서버(Firestore)에서 수행
      await login(inviteCode, realName, nickname, phone);
      toast.success('환영합니다!');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Firebase 오프라인 오류 처리
      if (err.code === 'unavailable') {
        const errorMsg = '네트워크 연결을 확인해주세요. Firebase에 연결할 수 없습니다.';
        setError(errorMsg);
        toast.error(errorMsg);
      } else {
        const errorMsg = err.message || '로그인에 실패했습니다.';
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-4 bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-white mb-2"
          >
            WINGS
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-blue-100"
          >
            야구동호회 커뮤니티
          </motion.p>
        </div>

        {/* Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Invite Code */}
            <div className="space-y-2">
              <Label htmlFor="inviteCode" className="text-white">
                초대코드 *
              </Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="WINGS2024"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                required
              />
            </div>

            {/* Real Name */}
            <div className="space-y-2">
              <Label htmlFor="realName" className="text-white">
                실명 *
              </Label>
              <Input
                id="realName"
                type="text"
                placeholder="홍길동"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
                required
              />
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname" className="text-white">
                닉네임 (선택)
              </Label>
              <Input
                id="nickname"
                type="text"
                placeholder="길동"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-white">
                연락처 (선택)
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-100 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !inviteCode || !realName}
              className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-semibold text-base shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  가입 중...
                </>
              ) : (
                '가입하기'
              )}
            </Button>
          </form>

          {/* Helper Text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center text-sm text-blue-100"
          >
            가입 후 관리자가 포지션과 백넘버를 설정합니다
          </motion.p>
        </motion.div>

        {/* Demo Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-sm text-blue-100 bg-white/5 backdrop-blur-xl rounded-xl p-4 border border-white/10"
        >
          <p className="mb-2">데모 계정으로 로그인하기</p>
          <p className="font-mono text-xs">초대코드: WINGS2024</p>
        </motion.div>
      </motion.div>
    </div>
  );
};