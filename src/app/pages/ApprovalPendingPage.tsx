
import React from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { LogOut, Clock } from 'lucide-react';

export const ApprovalPendingPage: React.FC = () => {
    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-gray-800 rounded-2xl p-8 text-center border border-gray-700 shadow-2xl"
            >
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-yellow-500" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">가입 승인 대기 중</h1>
                <p className="text-gray-400 mb-8 whitespace-pre-line">
                    회원가입 요청이 접수되었습니다.{'\n'}
                    관리자(회장)의 승인 후 서비스를 이용하실 수 있습니다.{'\n'}
                    승인이 완료되면 알림을 보내드립니다.
                </p>

                <div className="bg-gray-900/50 rounded-xl p-4 mb-8 text-left text-sm border border-gray-700">
                    <h3 className="text-gray-300 font-semibold mb-2">승인 문의</h3>
                    <p className="text-gray-500">카카오톡: Wings 관리자</p>
                </div>

                <Button
                    onClick={logout}
                    variant="outline"
                    className="w-full h-12 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    로그아웃
                </Button>
            </motion.div>
        </div>
    );
};
