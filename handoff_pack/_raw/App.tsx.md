# src/app/App.tsx 원문

핵심 부분만 추출 (라우팅 및 가드 로직)

```typescript
// ... imports ...

function AppContent() {
  const { user, loading } = useAuth();
  const data = useData();
  const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'boards' | 'album' | 'my'>('home');
  const [currentPage, setCurrentPage] = useState<PageType>('home');

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

  // 인증 가드: 미로그인 시 LoginPage
  if (!user && currentPage !== 'install') {
    return <LoginPage />;
  }

  // 승인 가드: DISABLED (주석 처리됨)
  // Global Gate: Check for Pending Status - DISABLED as per new requirement
  // Pending users can access the app but have limited permissions (e.g. read-only)
  // if (user.status === 'pending' && user.role !== 'ADMIN') {
  //   return <ApprovalPendingPage />;
  // }

  // 페이지 라우팅 (State 기반)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <TopBar {...pageConfig} />
      <main className="min-h-screen">
        {currentPage === 'home' && <HomePage onNavigate={handleNavigate} />}
        {currentPage === 'schedule' && <SchedulePage />}
        {currentPage === 'boards' && <BoardsPage />}
        {currentPage === 'album' && <AlbumPage />}
        {currentPage === 'my' && <MyPage {...} />}
        {currentPage === 'admin' && <AdminPage initialTab={adminInitialTab} />}
        {currentPage === 'finance' && <FinancePage onBack={() => handlePageChange('home')} />}
        {currentPage === 'game-record' && <GameRecordPage onBack={() => handlePageChange('home')} />}
        // ... 기타 페이지들
      </main>
      <BottomNav activeTab={activeTab} onTabChange={handleNavigate} />
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
```

