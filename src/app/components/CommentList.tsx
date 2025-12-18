import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { EmptyState } from './EmptyState';

interface CommentListProps {
  postId: string;
}

export const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const { comments } = useData();

  const postComments = (comments[postId] || [])
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (postComments.length === 0) {
    return (
      <EmptyState 
        type="empty" 
        message="첫 댓글을 작성해보세요!"
      />
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <AnimatePresence>
        {postComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            postId={postId}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface CommentItemProps {
  comment: any;
  postId: string;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, postId }) => {
  const { user } = useAuth();
  const { members, deleteComment, updateComment } = useData();
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  // ATOM-15: 작성자 확인
  const isAuthor = user?.id === comment.author.id;

  // ATOM-15: adminLike 확인 (PRESIDENT | DIRECTOR | ADMIN | TREASURER)
  const isAdminLike = user?.role && ['PRESIDENT', 'DIRECTOR', 'ADMIN', 'TREASURER'].includes(user.role);

  // ATOM-15: 수정/삭제 버튼 노출 조건 - 작성자만, 삭제는 adminLike도 가능
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdminLike;

  // Match author by ID from the nested author object
  const author = members.find(u => u.id === comment.author.id);
  const displayName = author?.realName || comment.author.name || '알 수 없음';
  const displayPhoto = author?.photoURL || comment.author.photoURL;

  const handleDelete = async () => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(postId, comment.id);
      toast.success('댓글이 삭제되었습니다');
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      // ATOM-15: 서버 거부 시 에러 메시지 표시
      if (error.code === 'permission-denied') {
        toast.error('댓글 삭제 권한이 없습니다');
      } else {
        toast.error('댓글 삭제 중 오류가 발생했습니다');
      }
    }
  };

  const handleUpdate = async () => {
    if (!editContent.trim()) {
      toast.error('댓글 내용을 입력해주세요');
      return;
    }

    try {
      await updateComment(postId, comment.id, editContent.trim());
      toast.success('댓글이 수정되었습니다');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating comment:', error);
      // ATOM-15: 서버 거부 시 에러 메시지 표시
      if (error.code === 'permission-denied') {
        toast.error('댓글 수정 권한이 없습니다');
      } else {
        toast.error('댓글 수정 중 오류가 발생했습니다');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm overflow-hidden">
          {displayPhoto ? (
            <img src={displayPhoto} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            displayName.charAt(0)
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{displayName}</span>
              {author?.nickname && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  @{author.nickname}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(comment.createdAt, 'yyyy.MM.dd HH:mm', { locale: ko })}
              {comment.updatedAt && comment.updatedAt.getTime() !== comment.createdAt.getTime() && (
                <span className="ml-2">(수정됨)</span>
              )}
            </div>
          </div>

          {/* ATOM-15: 작성자만 수정/삭제 버튼 노출, 삭제는 adminLike도 가능 */}
          {(canEdit || canDelete) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="More options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                >
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      수정
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      삭제
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Comment Text or Edit Form */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        )}
      </div>
    </motion.div>
  );
};
