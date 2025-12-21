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

// Types
type PageType = 'home' | 'boards' | 'my' | 'settings' | 'notifications' | 'admin' | 'my-activity' | 'install';
type BoardsTab = 'notice' | 'free' | 'event';
type AdminTab = 'members' | 'stats' | 'notices';

function AppContent() {
  const { user, loading, memberStatus, isAdmin, profileComplete } = useAuth();
  const data = useData();
  useFcm();

  // Debug Logging (Dev Only) [Task A.5]
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user) {
      console.log('[Security] Auth State:', {
        uid: user.id,
        status: memberStatus,
        role: user.role,
        profileComplete
      });
    }
  }, [user, memberStatus, profileComplete]);

  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'boards' | 'my'>('home');
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [boardsTab, setBoardsTab] = useState<BoardsTab>('notice');
  const [adminInitialTab, setAdminInitialTab] = useState<AdminTab>('members');

  // --- URL Routing Logic ---

  const buildUrlState = (page: PageType, bTab: BoardsTab, aTab: AdminTab): string => {
    if (page === 'install') return '/install';
    const params = new URLSearchParams();
    if (page !== 'home') params.set('p', page);
    if (page === 'boards' && bTab !== 'notice') params.set('bt', bTab);
    if (page === 'admin' && aTab !== 'members') params.set('at', aTab);

    // Minimal URL: / if home
    const query = params.toString();
    return query ? `/?${query}` : '/';
  };

  const parseUrlState = (): { page: PageType; boardsTab: BoardsTab; adminTab: AdminTab } => {
    if (window.location.pathname === '/install') {
      return { page: 'install', boardsTab: 'notice', adminTab: 'members' };
    }

    const params = new URLSearchParams(window.location.search);
    const p = params.get('p') as PageType | null;

    // Validate Page
    let page: PageType = 'home';
    if (p && ['home', 'boards', 'my', 'settings', 'notifications', 'admin', 'my-activity', 'install'].includes(p)) {
      page = p;
    }

    // Validate Boards Tab
    const bt = params.get('bt') as BoardsTab | null;
    let bTab: BoardsTab = 'notice';
    if (bt && ['notice', 'free', 'event'].includes(bt)) {
      bTab = bt;
    }

    // Validate Admin Tab
    const at = params.get('at') as AdminTab | null;
    let aTab: AdminTab = 'members';
    if (at && ['members', 'stats', 'notices'].includes(at)) {
      aTab = at;
    }

    return { page, boardsTab: bTab, adminTab: aTab };
  };

  const applyUrlState = (state: { page: PageType; boardsTab: BoardsTab; adminTab: AdminTab }) => {
    setCurrentPage(state.page);
    setBoardsTab(state.boardsTab);
    setAdminInitialTab(state.adminTab);

    // Sync BottomNav Active Tab
    if (state.page === 'home' || state.page === 'boards' || state.page === 'my') {
      setActiveTab(state.page);
    }
  };

  // Initial Load & Popstate Listener
  React.useEffect(() => {
    // Initial
    applyUrlState(parseUrlState());

    // Listener
    const handlePopState = () => {
      applyUrlState(parseUrlState());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigation Helpers

  const navigatePage = (page: PageType) => {
    const nextState = { page, boardsTab, adminTab: adminInitialTab };
    // Reset tabs to defaults if entering page? 
    // UX: If I click "Boards" from Home, I expect 'notice' or last state?
    // Let's stick to simple: default 'notice' unless specialized.
    // If navigating to Admin, default 'members'.
    // If navigating to Boards, default 'notice'. 
    // But if we are *already* there, we shouldn't reset?
    // Let's trust 'boardsTab' state preservation if switching between main tabs?
    // Actually, BottomNav usually resets or keeps.
    // Let's KEEP current tab state when navigating away, but apply default if new?
    // User request: "navigatePage(page): pushState(..., buildUrlState(nextState))"
    // We utilize current state vars for bTab/aTab.

    const url = buildUrlState(page, boardsTab, adminInitialTab);
    window.history.pushState({}, '', url);
    applyUrlState(nextState);
  };

  const replaceBoardsTab = (tab: BoardsTab) => {
    const nextState = { page: currentPage, boardsTab: tab, adminTab: adminInitialTab };
    const url = buildUrlState(currentPage, tab, adminInitialTab);
    window.history.replaceState({}, '', url);

    // Optimization: Direct state set to avoid lag, applyUrlState also works
    applyUrlState(nextState);
  };

  const navigateToAdmin = (tab: AdminTab) => {
    const nextState = { page: 'admin' as PageType, boardsTab, adminTab: tab };
    const url = buildUrlState('admin', boardsTab, tab);
    window.history.pushState({}, '', url);
    applyUrlState(nextState);
  };

  const goBack = () => {
    window.history.back();
  };

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

  // Admin Route Gate (Role check)
  // Status check is already handled above (non-active -> AccessDeniedPage)
  if (currentPage === 'admin' && !isAdmin()) {
    return <AccessDeniedPage />;
  }

  // --- Page Config ---

  const getPageConfig = () => {
    const commonBackConfig = {
      // Show back if NOT a root page OR if we want to allow going back to previous site?
      // "TopBar onBack should call goBack when pageConfig.showBack is true"
      // Roots: home, boards, my. Others are stack.
      // With URL routing, "history.length" is browser history.
      // We can't easily know if 'back' is internal app page or external.
      // BUT, usually we show Back button for non-root pages.
      showBack: !['home', 'boards', 'my'].includes(currentPage),
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
      case 'my-activity':
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
      default: // Roots
        return {
          title: 'WINGS BASEBALL CLUB',
          showBack: false, // Roots don't show back
          onBack: undefined,
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
        onNotificationClick={() => navigatePage('notifications')}
        onLogoClick={() => navigatePage('home')}
        unreadNotificationCount={unreadNotificationCount}
      />

      <main className="min-h-screen">
        {currentPage === 'home' && <HomePage onNavigate={(page) => navigatePage(page as PageType)} />}
        {currentPage === 'boards' && (
          <BoardsPage
            initialTab={boardsTab}
            onTabChange={(t) => replaceBoardsTab(t)}
          />
        )}
        {currentPage === 'my' && (
          <MyPage
            onNavigateToSettings={() => navigatePage('settings')}
            onNavigateToAdmin={() => navigateToAdmin('members')}
            onNavigateToNoticeManage={() => navigateToAdmin('notices')}
            onNavigateToMyActivity={() => navigatePage('my-activity')}
          />
        )}
        {currentPage === 'my-activity' && <MyActivityPage />}
        {currentPage === 'settings' && <SettingsPage onBack={goBack} />}
        {currentPage === 'notifications' && <NotificationPage onBack={goBack} />}
        {currentPage === 'admin' && <AdminPage initialTab={adminInitialTab} />}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={(t) => navigatePage(t)} />

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