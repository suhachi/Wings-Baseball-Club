import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MoreVertical, Trash2, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface CommentListProps {
  postId: string;
}

export const CommentList: React.FC<CommentListProps> = ({ postId }) => {
  const { user, isAdmin } = useAuth();
  const { comments, users, deleteComment, toggleCommentLike } = useData();
  
  const postComments = comments
    .filter(c => c.postId === postId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  if (postComments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        첫 댓글을 작성해보세요!
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-6">
      <AnimatePresence>
        {postComments.map((comment, index) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            index={index}
            canDelete={user?.id === comment.authorId || isAdmin()}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

interface CommentItemProps {
  comment: any;
  index: number;
  canDelete: boolean;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, index, canDelete }) => {
  const { user } = useAuth();
  const { users, deleteComment, toggleCommentLike } = useData();
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(comment.likes?.includes(user?.id || '') || false);
  
  const author = users.find(u => u.id === comment.authorId);

  const handleDelete = async () => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    
    try {
      await deleteComment(comment.postId, comment.id);
      toast.success('댓글이 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('댓글 삭제 중 오류가 발생했습니다');
    }
  };

  const handleLike = async () => {
    if (!user) return;
    
    try {
      await toggleCommentLike(comment.postId, comment.id, user.id);
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
          {author?.name?.charAt(0) || '?'}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{author?.name || '알 수 없음'}</span>
              {author?.nickname && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  @{author.nickname}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(comment.createdAt, 'yyyy.MM.dd HH:mm', { locale: ko })}
            </div>
          </div>

          {canDelete && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10"
                >
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    삭제
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Comment Text */}
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
          {comment.content}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-colors ${
              liked
                ? 'text-red-600 dark:text-red-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            <span>{comment.likes?.length || 0}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
