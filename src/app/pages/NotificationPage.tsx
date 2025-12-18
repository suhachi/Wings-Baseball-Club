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
  ArrowLeft,
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';

interface NotificationPageProps {
  onBack?: () => void;
}

export const NotificationPage: React.FC<NotificationPageProps> = ({ onBack }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead } = useData();

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
