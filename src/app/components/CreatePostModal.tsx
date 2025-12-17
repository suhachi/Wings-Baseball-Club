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
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">새 게시글 작성</h2>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <form onSubmit={handleSubmit} className="space-y-4 pb-64">
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
                          className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${isActive
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
