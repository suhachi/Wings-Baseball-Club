import React, { useEffect } from 'react';
import { X, FileText, Users, Calendar, MapPin, Trophy, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';
import { toast } from 'sonner';
import type { PostType } from '../contexts/DataContext';
import { createEventPost } from '../../lib/firebase/events.service';
import { createNoticeWithPush } from '../../lib/firebase/notices.service';
import { canManageNotices, canWritePost } from '../lib/permissions';

// [C02] RHF & Zod Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreatePostSchema, CreatePostInput } from '../lib/schemas/post.schema';

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
  const { user } = useAuth();
  const { currentClubId } = useClub();

  // [C02] RHF Setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreatePostInput>({
    resolver: zodResolver(CreatePostSchema),
    defaultValues: {
      type: defaultType,
      title: '',
      content: '',
      pinned: false,
      eventType: 'PRACTICE', // Default for event
      startDate: '',
      startTime: '',
      place: '',
      opponent: '',
    } as any,
    mode: 'onSubmit', // Validate on submit
  });

  // Watch fields for conditional rendering
  const postType = watch('type');
  const eventType = watch('eventType');
  // const pinned = watch('pinned'); // Removed unused

  // Sync defaultType when modal opens
  useEffect(() => {
    if (isOpen) {
      reset({
        type: defaultType,
        title: '',
        content: '',
        pinned: false,
        eventType: 'PRACTICE',
        startDate: '',
        startTime: '',
        place: '',
        opponent: '',
      } as any);
    }
  }, [isOpen, defaultType, reset]);

  // ATOM-14: free/event만 클라이언트에서 직접 생성 가능
  // notice 생성 UI는 이 ATOM에서 금지 -> v1.1.1: 관리자는 허용
  const basePostTypes: { id: PostType; label: string; icon: React.ElementType }[] = [
    { id: 'free', label: '자유게시판', icon: FileText },
    { id: 'event', label: '이벤트/정모', icon: Users },
  ];

  const postTypes = canManageNotices(user?.role)
    ? [{ id: 'notice' as PostType, label: '공지사항', icon: Bell }, ...basePostTypes]
    : basePostTypes;

  const onValidSubmit = async (data: CreatePostInput) => {
    // [M00-06] Re-validate permissions on submit
    const canWrite = canWritePost(data.type, user?.role, user?.status, user ? !!(user.realName && user.phone) : false);

    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    if (!canWrite) {
      // Double check profile for specific message
      if (!(user.realName && user.phone)) {
        toast.error('프로필 입력이 필요합니다 (실명/전화번호)');
        // Redirect logic could be here if needed, but Toast is enough as per Plan
      } else {
        toast.error('작성 권한이 없습니다');
      }
      return;
    }

    // 1. Notice creation (Admin only - Callable)
    if (data.type === 'notice') {
      try {
        await createNoticeWithPush(
          currentClubId,
          data.title.trim(),
          data.content.trim(),
          !!data.pinned
        );
        await refreshPosts();
        toast.success('공지사항이 작성되었습니다 (알림 발송)');
        onClose();
        reset();
      } catch (error: any) {
        console.error('Error creating notice:', error);
        toast.error(error.message || '공지 작성 중 오류가 발생했습니다');
      }
      return;
    }

    // 2. Event creation (Callable)
    if (data.type === 'event') {
      try {
        const eventDateTime = new Date(`${data.startDate}T${data.startTime}`);
        if (isNaN(eventDateTime.getTime())) {
          toast.error('올바른 일시를 입력해주세요');
          return;
        }

        await createEventPost(
          currentClubId,
          data.eventType,
          data.title.trim(),
          data.content.trim(),
          eventDateTime,
          data.place.trim(),
          data.opponent?.trim() || undefined
        );
        await refreshPosts();

        toast.success('이벤트가 작성되었습니다');
        onClose();
        reset();
      } catch (error: any) {
        console.error('Error creating event:', error);
        toast.error(error.message || '이벤트 작성 중 오류가 발생했습니다');
      }
      return;
    }

    // 3. Free post (Client SDK)
    if (data.type === 'free') {
      try {
        const postData: any = {
          type: 'free',
          title: data.title.trim(),
          content: data.content.trim(),
          pinned: false, // free/event는 고정 불가
        };

        await addPost(postData);

        toast.success('게시글이 작성되었습니다');
        onClose();
        reset();
      } catch (error) {
        console.error('Error creating post:', error);
        toast.error('게시글 작성 중 오류가 발생했습니다');
      }
      return;
    }
  };

  const onError = (errors: any) => {
    console.log("Validation Errors", errors);
    // Optional: Toast on error
    // if (Object.keys(errors).length > 0) {
    //   toast.error('입력 정보를 확인해주세요');
    // }
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
              <form onSubmit={handleSubmit(onValidSubmit, onError)} className="space-y-4">
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
                          // Use setValue for seamless type switching if fields overlap
                          onClick={() => setValue('type', type.id as any)}
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
                  <>
                    <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                      <Bell className="w-4 h-4 text-red-500" />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-red-800 dark:text-red-300">중요 공지</span>
                        <p className="text-xs text-red-600 dark:text-red-400">체크 시 상단에 고정되고 알림이 강조됩니다.</p>
                      </div>
                      <input
                        type="checkbox"
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        {...register('pinned')}
                      />
                    </div>
                  </>
                )}

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">제목</label>
                  <input
                    type="text"
                    {...register('title')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    placeholder="제목을 입력하세요"
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                  )}
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium mb-2">내용</label>
                  <textarea
                    rows={6}
                    {...register('content')}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none ${errors.content ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                    placeholder="내용을 입력하세요"
                  />
                  {errors.content && (
                    <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>
                  )}
                </div>

                {/* μATOM-0534: 이벤트 작성 화면(최소 입력) */}
                {postType === 'event' && (
                  <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {/* Event Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">이벤트 유형</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['PRACTICE', 'GAME'] as const).map((eType) => (
                          <button
                            key={eType}
                            type="button"
                            onClick={() => setValue('eventType', eType)}
                            className={`p-3 rounded-lg border-2 transition-all ${eventType === eType
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-gray-200 dark:border-gray-700'
                              }`}
                          >
                            {eType === 'PRACTICE' ? <Calendar className="w-5 h-5 mx-auto mb-1" /> : <Trophy className="w-5 h-5 mx-auto mb-1" />}
                            <span className="text-xs">{eType === 'PRACTICE' ? '연습' : '경기'}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Start Date & Time */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-2">일시</label>
                        <input
                          type="date"
                          {...register('startDate')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 ${postType === 'event' && (errors as any).startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                        />
                        {postType === 'event' && (errors as any).startDate && (
                          <p className="mt-1 text-xs text-red-500">{(errors as any).startDate.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">시간</label>
                        <input
                          type="time"
                          {...register('startTime')}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 ${postType === 'event' && (errors as any).startTime ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                        />
                        {postType === 'event' && (errors as any).startTime && (
                          <p className="mt-1 text-xs text-red-500">{(errors as any).startTime.message}</p>
                        )}
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
                        {...register('place')}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 ${postType === 'event' && (errors as any).place ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                        placeholder="장소를 입력하세요"
                      />
                      {postType === 'event' && (errors as any).place && (
                        <p className="mt-1 text-xs text-red-500">{(errors as any).place.message}</p>
                      )}
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
                          {...register('opponent')}
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
                type="button"
              >
                취소
              </button>
              <button
                onClick={handleSubmit(onValidSubmit, onError)}
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                type="button" // Use type button with onClick handler to trigger submit
              >
                {isSubmitting ? '작성 중...' : '작성하기'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

