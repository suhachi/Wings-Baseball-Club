import React, { useState } from 'react';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClubProvider } from './contexts/ClubContext';
import { DataProvider, useData } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { InstallPrompt } from './components/InstallPrompt';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { SchedulePage } from './pages/SchedulePage';
import { BoardsPage } from './pages/BoardsPage';
import { AlbumPage } from './pages/AlbumPage';
import { MyPage } from './pages/MyPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationPage } from './pages/NotificationPage';
import { AdminPage } from './pages/AdminPage';
import { FinancePage } from './pages/FinancePage';
import { GameRecordPage } from './pages/GameRecordPage';
import { Loader2 } from 'lucide-react';

type PageType = 'home' | 'schedule' | 'boards' | 'album' | 'my' | 'settings' | 'notifications' | 'admin' | 'finance' | 'game-record';

function AppContent() {
  const { user, loading } = useAuth();
  const data = useData();
  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'boards' | 'album' | 'my'>('home');
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [adminInitialTab, setAdminInitialTab] = useState<'members' | 'invites' | 'stats' | 'notices'>('members');

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
  if (!user) {
    return <LoginPage />;
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
      case 'finance':
        return {
          title: '재무 관리',
          showBack: true,
          onBack: () => handlePageChange('home'),
          showNotification: false,
          showSettings: false
        };
      case 'game-record':
        return {
          title: '경기 기록',
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

  const handleNavigate = (tab: 'home' | 'schedule' | 'boards' | 'album' | 'my', postId?: string) => {
    setActiveTab(tab);
    setCurrentPage(tab);
    // In a real app, you would also handle postId to show specific post details
  };

  const handlePageChange = (page: PageType) => {
    setCurrentPage(page);
    // Update activeTab if it's a main tab
    if (page !== 'settings' && page !== 'notifications' && page !== 'admin' && page !== 'finance' && page !== 'game-record') {
      setActiveTab(page as 'home' | 'schedule' | 'boards' | 'album' | 'my');
    }
  };

  const handleNavigateToAdmin = (tab: 'members' | 'invites' | 'stats' | 'notices' = 'members') => {
    setAdminInitialTab(tab);
    handlePageChange('admin');
  };

  const pageConfig = getPageConfig();

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
        unreadNotificationCount={unreadNotificationCount}
      />

      {/* Main Content */}
      <main className="min-h-screen">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'schedule' && <SchedulePage />}
        {currentPage === 'boards' && <BoardsPage />}
        {currentPage === 'album' && <AlbumPage />}
        {currentPage === 'my' && (
          <MyPage
            onNavigateToSettings={() => handlePageChange('settings')}
            onNavigateToAdmin={() => handleNavigateToAdmin('members')}
            onNavigateToFinance={() => handlePageChange('finance')}
            onNavigateToGameRecord={() => handlePageChange('game-record')}
            onNavigateToNoticeManage={() => handleNavigateToAdmin('notices')}
            onNavigateToScheduleManage={() => handleNavigate('schedule')}
          />
        )}
        {currentPage === 'settings' && <SettingsPage onBack={() => handlePageChange('my')} />}
        {currentPage === 'notifications' && <NotificationPage onBack={() => handlePageChange('my')} />}
        {currentPage === 'admin' && <AdminPage onBack={() => handlePageChange('home')} initialTab={adminInitialTab} />}
        {currentPage === 'finance' && <FinancePage onBack={() => handlePageChange('home')} />}
        {currentPage === 'game-record' && <GameRecordPage onBack={() => handlePageChange('home')} />}
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
    <AuthProvider>
      <ClubProvider>
        <DataProvider>
          <ThemeProvider>
            <AppContent />
          </ThemeProvider>
        </DataProvider>
      </ClubProvider>
    </AuthProvider>
  );
}