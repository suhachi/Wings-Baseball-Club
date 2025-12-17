import React, { useState } from 'react';
import { X, Heart, Share2, MoreVertical, Edit, Trash2, Pin, Calendar, MapPin, Trophy, Users, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData, Post } from '../contexts/DataContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface PostDetailModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { user, isAdmin } = useAuth();
  const { users, deletePost, toggleLike } = useData();
  const [showMenu, setShowMenu] = useState(false);
  const [liked, setLiked] = useState(post.likes?.includes(user?.id || '') || false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const author = users.find(u => u.id === post.authorId);
  const canEdit = user?.id === post.authorId || isAdmin();
  const canDelete = user?.id === post.authorId || isAdmin();

  const handleLike = async () => {
    if (!user) return;
    
    try {
      await toggleLike(post.id, user.id);
      setLiked(!liked);
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('좋아요 처리 중 오류가 발생했습니다');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다');
    }
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit?.(post);
  };

  const handleDelete = async () => {
    setShowMenu(false);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    
    try {
      await deletePost(post.id);
      toast.success('게시글이 삭제되었습니다');
      setShowDeleteDialog(false);
      onClose();
      onDelete?.(post.id);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('삭제 중 오류가 발생했습니다');
    } finally {
      setDeleting(false);
    }
  };

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'notice': return '공지사항';
      case 'free': return '자유게시판';
      case 'event': return '일정';
      case 'poll': return '투표';
      case 'game': return '경기';
      case 'album': return '앨범';
      default: return type;
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'notice': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'free': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'event': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'poll': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400';
      case 'game': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
      case 'album': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
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
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-2xl mx-0 sm:mx-4 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={getPostTypeColor(post.type)}>
                    {getPostTypeLabel(post.type)}
                  </Badge>
                  {post.pinned && (
                    <Badge variant="outline" className="gap-1">
                      <Pin className="w-3 h-3" />
                      고정
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(canEdit || canDelete) && (
                    <div className="relative">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>

                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20"
                        >
                          {canEdit && (
                            <button
                              onClick={handleEdit}
                              className="flex items-center gap-2 w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              수정
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={handleDelete}
                              className="flex items-center gap-2 w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              삭제
                            </button>
                          )}
                        </motion.div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={onClose}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-6">
                {/* Title */}
                <h1 className="text-2xl font-bold">{post.title}</h1>

                {/* Author & Date */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {author?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {author?.name || '알 수 없음'}
                      </div>
                      <div className="text-xs">
                        {author?.nickname && `@${author.nickname}`}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs">
                    {format(post.createdAt, 'yyyy.MM.dd HH:mm', { locale: ko })}
                  </div>
                </div>

                {/* Event Details */}
                {post.type === 'event' && (
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">일시</div>
                        <div className="font-medium">
                          {post.startAt && format(post.startAt, 'M월 d일 (E) HH:mm', { locale: ko })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                        <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">장소</div>
                        <div className="font-medium">{post.place}</div>
                      </div>
                    </div>

                    {post.opponent && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">상대팀</div>
                          <div className="font-medium">{post.opponent}</div>
                        </div>
                      </div>
                    )}

                    {post.attendanceSummary && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex gap-4">
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">참석</div>
                            <div className="font-medium text-green-600">{post.attendanceSummary.attending}명</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">불참</div>
                            <div className="font-medium text-red-600">{post.attendanceSummary.absent}명</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">미정</div>
                            <div className="font-medium text-yellow-600">{post.attendanceSummary.maybe}명</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Poll Details */}
                {post.type === 'poll' && post.choices && (
                  <div className="space-y-3">
                    {post.choices.map((choice) => {
                      const totalVotes = post.choices?.reduce((sum, c) => sum + (c.votes || 0), 0) || 0;
                      const percentage = totalVotes > 0 ? (choice.votes || 0) / totalVotes * 100 : 0;
                      
                      return (
                        <div key={choice.id} className="relative">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{choice.label}</span>
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {choice.votes || 0}표 ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${percentage}%` }}
                              transition={{ duration: 0.5 }}
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {post.content}
                  </p>
                </div>

                {/* Images */}
                {post.images && post.images.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {post.images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Image ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                  <button
                    onClick={handleLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      liked
                        ? 'bg-red-50 text-red-600 dark:bg-red-900/20'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">
                      {post.likes?.length || 0}
                    </span>
                  </button>

                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      {post.commentCount || 0}
                    </span>
                  </button>

                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-medium">공유</span>
                  </button>
                </div>

                {/* Comments Section */}
                <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
                  <h3 className="font-bold text-lg mb-4">
                    댓글 {post.commentCount || 0}
                  </h3>
                  
                  <CommentList postId={post.id} />
                  
                  {user && <CommentForm postId={post.id} />}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Delete Confirmation Dialog */}
          <DeleteConfirmDialog
            isOpen={showDeleteDialog}
            title="게시글 삭제"
            message="정말 이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다."
            onConfirm={confirmDelete}
            onCancel={() => setShowDeleteDialog(false)}
            loading={deleting}
          />
        </div>
      )}
    </AnimatePresence>
  );
};