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
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-900 w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden rounded-t-[20px] sm:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col"
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
