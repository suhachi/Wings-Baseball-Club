import React, { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useClub } from '../contexts/ClubContext';
import { createNoticeWithPush } from '../../lib/firebase/notices.service';
import { toast } from 'sonner';

interface CreateNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (postId: string) => void;
}

/**
 * ATOM-17: 공지 작성 모달 (Functions 호출 강제)
 * 
 * - Firestore addDoc로 공지 생성 코드 제거/차단
 * - UUID requestId 생성 후 createNoticeWithPush callable 호출
 * - 성공 시 pushStatus 표시 및 상세로 이동
 */
export const CreateNoticeModal: React.FC<CreateNoticeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentClubId } = useClub();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pinned, setPinned] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요');
      return;
    }

    if (!currentClubId) {
      toast.error('클럽이 선택되지 않았습니다');
      return;
    }

    setLoading(true);

    try {
      // ATOM-17: UUID requestId 생성 후 callable 호출
      const result = await createNoticeWithPush(
        currentClubId,
        title.trim(),
        content.trim(),
        pinned
      );

      toast.success('공지가 작성되었습니다');
      
      // pushStatus에 따른 메시지 표시
      if (result.pushStatus === 'FAILED') {
        toast.warning('공지는 작성되었지만 푸시 알림 발송에 실패했습니다. 관리자에게 문의하세요.');
      } else if (result.pushResult && result.pushResult.sent > 0) {
        toast.success(`${result.pushResult.sent}명에게 푸시 알림이 발송되었습니다`);
      }

      onClose();
      resetForm();
      onSuccess?.(result.postId);
    } catch (error: any) {
      console.error('Error creating notice:', error);
      
      // 권한 오류 처리
      if (error.code === 'permission-denied') {
        toast.error('공지 작성 권한이 없습니다');
      } else {
        toast.error('공지 작성 중 오류가 발생했습니다');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPinned(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
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
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 bg-white dark:bg-gray-900 w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[20px] sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col"
          >
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white dark:bg-gray-900">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">공지사항 작성</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">제목</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                    placeholder="제목을 입력하세요"
                    disabled={loading}
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium mb-2">내용</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
                    placeholder="내용을 입력하세요"
                    disabled={loading}
                  />
                </div>

                {/* Pinned */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="text-sm">상단 고정</span>
                  </label>
                </div>

                {/* Info */}
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  작성 시 모든 멤버에게 푸시 알림이 발송됩니다.
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-800">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !title.trim() || !content.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '작성 중...' : '공지 작성'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

