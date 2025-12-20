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
import { InstallPage } from './pages/InstallPage';
import { AccessDeniedPage } from './pages/AccessDeniedPage';
import { useFcm } from './hooks/useFcm';
import { Loader2 } from 'lucide-react';

type PageType = 'home' | 'boards' | 'my' | 'settings' | 'notifications' | 'admin' | 'my-activity' | 'install';

function AppContent() {
  // [DEBUG] Version Check
  console.log('%c Wings PWA v1.3-debug loaded ', 'background: #222; color: #ff00ff');

  const { user, loading, memberStatus } = useAuth();
  const data = useData();
  useFcm();

  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'boards' | 'my'>('home');
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [adminInitialTab, setAdminInitialTab] = useState<'members' | 'stats' | 'notices'>('members');

  // Phase 1: History Stack
  const [history, setHistory] = useState<PageType[]>([]);

  // Simple URL routing for install page
  React.useEffect(() => {
    if (window.location.pathname === '/install') {
      setCurrentPage('install');
    }
  }, []);

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
  if (!user && currentPage !== 'install') {
    return <LoginPage />;
  }

  // Access Gate
  if (user && memberStatus === 'denied') {
    return <AccessDeniedPage />;
  }

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

  if (user && memberStatus !== 'active' && currentPage !== 'install') {
    return <AccessDeniedPage />;
  }

  // --- Phase 1: History Logic ---

  const addToHistory = (nextPage: PageType) => {
    if (nextPage === currentPage) return; // Prevent duplicates
    setHistory((prev) => [...prev, currentPage]);
  };

  const goBack = () => {
    if (history.length === 0) return;

    // Pop last page
    const prevPage = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));

    // Navigate
    setCurrentPage(prevPage);

    // Sync tab if needed
    if (prevPage === 'home' || prevPage === 'boards' || prevPage === 'my') {
      setActiveTab(prevPage);
    }
  };

  const handleNavigate = (tab: 'home' | 'boards' | 'my') => {
    if (tab === currentPage) return;
    addToHistory(tab);
    setActiveTab(tab);
    setCurrentPage(tab);
  };

  const handlePageChange = (page: PageType) => {
    if (page === currentPage) return;
    addToHistory(page);
    setCurrentPage(page);
    if (page === 'home' || page === 'boards' || page === 'my') {
      setActiveTab(page);
    }
  };

  const handleNavigateToAdmin = (tab: 'members' | 'stats' | 'notices' = 'members') => {
    setAdminInitialTab(tab);
    handlePageChange('admin');
  };

  // --- Phase 2: Universal Back Config ---

  const getPageConfig = () => {
    const commonBackConfig = {
      showBack: history.length > 0,
      onBack: goBack,
    };

    switch (currentPage) {
      case 'settings':
        return {
          title: '설정',
          ...commonBackConfig,
          showNotification: false,
          showSettings: false
        };
      case 'my-activity': // Added missing title
        return {
          title: '내 활동',
          ...commonBackConfig,
          showNotification: false,
          showSettings: false
        };
      case 'notifications':
        return {
          title: '알림',
          ...commonBackConfig,
          showNotification: false,
          showSettings: false
        };
      case 'admin':
        return {
          title: '관리자 페이지',
          ...commonBackConfig,
          showNotification: false,
          showSettings: false
        };
      default: // Roots: home, boards, my
        return {
          title: 'WINGS BASEBALL CLUB',
          ...commonBackConfig, // Roots now show back if history exists
          showNotification: true,
          showSettings: false
        };
    }
  };

  const pageConfig = getPageConfig();

  if (currentPage === 'install') {
    return <InstallPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
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
        {currentPage === 'settings' && <SettingsPage onBack={goBack} />}
        {currentPage === 'notifications' && <NotificationPage onBack={goBack} />}
        {currentPage === 'admin' && <AdminPage initialTab={adminInitialTab} />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={handleNavigate} />

      <InstallPrompt />

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

const AuthProviderWithClub: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentClubId } = useClub();
  return <AuthProvider clubId={currentClubId}>{children}</AuthProvider>;
};