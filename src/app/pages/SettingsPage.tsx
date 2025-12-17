import React, { useEffect } from 'react';
import {
  Info,
  Mail,
  Building2,
  User,
  Shield,
  Code,
  Palette,
  Bell,
  LogOut,
  ChevronRight,
  ExternalLink,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { APP_INFO, DEVELOPER_INFO, FEATURES, TECH_STACK } from '../../lib/constants/app-info';
import { toast } from 'sonner';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [pushEnabled, setPushEnabled] = React.useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('로그아웃되었습니다');
    } catch (error) {
      toast.error('로그아웃 실패');
    }
  };

  useEffect(() => {
    // Check saved state
    const saved = localStorage.getItem('wings_push_enabled');
    if (saved === 'true') {
      if (Notification.permission === 'granted') {
        setPushEnabled(true);
      } else {
        localStorage.removeItem('wings_push_enabled');
      }
    }
  }, []);

  const handlePushToggle = async () => {
    if (pushEnabled) {
      // Turn off
      setPushEnabled(false);
      localStorage.setItem('wings_push_enabled', 'false');
      toast.info('푸시 알림이 해제되었습니다');
      return;
    }

    // Turn on
    if (!('Notification' in window)) {
      toast.error('이 브라우저는 푸시 알림을 지원하지 않습니다');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('wings_push_enabled', 'true');
        toast.success('푸시 알림이 설정되었습니다');

        // TODO: Get FCM Token and save to user profile
        // This requires 'messaging' from firebase config to be fully set up
      } else {
        toast.error('알림 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      toast.error('알림 권한 요청 중 오류가 발생했습니다');
    }
  };

  return (
    <div className="pb-20 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <h1 className="text-2xl font-bold mb-2">설정</h1>
        <p className="text-blue-100">앱 설정 및 정보</p>
      </div>

      <div className="p-4 space-y-4">
        {/* 앱 정보 섹션 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Info className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold">{APP_INFO.name}</h2>
              <p className="text-sm text-gray-500">{APP_INFO.fullName}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">버전</span>
              <span className="font-medium">{APP_INFO.version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">빌드 날짜</span>
              <span className="font-medium">{APP_INFO.buildDate}</span>
            </div>
            <div className="text-sm">
              <p className="text-gray-600 mb-1">설명</p>
              <p className="text-gray-800">{APP_INFO.description}</p>
            </div>
          </div>
        </div>

        {/* 개발사 정보 섹션 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold">개발사 정보</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">개발사</p>
                <p className="font-medium">{DEVELOPER_INFO.company}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">대표</p>
                <p className="font-medium">{DEVELOPER_INFO.ceo.join(', ')}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">{DEVELOPER_INFO.managerRole}</p>
                <p className="font-medium">{DEVELOPER_INFO.manager}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-0.5">문의 메일</p>
                <a
                  href={`mailto:${DEVELOPER_INFO.contactEmail}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {DEVELOPER_INFO.contactEmail}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 환경 설정 섹션 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold">환경 설정</h2>
          </div>

          <div className="space-y-3">
            {/* 다크 모드 */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-gray-400" />
                ) : (
                  <Sun className="w-5 h-5 text-gray-400" />
                )}
                <div className="text-left">
                  <p className="font-medium">다크 모드</p>
                  <p className="text-xs text-gray-500">곧 지원 예정</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {theme === 'dark' ? '켜짐' : '꺼짐'}
                </span>
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                  />
                </div>
              </div>
            </button>

            {/* 푸시 알림 */}
            <button
              onClick={handlePushToggle}
              className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div className="text-left">
                  <p className="font-medium">푸시 알림</p>
                  <p className="text-xs text-gray-500">곧 지원 예정</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {pushEnabled ? '켜짐' : '꺼짐'}
                </span>
                <div
                  className={`w-11 h-6 rounded-full transition-colors ${pushEnabled ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${pushEnabled ? 'translate-x-6' : 'translate-x-0.5'
                      } mt-0.5`}
                  />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 주요 기능 섹션 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold">주요 기능</h2>
          </div>

          <div className="space-y-2">
            {FEATURES.map((feature, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2" />
                <p className="text-sm text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 기술 스택 섹션 */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Code className="w-5 h-5 text-white" />
            </div>
            <h2 className="font-bold">기술 스택</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">프론트엔드</p>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.frontend.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">백엔드</p>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.backend.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">UI 라이브러리</p>
              <div className="flex flex-wrap gap-2">
                {TECH_STACK.ui.map((tech, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 개인정보 처리방침 */}
        <button className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <span className="font-medium">개인정보 처리방침</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* 이용약관 */}
        <button className="w-full bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ExternalLink className="w-5 h-5 text-gray-400" />
            <span className="font-medium">이용약관</span>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>

        {/* 로그아웃 */}
        <button
          onClick={handleLogout}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all font-medium flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          로그아웃
        </button>

        {/* 저작권 */}
        <div className="text-center text-xs text-gray-500 pt-4">
          <p>© 2024 {DEVELOPER_INFO.company}. All rights reserved.</p>
          <p className="mt-1">Made with ❤️ for {APP_INFO.fullName}</p>
        </div>
      </div>
    </div>
  );
};