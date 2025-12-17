# src/app – 앱 레이어 전체 코드

> 이 문서는 `src-app` 그룹에 속한 모든 파일의 실제 코드를 100% 포함합니다.

## src/app/App.tsx

```tsx
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
            onNavigateToAdmin={() => handlePageChange('admin')}
            onNavigateToFinance={() => handlePageChange('finance')}
            onNavigateToGameRecord={() => handlePageChange('game-record')}
          />
        )}
        {currentPage === 'settings' && <SettingsPage onBack={() => handlePageChange('my')} />}
        {currentPage === 'notifications' && <NotificationPage onBack={() => handlePageChange('my')} />}
        {currentPage === 'admin' && <AdminPage onBack={() => handlePageChange('home')} />}
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
```

## src/app/components/BottomNav.tsx

```tsx
import React from 'react';
import { Home, Calendar, MessageSquare, Image, User } from 'lucide-react';
import { motion } from 'motion/react';
interface BottomNavProps {
  activeTab: 'home' | 'schedule' | 'boards' | 'album' | 'my';
  onTabChange: (tab: 'home' | 'schedule' | 'boards' | 'album' | 'my') => void;
}
export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', label: '홈', icon: Home },
    { id: 'schedule', label: '일정', icon: Calendar },
    { id: 'boards', label: '게시판', icon: MessageSquare },
    { id: 'album', label: '앨범', icon: Image },
    { id: 'my', label: '내정보', icon: User },
  ] as const;
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200 dark:bg-gray-900/80 dark:border-gray-800 z-50 pb-safe">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center flex-1 h-full"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <Icon
                    className={`w-6 h-6 transition-colors ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600 dark:bg-blue-400"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
                <span
                  className={`text-xs mt-1 transition-colors ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
```

## src/app/components/CommentForm.tsx

```tsx
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'sonner';
interface CommentFormProps {
  postId: string;
}
export const CommentForm: React.FC<CommentFormProps> = ({ postId }) => {
  const { user } = useAuth();
  const { addComment } = useData();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error('댓글 내용을 입력해주세요');
      return;
    }
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }
    setLoading(true);
    try {
      await addComment({
        postId,
        content: content.trim(),
      });
      setContent('');
      toast.success('댓글이 작성되었습니다');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('댓글 작성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
            {user?.name?.charAt(0) || '?'}
          </div>
        </div>
        {/* Input */}
        <div className="flex-1 flex gap-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="댓글을 입력하세요..."
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
            rows={2}
            disabled={loading}
          />
          <motion.button
            type="submit"
            disabled={loading || !content.trim()}
            whileTap={{ scale: 0.95 }}
            className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </form>
  );
};
```

## src/app/components/CommentList.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Trash2, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
interface CommentListProps {
  postId: string;
}
export const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const { user, isAdmin } = useAuth();
  const { comments, users, deleteComment, toggleCommentLike } = useData();
  const postComments = comments
    .filter(c => c.postId === postId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  if (postComments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        첫 댓글을 작성해보세요!
      </div>
    );
  }
  return (
    <div className="space-y-4 mb-6">
      <AnimatePresence>
        {postComments.map((comment, index) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            index={index}
            canDelete={user?.id === comment.authorId || isAdmin()}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};
interface CommentItemProps {
  comment: any;
  index: number;
  canDelete: boolean;
}
const CommentItem: React.FC<CommentItemProps> = ({ comment, index, canDelete }) => {
  const { user } = useAuth();
  const { users, deleteComment, toggleCommentLike } = useData();
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(comment.likes?.includes(user?.id || '') || false);
  const author = users.find(u => u.id === comment.authorId);
  const handleDelete = async () => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteComment(comment.postId, comment.id);
      toast.success('댓글이 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('댓글 삭제 중 오류가 발생했습니다');
    }
  };
  const handleLike = async () => {
    if (!user) return;
    try {
      await toggleCommentLike(comment.postId, comment.id, user.id);
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {author?.name?.charAt(0) || '?'}
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{author?.name || '알 수 없음'}</span>
              {author?.nickname && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  @{author.nickname}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(comment.createdAt, 'yyyy.MM.dd HH:mm', { locale: ko })}
            </div>
          </div>
          {canDelete && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                >
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    삭제
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
        {/* Comment Text */}
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
          {comment.content}
        </p>
        {/* Actions */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${
              liked
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span>{comment.likes?.length || 0}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
```

## src/app/components/CreatePostModal.tsx

```tsx
import React, { useState } from 'react';
import { X, Calendar, FileText, BarChart3, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'sonner';
import type { PostType } from '../contexts/DataContext';
interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: PostType;
}
export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'notice',
}) => {
  const { user, isAdmin } = useAuth();
  const { addPost } = useData();
  const [postType, setPostType] = useState<PostType>(defaultType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  // Event fields
  const [eventType, setEventType] = useState<'PRACTICE' | 'GAME'>('PRACTICE');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [place, setPlace] = useState('');
  const [opponent, setOpponent] = useState('');
  // Poll fields
  const [choices, setChoices] = useState<string[]>(['', '']);
  const [multi, setMulti] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [closeDate, setCloseDate] = useState('');
  const postTypes: { id: PostType; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: 'notice', label: '공지사항', icon: FileText, adminOnly: true },
    { id: 'free', label: '자유게시판', icon: FileText },
    { id: 'event', label: '일정/출석', icon: Calendar },
    { id: 'poll', label: '투표', icon: BarChart3 },
    { id: 'album', label: '앨범', icon: ImageIcon },
  ];
  const availableTypes = isAdmin()
    ? postTypes
    : postTypes.filter(t => !t.adminOnly);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요');
      return;
    }
    setLoading(true);
    try {
      const postData: any = {
        type: postType,
        title: title.trim(),
        content: content.trim(),
        pinned: postType === 'notice',
      };
      if (postType === 'event') {
        if (!startDate || !startTime || !place) {
          toast.error('일정 정보를 모두 입력해주세요');
          setLoading(false);
          return;
        }
        const startAt = new Date(`${startDate}T${startTime}`);
        const voteCloseAt = new Date(startAt);
        voteCloseAt.setDate(voteCloseAt.getDate() - 1);
        voteCloseAt.setHours(23, 0, 0, 0);
        postData.eventType = eventType;
        postData.startAt = startAt;
        postData.place = place;
        postData.voteCloseAt = voteCloseAt;
        if (eventType === 'GAME' && opponent) {
          postData.opponent = opponent;
        }
      }
      if (postType === 'poll') {
        const validChoices = choices.filter(c => c.trim());
        if (validChoices.length < 2) {
          toast.error('선택지를 2개 이상 입력해주세요');
          setLoading(false);
          return;
        }
        postData.choices = validChoices.map((label, index) => ({
          id: `choice_${index}`,
          label,
        }));
        postData.multi = multi;
        postData.anonymous = anonymous;
        if (closeDate) {
          postData.closeAt = new Date(`${closeDate}T23:59:59`);
        }
      }
      await addPost(postData);
      toast.success('게시글이 작성되었습니다');
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('게시글 작성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };
  const resetForm = () => {
    setTitle('');
    setContent('');
    setStartDate('');
    setStartTime('');
    setPlace('');
    setOpponent('');
    setChoices(['', '']);
    setMulti(false);
    setAnonymous(false);
    setCloseDate('');
  };
  const addChoice = () => {
    if (choices.length < 10) {
      setChoices([...choices, '']);
    }
  };
  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };
  const removeChoice = (index: number) => {
    if (choices.length > 2) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="relative w-full max-w-2xl mx-4 mb-4 sm:mb-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold">게시글 작성</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Post Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">게시글 유형</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {availableTypes.map((type) => {
                      const Icon = type.icon;
                      const isActive = postType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setPostType(type.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                            isActive
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`} />
                          <span className={`text-xs ${isActive ? 'text-blue-600 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                            {type.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">제목</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                    placeholder="제목을 입력하세요"
                  />
                </div>
                {/* Content */}
                <div>
                  <label className="block text-sm font-medium mb-2">내용</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
                    placeholder="내용을 입력하세요"
                  />
                </div>
                {/* Event Fields */}
                {postType === 'event' && (
                  <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">유형</label>
                        <select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value as 'PRACTICE' | 'GAME')}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                        >
                          <option value="PRACTICE">연습</option>
                          <option value="GAME">경기</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">장소</label>
                        <input
                          type="text"
                          value={place}
                          onChange={(e) => setPlace(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                          placeholder="장소"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">날짜</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">시간</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                        />
                      </div>
                    </div>
                    {eventType === 'GAME' && (
                      <div>
                        <label className="block text-sm font-medium mb-2">상대팀</label>
                        <input
                          type="text"
                          value={opponent}
                          onChange={(e) => setOpponent(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                          placeholder="상대팀 이름"
                        />
                      </div>
                    )}
                  </div>
                )}
                {/* Poll Fields */}
                {postType === 'poll' && (
                  <div className="space-y-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium mb-2">선택지</label>
                      <div className="space-y-2">
                        {choices.map((choice, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={choice}
                              onChange={(e) => updateChoice(index, e.target.value)}
                              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                              placeholder={`선택지 ${index + 1}`}
                            />
                            {choices.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeChoice(index)}
                                className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {choices.length < 10 && (
                        <button
                          type="button"
                          onClick={addChoice}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          + 선택지 추가
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={multi}
                          onChange={(e) => setMulti(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">복수 선택 허용</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={anonymous}
                          onChange={(e) => setAnonymous(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">익명 투표</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">마감일 (선택)</label>
                      <input
                        type="date"
                        value={closeDate}
                        onChange={(e) => setCloseDate(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
                      />
                    </div>
                  </div>
                )}
              </form>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '작성 중...' : '작성하기'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
```

## src/app/components/DeleteConfirmDialog.tsx

```tsx
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}
export const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60"
          onClick={onCancel}
        />
        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6"
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          {/* Content */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </div>
          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              disabled={loading}
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
```

## src/app/components/EditPostModal.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, BarChart3, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData, Post, PostType } from '../contexts/DataContext';
import { toast } from 'sonner';
interface EditPostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
}
export const EditPostModal: React.FC<EditPostModalProps> = ({
  post,
  isOpen,
  onClose,
}) => {
  const { user, isAdmin } = useAuth();
  const { updatePost } = useData();
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [loading, setLoading] = useState(false);
  // Event fields
  const [eventType, setEventType] = useState<'PRACTICE' | 'GAME'>(post.eventType || 'PRACTICE');
  const [startDate, setStartDate] = useState(
    post.startDate ? new Date(post.startDate).toISOString().split('T')[0] : ''
  );
  const [startTime, setStartTime] = useState(
    post.startDate ? new Date(post.startDate).toTimeString().slice(0, 5) : ''
  );
  const [place, setPlace] = useState(post.place || '');
  const [opponent, setOpponent] = useState(post.opponent || '');
  // Poll fields
  const [choices, setChoices] = useState<string[]>(post.choices || ['', '']);
  const [multi, setMulti] = useState(post.multi || false);
  const [anonymous, setAnonymous] = useState(post.anonymous || false);
  const [closeDate, setCloseDate] = useState(
    post.voteCloseAt ? new Date(post.voteCloseAt).toISOString().split('T')[0] : ''
  );
  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setTitle(post.title);
      setContent(post.content);
      setEventType(post.eventType || 'PRACTICE');
      setStartDate(post.startDate ? new Date(post.startDate).toISOString().split('T')[0] : '');
      setStartTime(post.startDate ? new Date(post.startDate).toTimeString().slice(0, 5) : '');
      setPlace(post.place || '');
      setOpponent(post.opponent || '');
      setChoices(post.choices || ['', '']);
      setMulti(post.multi || false);
      setAnonymous(post.anonymous || false);
      setCloseDate(post.voteCloseAt ? new Date(post.voteCloseAt).toISOString().split('T')[0] : '');
    }
  }, [isOpen, post]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    if (!content.trim()) {
      toast.error('내용을 입력해주세요');
      return;
    }
    setLoading(true);
    try {
      const updates: Partial<Post> = {
        title: title.trim(),
        content: content.trim(),
        updatedAt: new Date(),
      };
      // Event specific fields
      if (post.type === 'event') {
        if (!startDate || !startTime) {
          toast.error('일정 날짜와 시간을 입력해주세요');
          setLoading(false);
          return;
        }
        if (!place.trim()) {
          toast.error('장소를 입력해주세요');
          setLoading(false);
          return;
        }
        const eventDateTime = new Date(`${startDate}T${startTime}`);
        updates.eventType = eventType;
        updates.startDate = eventDateTime;
        updates.place = place.trim();
        if (eventType === 'GAME' && opponent.trim()) {
          updates.opponent = opponent.trim();
        }
      }
      // Poll specific fields
      if (post.type === 'poll') {
        const validChoices = choices.filter(c => c.trim());
        if (validChoices.length < 2) {
          toast.error('투표 선택지를 최소 2개 입력해주세요');
          setLoading(false);
          return;
        }
        updates.choices = validChoices;
        updates.multi = multi;
        updates.anonymous = anonymous;
        if (closeDate) {
          updates.voteCloseAt = new Date(closeDate);
        }
      }
      await updatePost(post.id, updates);
      toast.success('게시글이 수정되었습니다');
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('게시글 수정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };
  const addChoice = () => {
    setChoices([...choices, '']);
  };
  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };
  const removeChoice = (index: number) => {
    if (choices.length > 2) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-bold">게시글 수정</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="제목을 입력하세요"
                  required
                />
              </div>
              {/* Event specific fields */}
              {post.type === 'event' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">일정 유형</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEventType('PRACTICE')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                          eventType === 'PRACTICE'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        연습
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventType('GAME')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${
                          eventType === 'GAME'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        경기
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">날짜</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">시간</label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">장소</label>
                    <input
                      type="text"
                      value={place}
                      onChange={(e) => setPlace(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="장소를 입력하세요"
                      required
                    />
                  </div>
                  {eventType === 'GAME' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">상대팀</label>
                      <input
                        type="text"
                        value={opponent}
                        onChange={(e) => setOpponent(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="상대팀을 입력하세요"
                      />
                    </div>
                  )}
                </>
              )}
              {/* Poll specific fields */}
              {post.type === 'poll' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">투표 선택지</label>
                    <div className="space-y-2">
                      {choices.map((choice, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={choice}
                            onChange={(e) => updateChoice(index, e.target.value)}
                            className="flex-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`선택지 ${index + 1}`}
                          />
                          {choices.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeChoice(index)}
                              className="px-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addChoice}
                        className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors"
                      >
                        + 선택지 추가
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={multi}
                        onChange={(e) => setMulti(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">복수 선택 허용</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={anonymous}
                        onChange={(e) => setAnonymous(e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">익명 투표</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">마감일 (선택)</label>
                    <input
                      type="date"
                      value={closeDate}
                      onChange={(e) => setCloseDate(e.target.value)}
                      className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
              {/* Content */}
              <div>
                <label className="block text-sm font-medium mb-2">내용</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="내용을 입력하세요"
                  required
                />
              </div>
            </div>
            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-4 bg-white dark:bg-gray-900 border-t">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '수정 완료'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
```

## src/app/components/FileUploadModal.tsx

```tsx
import React, { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Video, File, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'sonner';
import { Button } from './ui/button';
interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'album' | 'post';
  postId?: string;
  onUploadComplete?: (urls: string[]) => void;
}
interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'video';
}
export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  type,
  postId,
  onUploadComplete,
}) => {
  const { user } = useAuth();
  const { uploadFile, addPost } = useData();
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptedTypes = type === 'album' ? 'image/*,video/*' : 'image/*';
  const maxFiles = type === 'album' ? 10 : 5;
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`최대 ${maxFiles}개 파일만 업로드 가능합니다`);
      return;
    }
    const newPreviews: FilePreview[] = [];
    selectedFiles.forEach((file) => {
      // 파일 크기 체크 (20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`${file.name}은(는) 20MB를 초과합니다`);
        return;
      }
      // 파일 타입 체크
      const fileType = file.type.startsWith('image/') ? 'image' :
                      file.type.startsWith('video/') ? 'video' : null;
      if (!fileType) {
        toast.error(`${file.name}은(는) 지원하지 않는 형식입니다`);
        return;
      }
      // 미리보기 생성
      const preview = URL.createObjectURL(file);
      newPreviews.push({ file, preview, type: fileType });
    });
    setFiles(prev => [...prev, ...newPreviews]);
  };
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('파일을 선택해주세요');
      return;
    }
    if (type === 'album' && !title.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const uploadedUrls: string[] = [];
      const totalFiles = files.length;
      for (let i = 0; i < files.length; i++) {
        const filePreview = files[i];
        const path = type === 'album'
          ? `albums/${user.id}/${Date.now()}_${filePreview.file.name}`
          : `posts/${postId || 'temp'}/${Date.now()}_${filePreview.file.name}`;
        const url = await uploadFile(filePreview.file, path);
        uploadedUrls.push(url);
        // 진행률 업데이트
        setProgress(Math.round(((i + 1) / totalFiles) * 100));
      }
      // 앨범 타입이면 게시글 생성
      if (type === 'album') {
        await addPost({
          type: 'album',
          title: title.trim(),
          content: description.trim(),
          images: uploadedUrls,
        });
        toast.success('앨범이 업로드되었습니다');
      } else {
        // 게시글 첨부용
        onUploadComplete?.(uploadedUrls);
        toast.success('파일이 업로드되었습니다');
      }
      // 초기화
      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
      setTitle('');
      setDescription('');
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('업로드 중 오류가 발생했습니다');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-4 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">
                  {type === 'album' ? '앨범 업로드' : '파일 업로드'}
                </h2>
                <button
                  onClick={onClose}
                  disabled={uploading}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Title & Description (Album only) */}
              {type === 'album' && (
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">제목 *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                      placeholder="앨범 제목을 입력하세요"
                      disabled={uploading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">설명 (선택)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
                      placeholder="설명을 입력하세요"
                      disabled={uploading}
                    />
                  </div>
                </div>
              )}
              {/* File Upload Area */}
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  uploading
                    ? 'border-gray-300 dark:border-gray-700 cursor-not-allowed opacity-50'
                    : 'border-blue-300 dark:border-blue-700 hover:border-blue-500 dark:hover:border-blue-500 cursor-pointer'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      파일을 드래그하거나 클릭하여 선택
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {type === 'album' ? '사진, 동영상' : '이미지'} (최대 {maxFiles}개, 각 20MB 이하)
                    </p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedTypes}
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={uploading}
                />
              </div>
              {/* File Previews */}
              {files.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">
                      선택된 파일 ({files.length}/{maxFiles})
                    </p>
                    {!uploading && (
                      <button
                        onClick={() => {
                          files.forEach(f => URL.revokeObjectURL(f.preview));
                          setFiles([]);
                        }}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        전체 삭제
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {files.map((filePreview, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group"
                      >
                        {filePreview.type === 'image' ? (
                          <img
                            src={filePreview.preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        {!uploading && (
                          <button
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        {/* File Type Badge */}
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white flex items-center gap-1">
                          {filePreview.type === 'image' ? (
                            <ImageIcon className="w-3 h-3" />
                          ) : (
                            <Video className="w-3 h-3" />
                          )}
                          {filePreview.type}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
              {/* Upload Progress */}
              {uploading && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">업로드 중...</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{progress}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={uploading}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || files.length === 0 || (type === 'album' && !title.trim())}
                  className="flex-1"
                >
                  {uploading ? `업로드 중 (${progress}%)` : '업로드'}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
```

## src/app/components/InstallPrompt.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './ui/card';
import { Button } from './ui/button';
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // 사용자가 이전에 설치를 거부한 적이 없으면 보여줌
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    // 이미 설치된 경우 확인
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowPrompt(false);
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowPrompt(false);
  };
  if (!showPrompt || !deferredPrompt) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold mb-1">앱 설치하기</h3>
              <p className="text-sm text-white/90 mb-3">
                홈 화면에 추가하여 더 빠르게 접근하세요
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleInstall}
                  className="bg-white text-blue-600 hover:bg-white/90 flex-1"
                  size="sm"
                >
                  설치
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  size="sm"
                >
                  나중에
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};
```

## src/app/components/MemberPicker.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, X, Check, CheckCircle2, PlusCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
interface MemberPickerProps {
    selectedMemberIds: string[];
    onSelectionChange: (ids: string[]) => void;
    maxSelection?: number;
    label?: string;
}
export const MemberPicker: React.FC<MemberPickerProps> = ({
    selectedMemberIds,
    onSelectionChange,
    maxSelection = 10,
    label = '멤버 선택',
}) => {
    const { members } = useData();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    // Filter members based on search term
    const filteredMembers = members.filter(
        (member) =>
            member.status === 'active' &&
            (member.realName.includes(searchTerm) ||
                member.nickname?.includes(searchTerm))
    );
    const toggleSelection = (memberId: string) => {
        if (selectedMemberIds.includes(memberId)) {
            onSelectionChange(selectedMemberIds.filter((id) => id !== memberId));
        } else {
            if (selectedMemberIds.length >= maxSelection) {
                return; // Max selection reached
            }
            onSelectionChange([...selectedMemberIds, memberId]);
        }
    };
    const removeSelection = (memberId: string) => {
        onSelectionChange(selectedMemberIds.filter((id) => id !== memberId));
    };
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {label} ({selectedMemberIds.length})
                </label>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(true)}
                    type="button"
                >
                    <PlusCircle className="w-4 h-4 mr-1" />
                    추가
                </Button>
            </div>
            {/* Selected Members Chips */}
            <div className="flex flex-wrap gap-2">
                {selectedMemberIds.length === 0 && (
                    <span className="text-sm text-gray-400">선택된 멤버가 없습니다.</span>
                )}
                {selectedMemberIds.map((id) => {
                    const member = members.find((m) => m.id === id);
                    if (!member) return null;
                    return (
                        <div
                            key={id}
                            className="flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 px-2 py-1 rounded-full text-sm"
                        >
                            <span>{member.realName}</span>
                            <button
                                onClick={() => removeSelection(id)}
                                className="hover:text-purple-900 dark:hover:text-purple-100"
                                type="button"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    );
                })}
            </div>
            {/* Picker Modal */}
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col max-h-[80vh]"
                        >
                            <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
                                <h3 className="font-bold text-lg">{label}</h3>
                                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                            <div className="p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <Input
                                        placeholder="이름 또는 닉네임 검색"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
                                {filteredMembers.map((member) => {
                                    const isSelected = selectedMemberIds.includes(member.id);
                                    return (
                                        <div
                                            key={member.id}
                                            onClick={() => toggleSelection(member.id)}
                                            className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${isSelected
                                                ? 'bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
                                                : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                                                    {member.realName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{member.realName}</p>
                                                    <p className="text-xs text-gray-500">{member.nickname}</p>
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="p-4 border-t dark:border-gray-800">
                                <Button className="w-full" onClick={() => setIsOpen(false)}>
                                    완료 ({selectedMemberIds.length})
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
```

## src/app/components/PollVoteModal.tsx

```tsx
import React, { useState } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData, Post } from '../contexts/DataContext';
import { toast } from 'sonner';
import { Button } from './ui/button';
interface PollVoteModalProps {
  poll: Post;
  isOpen: boolean;
  onClose: () => void;
}
export const PollVoteModal: React.FC<PollVoteModalProps> = ({
  poll,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { votePoll, getMyVote } = useData();
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const myVote = user ? getMyVote(poll.id, user.id) : null;
  const hasVoted = myVote !== null;
  const totalVotes = poll.choices?.reduce((sum, c) => sum + (c.votes || 0), 0) || 0;
  const handleChoiceToggle = (choiceId: string) => {
    if (hasVoted) return;
    if (poll.multi) {
      // 복수 선택
      setSelectedChoices(prev =>
        prev.includes(choiceId)
          ? prev.filter(id => id !== choiceId)
          : [...prev, choiceId]
      );
    } else {
      // 단일 선택
      setSelectedChoices([choiceId]);
    }
  };
  const handleSubmit = async () => {
    if (selectedChoices.length === 0) {
      toast.error('선택지를 선택해주세요');
      return;
    }
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }
    setLoading(true);
    try {
      await votePoll(poll.id, user.id, selectedChoices);
      toast.success('투표가 완료되었습니다');
      onClose();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('투표 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{poll.title}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>총 {totalVotes}명 참여</span>
                {poll.multi && <span className="text-blue-600 dark:text-blue-400">복수 선택 가능</span>}
                {poll.anonymous && <span className="text-purple-600 dark:text-purple-400">익명 투표</span>}
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {hasVoted ? (
                // 투표 완료 - 결과 표시
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">투표 완료</span>
                    </div>
                  </div>
                  {poll.choices?.map((choice) => {
                    const percentage = totalVotes > 0 ? (choice.votes || 0) / totalVotes * 100 : 0;
                    const isMyChoice = myVote?.includes(choice.id);
                    return (
                      <div
                        key={choice.id}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isMyChoice
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{choice.label}</span>
                            {isMyChoice && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {choice.votes || 0}표
                          </span>
                        </div>
                        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className={`h-full ${
                              isMyChoice
                                ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                            }`}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}
                  {!poll.anonymous && myVote && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        투표한 선택지
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {poll.choices
                          ?.filter(c => myVote.includes(c.id))
                          .map(choice => (
                            <span
                              key={choice.id}
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                            >
                              {choice.label}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // 투표 전 - 선택지 표시
                <div className="space-y-3">
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                    {poll.multi ? '원하는 항목을 모두 선택하세요' : '하나를 선택하세요'}
                  </div>
                  {poll.choices?.map((choice) => {
                    const isSelected = selectedChoices.includes(choice.id);
                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleChoiceToggle(choice.id)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-white rounded-full"
                              />
                            )}
                          </div>
                          <span className="font-medium">{choice.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Footer */}
            {!hasVoted && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || selectedChoices.length === 0}
                    className="flex-1"
                  >
                    {loading ? '투표 중...' : '투표하기'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
```

## src/app/components/PostDetailModal.tsx

```tsx
import React, { useState } from 'react';
import { X, Heart, Share2, MoreVertical, Edit, Trash2, Pin, Calendar, MapPin, Trophy, Users, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData, Post } from '../contexts/DataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
interface PostDetailModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}
export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { user, isAdmin } = useAuth();
  const { users, deletePost, toggleLike } = useData();
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(post.likes?.includes(user?.id || '') || false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const author = users.find(u => u.id === post.authorId);
  const canEdit = user?.id === post.authorId || isAdmin();
  const canDelete = user?.id === post.authorId || isAdmin();
  const handleLike = async () => {
    if (!user) return;
    try {
      await toggleLike(post.id, user.id);
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('좋아요 처리 중 오류가 발생했습니다');
    }
  };
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다');
    }
  };
  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(post);
  };
  const handleDelete = async () => {
    setShowMenu(false);
    setShowDeleteDialog(true);
  };
  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await deletePost(post.id);
      toast.success('게시글이 삭제되었습니다');
      setShowDeleteDialog(false);
      onClose();
      onDelete?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(false);
    }
  };
  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'notice': return '공지사항';
      case 'free': return '자유게시판';
      case 'event': return '일정';
      case 'poll': return '투표';
      case 'game': return '경기';
      case 'album': return '앨범';
      default: return type;
    }
  };
  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'notice': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'free': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'event': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'poll': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'game': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'album': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-0 sm:mx-4 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getPostTypeColor(post.type)}>
                    {getPostTypeLabel(post.type)}
                  </Badge>
                  {post.pinned && (
                    <Badge variant="outline" className="gap-1">
                      <Pin className="w-3 h-3" />
                      고정
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(canEdit || canDelete) && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                        >
                          {canEdit && (
                            <button
                              onClick={handleEdit}
                              className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              수정
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={handleDelete}
                              className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              삭제
                            </button>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-6">
                {/* Title */}
                <h1 className="text-2xl font-bold">{post.title}</h1>
                {/* Author & Date */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {author?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {author?.name || '알 수 없음'}
                      </div>
                      <div className="text-xs">
                        {author?.nickname && `@${author.nickname}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs">
                    {format(post.createdAt, 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </div>
                </div>
                {/* Event Details */}
                {post.type === 'event' && (
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">일시</div>
                        <div className="font-medium">
                          {post.startAt && format(post.startAt, 'M월 d일 (E) HH:mm', { locale: ko })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">장소</div>
                        <div className="font-medium">{post.place}</div>
                      </div>
                    </div>
                    {post.opponent && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">상대팀</div>
                          <div className="font-medium">{post.opponent}</div>
                        </div>
                      </div>
                    )}
                    {post.attendanceSummary && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">참석</div>
                            <div className="font-medium text-green-600">{post.attendanceSummary.attending}명</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">불참</div>
                            <div className="font-medium text-red-600">{post.attendanceSummary.absent}명</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">미정</div>
                            <div className="font-medium text-yellow-600">{post.attendanceSummary.maybe}명</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {/* Poll Details */}
                {post.type === 'poll' && post.choices && (
                  <div className="space-y-3">
                    {post.choices.map((choice) => {
                      const totalVotes = post.choices?.reduce((sum, c) => sum + (c.votes || 0), 0) || 0;
                      const percentage = totalVotes > 0 ? (choice.votes || 0) / totalVotes * 100 : 0;
                      return (
                        <div key={choice.id} className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{choice.label}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {choice.votes || 0}표 ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {post.content}
                  </p>
                </div>
                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}
                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      liked
                        ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">
                      {post.likes?.length || 0}
                    </span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {post.commentCount || 0}
                    </span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">공유</span>
                  </button>
                </div>
                {/* Comments Section */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold text-lg mb-4">
                    댓글 {post.commentCount || 0}
                  </h3>
                  <CommentList postId={post.id} />
                  {user && <CommentForm postId={post.id} />}
                </div>
              </div>
            </div>
          </motion.div>
          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            isOpen={showDeleteDialog}
            title="게시글 삭제"
            message="정말 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다."
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteDialog(false)}
            loading={deleting}
          />
        </div>
      )}
    </AnimatePresence>
  );
};
```

## src/app/components/ProfileEditModal.tsx

```tsx
import React, { useState, useRef } from 'react';
import { X, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { uploadProfilePhoto } from '../../lib/firebase/storage.service';
import { toast } from 'sonner';
interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}
export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [position, setPosition] = useState(user?.position || '');
  const [backNumber, setBackNumber] = useState(user?.backNumber?.toString() || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const positions = [
    '투수', '포수', '1루수', '2루수', '3루수', '유격수', '좌익수', '중견수', '우익수'
  ];
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('파일 크기는 5MB 이하여야 합니다');
      return;
    }
    setPhotoFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const updates: any = {
        nickname: nickname.trim() || user.nickname,
        phone: phone.trim() || user.phone,
        position: position || user.position,
        backNumber: backNumber ? parseInt(backNumber) : user.backNumber,
      };
      // Upload photo if selected
      if (photoFile) {
        const photoURL = await uploadProfilePhoto(user.id, photoFile);
        updates.photoURL = photoURL;
      }
      await updateUser(updates);
      toast.success('프로필이 업데이트되었습니다');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('프로필 업데이트에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };
  if (!isOpen || !user) return null;
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-bold">프로필 수정</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0)
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">클릭하여 사진 변경 (최대 5MB)</p>
              </div>
              {/* Name (Read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2">이름</label>
                <input
                  type="text"
                  value={user.name}
                  disabled
                  className="w-full px-4 py-3 border rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">실명은 변경할 수 없습니다</p>
              </div>
              {/* Nickname */}
              <div>
                <label className="block text-sm font-medium mb-2">닉네임</label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="닉네임을 입력하세요"
                />
              </div>
              {/* Phone */}
              <div>
                <label className="block text-sm font-medium mb-2">연락처</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="010-1234-5678"
                />
              </div>
              {/* Position */}
              <div>
                <label className="block text-sm font-medium mb-2">포지션</label>
                <select
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
                >
                  <option value="">포지션 선택</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
              {/* Back Number */}
              <div>
                <label className="block text-sm font-medium mb-2">등번호</label>
                <input
                  type="number"
                  value={backNumber}
                  onChange={(e) => setBackNumber(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="등번호"
                  min="0"
                  max="99"
                />
              </div>
              {/* Role (Read-only) */}
              <div>
                <label className="block text-sm font-medium mb-2">역할</label>
                <input
                  type="text"
                  value={user.role === 'PRESIDENT' ? '회장' :
                         user.role === 'DIRECTOR' ? '감독' :
                         user.role === 'TREASURER' ? '총무' :
                         user.role === 'ADMIN' ? '관리자' : '일반회원'}
                  disabled
                  className="w-full px-4 py-3 border rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">역할은 관리자만 변경할 수 있습니다</p>
              </div>
            </div>
            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-4 bg-white dark:bg-gray-900 border-t">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  disabled={loading}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  {loading ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
```

## src/app/components/TopBar.tsx

```tsx
import React from 'react';
import { Bell, Settings, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
interface TopBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showNotification?: boolean;
  showSettings?: boolean;
  onNotificationClick?: () => void;
  unreadNotificationCount?: number;
}
export const TopBar: React.FC<TopBarProps> = ({
  title = 'WINGS BASEBALL CLUB',
  showBack = false,
  onBack,
  showNotification = true,
  showSettings = false,
  onNotificationClick,
  unreadNotificationCount,
}) => {
  const { isAdmin } = useAuth();
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-700 dark:to-blue-600 z-40 pt-safe">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left */}
          <div className="flex items-center gap-2">
            {showBack && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onBack}
                className="p-2 -ml-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </div>
          {/* Center */}
          <div className="flex-1 text-center">
            <h1 className="text-white font-bold tracking-tight">
              {title}
            </h1>
          </div>
          {/* Right */}
          <div className="flex items-center gap-2">
            {showNotification && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onNotificationClick}
                className="relative p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
              >
                <Bell className="w-5 h-5 text-white" />
                {unreadNotificationCount && unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </motion.button>
            )}
            {showSettings && isAdmin() && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-white/10 active:bg-white/20 transition-colors"
              >
                <Settings className="w-5 h-5 text-white" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## src/app/components/figma/ImageWithFallback.tsx

```tsx
import React, { useState } from 'react'
const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='
export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const handleError = () => {
    setDidError(true)
  }
  const { src, alt, style, className, ...rest } = props
  return didError ? (
    <div
      className={`inline-block bg-gray-100 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={src} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
```

## src/app/components/ui/accordion.tsx

```tsx
"use client";
import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "./utils";
function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}
function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}
function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}
function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pt-0 pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
```

## src/app/components/ui/alert-dialog.tsx

```tsx
"use client";
import * as React from "react";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import { cn } from "./utils";
import { buttonVariants } from "./button";
function AlertDialog({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Root>) {
  return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} />;
}
function AlertDialogTrigger({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}
function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  );
}
function AlertDialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) {
  return (
    <AlertDialogPrimitive.Overlay
      data-slot="alert-dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}
function AlertDialogContent({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Content>) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content
        data-slot="alert-dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className,
        )}
        {...props}
      />
    </AlertDialogPortal>
  );
}
function AlertDialogHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}
function AlertDialogFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
function AlertDialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Title>) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={cn("text-lg font-semibold", className)}
      {...props}
    />
  );
}
function AlertDialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Description>) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}
function AlertDialogAction({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Action>) {
  return (
    <AlertDialogPrimitive.Action
      className={cn(buttonVariants(), className)}
      {...props}
    />
  );
}
function AlertDialogCancel({
  className,
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Cancel>) {
  return (
    <AlertDialogPrimitive.Cancel
      className={cn(buttonVariants({ variant: "outline" }), className)}
      {...props}
    />
  );
}
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
```

## src/app/components/ui/alert.tsx

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}
function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className,
      )}
      {...props}
    />
  );
}
function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
export { Alert, AlertTitle, AlertDescription };
```

## src/app/components/ui/aspect-ratio.tsx

```tsx
"use client";
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio";
function AspectRatio({
  ...props
}: React.ComponentProps<typeof AspectRatioPrimitive.Root>) {
  return <AspectRatioPrimitive.Root data-slot="aspect-ratio" {...props} />;
}
export { AspectRatio };
```

## src/app/components/ui/avatar.tsx

```tsx
"use client";
import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "./utils";
function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}
function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}
function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}
export { Avatar, AvatarImage, AvatarFallback };
```

## src/app/components/ui/badge.tsx

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
export { Badge, badgeVariants };
```

## src/app/components/ui/breadcrumb.tsx

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "./utils";
function Breadcrumb({ ...props }: React.ComponentProps<"nav">) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}
function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
  return (
    <ol
      data-slot="breadcrumb-list"
      className={cn(
        "text-muted-foreground flex flex-wrap items-center gap-1.5 text-sm break-words sm:gap-2.5",
        className,
      )}
      {...props}
    />
  );
}
function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-item"
      className={cn("inline-flex items-center gap-1.5", className)}
      {...props}
    />
  );
}
function BreadcrumbLink({
  asChild,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
}) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      data-slot="breadcrumb-link"
      className={cn("hover:text-foreground transition-colors", className)}
      {...props}
    />
  );
}
function BreadcrumbPage({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-page"
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn("text-foreground font-normal", className)}
      {...props}
    />
  );
}
function BreadcrumbSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="breadcrumb-separator"
      role="presentation"
      aria-hidden="true"
      className={cn("[&>svg]:size-3.5", className)}
      {...props}
    >
      {children ?? <ChevronRight />}
    </li>
  );
}
function BreadcrumbEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      aria-hidden="true"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontal className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
```

## src/app/components/ui/button.tsx

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
export { Button, buttonVariants };
```

## src/app/components/ui/calendar.tsx

```tsx
"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "./utils";
import { buttonVariants } from "./button";
function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 font-normal aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_range_end:
          "day-range-end aria-selected:bg-primary aria-selected:text-primary-foreground",
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside:
          "day-outside text-muted-foreground aria-selected:text-muted-foreground",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}
export { Calendar };
```

## src/app/components/ui/card.tsx

```tsx
import * as React from "react";
import { cn } from "./utils";
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border",
        className,
      )}
      {...props}
    />
  );
}
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("leading-none", className)}
      {...props}
    />
  );
}
function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  );
}
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6 pb-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
```

## src/app/components/ui/carousel.tsx

```tsx
"use client";
import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "./utils";
import { Button } from "./button";
type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];
type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};
type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;
const CarouselContext = React.createContext<CarouselContextProps | null>(null);
function useCarousel() {
  const context = React.useContext(CarouselContext);
  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }
  return context;
}
function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: orientation === "horizontal" ? "x" : "y",
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const onSelect = React.useCallback((api: CarouselApi) => {
    if (!api) return;
    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());
  }, []);
  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);
  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );
  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);
  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("reInit", onSelect);
    api.on("select", onSelect);
    return () => {
      api?.off("select", onSelect);
    };
  }, [api, onSelect]);
  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api: api,
        opts,
        orientation:
          orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}
