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
  onNavigateToNoticeManage?: () => void;
  onNavigateToScheduleManage?: () => void;
}

export const MyPage: React.FC<MyPageProps> = ({
  onNavigateToSettings,
  onNavigateToAdmin,
  onNavigateToFinance,
  onNavigateToGameRecord,
  onNavigateToNoticeManage,
  onNavigateToScheduleManage
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
    const attendanceCount = (attendanceRecords || []).filter(
      record => record.userId === user.id && record.status === 'attending'
    ).length;

    // Count posts
    const postCount = (posts || []).filter((post: any) => post.authorId === user.id).length;

    // Count comments
    const allComments = Object.values(comments || {}).flat();
    const commentCount = allComments.filter((comment: any) => comment.authorId === user.id).length;

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
                    <MenuItem icon={Bell} label="공지 관리" onClick={() => onNavigateToNoticeManage?.()} />
                    <Separator />
                    <MenuItem
                      icon={Calendar}
                      label="일정 관리"
                      onClick={() => {
                        toast.info('일정 탭으로 이동합니다. 일정을 클릭하여 수정하세요.');
                        onNavigateToScheduleManage?.();
                      }}
                    />
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