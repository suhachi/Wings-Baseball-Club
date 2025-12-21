import React from 'react';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { ProfileEditModal } from '../components/ProfileEditModal';

interface ProfileRequiredPageProps {
    onNavigateHome: () => void;
}

export const ProfileRequiredPage: React.FC<ProfileRequiredPageProps> = ({ onNavigateHome }) => {
    const { profileComplete } = useAuth();
    const [isEditOpen, setIsEditOpen] = React.useState(false);

    // Auto-close if completed (or user can navigate manually)
    React.useEffect(() => {
        if (profileComplete) {
            // Allow user to celebrate or just stay
        }
    }, [profileComplete]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden"
            >
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        프로필 완성이 필요합니다
                    </h1>

                    <p className="text-gray-600 dark:text-gray-400 mb-8 whitespace-pre-wrap">
                        {`원활한 커뮤니티 활동을 위해\n실명과 전화번호를 등록해주세요.`}
                    </p>

                    <div className="space-y-3">
                        <Button
                            className="w-full h-12 text-lg"
                            onClick={() => setIsEditOpen(true)}
                        >
                            프로필 입력하기
                        </Button>

                        <Button
                            variant="ghost"
                            className="w-full"
                            onClick={onNavigateHome}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            홈으로 돌아가기
                        </Button>
                    </div>
                </div>
            </motion.div>

            <ProfileEditModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
            />
        </div>
    );
};
