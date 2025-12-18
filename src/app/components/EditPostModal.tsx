import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData, Post } from '../contexts/DataContext';
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
  const { updatePost } = useData();

  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);
  const [loading, setLoading] = useState(false);

  // Event fields
  const [eventType, setEventType] = useState<'PRACTICE' | 'GAME'>(post.eventType || 'PRACTICE');
  const [startDate, setStartDate] = useState(
    post.startAt ? new Date(post.startAt).toISOString().split('T')[0] : ''
  );
  const [startTime, setStartTime] = useState(
    post.startAt ? new Date(post.startAt).toTimeString().slice(0, 5) : ''
  );
  const [place, setPlace] = useState(post.place || '');
  const [opponent, setOpponent] = useState(post.opponent || '');


  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setTitle(post.title);
      setContent(post.content);
      setEventType(post.eventType || 'PRACTICE');
      setStartDate(post.startAt ? new Date(post.startAt).toISOString().split('T')[0] : '');
      setStartTime(post.startAt ? new Date(post.startAt).toTimeString().slice(0, 5) : '');
      setPlace(post.place || '');
      setOpponent(post.opponent || '');
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
        updates.startAt = eventDateTime;
        updates.place = place.trim();
        if (eventType === 'GAME' && opponent.trim()) {
          updates.opponent = opponent.trim();
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


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
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
          onClick={(e) => e.stopPropagation()}
          className="relative z-10 bg-white dark:bg-gray-900 w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[20px] sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col"
        >
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white dark:bg-gray-900">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">게시글 수정</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4 pb-64">
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
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${eventType === 'PRACTICE'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                      >
                        연습
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventType('GAME')}
                        className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${eventType === 'GAME'
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
