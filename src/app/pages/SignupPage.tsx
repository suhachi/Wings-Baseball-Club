import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

interface SignupPageProps {
    onBack: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onBack }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        realName: '',
        phone: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!formData.email || !formData.password || !formData.realName || !formData.phone) {
            toast.error('모든 필드를 입력해주세요.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            toast.error('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('비밀번호는 6동 이상이어야 합니다.');
            return;
        }

        setLoading(true);
        try {
            // Lazy load auth service to avoid circular dependencies if any
            const { signUpWithEmailPassword } = await import('../../lib/firebase/auth.service');

            await signUpWithEmailPassword({
                email: formData.email,
                password: formData.password,
                name: formData.realName,
                phone: formData.phone,
                clubId: 'WINGS' // Default club ID
            });

            toast.success('회원가입이 완료되었습니다!');
            // Navigation will be handled by AuthContext state change or parent
            // But typically we might want to redirect to login or just let the auto-login filter through
        } catch (error: any) {
            console.error('Signup Error:', error);
            toast.error(error.message || '회원가입 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 dark:from-blue-900 dark:via-blue-800 dark:to-blue-700 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20"
            >
                <div className="p-8">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="mb-6 text-white hover:bg-white/20 -ml-2"
                    >
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        로그인으로 돌아가기
                    </Button>

                    <h1 className="text-2xl font-bold text-white mb-6">회원가입</h1>

                    <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-blue-50">이메일</Label>
                            <Input
                                name="email"
                                type="email"
                                required
                                className="bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 focus:bg-white/30"
                                placeholder="example@email.com"
                                value={formData.email}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-blue-50">비밀번호</Label>
                            <Input
                                name="password"
                                type="password"
                                required
                                className="bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 focus:bg-white/30"
                                placeholder="6자리 이상 입력"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-blue-50">비밀번호 확인</Label>
                            <Input
                                name="confirmPassword"
                                type="password"
                                required
                                className="bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 focus:bg-white/30"
                                placeholder="비밀번호 재입력"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-blue-50">실명</Label>
                            <Input
                                name="realName"
                                type="text"
                                required
                                className="bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 focus:bg-white/30"
                                placeholder="홍길동"
                                value={formData.realName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-blue-50">전화번호</Label>
                            <Input
                                name="phone"
                                type="tel"
                                required
                                className="bg-white/20 border-white/30 text-white placeholder:text-blue-100/50 focus:bg-white/30"
                                placeholder="010-1234-5678"
                                value={formData.phone}
                                onChange={handleChange}
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-bold text-lg mt-6"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : '가입하기'}
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};
