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
  onLogoClick?: () => void;
  unreadNotificationCount?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  title = 'WINGS BASEBALL CLUB',
  showBack = false,
  onBack,
  showNotification = true,
  showSettings = false,
  onNotificationClick,
  onLogoClick,
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
            <div
              onClick={onLogoClick}
              className={`inline-flex items-center gap-2 ${onLogoClick ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all' : ''}`}
            >
              <img src="/wingslogo.jpg" alt="Logo" className="w-8 h-8 rounded-full border-2 border-white/20 shadow-sm" />
              <h1 className="text-white font-bold tracking-tight">
                {title}
              </h1>
            </div>
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