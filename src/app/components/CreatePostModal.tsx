import React, { useState } from 'react';
import { X, FileText, Users, Calendar, MapPin, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';
import { toast } from 'sonner';
import type { PostType } from '../contexts/DataContext';
import { createEventPost } from '../../lib/firebase/events.service';
import { createNoticeWithPush } from '../../lib/firebase/notices.service';
import { Bell } from 'lucide-react'; // Icon for notice

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: PostType;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'free',
}) => {
  const { addPost, refreshPosts } = useData();
  const { isAdmin } = useAuth();
  const { currentClubId } = useClub();

  const [postType, setPostType] = useState<PostType>(defaultType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [pinned, setPinned] = useState(false); // For notice

  // μATOM-0534: 이벤트 작성 화면 (최소 입력)
  const [eventType, setEventType] = useState<'PRACTICE' | 'GAME'>('PRACTICE');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [place, setPlace] = useState('');
  const [opponent, setOpponent] = useState('');

  // ATOM-14: free/event만 클라이언트에서 직접 생성 가능
  // notice 생성 UI는 이 ATOM에서 금지 -> v1.1.1: 관리자는 허용
  const basePostTypes: { id: PostType; label: string; icon: React.ElementType }[] = [
    { id: 'free', label: '자유게시판', icon: FileText },
    { id: 'event', label: '이벤트/정모', icon: Users },
  ];

  const postTypes = isAdmin()
    ? [{ id: 'notice' as PostType, label: '공지사항', icon: Bell }, ...basePostTypes]
    : basePostTypes;



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요');
      return;
    }

    // Notice creation (Admin only)
    if (postType === 'notice') {
      setLoading(true);
      try {
        await createNoticeWithPush(
          currentClubId,
          title.trim(),
          content.trim(),
          pinned
        );
        await refreshPosts();
        toast.success('공지사항이 작성되었습니다 (알림 발송)');
        onClose();
        resetForm();
      } catch (error: any) {
        console.error('Error creating notice:', error);
        toast.error(error.message || '공지 작성 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
      return;
    }

    // μATOM-0534: 이벤트 작성 화면(최소 입력) - 필수값 누락 방지
    if (postType === 'event') {
      if (!startDate || !startTime || !place.trim()) {
        toast.error('일시, 장소는 필수 입력 항목입니다');
        return;
      }

      // event는 callable로 생성
      setLoading(true);
      try {
        const eventDateTime = new Date(`${startDate}T${startTime}`);
        if (isNaN(eventDateTime.getTime())) {
          toast.error('올바른 일시를 입력해주세요');
          setLoading(false);
          return;
        }

        await createEventPost(
          currentClubId,
          eventType,
          title.trim(),
          content.trim(),
          eventDateTime,
          place.trim(),
          opponent.trim() || undefined
        );
        await refreshPosts();

        toast.success('이벤트가 작성되었습니다');
        onClose();
        resetForm();
      } catch (error: any) {
        console.error('Error creating event:', error);
        toast.error(error.message || '이벤트 작성 중 오류가 발생했습니다');
      } finally {
        setLoading(false);
      }
      return;
    }

    // free는 클라이언트에서 직접 생성
    if (postType !== 'free') {
      toast.error('이 게시글 타입은 클라이언트에서 직접 생성할 수 없습니다');
      return;
    }

    setLoading(true);

    try {
      const postData: any = {
        type: postType,
        title: title.trim(),
        content: content.trim(),
        pinned: false, // free/event는 고정 불가
      };

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
    setEventType('PRACTICE');
    setStartDate('');
    setStartTime('');
    setPlace('');
    setOpponent('');
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
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Post Type Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">게시글 유형</label>
                  <div className="grid grid-cols-2 gap-2">
                    {postTypes.map((type) => {
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

                {/* Pinned Checkbox (Notice Only) */}
                {postType === 'notice' && (
                  <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                    <Bell className="w-4 h-4 text-red-500" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-red-800 dark:text-red-300">중요 공지</span>
                      <p className="text-xs text-red-600 dark:text-red-400">체크 시 상단에 고정되고 알림이 강조됩니다.</p>
                    </div>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      checked={pinned}
                      onChange={(e) => setPinned(e.target.checked)}
                    />
                  </div>
                )}

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

                {/* μATOM-0534: 이벤트 작성 화면(최소 입력) */}
                {postType === 'event' && (
                  <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {/* Event Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">이벤트 유형</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEventType('PRACTICE')}
                          className={`p-3 rounded-lg border-2 transition-all ${eventType === 'PRACTICE'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                            }`}
                        >
                          <Calendar className="w-5 h-5 mx-auto mb-1" />
                          <span className="text-xs">연습</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventType('GAME')}
                          className={`p-3 rounded-lg border-2 transition-all ${eventType === 'GAME'
                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                            }`}
                        >
                          <Trophy className="w-5 h-5 mx-auto mb-1" />
                          <span className="text-xs">경기</span>
                        </button>
                      </div>
                    </div>

                    {/* Start Date & Time */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-2">일시</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                          required={postType === 'event'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">시간</label>
                        <input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                          required={postType === 'event'}
                        />
                      </div>
                    </div>

                    {/* Place */}
                    <div>
                      <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        장소 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={place}
                        onChange={(e) => setPlace(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                        placeholder="장소를 입력하세요"
                        required={postType === 'event'}
                      />
                    </div>

                    {/* Opponent (경기일 때만) */}
                    {eventType === 'GAME' && (
                      <div>
                        <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          상대팀
                        </label>
                        <input
                          type="text"
                          value={opponent}
                          onChange={(e) => setOpponent(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800"
                          placeholder="상대팀을 입력하세요"
                        />
                      </div>
                    )}
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
                disabled={loading || !title.trim() || !content.trim()}
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
