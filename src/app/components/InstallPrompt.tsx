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
