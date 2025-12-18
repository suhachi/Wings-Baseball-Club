import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClubProvider, useClub } from './contexts/ClubContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { InstallPrompt } from './components/InstallPrompt';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { BoardsPage } from './pages/BoardsPage';
import { MyPage } from './pages/MyPage';
import { MyActivityPage } from './pages/MyActivityPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationPage } from './pages/NotificationPage';
import { AdminPage } from './pages/AdminPage';
import { InstallPage } from './pages/InstallPage'; // Added
import { AccessDeniedPage } from './pages/AccessDeniedPage'; // ATOM-08
import { useFcm } from './hooks/useFcm'; // ATOM-13: FCM 초기화
import { Loader2 } from 'lucide-react';

type PageType = 'home' | 'boards' | 'my' | 'settings' | 'notifications' | 'admin' | 'my-activity' | 'install';

function AppContent() {
  // [DEBUG] Version Check
  console.log('%c Wings PWA v1.3-debug loaded ', 'background: #222; color: #ff00ff');

  const { user, loading, memberStatus } = useAuth(); // μATOM-0401~0402: memberStatus 추가
  const data = useData();
  useFcm(); // ATOM-13: FCM 초기화 (권한 확인, 토큰 등록, foreground 수신 핸들러)
  const [activeTab, setActiveTab] = useState<'home' | 'boards' | 'my'>('home');
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [adminInitialTab, setAdminInitialTab] = useState<'members' | 'stats' | 'notices'>('members');

  // Simple URL routing for install page
  React.useEffect(() => {
    if (window.location.pathname === '/install') {
      setCurrentPage('install');
    }
  }, []);

  // Calculate unread notification count safely
  const unreadNotificationCount = data?.notifications ? data.notifications.filter((n) => !n.read).length : 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">로딩 중...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login page
  if (!user && currentPage !== 'install') { // Allow access to install page without login
    return <LoginPage />;
  }

  // μATOM-0401: 로그인 후 members/{uid} 존재 체크
  // μATOM-0402: status==active 검증
  // μATOM-0403: Gate 실패 시 강제 이동(라우트 가드)
  // 멤버 문서가 없거나 status가 'active'가 아니면 차단
  // URL 직접 접근도 AccessDenied로 수렴
  if (user && memberStatus === 'denied') {
    return <AccessDeniedPage />;
  }

  // 멤버 상태 체크 중이면 로딩 표시
  if (user && memberStatus === 'checking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">접근 권한 확인 중...</p>
        </div>
      </div>
    );
  }

  // μATOM-0403: Gate 실패 시 강제 이동(라우트 가드)
  // memberStatus가 'active'가 아니면 모든 보호 페이지 접근 차단
  if (user && memberStatus !== 'active' && currentPage !== 'install') {
    return <AccessDeniedPage />;
  }



  // Get page title and back button config
  const getPageConfig = () => {
    switch (currentPage) {
      case 'settings':
        return {
          title: '설정',
          showBack: true,
          onBack: () => handlePageChange('my'),
          showNotification: false,
          showSettings: false
        };
      case 'notifications':
        return {
          title: '알림',
          showBack: true,
          onBack: () => handlePageChange('home'),
          showNotification: false,
          showSettings: false
        };
      case 'admin':
        return {
          title: '관리자 페이지',
          showBack: true,
          onBack: () => handlePageChange('home'),
          showNotification: false,
          showSettings: false
        };
      default:
        return {
          title: 'WINGS BASEBALL CLUB',
          showBack: false,
          showNotification: true,
          showSettings: false
        };
    }
  };

  const handleNavigate = (tab: 'home' | 'boards' | 'my') => {
    setActiveTab(tab);
    setCurrentPage(tab);
    // In a real app, you would also handle postId to show specific post details
  };

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
    // Update activeTab if it's a main tab
      if (page !== 'settings' && page !== 'notifications' && page !== 'admin') {
        setActiveTab(page as 'home' | 'boards' | 'my');
      }
  };

  const handleNavigateToAdmin = (tab: 'members' | 'stats' | 'notices' = 'members') => {
    setAdminInitialTab(tab);
    handlePageChange('admin');
  };

  const pageConfig = getPageConfig();

  if (currentPage === 'install') {
    return <InstallPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Bar */}
      <TopBar
        title={pageConfig.title}
        showBack={pageConfig.showBack}
        onBack={pageConfig.onBack}
        showNotification={pageConfig.showNotification}
        showSettings={pageConfig.showSettings}
        onNotificationClick={() => handlePageChange('notifications')}
        onLogoClick={() => handlePageChange('home')}
        unreadNotificationCount={unreadNotificationCount}
      />

      {/* Main Content */}
      <main className="min-h-screen">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'boards' && <BoardsPage />}
        {currentPage === 'my' && (
          <MyPage
            onNavigateToSettings={() => handlePageChange('settings')}
            onNavigateToAdmin={() => handleNavigateToAdmin('members')}
            onNavigateToNoticeManage={() => handleNavigateToAdmin('notices')}
            onNavigateToMyActivity={() => handlePageChange('my-activity')}
          />
        )}
        {currentPage === 'my-activity' && <MyActivityPage />}
        {currentPage === 'settings' && <SettingsPage onBack={() => handlePageChange('my')} />}
        {currentPage === 'notifications' && <NotificationPage onBack={() => handlePageChange('my')} />}
        {currentPage === 'admin' && <AdminPage initialTab={adminInitialTab} />}
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleNavigate} />

      {/* Install Prompt */}
      <InstallPrompt />

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        richColors
        closeButton
        theme="light"
      />
    </div>
  );
}

export default function App() {
  return (
    <ClubProvider>
      <AuthProviderWithClub>
        <DataProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </DataProvider>
      </AuthProviderWithClub>
    </ClubProvider>
  );
}

// μATOM-0404: Gate 성공 시 clubId 컨텍스트 고정
// ClubContext의 clubId를 AuthProvider에 전달
const AuthProviderWithClub: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentClubId } = useClub();
  return <AuthProvider clubId={currentClubId}>{children}</AuthProvider>;
};