function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation } = useCarousel();
  return (
    <div
      ref={carouselRef}
      className="overflow-hidden"
      data-slot="carousel-content"
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
}
function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();
  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
}
function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();
  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}
function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();
  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}
export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
```

## src/app/components/ui/chart.tsx

```tsx
"use client";
import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "./utils";
// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};
type ChartContextProps = {
  config: ChartConfig;
};
const ChartContext = React.createContext<ChartContextProps | null>(null);
function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}
function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        className={cn(
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border flex aspect-video justify-center text-xs [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, config]) => config.theme || config.color,
  );
  if (!colorConfig.length) {
    return null;
  }
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, itemConfig]) => {
    const color =
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||
      itemConfig.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};
const ChartTooltip = RechartsPrimitive.Tooltip;
function ChartTooltipContent({
  active,
  payload,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  label,
  labelFormatter,
  labelClassName,
  formatter,
  color,
  nameKey,
  labelKey,
}: React.ComponentProps<typeof RechartsPrimitive.Tooltip> &
  React.ComponentProps<"div"> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "line" | "dot" | "dashed";
    nameKey?: string;
    labelKey?: string;
  }) {
  const { config } = useChart();
  const tooltipLabel = React.useMemo(() => {
    if (hideLabel || !payload?.length) {
      return null;
    }
    const [item] = payload;
    const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
    const itemConfig = getPayloadConfigFromPayload(config, item, key);
    const value =
      !labelKey && typeof label === "string"
        ? config[label as keyof typeof config]?.label || label
        : itemConfig?.label;
    if (labelFormatter) {
      return (
        <div className={cn("font-medium", labelClassName)}>
          {labelFormatter(value, payload)}
        </div>
      );
    }
    if (!value) {
      return null;
    }
    return <div className={cn("font-medium", labelClassName)}>{value}</div>;
  }, [
    label,
    labelFormatter,
    payload,
    hideLabel,
    labelClassName,
    config,
    labelKey,
  ]);
  if (!active || !payload?.length) {
    return null;
  }
  const nestLabel = payload.length === 1 && indicator !== "dot";
  return (
    <div
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className,
      )}
    >
      {!nestLabel ? tooltipLabel : null}
      <div className="grid gap-1.5">
        {payload.map((item, index) => {
          const key = `${nameKey || item.name || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);
          const indicatorColor = color || item.payload.fill || item.color;
          return (
            <div
              key={item.dataKey}
              className={cn(
                "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                indicator === "dot" && "items-center",
              )}
            >
              {formatter && item?.value !== undefined && item.name ? (
                formatter(item.value, item.name, item, index, item.payload)
              ) : (
                <>
                  {itemConfig?.icon ? (
                    <itemConfig.icon />
                  ) : (
                    !hideIndicator && (
                      <div
                        className={cn(
                          "shrink-0 rounded-[2px] border-(--color-border) bg-(--color-bg)",
                          {
                            "h-2.5 w-2.5": indicator === "dot",
                            "w-1": indicator === "line",
                            "w-0 border-[1.5px] border-dashed bg-transparent":
                              indicator === "dashed",
                            "my-0.5": nestLabel && indicator === "dashed",
                          },
                        )}
                        style={
                          {
                            "--color-bg": indicatorColor,
                            "--color-border": indicatorColor,
                          } as React.CSSProperties
                        }
                      />
                    )
                  )}
                  <div
                    className={cn(
                      "flex flex-1 justify-between leading-none",
                      nestLabel ? "items-end" : "items-center",
                    )}
                  >
                    <div className="grid gap-1.5">
                      {nestLabel ? tooltipLabel : null}
                      <span className="text-muted-foreground">
                        {itemConfig?.label || item.name}
                      </span>
                    </div>
                    {item.value && (
                      <span className="text-foreground font-mono font-medium tabular-nums">
                        {item.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
const ChartLegend = RechartsPrimitive.Legend;
function ChartLegendContent({
  className,
  hideIcon = false,
  payload,
  verticalAlign = "bottom",
  nameKey,
}: React.ComponentProps<"div"> &
  Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {
    hideIcon?: boolean;
    nameKey?: string;
  }) {
  const { config } = useChart();
  if (!payload?.length) {
    return null;
  }
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
    >
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemConfig = getPayloadConfigFromPayload(config, item, key);
        return (
          <div
            key={item.value}
            className={cn(
              "[&>svg]:text-muted-foreground flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3",
            )}
          >
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>
        );
      })}
    </div>
  );
}
// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string,
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }
  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined;
  let configLabelKey: string = key;
  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }
  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
};
```

## src/app/components/ui/checkbox.tsx

```tsx
"use client";
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";
import { cn } from "./utils";
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer border bg-input-background dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        <CheckIcon className="size-3.5" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
export { Checkbox };
```

## src/app/components/ui/collapsible.tsx

```tsx
"use client";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />;
}
function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  );
}
function CollapsibleContent({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      {...props}
    />
  );
}
export { Collapsible, CollapsibleTrigger, CollapsibleContent };
```

## src/app/components/ui/command.tsx

```tsx
"use client";
import * as React from "react";
import { Command as CommandPrimitive } from "cmdk";
import { SearchIcon } from "lucide-react";
import { cn } from "./utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md",
        className,
      )}
      {...props}
    />
  );
}
function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  ...props
}: React.ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
}) {
  return (
    <Dialog {...props}>
      <DialogHeader className="sr-only">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:text-muted-foreground **:data-[slot=command-input-wrapper]:h-12 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group]]:px-2 [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  );
}
function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div
      data-slot="command-input-wrapper"
      className="flex h-9 items-center gap-2 border-b px-3"
    >
      <SearchIcon className="size-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn(
          "placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}
function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-[300px] scroll-py-1 overflow-x-hidden overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}
function CommandEmpty({
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className="py-6 text-center text-sm"
      {...props}
    />
  );
}
function CommandGroup({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "text-foreground [&_[cmdk-group-heading]]:text-muted-foreground overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium",
        className,
      )}
      {...props}
    />
  );
}
function CommandSeparator({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Separator>) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("bg-border -mx-1 h-px", className)}
      {...props}
    />
  );
}
function CommandItem({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
function CommandShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}
export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
};
```

## src/app/components/ui/context-menu.tsx

```tsx
"use client";
import * as React from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "./utils";
function ContextMenu({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Root>) {
  return <ContextMenuPrimitive.Root data-slot="context-menu" {...props} />;
}
function ContextMenuTrigger({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Trigger>) {
  return (
    <ContextMenuPrimitive.Trigger data-slot="context-menu-trigger" {...props} />
  );
}
function ContextMenuGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Group>) {
  return (
    <ContextMenuPrimitive.Group data-slot="context-menu-group" {...props} />
  );
}
function ContextMenuPortal({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Portal>) {
  return (
    <ContextMenuPrimitive.Portal data-slot="context-menu-portal" {...props} />
  );
}
function ContextMenuSub({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Sub>) {
  return <ContextMenuPrimitive.Sub data-slot="context-menu-sub" {...props} />;
}
function ContextMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioGroup>) {
  return (
    <ContextMenuPrimitive.RadioGroup
      data-slot="context-menu-radio-group"
      {...props}
    />
  );
}
function ContextMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.SubTrigger
      data-slot="context-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto" />
    </ContextMenuPrimitive.SubTrigger>
  );
}
function ContextMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.SubContent>) {
  return (
    <ContextMenuPrimitive.SubContent
      data-slot="context-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
function ContextMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Content>) {
  return (
    <ContextMenuPrimitive.Portal>
      <ContextMenuPrimitive.Content
        data-slot="context-menu-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-context-menu-content-available-height) min-w-[8rem] origin-(--radix-context-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className,
        )}
        {...props}
      />
    </ContextMenuPrimitive.Portal>
  );
}
function ContextMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <ContextMenuPrimitive.Item
      data-slot="context-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
function ContextMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.CheckboxItem>) {
  return (
    <ContextMenuPrimitive.CheckboxItem
      data-slot="context-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.CheckboxItem>
  );
}
function ContextMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.RadioItem>) {
  return (
    <ContextMenuPrimitive.RadioItem
      data-slot="context-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <ContextMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </ContextMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </ContextMenuPrimitive.RadioItem>
  );
}
function ContextMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <ContextMenuPrimitive.Label
      data-slot="context-menu-label"
      data-inset={inset}
      className={cn(
        "text-foreground px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  );
}
function ContextMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof ContextMenuPrimitive.Separator>) {
  return (
    <ContextMenuPrimitive.Separator
      data-slot="context-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}
function ContextMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="context-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
};
```

## src/app/components/ui/dialog.tsx

```tsx
"use client";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "./utils";
function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}
function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}
function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}
function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}
function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}
function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4">
          <XIcon />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}
function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}
function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}
function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}
export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
```

## src/app/components/ui/drawer.tsx

```tsx
"use client";
import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "./utils";
function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}
function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />;
}
function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}
function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />;
}
function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}
function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className,
        )}
        {...props}
      >
        <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}
function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}
function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}
function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}
function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}
export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
```

## src/app/components/ui/dropdown-menu.tsx

```tsx
"use client";
import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "./utils";
function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}
function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}
function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}
function DropdownMenuContent({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--radix-dropdown-menu-content-available-height) min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border p-1 shadow-md",
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}
function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}
function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}
function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}
function DropdownMenuRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-sm py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}
function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  );
}
function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}
function DropdownMenuShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}
function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}
function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[inset]:pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-4" />
    </DropdownMenuPrimitive.SubTrigger>
  );
}
function DropdownMenuSubContent({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-dropdown-menu-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
```

## src/app/components/ui/form.tsx

```tsx
"use client";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { cn } from "./utils";
import { Label } from "./label";
const Form = FormProvider;
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};
const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);
const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  const { id } = itemContext;
  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};
type FormItemContextValue = {
  id: string;
};
const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);
function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}
function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  const { error, formItemId } = useFormField();
  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}
function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();
  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}
function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();
  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}
function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;
  if (!body) {
    return null;
  }
  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  );
}
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
```

## src/app/components/ui/hover-card.tsx

```tsx
"use client";
import * as React from "react";
import * as HoverCardPrimitive from "@radix-ui/react-hover-card";
import { cn } from "./utils";
function HoverCard({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  return <HoverCardPrimitive.Root data-slot="hover-card" {...props} />;
}
function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return (
    <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  );
}
function HoverCardContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  return (
    <HoverCardPrimitive.Portal data-slot="hover-card-portal">
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-64 origin-(--radix-hover-card-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className,
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}
export { HoverCard, HoverCardTrigger, HoverCardContent };
```

## src/app/components/ui/input-otp.tsx

```tsx
"use client";
import * as React from "react";
import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import { cn } from "./utils";
function InputOTP({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string;
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "flex items-center gap-2 has-disabled:opacity-50",
        containerClassName,
      )}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}
function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  );
}
function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number;
}) {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};
  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn(
        "data-[active=true]:border-ring data-[active=true]:ring-ring/50 data-[active=true]:aria-invalid:ring-destructive/20 dark:data-[active=true]:aria-invalid:ring-destructive/40 aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive dark:bg-input/30 border-input relative flex h-9 w-9 items-center justify-center border-y border-r text-sm bg-input-background transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md data-[active=true]:z-10 data-[active=true]:ring-[3px]",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink bg-foreground h-4 w-px duration-1000" />
        </div>
      )}
    </div>
  );
}
function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="input-otp-separator" role="separator" {...props}>
      <MinusIcon />
    </div>
  );
}
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator };
```

## src/app/components/ui/input.tsx

```tsx
import * as React from "react";
import { cn } from "./utils";
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base bg-input-background transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}
export { Input };
```

## src/app/components/ui/label.tsx

```tsx
"use client";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "./utils";
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
export { Label };
```

## src/app/components/ui/menubar.tsx

```tsx
"use client";
import * as React from "react";
import * as MenubarPrimitive from "@radix-ui/react-menubar";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "./utils";
function Menubar({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Root>) {
  return (
    <MenubarPrimitive.Root
      data-slot="menubar"
      className={cn(
        "bg-background flex h-9 items-center gap-1 rounded-md border p-1 shadow-xs",
        className,
      )}
      {...props}
    />
  );
}
function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu data-slot="menubar-menu" {...props} />;
}
function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group data-slot="menubar-group" {...props} />;
}
function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal data-slot="menubar-portal" {...props} />;
}
function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return (
    <MenubarPrimitive.RadioGroup data-slot="menubar-radio-group" {...props} />
  );
}
function MenubarTrigger({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Trigger>) {
  return (
    <MenubarPrimitive.Trigger
      data-slot="menubar-trigger"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex items-center rounded-sm px-2 py-1 text-sm font-medium outline-hidden select-none",
        className,
      )}
      {...props}
    />
  );
}
function MenubarContent({
  className,
  align = "start",
  alignOffset = -4,
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Content>) {
  return (
    <MenubarPortal>
      <MenubarPrimitive.Content
        data-slot="menubar-content"
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[12rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-md",
          className,
        )}
        {...props}
      />
    </MenubarPortal>
  );
}
function MenubarItem({
  className,
  inset,
  variant = "default",
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
}) {
  return (
    <MenubarPrimitive.Item
      data-slot="menubar-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:*:[svg]:!text-destructive [&_svg:not([class*='text-'])]:text-muted-foreground relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
function MenubarCheckboxItem({
  className,
  children,
  checked,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.CheckboxItem>) {
  return (
    <MenubarPrimitive.CheckboxItem
      data-slot="menubar-checkbox-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      checked={checked}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.CheckboxItem>
  );
}
function MenubarRadioItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioItem>) {
  return (
    <MenubarPrimitive.RadioItem
      data-slot="menubar-radio-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-xs py-1.5 pr-2 pl-8 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute left-2 flex size-3.5 items-center justify-center">
        <MenubarPrimitive.ItemIndicator>
          <CircleIcon className="size-2 fill-current" />
        </MenubarPrimitive.ItemIndicator>
      </span>
      {children}
    </MenubarPrimitive.RadioItem>
  );
}
function MenubarLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Label> & {
  inset?: boolean;
}) {
  return (
    <MenubarPrimitive.Label
      data-slot="menubar-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1.5 text-sm font-medium data-[inset]:pl-8",
        className,
      )}
      {...props}
    />
  );
}
function MenubarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Separator>) {
  return (
    <MenubarPrimitive.Separator
      data-slot="menubar-separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}
function MenubarShortcut({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="menubar-shortcut"
      className={cn(
        "text-muted-foreground ml-auto text-xs tracking-widest",
        className,
      )}
      {...props}
    />
  );
}
function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />;
}
function MenubarSubTrigger({
  className,
  inset,
  children,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubTrigger> & {
  inset?: boolean;
}) {
  return (
    <MenubarPrimitive.SubTrigger
      data-slot="menubar-sub-trigger"
      data-inset={inset}
      className={cn(
        "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground flex cursor-default items-center rounded-sm px-2 py-1.5 text-sm outline-none select-none data-[inset]:pl-8",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto h-4 w-4" />
    </MenubarPrimitive.SubTrigger>
  );
}
function MenubarSubContent({
  className,
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.SubContent>) {
  return (
    <MenubarPrimitive.SubContent
      data-slot="menubar-sub-content"
      className={cn(
        "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[8rem] origin-(--radix-menubar-content-transform-origin) overflow-hidden rounded-md border p-1 shadow-lg",
        className,
      )}
      {...props}
    />
  );
}
export {
  Menubar,
  MenubarPortal,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarGroup,
  MenubarSeparator,
  MenubarLabel,
  MenubarItem,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
};
```

## src/app/components/ui/navigation-menu.tsx

```tsx
import * as React from "react";
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu";
import { cva } from "class-variance-authority";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "./utils";
function NavigationMenu({
  className,
  children,
  viewport = true,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Root> & {
  viewport?: boolean;
}) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      data-viewport={viewport}
      className={cn(
        "group/navigation-menu relative flex max-w-max flex-1 items-center justify-center",
        className,
      )}
      {...props}
    >
      {children}
      {viewport && <NavigationMenuViewport />}
    </NavigationMenuPrimitive.Root>
  );
}
function NavigationMenuList({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.List>) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn(
        "group flex flex-1 list-none items-center justify-center gap-1",
        className,
      )}
      {...props}
    />
  );
}
function NavigationMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Item>) {
  return (
    <NavigationMenuPrimitive.Item
      data-slot="navigation-menu-item"
      className={cn("relative", className)}
      {...props}
    />
  );
}
const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=open]:hover:bg-accent data-[state=open]:text-accent-foreground data-[state=open]:focus:bg-accent data-[state=open]:bg-accent/50 focus-visible:ring-ring/50 outline-none transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1",
);
function NavigationMenuTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Trigger>) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(navigationMenuTriggerStyle(), "group", className)}
      {...props}
    >
      {children}{" "}
      <ChevronDownIcon
        className="relative top-[1px] ml-1 size-3 transition duration-300 group-data-[state=open]:rotate-180"
        aria-hidden="true"
      />
    </NavigationMenuPrimitive.Trigger>
  );
}
function NavigationMenuContent({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Content>) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 top-0 left-0 w-full p-2 pr-2.5 md:absolute md:w-auto",
        "group-data-[viewport=false]/navigation-menu:bg-popover group-data-[viewport=false]/navigation-menu:text-popover-foreground group-data-[viewport=false]/navigation-menu:data-[state=open]:animate-in group-data-[viewport=false]/navigation-menu:data-[state=closed]:animate-out group-data-[viewport=false]/navigation-menu:data-[state=closed]:zoom-out-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:zoom-in-95 group-data-[viewport=false]/navigation-menu:data-[state=open]:fade-in-0 group-data-[viewport=false]/navigation-menu:data-[state=closed]:fade-out-0 group-data-[viewport=false]/navigation-menu:top-full group-data-[viewport=false]/navigation-menu:mt-1.5 group-data-[viewport=false]/navigation-menu:overflow-hidden group-data-[viewport=false]/navigation-menu:rounded-md group-data-[viewport=false]/navigation-menu:border group-data-[viewport=false]/navigation-menu:shadow group-data-[viewport=false]/navigation-menu:duration-200 **:data-[slot=navigation-menu-link]:focus:ring-0 **:data-[slot=navigation-menu-link]:focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}
function NavigationMenuViewport({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Viewport>) {
  return (
    <div
      className={cn(
        "absolute top-full left-0 isolate z-50 flex justify-center",
      )}
    >
      <NavigationMenuPrimitive.Viewport
        data-slot="navigation-menu-viewport"
        className={cn(
          "origin-top-center bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border shadow md:w-[var(--radix-navigation-menu-viewport-width)]",
          className,
        )}
        {...props}
      />
    </div>
  );
}
function NavigationMenuLink({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Link>) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "data-[active=true]:focus:bg-accent data-[active=true]:hover:bg-accent data-[active=true]:bg-accent/50 data-[active=true]:text-accent-foreground hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus-visible:ring-ring/50 [&_svg:not([class*='text-'])]:text-muted-foreground flex flex-col gap-1 rounded-sm p-2 text-sm transition-all outline-none focus-visible:ring-[3px] focus-visible:outline-1 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
function NavigationMenuIndicator({
  className,
  ...props
}: React.ComponentProps<typeof NavigationMenuPrimitive.Indicator>) {
  return (
    <NavigationMenuPrimitive.Indicator
      data-slot="navigation-menu-indicator"
      className={cn(
        "data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden",
        className,
      )}
      {...props}
    >
      <div className="bg-border relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm shadow-md" />
    </NavigationMenuPrimitive.Indicator>
  );
}
export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
  navigationMenuTriggerStyle,
};
```

## src/app/components/ui/pagination.tsx

```tsx
import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";
import { cn } from "./utils";
import { Button, buttonVariants } from "./button";
function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn("mx-auto flex w-full justify-center", className)}
      {...props}
    />
  );
}
function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex flex-row items-center gap-1", className)}
      {...props}
    />
  );
}
function PaginationItem({ ...props }: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />;
}
type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">;
function PaginationLink({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) {
  return (
    <a
      aria-current={isActive ? "page" : undefined}
      data-slot="pagination-link"
      data-active={isActive}
      className={cn(
        buttonVariants({
          variant: isActive ? "outline" : "ghost",
          size,
        }),
        className,
      )}
      {...props}
    />
  );
}
function PaginationPrevious({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pl-2.5", className)}
      {...props}
    >
      <ChevronLeftIcon />
      <span className="hidden sm:block">Previous</span>
    </PaginationLink>
  );
}
function PaginationNext({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-2.5 sm:pr-2.5", className)}
      {...props}
    >
      <span className="hidden sm:block">Next</span>
      <ChevronRightIcon />
    </PaginationLink>
  );
}
function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn("flex size-9 items-center justify-center", className)}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}
export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
```

## src/app/components/ui/popover.tsx

```tsx
"use client";
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "./utils";
function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}
function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}
function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}
function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };
```

## src/app/components/ui/progress.tsx

```tsx
"use client";
import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "./utils";
function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-primary/20 relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="bg-primary h-full w-full flex-1 transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
export { Progress };
```

## src/app/components/ui/radio-group.tsx

```tsx
"use client";
import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { CircleIcon } from "lucide-react";
import { cn } from "./utils";
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid gap-3", className)}
      {...props}
    />
  );
}
function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="relative flex items-center justify-center"
      >
        <CircleIcon className="fill-primary absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
}
export { RadioGroup, RadioGroupItem };
```

## src/app/components/ui/resizable.tsx

```tsx
"use client";
import * as React from "react";
import { GripVerticalIcon } from "lucide-react";
import * as ResizablePrimitive from "react-resizable-panels";
import { cn } from "./utils";
function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}
function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}
function ResizableHandle({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean;
}) {
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        "bg-border focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="bg-border z-10 flex h-4 w-3 items-center justify-center rounded-xs border">
          <GripVerticalIcon className="size-2.5" />
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
```

## src/app/components/ui/scroll-area.tsx

```tsx
"use client";
import * as React from "react";
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area";
import { cn } from "./utils";
function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        className="focus-visible:ring-ring/50 size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>) {
  return (
    <ScrollAreaPrimitive.ScrollAreaScrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.ScrollAreaThumb
        data-slot="scroll-area-thumb"
        className="bg-border relative flex-1 rounded-full"
      />
    </ScrollAreaPrimitive.ScrollAreaScrollbar>
  );
}
export { ScrollArea, ScrollBar };
```

## src/app/components/ui/select.tsx

```tsx
"use client";
import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "lucide-react";
import { cn } from "./utils";
function Select({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}
function SelectGroup({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}
function SelectValue({
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}
function SelectTrigger({
  className,
  size = "default",
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
  size?: "sm" | "default";
}) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size}
      className={cn(
        "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-input-background px-3 py-2 text-sm whitespace-nowrap transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon className="size-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}
function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        className={cn(
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] origin-(--radix-select-content-transform-origin) overflow-x-hidden overflow-y-auto rounded-md border shadow-md",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className,
        )}
        position={position}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn(
            "p-1",
            position === "popper" &&
              "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)] scroll-my-1",
          )}
        >
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}
function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn("text-muted-foreground px-2 py-1.5 text-xs", className)}
      {...props}
    />
  );
}
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
        className,
      )}
      {...props}
    >
      <span className="absolute right-2 flex size-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon className="size-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}
function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("bg-border pointer-events-none -mx-1 my-1 h-px", className)}
      {...props}
    />
  );
}
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronUpIcon className="size-4" />
    </SelectPrimitive.ScrollUpButton>
  );
}
function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        "flex cursor-default items-center justify-center py-1",
        className,
      )}
      {...props}
    >
      <ChevronDownIcon className="size-4" />
    </SelectPrimitive.ScrollDownButton>
  );
}
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
```

## src/app/components/ui/separator.tsx

```tsx
"use client";
import * as React from "react";
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "./utils";
function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator-root"
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
        className,
      )}
      {...props}
    />
  );
}
export { Separator };
```

## src/app/components/ui/sheet.tsx

```tsx
"use client";
import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";
import { cn } from "./utils";
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />;
}
function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />;
}
function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />;
}
function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />;
}
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className,
      )}
      {...props}
    />
  );
}
function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: "top" | "right" | "bottom" | "left";
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
            "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm",
          side === "left" &&
            "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm",
          side === "top" &&
            "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
            "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          className,
        )}
        {...props}
      >
        {children}
        <SheetPrimitive.Close className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
          <XIcon className="size-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
}
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}
function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  );
}
function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}
export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
```

## src/app/components/ui/sidebar.tsx

```tsx
"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { VariantProps, cva } from "class-variance-authority";
import { PanelLeftIcon } from "lucide-react";
import { useIsMobile } from "./use-mobile";
import { cn } from "./utils";
import { Button } from "./button";
import { Input } from "./input";
import { Separator } from "./separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { Skeleton } from "./skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
const SIDEBAR_COOKIE_NAME = "sidebar_state";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";
type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};
const SidebarContext = React.createContext<SidebarContextProps | null>(null);
function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }
  return context;
}
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const [openMobile, setOpenMobile] = React.useState(false);
  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
    },
    [setOpenProp, open],
  );
  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);
  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);
  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";
  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );
  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  );
}
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar();
  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-(--sidebar-width) p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }
  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-(--sidebar-width) bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-(--sidebar-width) transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("size-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
}
function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className,
      )}
      {...props}
    />
  );
}
function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className,
      )}
      {...props}
    />
  );
}
function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  );
}
function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}
function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}
function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  );
}
function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}
function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  );
}
function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className,
      )}
      {...props}
    />
  );
}
function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}
function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  );
}
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  );
}
function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}
const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  isActive?: boolean;
  tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button";
  const { isMobile, state } = useSidebar();
  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
  if (!tooltip) {
    return button;
  }
  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    };
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  );
}
function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className,
      )}
      {...props}
    />
  );
}
function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}
function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);
  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-(--skeleton-width) flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}
function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}
function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}
function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
}) {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline-hidden focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}
export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
};
```

## src/app/components/ui/skeleton.tsx

```tsx
import { cn } from "./utils";
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}
export { Skeleton };
```

## src/app/components/ui/slider.tsx

```tsx
"use client";
import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "./utils";
function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : [min, max],
    [value, defaultValue, min, max],
  );
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-4 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
export { Slider };
```

## src/app/components/ui/sonner.tsx

```tsx
"use client";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};
export { Toaster };
```

## src/app/components/ui/switch.tsx

```tsx
"use client";
import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "./utils";
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-switch-background focus-visible:border-ring focus-visible:ring-ring/50 dark:data-[state=unchecked]:bg-input/80 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border border-transparent transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "bg-card dark:data-[state=unchecked]:bg-card-foreground dark:data-[state=checked]:bg-primary-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0",
        )}
      />
    </SwitchPrimitive.Root>
  );
}
export { Switch };
```

## src/app/components/ui/table.tsx

```tsx
"use client";
import * as React from "react";
import { cn } from "./utils";
function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  );
}
function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}
function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}
function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
      )}
      {...props}
    />
  );
}
function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
        className,
      )}
      {...props}
    />
  );
}
function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "text-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}
function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
      )}
      {...props}
    />
  );
}
function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
```

## src/app/components/ui/tabs.tsx

```tsx
"use client";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "./utils";
function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] flex",
        className,
      )}
      {...props}
    />
  );
}
function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "data-[state=active]:bg-card dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}
function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}
export { Tabs, TabsList, TabsTrigger, TabsContent };
```

## src/app/components/ui/textarea.tsx

```tsx
import * as React from "react";
import { cn } from "./utils";
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "resize-none border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md border bg-input-background px-3 py-2 text-base transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      {...props}
    />
  );
}
export { Textarea };
```

## src/app/components/ui/toggle-group.tsx

```tsx
"use client";
import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
import { toggleVariants } from "./toggle";
const ToggleGroupContext = React.createContext<
  VariantProps<typeof toggleVariants>
>({
  size: "default",
  variant: "default",
});
function ToggleGroup({
  className,
  variant,
  size,
  children,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      data-variant={variant}
      data-size={size}
      className={cn(
        "group/toggle-group flex w-fit items-center rounded-md data-[variant=outline]:shadow-xs",
        className,
      )}
      {...props}
    >
      <ToggleGroupContext.Provider value={{ variant, size }}>
        {children}
      </ToggleGroupContext.Provider>
    </ToggleGroupPrimitive.Root>
  );
}
function ToggleGroupItem({
  className,
  children,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item> &
  VariantProps<typeof toggleVariants>) {
  const context = React.useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      data-variant={context.variant || variant}
      data-size={context.size || size}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size,
        }),
        "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10 data-[variant=outline]:border-l-0 data-[variant=outline]:first:border-l",
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
}
export { ToggleGroup, ToggleGroupItem };
```

## src/app/components/ui/toggle.tsx

```tsx
"use client";
import * as React from "react";
import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";
const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium hover:bg-muted hover:text-muted-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-[color,box-shadow] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}
export { Toggle, toggleVariants };
```

## src/app/components/ui/tooltip.tsx

```tsx
"use client";
import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "./utils";
function TooltipProvider({
  delayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}
function Tooltip({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}
function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}
function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
```

## src/app/components/ui/use-mobile.ts

```ts
import * as React from "react";
const MOBILE_BREAKPOINT = 768;
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return !!isMobile;
}
```

## src/app/components/ui/utils.ts

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## src/app/contexts/AuthContext.tsx

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  redeemInviteCode,
  getCurrentUserData,
  updateUserData,
  logout as firebaseLogout,
  onAuthStateChange,
  isAdmin as checkIsAdmin,
  isTreasury as checkIsTreasury,
  canRecordGame,
} from '../../lib/firebase/auth.service';
import type { UserDoc, UserRole } from '../../lib/firebase/types';
// User roles
export type { UserRole };
export interface User {
  id: string;
  realName: string;
  nickname?: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  position?: string;
  backNumber?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (code: string, realName: string, nickname?: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAdmin: () => boolean;
  isTreasury: () => boolean;
  isRecorder: (postId: string) => boolean;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    // Firebase 인증 상태 감지
    const unsubscribe = onAuthStateChange(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Firestore에서 사용자 데이터 가져오기
        const userData = await getCurrentUserData(firebaseUser.uid);
        if (userData) {
          setUser({
            id: userData.uid,
            realName: userData.realName,
            nickname: userData.nickname,
            phone: userData.phone,
            photoURL: userData.photoURL,
            role: userData.role,
            position: userData.position,
            backNumber: userData.backNumber,
            status: userData.status,
            createdAt: userData.createdAt,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const login = async (code: string, realName: string, nickname?: string, phone?: string) => {
    try {
      setLoading(true);
      const userData = await redeemInviteCode(code, realName);
      setUser({
        id: userData.id,
        realName: userData.realName,
        nickname: userData.nickname,
        phone: userData.phone,
        photoURL: userData.photoURL,
        role: userData.role,
        position: userData.position,
        backNumber: userData.backNumber,
        status: userData.status,
        createdAt: userData.createdAt,
      });
    } catch (error: any) {
      // Suppress console error for offline state
      if (error.code !== 'unavailable') {
        console.error('❌ Login error:', error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };
  const logout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        await updateUserData(user.id, updates as Partial<UserDoc>);
        setUser({ ...user, ...updates });
      } catch (error) {
        console.error('Update user error:', error);
        throw error;
      }
    }
  };
  const isAdmin = () => {
    return user ? checkIsAdmin(user.role) : false;
  };
  const isTreasury = () => {
    return user ? checkIsTreasury(user.role) : false;
  };
  const isRecorder = (postId: string) => {
    // 실제로는 Firestore에서 해당 게시글의 recorders 배열을 확인해야 함
    // 지금은 관리자면 기록 가능하도록
    return user ? canRecordGame(user.role) : false;
  };
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin, isTreasury, isRecorder }}>
      {children}
    </AuthContext.Provider>
  );
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

## src/app/contexts/ClubContext.tsx

```tsx
import React, { createContext, useContext, useState } from 'react';
interface ClubContextType {
  currentClubId: string;
  setCurrentClubId: (id: string) => void;
}
const ClubContext = createContext<ClubContextType | undefined>(undefined);
export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to a hardcoded club ID for the prototype/v1.0
  // In a real multi-club app, this would be determined by URL or user selection
  const [currentClubId, setCurrentClubId] = useState<string>('default-club');
  return (
    <ClubContext.Provider value={{ currentClubId, setCurrentClubId }}>
      {children}
    </ClubContext.Provider>
  );
};
export const useClub = () => {
  const context = useContext(ClubContext);
  if (context === undefined) {
    throw new Error('useClub must be used within a ClubProvider');
  }
  return context;
};
```

## src/app/contexts/DataContext.tsx

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useClub } from './ClubContext';
import {
  getPosts,
  createPost as createPostInDb,
  updatePost as updatePostInDb,
  deletePost as deletePostInDb,
  getComments,
  addComment as addCommentInDb,
  deleteComment as deleteCommentInDb,
  getAttendances,
  updateAttendance as updateAttendanceInDb,
  getUserAttendance,
  getMembers,
  getUserNotifications,
  markNotificationAsRead as markNotificationAsReadInDb,
  markAllNotificationsAsRead as markAllNotificationsAsReadInDb,
} from '../../lib/firebase/firestore.service';
import type { PostDoc, CommentDoc, AttendanceDoc, AttendanceStatus, PostType, NotificationDoc } from '../../lib/firebase/types';
// Re-export types
export type { PostType, AttendanceStatus };
export interface Post {
  id: string;
  type: PostType;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    photoURL?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
  commentCount?: number;
  // Event specific
  eventType?: 'PRACTICE' | 'GAME';
  startAt?: Date;
  place?: string;
  opponent?: string;
  voteCloseAt?: Date;
  voteClosed?: boolean;
  attendanceSummary?: {
    attending: number;
    absent: number;
    maybe: number;
  };
  // Poll specific
  choices?: Array<{ id: string; label: string; count: number }>;
  multi?: boolean;
  anonymous?: boolean;
  closeAt?: Date;
  closed?: boolean;
  // Game specific
  gameType?: 'LEAGUE' | 'PRACTICE';
  score?: { our: number; opp: number };
  recorders?: string[];
  recordingLocked?: boolean;
  recordingLockedAt?: Date;
  recordingLockedBy?: string;
  // Album specific
  mediaUrl?: string;
  mediaType?: 'photo' | 'video';
  // Push specific
  pushStatus?: 'SENT' | 'FAILED' | 'PENDING';
}
export interface Comment {
  id: string;
  postId: string;
  content: string;
  author: {
    id: string;
    name: string;
    photoURL?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
export interface Attendance {
  postId: string;
  userId: string;
  status: AttendanceStatus;
  updatedAt: Date;
}
export interface AttendanceRecord {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  status: AttendanceStatus;
  updatedAt: Date;
}
export interface Member {
  id: string;
  realName: string;
  nickname?: string;
  photoURL?: string;
  role: string;
  position?: string;
  backNumber?: string;
  status: 'active' | 'inactive';
}
export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}
interface DataContextType {
  posts: Post[];
  comments: Record<string, Comment[]>;
  attendances: Record<string, Attendance[]>;
  attendanceRecords: AttendanceRecord[];
  members: Member[];
  notifications: Notification[];
  loading: boolean;
  refreshPosts: () => Promise<void>;
  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author'>) => Promise<void>;
  updatePost: (id: string, updates: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  loadComments: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  updateAttendance: (postId: string, userId: string, status: AttendanceStatus) => Promise<void>;
  getMyAttendance: (postId: string, userId: string) => AttendanceStatus;
  loadAttendances: (postId: string) => Promise<void>;
  loadNotifications: () => Promise<void>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
}
const DataContext = createContext<DataContextType | undefined>(undefined);
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentClubId } = useClub();
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [attendances, setAttendances] = useState<Record<string, Attendance[]>>({});
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  // 게시글 로드
  const refreshPosts = async () => {
    try {
      setLoading(true);
      const postsData = await getPosts(currentClubId);
      // Firebase PostDoc을 Post로 변환
      const transformedPosts: Post[] = postsData.map((postDoc) => {
        const post: Post = {
          id: postDoc.id,
          type: postDoc.type,
          title: postDoc.title,
          content: postDoc.content,
          author: {
            id: postDoc.authorId,
            name: postDoc.authorName,
            photoURL: postDoc.authorPhotoURL,
          },
          createdAt: postDoc.createdAt,
          updatedAt: postDoc.updatedAt,
          pinned: postDoc.pinned,
          commentCount: 0, // 나중에 계산
        };
        // Event specific
        if (postDoc.eventType) {
          post.eventType = postDoc.eventType;
          post.startAt = postDoc.startAt;
          post.place = postDoc.place;
          post.opponent = postDoc.opponent;
          post.voteCloseAt = postDoc.voteCloseAt;
          post.voteClosed = postDoc.voteClosed;
        }
        // Poll specific
        if (postDoc.choices) {
          post.choices = postDoc.choices.map((choice) => ({
            id: choice.id,
            label: choice.label,
            count: choice.votes?.length || 0,
          }));
          post.multi = postDoc.multi;
          post.anonymous = postDoc.anonymous;
          post.closeAt = postDoc.closeAt;
          post.closed = postDoc.closed;
        }
        // Game specific
        if (postDoc.gameType) {
          post.gameType = postDoc.gameType;
          post.score = postDoc.score;
          post.recorders = postDoc.recorders;
          post.recordingLocked = postDoc.recordingLocked;
          post.recordingLockedAt = postDoc.recordingLockedAt;
          post.recordingLockedBy = postDoc.recordingLockedBy;
        }
        // Album specific
        if (postDoc.mediaUrls && postDoc.mediaUrls.length > 0) {
          post.mediaUrl = postDoc.mediaUrls[0];
          post.mediaType = postDoc.mediaType;
        }
        // Push specific
        if (postDoc.pushStatus) {
          post.pushStatus = postDoc.pushStatus;
        }
        return post;
      });
      setPosts(transformedPosts);
      // 각 게시글의 출석 현황 로드 (이벤트 타입만)
      for (const post of transformedPosts) {
        if (post.type === 'event') {
          await loadAttendances(post.id);
        }
      }
    } catch (error) {
      console.error('Error refreshing posts:', error);
    } finally {
      setLoading(false);
    }
  };
  // 멤버 로드
  const loadMembers = async () => {
    try {
      const membersData = await getMembers(currentClubId);
      setMembers(membersData);
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };
  // 알림 로드
  const loadNotifications = async () => {
    if (!user) return;
    try {
      const notificationsData = await getUserNotifications(user.id);
      const transformedNotifications: Notification[] = notificationsData.map((notificationDoc) => ({
        id: notificationDoc.id,
        type: notificationDoc.type,
        title: notificationDoc.title,
        message: notificationDoc.message,
        link: notificationDoc.link,
        read: notificationDoc.read,
        createdAt: notificationDoc.createdAt,
      }));
      setNotifications(transformedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };
  // 초기 로드
  useEffect(() => {
    if (user) {
      refreshPosts();
      loadMembers();
      loadNotifications();
    }
  }, [user]);
  // 게시글 추가
  const addPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'updatedAt' | 'author'>) => {
    if (!user) return;
    try {
      const newPostData: Omit<PostDoc, 'id' | 'createdAt' | 'updatedAt'> = {
        type: postData.type,
        title: postData.title,
        content: postData.content,
        authorId: user.id,
        authorName: user.realName,
        authorPhotoURL: user.photoURL,
        pinned: postData.pinned,
      };
      // Event specific
      if (postData.eventType) {
        newPostData.eventType = postData.eventType;
        newPostData.startAt = postData.startAt;
        newPostData.place = postData.place;
        newPostData.opponent = postData.opponent;
        newPostData.voteCloseAt = postData.voteCloseAt;
        newPostData.voteClosed = false;
      }
      // Poll specific
      if (postData.choices) {
        newPostData.choices = postData.choices.map((choice) => ({
          id: choice.id,
          label: choice.label,
          votes: [],
        }));
        newPostData.multi = postData.multi;
        newPostData.anonymous = postData.anonymous;
        newPostData.closeAt = postData.closeAt;
        newPostData.closed = false;
      }
      // Game specific
      if (postData.gameType) {
        newPostData.gameType = postData.gameType;
        newPostData.score = postData.score;
        newPostData.recorders = [];
        newPostData.recordingLocked = false;
      }
      await createPostInDb(currentClubId, newPostData);
      await refreshPosts();
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  };
  // 게시글 업데이트
  const updatePost = async (id: string, updates: Partial<Post>) => {
    try {
      await updatePostInDb(currentClubId, id, updates as Partial<PostDoc>);
      await refreshPosts();
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };
  // 게시글 삭제
  const deletePost = async (id: string) => {
    try {
      await deletePostInDb(currentClubId, id);
      await refreshPosts();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };
  // 댓글 로드
  const loadComments = async (postId: string) => {
    try {
      const commentsData = await getComments(currentClubId, postId);
      const transformedComments: Comment[] = commentsData.map((commentDoc) => ({
        id: commentDoc.id,
        postId: commentDoc.postId,
        content: commentDoc.content,
        author: {
          id: commentDoc.authorId,
          name: commentDoc.authorName,
          photoURL: commentDoc.authorPhotoURL,
        },
        createdAt: commentDoc.createdAt,
        updatedAt: commentDoc.updatedAt,
      }));
      setComments((prev) => ({
        ...prev,
        [postId]: transformedComments,
      }));
      // 댓글 수 업데이트
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, commentCount: transformedComments.length } : post
        )
      );
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };
  // 댓글 추가
  const addComment = async (postId: string, content: string) => {
    if (!user) return;
    try {
      const commentData: Omit<CommentDoc, 'id' | 'createdAt' | 'updatedAt'> = {
        postId,
        content,
        authorId: user.id,
        authorName: user.realName,
        authorPhotoURL: user.photoURL,
      };
      // Note: addCommentInDb(clubId, postId, data)
      const commentDataForDb: Omit<CommentDoc, 'id' | 'createdAt' | 'updatedAt' | 'postId'> = {
        content,
        authorId: user.id,
        authorName: user.realName,
        authorPhotoURL: user.photoURL,
      };
      await addCommentInDb(currentClubId, postId, commentDataForDb);
      await loadComments(postId);
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };
  // 출석 현황 로드
  const loadAttendances = async (postId: string) => {
    try {
      const attendancesData = await getAttendances(currentClubId, postId);
      const transformedAttendances: Attendance[] = attendancesData.map((attendanceDoc) => ({
        postId: attendanceDoc.postId,
        userId: attendanceDoc.userId,
        status: attendanceDoc.status,
        updatedAt: attendanceDoc.updatedAt,
      }));
      setAttendances((prev) => ({
        ...prev,
        [postId]: transformedAttendances,
      }));
      // 출석 기록 업데이트 (플랫 배열)
      const transformedRecords: AttendanceRecord[] = attendancesData.map((attendanceDoc) => ({
        id: attendanceDoc.id,
        postId: attendanceDoc.postId,
        userId: attendanceDoc.userId,
        userName: attendanceDoc.userName,
        status: attendanceDoc.status,
        updatedAt: attendanceDoc.updatedAt,
      }));
      setAttendanceRecords((prev) => {
        // 기존 기록에서 같은 postId의 기록을 제거하고 새로운 기록을 추가
        const filtered = prev.filter((record) => record.postId !== postId);
        return [...filtered, ...transformedRecords];
      });
      // 출석 요약 계산
      const summary = {
        attending: transformedAttendances.filter((a) => a.status === 'attending').length,
        absent: transformedAttendances.filter((a) => a.status === 'absent').length,
        maybe: transformedAttendances.filter((a) => a.status === 'maybe').length,
      };
      // 게시글 업데이트
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, attendanceSummary: summary } : post
        )
      );
    } catch (error) {
      console.error('Error loading attendances:', error);
    }
  };
  // 출석 업데이트
  const updateAttendance = async (postId: string, userId: string, status: AttendanceStatus) => {
    if (!user) return;
    try {
      const attendanceData: Omit<AttendanceDoc, 'id' | 'updatedAt'> = {
        postId,
        userId,
        userName: user.realName,
        status,
      };
      // Note: updateAttendanceInDb(clubId, postId, userId, data)
      const attendanceDataForDb: Omit<AttendanceDoc, 'id' | 'updatedAt' | 'postId' | 'userId'> = {
        userName: user.realName,
        status,
      };
      await updateAttendanceInDb(currentClubId, postId, userId, attendanceDataForDb);
      await loadAttendances(postId);
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  };
  // 내 출석 상태 가져오기
  const getMyAttendance = (postId: string, userId: string): AttendanceStatus => {
    const postAttendances = attendances[postId] || [];
    const myAttendance = postAttendances.find((a) => a.userId === userId);
    return myAttendance?.status || 'none';
  };
  // 알림 읽음 표시
  const markNotificationAsRead = async (notificationId: string) => {
    if (!user) return;
    try {
      await markNotificationAsReadInDb(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  };
  // 모든 알림 읽음 표시
  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    try {
      await markAllNotificationsAsReadInDb(user.id);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  };
  return (
    <DataContext.Provider
      value={{
        posts,
        comments,
        attendances,
        attendanceRecords,
        members,
        notifications,
        loading,
        refreshPosts,
        addPost,
        updatePost,
        deletePost,
        loadComments,
        addComment,
        updateAttendance,
        getMyAttendance,
        loadAttendances,
        loadNotifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
```

## src/app/contexts/ThemeContext.tsx

```tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) return savedTheme;
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });
  useEffect(() => {
    // Update document class and localStorage
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## src/app/pages/AdminPage.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Ticket,
  BarChart3,
  Shield,
  UserPlus,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  Edit2,
  Trash2,
  Check,
  X,
  Plus,
  Bell,
  Send,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClub } from '../contexts/ClubContext';
import {
  getAllMembers,
  updateMember,
  getInviteCodes,
  createInviteCode,
  deleteInviteCode,
  createPost,
} from '../../lib/firebase/firestore.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { UserRole, PostDoc } from '../../lib/firebase/types';
type TabType = 'members' | 'invites' | 'stats' | 'notices';
interface Member {
  id: string;
  realName: string;
  nickname?: string;
  role: UserRole;
  position?: string;
  backNumber?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}
interface InviteCode {
  id: string;
  code: string;
  role: UserRole;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  expiresAt?: Date;
  isUsed: boolean;
  usedBy?: string;
  usedByName?: string;
  usedAt?: Date;
  maxUses: number;
  currentUses: number;
}
interface AdminPageProps {
  onBack?: () => void;
}
export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const { user, isAdmin } = useAuth();
  const { currentClubId } = useClub();
  const { posts, members: activeMembers } = useData();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [showCreateInvite, setShowCreateInvite] = useState(false);
  // 관리자 권한 확인
  useEffect(() => {
    if (!isAdmin()) {
      toast.error('관리자 권한이 필요합니다');
      return;
    }
    loadData();
  }, []);
  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        getAllMembers(currentClubId),
        getInviteCodes(currentClubId),
      ]);
      setMembers(membersData);
      setInviteCodes(invitesData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateMember = async (
    memberId: string,
    updates: Partial<Member>
  ) => {
    try {
      await updateMember(currentClubId, memberId, updates);
      await loadData();
      setEditingMember(null);
      toast.success('멤버 정보가 업데이트되었습니다');
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('업데이트 실패');
    }
  };
  const handleCreateInviteCode = async (data: {
    code: string;
    role: UserRole;
    maxUses: number;
    expiresAt?: Date;
  }) => {
    try {
      await createInviteCode(currentClubId, {
        code: data.code,
        role: data.role,
        createdBy: user!.id,
        createdByName: user!.realName,
        isUsed: false,
        maxUses: data.maxUses,
        currentUses: 0,
        expiresAt: data.expiresAt,
      });
      await loadData();
      setShowCreateInvite(false);
      toast.success('초대 코드가 생성되었습니다');
    } catch (error) {
      console.error('Error creating invite code:', error);
      toast.error('초대 코드 생성 실패');
    }
  };
  const handleDeleteInviteCode = async (code: string) => {
    if (!confirm('정말 이 초대 코드를 삭제하시겠습니까?')) return;
    try {
      await deleteInviteCode(currentClubId, code);
      await loadData();
      toast.success('초대 코드가 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting invite code:', error);
      toast.error('삭제 실패');
    }
  };
  // 통계 계산
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'active').length,
    inactiveMembers: members.filter((m) => m.status === 'inactive').length,
    totalPosts: posts.length,
    totalInviteCodes: inviteCodes.length,
    usedInviteCodes: inviteCodes.filter((i) => i.isUsed).length,
    availableInviteCodes: inviteCodes.filter((i) => !i.isUsed).length,
  };
  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">접근 권한 없음</h2>
          <p className="text-gray-600">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="pb-20 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8" />
          <h1 className="text-2xl font-bold">관리자 페이지</h1>
        </div>
        <p className="text-purple-100">멤버 및 초대 코드 관리</p>
      </div>
      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'members'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Users className="w-5 h-5 inline-block mr-2" />
            멤버 관리
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'invites'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Ticket className="w-5 h-5 inline-block mr-2" />
            초대 코드
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'notices'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Bell className="w-5 h-5 inline-block mr-2" />
            공지/푸시
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'stats'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <BarChart3 className="w-5 h-5 inline-block mr-2" />
            통계
          </button>
        </div>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Members Tab */}
            {activeTab === 'members' && (
              <MembersTab
                members={members}
                editingMember={editingMember}
                setEditingMember={setEditingMember}
                onUpdateMember={handleUpdateMember}
              />
            )}
            {/* Invites Tab */}
            {activeTab === 'invites' && (
              <InvitesTab
                inviteCodes={inviteCodes}
                showCreateInvite={showCreateInvite}
                setShowCreateInvite={setShowCreateInvite}
                onCreateInviteCode={handleCreateInviteCode}
                onDeleteInviteCode={handleDeleteInviteCode}
              />
            )}
            {/* Notices Tab */}
            {activeTab === 'notices' && <NoticesTab currentClubId={currentClubId} user={user!} />}
            {/* Stats Tab */}
            {activeTab === 'stats' && <StatsTab stats={stats} />}
          </>
        )}
      </div>
    </div>
  );
};
// Members Tab Component
const MembersTab: React.FC<{
  members: Member[];
  editingMember: string | null;
  setEditingMember: (id: string | null) => void;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
}> = ({ members, editingMember, setEditingMember, onUpdateMember }) => {
  const [editData, setEditData] = useState<Partial<Member>>({});
  const roleLabels: Record<UserRole, string> = {
    PRESIDENT: '회장',
    DIRECTOR: '감독',
    TREASURER: '총무',
    ADMIN: '관리자',
    MEMBER: '일반',
  };
  const roleColors: Record<UserRole, string> = {
    PRESIDENT: 'from-yellow-500 to-orange-500',
    DIRECTOR: 'from-blue-500 to-cyan-500',
    TREASURER: 'from-green-500 to-emerald-500',
    ADMIN: 'from-purple-500 to-pink-500',
    MEMBER: 'from-gray-500 to-gray-600',
  };
  const startEdit = (member: Member) => {
    setEditingMember(member.id);
    setEditData({
      role: member.role,
      position: member.position,
      backNumber: member.backNumber,
      status: member.status,
    });
  };
  return (
    <div className="space-y-3">
      {members.map((member, index) => (
        <motion.div
          key={member.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm"
        >
          {editingMember === member.id ? (
            // Edit Mode
            <div className="space-y-4">
              <div>
                <Label>역할</Label>
                <select
                  value={editData.role}
                  onChange={(e) =>
                    setEditData({ ...editData, role: e.target.value as UserRole })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="MEMBER">일반</option>
                  <option value="ADMIN">관리자</option>
                  <option value="TREASURER">총무</option>
                  <option value="DIRECTOR">감독</option>
                  <option value="PRESIDENT">회장</option>
                </select>
              </div>
              <div>
                <Label>포지션</Label>
                <Input
                  value={editData.position || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, position: e.target.value })
                  }
                  placeholder="예: 투수"
                />
              </div>
              <div>
                <Label>등번호</Label>
                <Input
                  value={editData.backNumber || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, backNumber: e.target.value })
                  }
                  placeholder="예: 10"
                />
              </div>
              <div>
                <Label>상태</Label>
                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onUpdateMember(member.id, editData)}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingMember(null)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
                </Button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-gray-600">
                    {member.realName[0]}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{member.realName}</h3>
                    {member.nickname && (
                      <span className="text-sm text-gray-500">
                        ({member.nickname})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium text-white bg-gradient-to-r ${roleColors[member.role]
                        } rounded-full`}
                    >
                      {roleLabels[member.role]}
                    </span>
                    {member.position && (
                      <span className="text-xs text-gray-500">
                        {member.position}
                      </span>
                    )}
                    {member.backNumber && (
                      <span className="text-xs text-gray-500">
                        #{member.backNumber}
                      </span>
                    )}
                    <span
                      className={`text-xs ${member.status === 'active'
                        ? 'text-green-600'
                        : 'text-gray-400'
                        }`}
                    >
                      {member.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEdit(member)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};
// Invites Tab Component
const InvitesTab: React.FC<{
  inviteCodes: InviteCode[];
  showCreateInvite: boolean;
  setShowCreateInvite: (show: boolean) => void;
  onCreateInviteCode: (data: any) => void;
  onDeleteInviteCode: (code: string) => void;
}> = ({
  inviteCodes,
  showCreateInvite,
  setShowCreateInvite,
  onCreateInviteCode,
  onDeleteInviteCode,
}) => {
    const [newCode, setNewCode] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('MEMBER');
    const [maxUses, setMaxUses] = useState(1);
    const handleCreate = () => {
      if (!newCode.trim()) {
        toast.error('초대 코드를 입력하세요');
        return;
      }
      onCreateInviteCode({
        code: newCode.trim().toUpperCase(),
        role: newRole,
        maxUses,
      });
      setNewCode('');
      setNewRole('MEMBER');
      setMaxUses(1);
    };
    return (
      <div className="space-y-4">
        {/* Create Button */}
        <Button
          onClick={() => setShowCreateInvite(!showCreateInvite)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          초대 코드 생성
        </Button>
        {/* Create Form */}
        {showCreateInvite && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 space-y-4"
          >
            <div>
              <Label>초대 코드</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="예: WINGS2024"
                className="uppercase"
              />
            </div>
            <div>
              <Label>역할</Label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="MEMBER">일반</option>
                <option value="ADMIN">관리자</option>
                <option value="TREASURER">총무</option>
                <option value="DIRECTOR">감독</option>
                <option value="PRESIDENT">회장</option>
              </select>
            </div>
            <div>
              <Label>최대 사용 횟수</Label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
            <Button onClick={handleCreate} className="w-full">
              생성하기
            </Button>
          </motion.div>
        )}
        {/* Invite Codes List */}
        <div className="space-y-3">
          {inviteCodes.map((invite, index) => (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl p-4 ${invite.isUsed
                ? 'bg-gray-100 dark:bg-gray-800'
                : 'bg-white dark:bg-gray-900 shadow-sm'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold font-mono">
                      {invite.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${invite.isUsed
                        ? 'bg-gray-300 text-gray-700'
                        : 'bg-green-100 text-green-700'
                        }`}
                    >
                      {invite.isUsed ? '사용됨' : '사용 가능'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    생성자: {invite.createdByName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(invite.createdAt, {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </p>
                </div>
                {!invite.isUsed && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteInviteCode(invite.code)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {invite.isUsed && invite.usedByName && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    사용자: {invite.usedByName}
                  </p>
                  {invite.usedAt && (
                    <p className="text-xs text-gray-500">
                      사용일:{' '}
                      {formatDistanceToNow(invite.usedAt, {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };
// Stats Tab Component
const StatsTab: React.FC<{ stats: any }> = ({ stats }) => {
  const statCards = [
    {
      label: '전체 멤버',
      value: stats.totalMembers,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: '활성 멤버',
      value: stats.activeMembers,
      icon: UserPlus,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: '비활성 멤버',
      value: stats.inactiveMembers,
      icon: Users,
      color: 'from-gray-500 to-gray-600',
    },
    {
      label: '전체 게시글',
      value: stats.totalPosts,
      icon: Activity,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: '전체 초대코드',
      value: stats.totalInviteCodes,
      icon: Ticket,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: '사용된 초대코드',
      value: stats.usedInviteCodes,
      icon: Check,
      color: 'from-teal-500 to-cyan-500',
    },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 text-white shadow-lg`}
          >
            <stat.icon className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm opacity-90">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
// Notices Tab Component
const NoticesTab: React.FC<{ currentClubId: string; user: any }> = ({
  currentClubId,
  user,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력하세요');
      return;
    }
    if (!confirm('공지사항을 등록하시겠습니까?' + (sendPush ? '\n(멤버들에게 푸시 알림이 발송됩니다)' : ''))) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Create Post with type 'notice'
      const postData: Omit<PostDoc, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'notice',
        title: title.trim(),
        content: content.trim(),
        authorId: user.id,
        authorName: user.realName,
        authorPhotoURL: user.photoURL,
        // Push Notification Meta
        pushStatus: sendPush ? 'PENDING' : undefined,
      };
      await createPost(currentClubId, postData);
      toast.success('공지사항이 등록되었습니다');
      setTitle('');
      setContent('');
      setSendPush(true);
    } catch (error) {
      console.error('Error creating notice:', error);
      toast.error('공지 등록 실패');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold">새 공지 작성</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="notice-title">제목</Label>
            <Input
              id="notice-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지사항 제목을 입력하세요"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="notice-content">내용</Label>
            <Textarea
              id="notice-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="mt-1 min-h-[150px]"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${sendPush ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-500'}`}>
                <Send className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">푸시 알림 발송</p>
                <p className="text-xs text-gray-500">모든 멤버에게 알림을 보냅니다</p>
              </div>
            </div>
            <Switch
              checked={sendPush}
              onCheckedChange={setSendPush}
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                등록 중...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                공지 등록 및 발송
              </div>
            )}
          </Button>
        </div>
      </motion.div>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 text-sm text-blue-700 dark:text-blue-300">
        <Activity className="w-5 h-5 flex-shrink-0" />
        <p>
          공지사항은 메인 홈 화면 최상단에 고정될 수 있으며, 푸시 알림을 활성화하면 앱을 설치한 모든 멤버에게 즉시 알림이 전송됩니다.
        </p>
      </div>
    </div>
  );
};
```

## src/app/pages/AdminPage.tsx_append

```

// Notices Tab Component
const NoticesTab: React.FC<{ currentClubId: string; user: any }> = ({
  currentClubId,
  user,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력하세요');
      return;
    }
    if (!confirm('공지사항을 등록하시겠습니까?' + (sendPush ? '\n(멤버들에게 푸시 알림이 발송됩니다)' : ''))) {
      return;
    }
    setIsSubmitting(true);
    try {
      // Create Post with type 'notice'
      const postData: Omit<PostDoc, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'notice',
        title: title.trim(),
        content: content.trim(),
        authorId: user.id,
        authorName: user.realName,
        authorPhotoURL: user.photoURL,
        // Push Notification Meta
        pushStatus: sendPush ? 'PENDING' : undefined,
      };
      await createPost(currentClubId, postData);
      toast.success('공지사항이 등록되었습니다');
      setTitle('');
      setContent('');
      setSendPush(true);
    } catch (error) {
      console.error('Error creating notice:', error);
      toast.error('공지 등록 실패');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center gap-2 mb-2">
          <Bell className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold">새 공지 작성</h2>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="notice-title">제목</Label>
            <Input
              id="notice-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지사항 제목을 입력하세요"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="notice-content">내용</Label>
            <Textarea
              id="notice-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="mt-1 min-h-[150px]"
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${sendPush ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-500'}`}>
                <Send className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">푸시 알림 발송</p>
                <p className="text-xs text-gray-500">모든 멤버에게 알림을 보냅니다</p>
              </div>
            </div>
            <Switch
              checked={sendPush}
              onCheckedChange={setSendPush}
            />
          </div>
          <Button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                등록 중...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                공지 등록 및 발송
              </div>
            )}
          </Button>
        </div>
      </motion.div>
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 text-sm text-blue-700 dark:text-blue-300">
        <Activity className="w-5 h-5 flex-shrink-0" />
        <p>
          공지사항은 메인 홈 화면 최상단에 고정될 수 있으며, 푸시 알림을 활성화하면 앱을 설치한 모든 멤버에게 즉시 알림이 전송됩니다.
        </p>
      </div>
    </div>
  );
};
```

## src/app/pages/AlbumPage.tsx

```tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, Image as ImageIcon, Video, Play, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { FileUploadModal } from '../components/FileUploadModal';
import Masonry from 'react-responsive-masonry';
export const AlbumPage: React.FC = () => {
  const { posts } = useData();
  const { user } = useAuth();
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  // Filter album posts
  const albumPosts = posts.filter(p => p.type === 'album');
  const photos = albumPosts.filter(p => p.mediaType === 'photo');
  const videos = albumPosts.filter(p => p.mediaType === 'video');
  // Mock media data (since we don't have real uploads)
  const mockPhotos = Array.from({ length: 12 }, (_, i) => ({
    id: `photo${i}`,
    url: `https://picsum.photos/seed/${i}/400/600`,
    author: '김태준',
    date: new Date(2024, 11, 15 - i),
    likes: Math.floor(Math.random() * 20),
    comments: Math.floor(Math.random() * 10),
  }));
  const mockVideos = Array.from({ length: 4 }, (_, i) => ({
    id: `video${i}`,
    thumbnail: `https://picsum.photos/seed/video${i}/400/300`,
    author: '박민수',
    date: new Date(2024, 11, 20 - i),
    duration: '2:34',
    likes: Math.floor(Math.random() * 30),
    comments: Math.floor(Math.random() * 15),
  }));
  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto">
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="w-full sticky top-14 z-30 bg-white dark:bg-gray-900 border-b">
            <TabsTrigger value="photos" className="flex-1 flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              사진 ({mockPhotos.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex-1 flex items-center gap-2">
              <Video className="w-4 h-4" />
              영상 ({mockVideos.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="photos" className="p-2 mt-0">
            <Masonry columnsCount={3} gutter="8px">
              {mockPhotos.map((photo, index) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onClick={() => setSelectedMedia(photo)}
                />
              ))}
            </Masonry>
          </TabsContent>
          <TabsContent value="videos" className="p-4 space-y-3 mt-0">
            {mockVideos.map((video, index) => (
              <VideoCard
                key={video.id}
                video={video}
                index={index}
                onClick={() => setSelectedMedia(video)}
              />
            ))}
          </TabsContent>
        </Tabs>
        {/* FAB - Upload */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setUploadModalOpen(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
        >
          <Upload className="w-6 h-6" />
        </motion.button>
        {/* Media Detail Modal */}
        {selectedMedia && (
          <MediaDetailModal
            media={selectedMedia}
            onClose={() => setSelectedMedia(null)}
          />
        )}
        {/* File Upload Modal */}
        <FileUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          type="album"
        />
      </div>
    </div>
  );
};
// Photo Card Component
const PhotoCard: React.FC<{
  photo: any;
  index: number;
  onClick: () => void;
}> = ({ photo, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 * index }}
      onClick={onClick}
      className="relative cursor-pointer group overflow-hidden rounded-lg"
    >
      <img
        src={photo.url}
        alt=""
        className="w-full h-auto object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-2 text-white">
          <div className="text-xs">{photo.author}</div>
        </div>
      </div>
    </motion.div>
  );
};
// Video Card Component
const VideoCard: React.FC<{
  video: any;
  index: number;
  onClick: () => void;
}> = ({ video, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Card
        className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={onClick}
      >
        <div className="relative">
          <img
            src={video.thumbnail}
            alt=""
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
              <Play className="w-8 h-8 text-gray-900 ml-1" />
            </div>
          </div>
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
            {video.duration}
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {video.author}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {video.date.toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
// Media Detail Modal
const MediaDetailModal: React.FC<{
  media: any;
  onClose: () => void;
}> = ({ media, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        {media.url && (
          <img
            src={media.url}
            alt=""
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        )}
        {/* Video Thumbnail */}
        {media.thumbnail && (
          <div className="relative">
            <img
              src={media.thumbnail}
              alt=""
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Play className="w-10 h-10 text-gray-900 ml-1" />
              </div>
            </div>
          </div>
        )}
        {/* Info */}
        <div className="mt-4 bg-white/10 backdrop-blur-xl rounded-lg p-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <div className="font-semibold">{media.author}</div>
              <div className="text-sm opacity-75">
                {media.date.toLocaleDateString('ko-KR')}
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span>❤️ {media.likes}</span>
              <span>💬 {media.comments}</span>
            </div>
          </div>
        </div>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
        >
          ✕
        </button>
      </motion.div>
    </motion.div>
  );
};
```

## src/app/pages/BoardsPage.tsx

```tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Bell, MessageSquare, Calendar, Users, BarChart3, Trophy, Plus, Pin, MessageCircle } from 'lucide-react';
import { useData, PostType, Post } from '../contexts/DataContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CreatePostModal } from '../components/CreatePostModal';
import { EditPostModal } from '../components/EditPostModal';
import { PostDetailModal } from '../components/PostDetailModal';
import { PollVoteModal } from '../components/PollVoteModal';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
export const BoardsPage: React.FC = () => {
  const { posts } = useData();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createPostType, setCreatePostType] = useState<PostType>('free');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<Post | null>(null);
  // Filter posts by type
  const notices = posts.filter(p => p.type === 'notice').sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
  const freePosts = posts.filter(p => p.type === 'free');
  const meetupPosts = posts.filter(p => p.type === 'meetup');
  const polls = posts.filter(p => p.type === 'poll');
  const games = posts.filter(p => p.type === 'game');
  const handleCreatePost = (type: PostType) => {
    setCreatePostType(type);
    setCreateModalOpen(true);
  };
  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto">
        <Tabs defaultValue="notice" className="w-full">
          <TabsList className="w-full sticky top-14 z-30 bg-white dark:bg-gray-900 border-b grid grid-cols-5 h-auto p-0">
            <TabsTrigger value="notice" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <Bell className="w-4 h-4" />
              <span className="text-xs">공지</span>
            </TabsTrigger>
            <TabsTrigger value="free" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs">자유</span>
            </TabsTrigger>
            <TabsTrigger value="meetup" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <Users className="w-4 h-4" />
              <span className="text-xs">기타</span>
            </TabsTrigger>
            <TabsTrigger value="poll" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">투표</span>
            </TabsTrigger>
            <TabsTrigger value="game" className="flex-col py-3 gap-1 data-[state=active]:bg-blue-50 dark:data-[state=active]:bg-blue-900/20">
              <Trophy className="w-4 h-4" />
              <span className="text-xs">경기</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="notice" className="p-4 space-y-3 mt-0">
            <PostList
              posts={notices}
              type="notice"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>
          <TabsContent value="free" className="p-4 space-y-3 mt-0">
            <PostList
              posts={freePosts}
              type="free"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>
          <TabsContent value="meetup" className="p-4 space-y-3 mt-0">
            <PostList
              posts={meetupPosts}
              type="meetup"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>
          <TabsContent value="poll" className="p-4 space-y-3 mt-0">
            <PostList
              posts={polls}
              type="poll"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>
          <TabsContent value="game" className="p-4 space-y-3 mt-0">
            <PostList
              posts={games}
              type="game"
              onPostClick={(post) => setSelectedPost(post)}
              onPollClick={(post) => setSelectedPoll(post)}
            />
          </TabsContent>
        </Tabs>
        {/* FAB - Create Post */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
          onClick={() => handleCreatePost('free')}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
      </div>
      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        defaultType={createPostType}
      />
      {/* Edit Post Modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          isOpen={editingPost !== null}
          onClose={() => setEditingPost(null)}
        />
      )}
      {/* Post Detail Modal */}
      {selectedPost && (
        <PostDetailModal
          post={selectedPost}
          isOpen={selectedPost !== null}
          onClose={() => setSelectedPost(null)}
          onEdit={(post) => {
            setSelectedPost(null);
            setEditingPost(post);
          }}
          onDelete={() => {
            setSelectedPost(null);
          }}
        />
      )}
      {/* Poll Vote Modal */}
      {selectedPoll && (
        <PollVoteModal
          poll={selectedPoll}
          isOpen={selectedPoll !== null}
          onClose={() => setSelectedPoll(null)}
        />
      )}
    </div>
  );
};
// Post List Component
const PostList: React.FC<{ posts: any[]; type: PostType; onPostClick: (post: Post) => void; onPollClick: (post: Post) => void }> = ({ posts, type, onPostClick, onPollClick }) => {
  if (posts.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500">
        게시글이 없습니다
      </Card>
    );
  }
  return (
    <>
      {posts.map((post, index) => (
        <PostCard key={post.id} post={post} index={index} type={type} onPostClick={onPostClick} onPollClick={onPollClick} />
      ))}
    </>
  );
};
// Post Card Component
const PostCard: React.FC<{ post: any; index: number; type: PostType; onPostClick: (post: Post) => void; onPollClick: (post: Post) => void }> = ({ post, index, type, onPostClick, onPollClick }) => {
  const getTypeInfo = () => {
    switch (type) {
      case 'notice':
        return { icon: Bell, color: 'from-red-500 to-orange-500', label: '공지' };
      case 'free':
        return { icon: MessageSquare, color: 'from-blue-500 to-blue-600', label: '자유' };
      case 'meetup':
        return { icon: Users, color: 'from-green-500 to-green-600', label: '기타' };
      case 'poll':
        return { icon: BarChart3, color: 'from-purple-500 to-purple-600', label: '투표' };
      case 'game':
        return { icon: Trophy, color: 'from-yellow-500 to-orange-500', label: '경기' };
      default:
        return { icon: MessageSquare, color: 'from-gray-500 to-gray-600', label: '게시글' };
    }
  };
  const { icon: Icon, color, label } = getTypeInfo();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
      onClick={() => {
        if (type === 'poll') {
          onPollClick(post);
        } else {
          onPostClick(post);
        }
      }}
    >
      <Card className="p-4 hover:shadow-lg transition-all cursor-pointer">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 bg-gradient-to-br ${color} rounded-lg text-white flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant={type === 'notice' ? 'default' : 'secondary'} className={type === 'notice' ? 'bg-red-500' : ''}>
                {label}
              </Badge>
              {post.pinned && (
                <Badge variant="outline" className="text-xs">
                  <Pin className="w-3 h-3 mr-1" />
                  고정
                </Badge>
              )}
              {type === 'poll' && post.closed && (
                <Badge variant="outline" className="text-xs">마감</Badge>
              )}
              {type === 'game' && post.recordingLocked && (
                <Badge variant="outline" className="text-xs">🔒 LOCK</Badge>
              )}
            </div>
            {/* Title */}
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
              {post.title}
            </h3>
            {/* Content Preview */}
            {post.content && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                {post.content}
              </p>
            )}
            {/* Meta Info */}
            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span>{post.author.name}</span>
              <span>•</span>
              <span>{format(post.createdAt, 'M월 d일', { locale: ko })}</span>
              {post.commentCount && post.commentCount > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <MessageCircle className="w-3 h-3" />
                    {post.commentCount}
                  </span>
                </>
              )}
            </div>
            {/* Poll specific */}
            {type === 'poll' && post.choices && (
              <div className="mt-3 space-y-1">
                {post.choices.slice(0, 2).map((choice: any) => (
                  <div key={choice.id} className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center px-2 text-xs text-white"
                        style={{
                          width: `${Math.max((choice.count / 20) * 100, 10)}%`
                        }}
                      >
                        {choice.label}
                      </div>
                    </div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8 text-right">
                      {choice.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {/* Game specific */}
            {type === 'game' && post.score && (
              <div className="mt-2 flex items-center gap-3">
                <Badge variant="outline" className="text-blue-600 dark:text-blue-400">
                  {post.opponent}
                </Badge>
                <span className="font-bold text-lg">
                  {post.score.our} - {post.score.opp}
                </span>
                <Badge variant={post.score.our > post.score.opp ? 'default' : 'secondary'} className={post.score.our > post.score.opp ? 'bg-green-600' : 'bg-red-600'}>
                  {post.score.our > post.score.opp ? '승' : post.score.our < post.score.opp ? '패' : '무'}
                </Badge>
              </div>
            )}
            {/* Push Status (Notice) */}
            {type === 'notice' && post.pushStatus && (
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    post.pushStatus === 'SENT'
                      ? 'text-green-600 border-green-300'
                      : post.pushStatus === 'FAILED'
                      ? 'text-red-600 border-red-300'
                      : 'text-yellow-600 border-yellow-300'
                  }`}
                >
                  푸시: {post.pushStatus === 'SENT' ? '발송완료' : post.pushStatus === 'FAILED' ? '발송실패' : '발송중'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
```

## src/app/pages/FinancePage.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Filter,
  Wallet,
  CreditCard,
  ShoppingBag,
  Package,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClub } from '../contexts/ClubContext';
import {
  addFinance,
  getFinances,
} from '../../lib/firebase/firestore.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { FinanceDoc } from '../../lib/firebase/types';
type FilterType = 'all' | 'income' | 'expense';
type CategoryType = 'dues' | 'event' | 'equipment' | 'other';
interface FinancePageProps {
  onBack?: () => void;
}
export const FinancePage: React.FC<FinancePageProps> = ({ onBack }) => {
  const { user, isTreasury } = useAuth();
  const { currentClubId } = useClub();
  const { members } = useData();
  const [finances, setFinances] = useState<FinanceDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    category: 'event' as CategoryType,
    amount: '',
    description: '',
    duesPaidBy: '',
    duesMonth: format(new Date(), 'yyyy-MM'),
  });
  useEffect(() => {
    loadFinances();
  }, []);
  const loadFinances = async () => {
    setLoading(true);
    try {
      const data = await getFinances(currentClubId);
      setFinances(data);
    } catch (error) {
      console.error('Error loading finances:', error);
      toast.error('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };
  const handleAddFinance = async () => {
    if (!user) return;
    if (!formData.amount || !formData.description) {
      toast.error('금액과 설명을 입력하세요');
      return;
    }
    try {
      const newFinance: Omit<FinanceDoc, 'id' | 'createdAt'> = {
        type: formData.type,
        category: formData.category,
        amount: parseInt(formData.amount),
        description: formData.description,
        date: new Date(),
        createdBy: user.id,
        createdByName: user.realName,
      };
      // 회비인 경우 추가 정보
      if (formData.category === 'dues' && formData.duesPaidBy) {
        const paidByMember = members.find((m) => m.id === formData.duesPaidBy);
        newFinance.duesPaidBy = formData.duesPaidBy;
        newFinance.duesPaidByName = paidByMember?.realName || '';
        newFinance.duesMonth = formData.duesMonth;
      }
      await addFinance(currentClubId, newFinance);
      await loadFinances();
      setShowAddForm(false);
      resetForm();
      toast.success('등록되었습니다');
    } catch (error) {
      console.error('Error adding finance:', error);
      toast.error('등록 실패');
    }
  };
  const resetForm = () => {
    setFormData({
      type: 'expense',
      category: 'event',
      amount: '',
      description: '',
      duesPaidBy: '',
      duesMonth: format(new Date(), 'yyyy-MM'),
    });
  };
  // Filter finances by type and month
  const filteredFinances = finances.filter((finance) => {
    const typeMatch = filter === 'all' || finance.type === filter;
    const monthMatch = isWithinInterval(finance.date, {
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth),
    });
    return typeMatch && monthMatch;
  });
  // Calculate statistics
  const stats = {
    totalIncome: finances
      .filter((f) => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0),
    totalExpense: finances
      .filter((f) => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0),
    monthlyIncome: filteredFinances
      .filter((f) => f.type === 'income')
      .reduce((sum, f) => sum + f.amount, 0),
    monthlyExpense: filteredFinances
      .filter((f) => f.type === 'expense')
      .reduce((sum, f) => sum + f.amount, 0),
  };
  const categoryLabels: Record<CategoryType, string> = {
    dues: '회비',
    event: '행사비',
    equipment: '장비',
    other: '기타',
  };
  const categoryIcons: Record<CategoryType, typeof Wallet> = {
    dues: Wallet,
    event: Calendar,
    equipment: Package,
    other: MoreHorizontal,
  };
  if (!isTreasury()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-16 pb-20">
        <div className="text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">접근 권한 없음</h2>
          <p className="text-gray-600">총무만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="pb-20 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign className="w-8 h-8" />
          <h1 className="text-2xl font-bold">회비/회계</h1>
        </div>
        <p className="text-green-100">동호회 수입/지출 관리</p>
      </div>
      {/* Stats Cards */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <TrendingUp className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">
              {stats.totalIncome.toLocaleString()}원
            </p>
            <p className="text-sm opacity-90">총 수입</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <TrendingDown className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">
              {stats.totalExpense.toLocaleString()}원
            </p>
            <p className="text-sm opacity-90">총 지출</p>
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-4 text-white shadow-lg"
        >
          <Wallet className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-bold">
            {(stats.totalIncome - stats.totalExpense).toLocaleString()}원
          </p>
          <p className="text-sm opacity-90">잔액</p>
        </motion.div>
        {/* Month Filter */}
        <div className="flex items-center gap-2">
          <button
            onClick={() =>
              setSelectedMonth(
                new Date(selectedMonth.setMonth(selectedMonth.getMonth() - 1))
              )
            }
            className="px-3 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm"
          >
            ←
          </button>
          <div className="flex-1 text-center font-semibold">
            {format(selectedMonth, 'yyyy년 M월', { locale: ko })}
          </div>
          <button
            onClick={() =>
              setSelectedMonth(
                new Date(selectedMonth.setMonth(selectedMonth.getMonth() + 1))
              )
            }
            className="px-3 py-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm"
          >
            →
          </button>
        </div>
        {/* Add Button */}
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          내역 추가
        </Button>
        {/* Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-4 space-y-4"
          >
            <div className="flex gap-2">
              <button
                onClick={() => setFormData({ ...formData, type: 'income' })}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${formData.type === 'income'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
              >
                수입
              </button>
              <button
                onClick={() => setFormData({ ...formData, type: 'expense' })}
                className={`flex-1 py-2 rounded-lg font-medium transition-colors ${formData.type === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
              >
                지출
              </button>
            </div>
            <div>
              <Label>카테고리</Label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value as CategoryType,
                  })
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="dues">회비</option>
                <option value="event">행사비</option>
                <option value="equipment">장비</option>
                <option value="other">기타</option>
              </select>
            </div>
            {formData.category === 'dues' && (
              <>
                <div>
                  <Label>납부자</Label>
                  <select
                    value={formData.duesPaidBy}
                    onChange={(e) =>
                      setFormData({ ...formData, duesPaidBy: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">선택하세요</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.realName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>납부 월</Label>
                  <Input
                    type="month"
                    value={formData.duesMonth}
                    onChange={(e) =>
                      setFormData({ ...formData, duesMonth: e.target.value })
                    }
                  />
                </div>
              </>
            )}
            <div>
              <Label>금액</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="10000"
              />
            </div>
            <div>
              <Label>설명</Label>
              <Input
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="예: 3월 회비"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddFinance} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                추가
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
            </div>
          </motion.div>
        )}
        {/* Filter Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${filter === 'all'
              ? 'bg-gray-800 dark:bg-gray-700 text-white'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}
          >
            전체
          </button>
          <button
            onClick={() => setFilter('income')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${filter === 'income'
              ? 'bg-blue-500 text-white'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}
          >
            수입
          </button>
          <button
            onClick={() => setFilter('expense')}
            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${filter === 'expense'
              ? 'bg-red-500 text-white'
              : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
              }`}
          >
            지출
          </button>
        </div>
        {/* Finance List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent"></div>
            </div>
          ) : filteredFinances.length === 0 ? (
            <div className="text-center py-20">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">내역이 없습니다</p>
            </div>
          ) : (
            filteredFinances.map((finance, index) => {
              const CategoryIcon = categoryIcons[finance.category];
              return (
                <motion.div
                  key={finance.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${finance.type === 'income'
                          ? 'bg-blue-100 dark:bg-blue-900/20'
                          : 'bg-red-100 dark:bg-red-900/20'
                          }`}
                      >
                        <CategoryIcon
                          className={`w-5 h-5 ${finance.type === 'income'
                            ? 'text-blue-600'
                            : 'text-red-600'
                            }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">
                            {finance.description}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${finance.type === 'income'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              }`}
                          >
                            {categoryLabels[finance.category]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {finance.createdByName}
                        </p>
                        {finance.duesPaidByName && (
                          <p className="text-xs text-gray-500 dark:text-gray-500">
                            납부자: {finance.duesPaidByName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {format(finance.date, 'yyyy-MM-dd HH:mm', {
                            locale: ko,
                          })}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-right ${finance.type === 'income'
                        ? 'text-blue-600'
                        : 'text-red-600'
                        }`}
                    >
                      <p className="text-lg font-bold">
                        {finance.type === 'income' ? '+' : '-'}
                        {finance.amount.toLocaleString()}원
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
```

## src/app/pages/GameRecordPage.tsx

```tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Target,
  Edit,
  ChevronRight,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  Calendar,
  MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData, Post } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
interface GameRecordPageProps {
  onBack?: () => void;
}
export const GameRecordPage: React.FC<GameRecordPageProps> = () => {
  const { user } = useAuth();
  const { posts } = useData();
  const [selectedGame, setSelectedGame] = useState<Post | null>(null);
  // Filter for games (events with eventType === 'GAME')
  const games = posts
    .filter((p: Post) => p.type === 'event' && p.eventType === 'GAME')
    .sort((a: Post, b: Post) => (b.startAt?.getTime() || 0) - (a.startAt?.getTime() || 0));
  // Calculate statistics (Mock for now, as real stats need more data structure)
  const stats = {
    totalGames: games.length,
    wins: 0,
    losses: 0,
    draws: 0,
  };
  // Real logic would calculate from game results if stored
  return (
    <div className="pb-20 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8" />
          <h1 className="text-2xl font-bold">경기 기록</h1>
        </div>
        <p className="text-orange-100">라인업 및 타자/투수 기록 관리</p>
      </div>
      <div className="p-4 space-y-4">
        {/* Games List */}
        <div className="space-y-3">
          {games.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>등록된 경기 일정이 없습니다</p>
            </Card>
          ) : (
            games.map((game: Post, index: number) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                onClick={() => setSelectedGame(game)}
              />
            ))
          )}
        </div>
      </div>
      {/* Game Detail Modal */}
      <AnimatePresence>
        {selectedGame && (
          <GameDetailModal
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
// Game Card Component
const GameCard: React.FC<{
  game: Post;
  index: number;
  onClick: () => void;
}> = ({ game, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] transition-transform"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`${game.recordingLocked ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {game.recordingLocked ? '마감됨' : '기록중'}
              </Badge>
              <h3 className="text-lg font-bold">vs {game.opponent || '상대팀 미정'}</h3>
            </div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {game.startAt ? format(game.startAt, 'M월 d일 (E) HH:mm', { locale: ko }) : '미정'}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {game.place || '장소 미정'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </Card>
    </motion.div>
  );
};
// Game Detail Modal Component (With Gatekeeper & Lock Logic)
const GameDetailModal: React.FC<{
  game: Post;
  onClose: () => void;
}> = ({ game, onClose }) => {
  const { user, isAdmin } = useAuth();
  const { updatePost } = useData();
  const [isLocking, setIsLocking] = useState(false);
  // Gatekeeper Logic
  const canEdit = React.useMemo(() => {
    if (!user) return false;
    if (game.recordingLocked) return false; // Locked games are readonly for everyone except maybe unlocking (admin only)
    if (isAdmin()) return true;
    if (game.recorders && game.recorders.includes(user.id)) return true;
    return false;
  }, [user, game, isAdmin]);
  const canLock = React.useMemo(() => {
    if (!user) return false;
    // Admin or designated recorders can lock
    return !game.recordingLocked && (isAdmin() || (game.recorders && game.recorders.includes(user.id)));
  }, [user, game, isAdmin]);
  const canUnlock = React.useMemo(() => {
    // Only Admin can unlock
    return game.recordingLocked && isAdmin();
  }, [game, isAdmin]);
  const handleToggleLock = async () => {
    if (!confirm(game.recordingLocked ? '기록 입력을 다시 허용하시겠습니까?' : '경기를 종료하고 기록을 마감하시겠습니까?\n마감 후에는 수정할 수 없습니다.')) {
      return;
    }
    setIsLocking(true);
    try {
      await updatePost(game.id, {
        recordingLocked: !game.recordingLocked,
        recordingLockedAt: !game.recordingLocked ? new Date() : undefined,
        recordingLockedBy: !game.recordingLocked ? user?.id : undefined
      });
      toast.success(game.recordingLocked ? '기록 잠금이 해제되었습니다' : '경기 기록이 마감되었습니다');
      if (game.recordingLocked) {
        onClose(); // Close modal on lock to refresh state view implies clarity
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('상태 변경 실패');
    } finally {
      setIsLocking(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="font-bold text-lg">경기 기록 관리</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-6 space-y-6">
          {/* Game Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${game.recordingLocked
            ? 'bg-gray-100 border-gray-200 text-gray-700'
            : 'bg-green-50 border-green-200 text-green-700'
            }`}>
            {game.recordingLocked ? <Lock className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            <div>
              <p className="font-bold">{game.recordingLocked ? '기록 마감됨' : '기록 입력 중'}</p>
              <p className="text-xs opacity-80">
                {game.recordingLocked
                  ? '관리자만 잠금을 해제할 수 있습니다.'
                  : '기록원 및 관리자가 수정할 수 있습니다.'}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                vs {game.opponent}
                <Badge variant="outline">{game.place}</Badge>
              </h3>
              <p className="text-gray-500">
                {game.startAt ? format(game.startAt, 'yyyy년 M월 d일 HH:mm', { locale: ko }) : ''}
              </p>
            </div>
            {/* Placeholder for Record Input UI */}
            <div className="p-8 border-2 border-dashed rounded-xl text-center space-y-2">
              <Target className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="font-medium text-gray-500">기록 입력 UI 영역</p>
              {canEdit ? (
                <p className="text-sm text-blue-600">작성 권한이 있습니다</p>
              ) : (
                <p className="text-sm text-red-500 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  읽기 전용 모드
                </p>
              )}
            </div>
            {/* Lock/Unlock Actions */}
            <div className="flex gap-2 pt-4 border-t dark:border-gray-800">
              {(canLock || canUnlock) ? (
                <Button
                  className={`w-full ${canLock ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  onClick={handleToggleLock}
                  disabled={isLocking}
                >
                  {isLocking ? (
                    '처리 중...'
                  ) : canLock ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      경기 종료 및 기록 마감
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      기록 잠금 해제 (관리자)
                    </>
                  )}
                </Button>
              ) : (
                <Button className="w-full" variant="outline" onClick={onClose}>
                  닫기
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
```

## src/app/pages/HomePage.tsx

```tsx
import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, Trophy, Clock, Bell, Plus, Camera, FileText } from 'lucide-react';
import { useData, Post } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { format, differenceInHours } from 'date-fns';
import { ko } from 'date-fns/locale';
interface HomePageProps {
  onNavigate: (tab: 'schedule' | 'boards' | 'album', postId?: string) => void;
}
export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { posts } = useData();
  const { user } = useAuth();
  // Get upcoming events (next 3)
  const upcomingEvents = posts
    .filter(p => p.type === 'event' && p.startAt && p.startAt > new Date())
    .sort((a, b) => (a.startAt?.getTime() || 0) - (b.startAt?.getTime() || 0))
    .slice(0, 3);
  // Get latest notices (2)
  const latestNotices = posts
    .filter(p => p.type === 'notice')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 2);
  // Get next event with deadline
  const nextEventWithDeadline = upcomingEvents[0];
  const hoursUntilDeadline = nextEventWithDeadline?.voteCloseAt
    ? differenceInHours(nextEventWithDeadline.voteCloseAt, new Date())
    : null;
  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
            <Users className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">24</div>
            <div className="text-xs opacity-80">활동 멤버</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
            <Calendar className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">3</div>
            <div className="text-xs opacity-80">예정 일정</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
            <Trophy className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">8-5</div>
            <div className="text-xs opacity-80">최근 경기</div>
          </Card>
        </motion.div>
        {/* Deadline Alert */}
        {nextEventWithDeadline && hoursUntilDeadline !== null && hoursUntilDeadline > 0 && hoursUntilDeadline < 48 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">출석 투표 마감 임박!</div>
                  <div className="text-sm opacity-90">{nextEventWithDeadline.title}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {hoursUntilDeadline}시간 후 마감 (전날 23:00)
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              다가오는 일정
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('schedule')}
              className="text-blue-600 dark:text-blue-400"
            >
              전체보기
            </Button>
          </div>
          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <Card className="p-6 text-center text-gray-500 dark:text-gray-400">
                예정된 일정이 없습니다
              </Card>
            ) : (
              upcomingEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </div>
        </motion.div>
        {/* Latest Notices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              최신 공지
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('boards')}
              className="text-blue-600 dark:text-blue-400"
            >
              전체보기
            </Button>
          </div>
          <div className="space-y-2">
            {latestNotices.length === 0 ? (
              <Card className="p-6 text-center text-gray-500 dark:text-gray-400">
                공지사항이 없습니다
              </Card>
            ) : (
              latestNotices.map((notice, index) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  index={index}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </div>
        </motion.div>
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            빠른 작업
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => nextEventWithDeadline && onNavigate('schedule', nextEventWithDeadline.id)}
            >
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-xs">출석하기</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onNavigate('boards')}
            >
              <FileText className="w-6 h-6 text-green-600" />
              <span className="text-xs">글쓰기</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onNavigate('album')}
            >
              <Camera className="w-6 h-6 text-purple-600" />
              <span className="text-xs">사진올리기</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
// Event Card Component
const EventCard: React.FC<{
  event: Post;
  index: number;
  onNavigate: (tab: 'schedule', postId?: string) => void;
}> = ({ event, index, onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <Card
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onNavigate('schedule', event.id)}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            {event.eventType === 'GAME' ? (
              <Trophy className="w-5 h-5" />
            ) : (
              <Calendar className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={event.eventType === 'GAME' ? 'default' : 'secondary'}>
                {event.eventType === 'GAME' ? '경기' : '연습'}
              </Badge>
              {event.voteClosed && (
                <Badge variant="outline" className="text-xs">마감</Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {event.title}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {event.startAt && format(event.startAt, 'M월 d일 (E) HH:mm', { locale: ko })}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500 truncate">
              📍 {event.place}
            </div>
            {event.attendanceSummary && (
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-green-600 dark:text-green-400">
                  참석 {event.attendanceSummary.attending}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  불참 {event.attendanceSummary.absent}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  미정 {event.attendanceSummary.maybe}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
// Notice Card Component
const NoticeCard: React.FC<{
  notice: Post;
  index: number;
  onNavigate: (tab: 'boards', postId?: string) => void;
}> = ({ notice, index, onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <Card
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onNavigate('boards', notice.id)}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg text-white">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-red-500">공지</Badge>
              {notice.pinned && (
                <Badge variant="outline" className="text-xs">📌 고정</Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {notice.title}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {format(notice.createdAt, 'M월 d일', { locale: ko })}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
```

## src/app/pages/LoginPage.tsx

```tsx
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
        {/* DEBUG INFO */}
        <div className="mt-4 p-2 bg-black/50 text-white text-xs rounded">
          <p>Project ID: {import.meta.env.VITE_FIREBASE_PROJECT_ID}</p>
          <p>Auth Domain: {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}</p>
          <p>Error Detail: {error}</p>
        </div>
      </motion.div>
    </div>
  );
};
```

## src/app/pages/MyPage.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Settings, Bell, Shield, LogOut, ChevronRight, Crown, Star, Calendar, Trophy, MessageSquare, Edit } from 'lucide-react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useData, Post, Comment } from '../contexts/DataContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { APP_INFO } from '../../lib/constants/app-info';
import { toast } from 'sonner';
interface MyPageProps {
  onNavigateToSettings?: () => void;
  onNavigateToAdmin?: () => void;
  onNavigateToFinance?: () => void;
  onNavigateToGameRecord?: () => void;
}
export const MyPage: React.FC<MyPageProps> = ({
  onNavigateToSettings,
  onNavigateToAdmin,
  onNavigateToFinance,
  onNavigateToGameRecord
}: MyPageProps) => {
  const { user, logout, isAdmin, isTreasury } = useAuth();
  const { posts, comments, attendanceRecords } = useData();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [stats, setStats] = useState({
    attendanceCount: 0,
    postCount: 0,
    commentCount: 0,
  });
  // Calculate real statistics
  useEffect(() => {
    if (!user) return;
    // Count attendance
    const attendanceCount = attendanceRecords.filter(
      record => record.userId === user.id && record.status === 'ATTENDING'
    ).length;
    // Count posts
    const postCount = posts.filter((post: Post) => post.authorId === user.id).length;
    // Count comments
    const commentCount = comments.filter((comment: Comment) => comment.authorId === user.id).length;
    setStats({
      attendanceCount,
      postCount,
      commentCount,
    });
  }, [user, posts, comments, attendanceRecords]);
  const handleLogout = () => {
    logout();
    toast.success('로그아웃되었습니다');
  };
  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case 'PRESIDENT':
        return { label: '회장', color: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: Crown };
      case 'DIRECTOR':
        return { label: '감독', color: 'bg-gradient-to-r from-blue-500 to-blue-600', icon: Star };
      case 'TREASURER':
        return { label: '총무', color: 'bg-gradient-to-r from-green-500 to-green-600', icon: Star };
      case 'ADMIN':
        return { label: '관리자', color: 'bg-gradient-to-r from-purple-500 to-purple-600', icon: Shield };
      default:
        return { label: '일반회원', color: 'bg-gradient-to-r from-gray-500 to-gray-600', icon: User };
    }
  };
  if (!user) return null;
  const roleInfo = getRoleInfo(user.role);
  const RoleIcon = roleInfo.icon;
  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          {/* Background Gradient */}
          <div className={`h-32 ${roleInfo.color} rounded-b-3xl`}></div>
          {/* Profile Card */}
          <div className="px-4 -mt-16">
            <Card className="p-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {user.realName.charAt(0)}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-8 h-8 ${roleInfo.color} rounded-full flex items-center justify-center text-white shadow-lg`}>
                    <RoleIcon className="w-4 h-4" />
                  </div>
                </div>
                {/* Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {user.realName}
                  </h2>
                  {user.nickname && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      @{user.nickname}
                    </p>
                  )}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={roleInfo.color + ' text-white border-0'}>
                      {roleInfo.label}
                    </Badge>
                    {user.position && (
                      <Badge variant="outline">
                        {user.position}
                      </Badge>
                    )}
                    {user.backNumber && (
                      <Badge variant="outline">
                        #{user.backNumber}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t dark:border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.attendanceCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">참석</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.postCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">게시글</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.commentCount}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">댓글</div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 mt-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">3</div>
                  <div className="text-xs text-blue-700 dark:text-blue-300">예정 일정</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">15</div>
                  <div className="text-xs text-green-700 dark:text-green-300">경기 출전</div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
        {/* Menu List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 mt-6 space-y-3"
        >
          {/* Admin & Recorder Menu */}
          {(isAdmin() || posts.some((p: Post) => p.recorders?.includes(user.id))) && (
            <>
              <Card className="overflow-hidden">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <span className="font-semibold text-sm">관리자 및 기록원 메뉴</span>
                  </div>
                </div>
                {isAdmin() && (
                  <>
                    <MenuItem icon={Shield} label="관리자 페이지" onClick={() => onNavigateToAdmin?.()} />
                    <Separator />
                    <MenuItem icon={User} label="멤버 관리" onClick={() => onNavigateToAdmin?.()} />
                    <Separator />
                  </>
                )}
                <MenuItem icon={Trophy} label="경기 기록 관리" onClick={() => onNavigateToGameRecord?.()} />
                {isAdmin() && (
                  <>
                    <Separator />
                    <MenuItem icon={Bell} label="공지 관리" onClick={() => toast.info('공지 관리')} />
                    <Separator />
                    <MenuItem icon={Calendar} label="일정 관리" onClick={() => toast.info('일정 관리')} />
                    {isTreasury() && (
                      <>
                        <Separator />
                        <MenuItem icon={Trophy} label="회비/회계" onClick={() => onNavigateToFinance?.()} />
                      </>
                    )}
                  </>
                )}
              </Card>
              <div className="h-3"></div>
            </>
          )}
          {/* General Menu */}
          <Card>
            <MenuItem icon={MessageSquare} label="내 활동" onClick={() => toast.info('내 활동')} />
            <Separator />
            <MenuItem icon={Bell} label="알림 설정" onClick={() => toast.info('알림 설정')} />
            <Separator />
            <MenuItem icon={Settings} label="설정" onClick={() => onNavigateToSettings?.()} />
            <Separator />
            <MenuItem icon={Edit} label="프로필 편집" onClick={() => setEditModalOpen(true)} />
          </Card>
          {/* Logout */}
          <Button
            variant="outline"
            className="w-full h-12 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
          {/* Version Info */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-4">
            {APP_INFO.version}
          </div>
        </motion.div>
      </div>
      {/* Profile Edit Modal */}
      <ProfileEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
      />
    </div>
  );
};
// Menu Item Component
const MenuItem: React.FC<{
  icon: React.ElementType;
  label: string;
  onClick: () => void;
}> = ({ icon: Icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <span className="text-gray-900 dark:text-white">{label}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
};
```

## src/app/pages/NotificationPage.tsx

```tsx
import React from 'react';
import { motion } from 'motion/react';
import {
  Bell,
  BellOff,
  MessageSquare,
  Heart,
  CalendarDays,
  Megaphone,
  User,
  CheckCheck,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
interface NotificationPageProps {
  onBack?: () => void;
}
export const NotificationPage: React.FC<NotificationPageProps> = ({ onBack }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();
  const { user } = useAuth();
  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }
    // 링크가 있으면 이동 (향후 구현)
    if (notification.link) {
      toast.info('해당 게시글로 이동 기능은 곧 구현됩니다');
    }
  };
  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      toast.success('모든 알림을 읽음 처리했습니다');
    } catch (error) {
      toast.error('알림 읽음 처리 실패');
    }
  };
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'notice':
        return <Megaphone className="w-5 h-5" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5" />;
      case 'like':
        return <Heart className="w-5 h-5" />;
      case 'event':
        return <CalendarDays className="w-5 h-5" />;
      case 'mention':
        return <User className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'notice':
        return 'from-red-500 to-orange-500';
      case 'comment':
        return 'from-blue-500 to-cyan-500';
      case 'like':
        return 'from-pink-500 to-red-500';
      case 'event':
        return 'from-purple-500 to-indigo-500';
      case 'mention':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };
  const unreadCount = notifications.filter((n) => !n.read).length;
  return (
    <div className="pb-20 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-2xl font-bold">알림</h1>
          </div>
          {unreadCount > 0 && (
            <div className="px-3 py-1 bg-red-500 rounded-full text-sm font-bold">
              {unreadCount}
            </div>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="border-white/30 text-white hover:bg-white/20"
          >
            <CheckCheck className="w-4 h-4 mr-2" />
            모두 읽음 처리
          </Button>
        )}
      </div>
      <div className="p-4">
        {notifications.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500">알림이 없습니다</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 rounded-2xl transition-all ${
                    notification.read
                      ? 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                      : 'bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${getNotificationColor(
                        notification.type
                      )} rounded-full flex items-center justify-center text-white shadow-md`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className={`font-semibold ${
                            notification.read
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDistanceToNow(notification.createdAt, {
                          addSuffix: true,
                          locale: ko,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
```

## src/app/pages/SchedulePage.tsx

```tsx
import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Trophy, MapPin, Users, Clock, CheckCircle2, XCircle, HelpCircle, Plus } from 'lucide-react';
import { useData, Post, AttendanceStatus } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CreatePostModal } from '../components/CreatePostModal';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { MemberPicker } from '../components/MemberPicker';
export const SchedulePage: React.FC = () => {
  const { posts, updateAttendance, getMyAttendance } = useData();
  const { user, isAdmin } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Post | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // Filter events
  const events = posts
    .filter(p => p.type === 'event')
    .sort((a, b) => (b.startAt?.getTime() || 0) - (a.startAt?.getTime() || 0));
  const upcomingEvents = events.filter(e => e.startAt && e.startAt > new Date());
  const pastEvents = events.filter(e => e.startAt && e.startAt <= new Date());
  const handleAttendance = (eventId: string, status: AttendanceStatus) => {
    if (!user) return;
    const event = posts.find(p => p.id === eventId);
    if (event?.voteClosed) {
      toast.error('투표가 마감되었습니다');
      return;
    }
    updateAttendance(eventId, user.id, status);
    toast.success('출석 상태가 변경되었습니다');
  };
  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full sticky top-14 z-30 bg-white dark:bg-gray-900 border-b">
            <TabsTrigger value="upcoming" className="flex-1">
              예정 ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1">
              지난 일정 ({pastEvents.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="p-4 space-y-3 mt-0">
            {upcomingEvents.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                예정된 일정이 없습니다
              </Card>
            ) : (
              upcomingEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  myStatus={user ? getMyAttendance(event.id, user.id) : 'none'}
                  onAttendance={handleAttendance}
                  onClick={() => setSelectedEvent(event)}
                />
              ))
            )}
          </TabsContent>
          <TabsContent value="past" className="p-4 space-y-3 mt-0">
            {pastEvents.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                지난 일정이 없습니다
              </Card>
            ) : (
              pastEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  myStatus={user ? getMyAttendance(event.id, user.id) : 'none'}
                  onAttendance={handleAttendance}
                  onClick={() => setSelectedEvent(event)}
                  isPast
                />
              ))
            )}
          </TabsContent>
        </Tabs>
        {/* Event Detail Modal */}
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            myStatus={user ? getMyAttendance(selectedEvent.id, user.id) : 'none'}
            onClose={() => setSelectedEvent(null)}
            onAttendance={handleAttendance}
          />
        )}
        {/* Create Event Button */}
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="w-full mt-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            일정 추가
          </Button>
        )}
        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          defaultType="event"
        />
      </div>
    </div>
  );
};
// Event Card Component
const EventCard: React.FC<{
  event: Post;
  index: number;
  myStatus: AttendanceStatus;
  onAttendance: (eventId: string, status: AttendanceStatus) => void;
  onClick: () => void;
  isPast?: boolean;
}> = ({ event, index, myStatus, onAttendance, onClick, isPast }) => {
  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'attending': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'maybe': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };
  const getStatusText = (status: AttendanceStatus) => {
    switch (status) {
      case 'attending': return '참석';
      case 'absent': return '불참';
      case 'maybe': return '미정';
      default: return '미응답';
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Card className={`overflow-hidden ${isPast ? 'opacity-75' : ''}`}>
        {/* Header with gradient */}
        <div
          className={`p-4 ${event.eventType === 'GAME'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
            : 'bg-gradient-to-r from-green-500 to-green-600'
            } text-white`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {event.eventType === 'GAME' ? '경기' : '연습'}
              </Badge>
              {event.voteClosed && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  마감
                </Badge>
              )}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(myStatus)} text-white`}>
              {getStatusText(myStatus)}
            </div>
          </div>
          <h3 className="font-bold text-lg mb-1">{event.title}</h3>
          {event.opponent && (
            <p className="text-sm opacity-90">vs {event.opponent}</p>
          )}
        </div>
        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            {event.startAt && format(event.startAt, 'M월 d일 (E) HH:mm', { locale: ko })}
          </div>
          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            {event.place}
          </div>
          {/* Deadline */}
          {event.voteCloseAt && !event.voteClosed && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <Clock className="w-4 h-4" />
              투표 마감: {format(event.voteCloseAt, 'M월 d일 23:00', { locale: ko })}
            </div>
          )}
          {/* Summary */}
          {event.attendanceSummary && (
            <div className="flex items-center gap-4 pt-2 border-t dark:border-gray-700">
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">{event.attendanceSummary.attending}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-600 font-medium">{event.attendanceSummary.absent}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <HelpCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-600 font-medium">{event.attendanceSummary.maybe}</span>
              </div>
            </div>
          )}
          {/* Action Buttons */}
          {!event.voteClosed && !isPast && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                variant={myStatus === 'attending' ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAttendance(event.id, 'attending');
                }}
                className={myStatus === 'attending' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                참석
              </Button>
              <Button
                variant={myStatus === 'absent' ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAttendance(event.id, 'absent');
                }}
                className={myStatus === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <XCircle className="w-4 h-4 mr-1" />
                불참
              </Button>
              <Button
                variant={myStatus === 'maybe' ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAttendance(event.id, 'maybe');
                }}
                className={myStatus === 'maybe' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                미정
              </Button>
            </div>
          )}
          {/* Detail Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className="w-full"
          >
            자세히 보기
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};
// Event Detail Modal
const EventDetailModal: React.FC<{
  event: Post;
  myStatus: AttendanceStatus;
  onClose: () => void;
  onAttendance: (eventId: string, status: AttendanceStatus) => void;
}> = ({ event, myStatus, onClose, onAttendance }) => {
  const { user, isAdmin } = useAuth();
  const { updatePost } = useData();
  const [isEditingRecorders, setIsEditingRecorders] = useState(false);
  const [recorderIds, setRecorderIds] = useState<string[]>(event.recorders || []);
  const [isSavingRecorders, setIsSavingRecorders] = useState(false);
  // Sync recorderIds when event changes
  React.useEffect(() => {
    setRecorderIds(event.recorders || []);
  }, [event.recorders]);
  const handleSaveRecorders = async () => {
    setIsSavingRecorders(true);
    try {
      await updatePost(event.id, { recorders: recorderIds });
      toast.success('기록원이 지정되었습니다');
      setIsEditingRecorders(false);
    } catch (error) {
      console.error('Error updating recorders:', error);
      toast.error('기록원 지정 실패');
    } finally {
      setIsSavingRecorders(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-4">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <h2 className="font-bold text-xl text-center">{event.title}</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">일시</div>
                <div className="font-medium">
                  {event.startAt && format(event.startAt, 'M월 d일 (E) HH:mm', { locale: ko })}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">장소</div>
                <div className="font-medium">{event.place}</div>
              </div>
            </div>
            {event.opponent && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">상대팀</div>
                  <div className="font-medium">{event.opponent}</div>
                </div>
              </div>
            )}
          </div>
          {/* Game Recorders Section (Only for Games and Admins) */}
          {event.eventType === 'GAME' && isAdmin() && (
            <div className="p-4 border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">기록원</Badge>
                  관리
                </div>
                {!isEditingRecorders ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingRecorders(true)}
                    className="h-8 text-xs"
                  >
                    편집
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveRecorders}
                      disabled={isSavingRecorders}
                      className="h-8 text-xs"
                    >
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingRecorders(false)}
                      className="h-8 text-xs"
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>
              {isEditingRecorders ? (
                <MemberPicker
                  selectedMemberIds={recorderIds}
                  onSelectionChange={setRecorderIds}
                  label="기록원 선택"
                />
              ) : (
                <div className="text-sm">
                  {recorderIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <SelectedRecordersList recorderIds={recorderIds} />
                    </div>
                  ) : (
                    <span className="text-gray-500">배정된 기록원이 없습니다.</span>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Attendance Summary */}
          {event.attendanceSummary && (
            <Card className="p-4 bg-gray-50 dark:bg-gray-800">
              <div className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                참석 현황
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">참석</span>
                  <span className="font-medium text-green-600">{event.attendanceSummary.attending}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">불참</span>
                  <span className="font-medium text-red-600">{event.attendanceSummary.absent}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">미정</span>
                  <span className="font-medium text-yellow-600">{event.attendanceSummary.maybe}명</span>
                </div>
              </div>
            </Card>
          )}
          {/* Content */}
          {event.content && (
            <div>
              <div className="text-sm font-medium mb-2">상세 내용</div>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.content}
              </p>
            </div>
          )}
          {/* Voting Buttons */}
          {!event.voteClosed && (
            <div className="space-y-3">
              <div className="text-sm font-medium">출석 투표</div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={myStatus === 'attending' ? 'default' : 'outline'}
                  onClick={() => onAttendance(event.id, 'attending')}
                  className={myStatus === 'attending' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  참석
                </Button>
                <Button
                  variant={myStatus === 'absent' ? 'default' : 'outline'}
                  onClick={() => onAttendance(event.id, 'absent')}
                  className={myStatus === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  불참
                </Button>
                <Button
                  variant={myStatus === 'maybe' ? 'default' : 'outline'}
                  onClick={() => onAttendance(event.id, 'maybe')}
                  className={myStatus === 'maybe' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  미정
                </Button>
              </div>
            </div>
          )}
          {event.voteClosed && (
            <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <div className="text-sm text-orange-800 dark:text-orange-200 text-center">
                ⏰ 투표가 마감되었습니다
              </div>
            </Card>
          )}
          <Button variant="outline" onClick={onClose} className="w-full">
            닫기
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};
// Helper component to display list of recorder names
const SelectedRecordersList: React.FC<{ recorderIds: string[] }> = ({ recorderIds }) => {
  const { members } = useData();
  return (
    <>
      {recorderIds.map((id) => {
        const member = members.find(m => m.id === id);
        if (!member) return null;
        return (
          <span key={id} className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">{member.realName}</span>
        )
      })}
    </>
  );
};
```

## src/app/pages/SettingsPage.tsx

```tsx
import React from 'react';
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
  ArrowLeft,
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
export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
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
  const handlePushToggle = () => {
    setPushEnabled(!pushEnabled);
    toast.info('푸시 알림은 곧 지원될 예정입니다');
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
                  className={`w-11 h-6 rounded-full transition-colors ${
                    theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
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
                  className={`w-11 h-6 rounded-full transition-colors ${
                    pushEnabled ? 'bg-blue-500' : 'bg-gray-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      pushEnabled ? 'translate-x-6' : 'translate-x-0.5'
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
```
