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
