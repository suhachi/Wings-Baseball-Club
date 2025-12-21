import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useData, Post } from '../contexts/DataContext';
import { toast } from 'sonner';

// [C02] RHF & Zod Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdatePostSchema, UpdatePostInput } from '../lib/schemas/post.schema';

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

  // [C02] RHF Setup
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePostInput>({
    resolver: zodResolver(UpdatePostSchema),
    defaultValues: {
      title: post.title,
      content: post.content,
      eventType: post.eventType,
      startDate: post.startAt ? new Date(post.startAt).toISOString().split('T')[0] : '',
      startTime: post.startAt ? new Date(post.startAt).toTimeString().slice(0, 5) : '',
      place: post.place || '',
      opponent: post.opponent || '',
    },
  });

  const eventType = watch('eventType');

  useEffect(() => {
    if (isOpen && post) {
      reset({
        title: post.title,
        content: post.content,
        eventType: post.eventType || 'PRACTICE',
        startDate: post.startAt ? new Date(post.startAt).toISOString().split('T')[0] : '',
        startTime: post.startAt ? new Date(post.startAt).toTimeString().slice(0, 5) : '',
        place: post.place || '',
        opponent: post.opponent || '',
      });
    }
  }, [isOpen, post, reset]);

  const onValidSubmit = async (data: UpdatePostInput) => {
    try {
      const updates: Partial<Post> = {
        title: data.title?.trim(),
        content: data.content?.trim(),
        updatedAt: new Date(),
      };

      // Event specific logic
      if (post.type === 'event') {
        const startDate = data.startDate;
        const startTime = data.startTime;

        if (!startDate || !startTime) {
          // Should be caught by schema or manual check if schema implies optional
          toast.error('일정 날짜와 시간을 입력해주세요');
          return;
        }

        if (!data.place?.trim()) {
          toast.error('장소를 입력해주세요');
          return;
        }

        const eventDateTime = new Date(`${startDate}T${startTime}`);
        if (isNaN(eventDateTime.getTime())) {
          toast.error('올바른 일시를 입력해주세요');
          return;
        }

        updates.eventType = data.eventType;
        updates.startAt = eventDateTime;
        updates.place = data.place?.trim();

        if (data.eventType === 'GAME' && data.opponent?.trim()) {
          updates.opponent = data.opponent?.trim();
        } else {
          // If switched to PRACTICE or empty, clean up?
          // Existing logic didn't explicitly clear it, but let's follow standard behavior.
          // If PRACTICE, opponent is usually ignored or cleared.
          if (data.eventType === 'PRACTICE') {
            updates.opponent = null as any; // or delete field or set undefined
          }
        }
      }

      await updatePost(post.id, updates);
      toast.success('게시글이 수정되었습니다');
      onClose();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('게시글 수정에 실패했습니다');
    }
  };

  const onError = (errors: any) => {
    console.log("Edit Validation Errors", errors);
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
          <form onSubmit={handleSubmit(onValidSubmit, onError)} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4 pb-64">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">제목</label>
                <input
                  type="text"
                  {...register('title')}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.title ? 'border-red-500' : ''}`}
                  placeholder="제목을 입력하세요"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                )}
              </div>

              {/* Event specific fields */}
              {post.type === 'event' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">일정 유형</label>
                    <div className="flex gap-2">
                      {(['PRACTICE', 'GAME'] as const).map((eType) => (
                        <button
                          key={eType}
                          type="button"
                          onClick={() => setValue('eventType', eType)}
                          className={`flex-1 py-3 px-4 rounded-xl font-medium transition-colors ${eventType === eType
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                            }`}
                        >
                          {eType === 'PRACTICE' ? '연습' : '경기'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-2">날짜</label>
                      <input
                        type="date"
                        {...register('startDate')}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startDate ? 'border-red-500' : ''}`}
                      />
                      {errors.startDate && (
                        <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">시간</label>
                      <input
                        type="time"
                        {...register('startTime')}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.startTime ? 'border-red-500' : ''}`}
                      />
                      {errors.startTime && (
                        <p className="mt-1 text-xs text-red-500">{errors.startTime.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">장소</label>
                    <input
                      type="text"
                      {...register('place')}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.place ? 'border-red-500' : ''}`}
                      placeholder="장소를 입력하세요"
                    />
                    {errors.place && (
                      <p className="mt-1 text-xs text-red-500">{errors.place.message}</p>
                    )}
                  </div>

                  {eventType === 'GAME' && (
                    <div>
                      <label className="block text-sm font-medium mb-2">상대팀</label>
                      <input
                        type="text"
                        {...register('opponent')}
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
                  {...register('content')}
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.content ? 'border-red-500' : ''}`}
                  placeholder="내용을 입력하세요"
                />
                {errors.content && (
                  <p className="mt-1 text-xs text-red-500">{errors.content.message}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 px-6 py-4 bg-white dark:bg-gray-900 border-t">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 border rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  disabled={isSubmitting}
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '저장 중...' : '수정 완료'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

