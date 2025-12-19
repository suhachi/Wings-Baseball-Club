import React, { useState, useEffect } from 'react';
import { X, Share2, Edit, Trash2, Pin, Calendar, MapPin, Trophy, Users, MessageCircle, AlertCircle, Bell, Clock, CheckCircle2, XCircle, HelpCircle, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData, Post, AttendanceStatus } from '../contexts/DataContext';
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
  const { members, deletePost, loadComments, updateAttendance, getMyAttendance, loadAttendances } = useData();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // μATOM-0304: 상세 공통 post fetch + comments fetch
  useEffect(() => {
    if (isOpen && post.id) {
      loadComments(post.id);
      // μATOM-0502: attendance 읽기 (event 타입만)
      if (post.type === 'event') {
        loadAttendances(post.id);
      }
    }
  }, [isOpen, post.id, loadComments, post.type, loadAttendances]);

  // μATOM-0502: 내 상태 표시
  const myAttendanceStatus = user ? getMyAttendance(post.id, user.id) : 'none';

  // μATOM-0503: YES/NO/MAYBE 투표 write
  const handleAttendanceChange = async (status: AttendanceStatus) => {
    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    // μATOM-0505: voteClosed=true면 버튼 비활성
    if (post.voteClosed) {
      toast.error('투표가 마감되었습니다');
      return;
    }

    try {
      await updateAttendance(post.id, user.id, status);
      toast.success('출석 상태가 변경되었습니다');
      await loadAttendances(post.id);
    } catch (error: any) {
      console.error('Error updating attendance:', error);
      toast.error(error.message || '출석 상태 변경에 실패했습니다');
    }
  };

  // Fix: use realName
  const author = members.find(u => u.id === post.author.id);
  const canEdit = user?.id === post.author.id || isAdmin();
  const canDelete = user?.id === post.author.id || isAdmin();

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
      case 'event': return '이벤트/정모';
      default: return type;
    }
  };

  const getPushStatusLabel = (status?: string) => {
    switch (status) {
      case 'SENT': return '푸시 발송 완료';
      case 'FAILED': return '푸시 발송 실패';
      case 'PENDING': return '푸시 발송 대기중';
      default: return null;
    }
  };

  const getPushStatusColor = (status?: string) => {
    switch (status) {
      case 'SENT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'FAILED': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return '';
    }
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'notice': return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'free': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'event': return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
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
                  <button
                    onClick={onClose}
                    className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full sm:hidden"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <Badge className={getPostTypeColor(post.type)}>
                    {getPostTypeLabel(post.type)}
                  </Badge>
                  {post.pinned && (
                    <Badge variant="outline" className="gap-1">
                      <Pin className="w-3 h-3" />
                      고정
                    </Badge>
                  )}
                  {/* μATOM-0525: 공지 상세 배지(SENT/FAILED) 표시 */}
                  {post.type === 'notice' && post.pushStatus && (
                    <Badge className={getPushStatusColor(post.pushStatus)}>
                      <Bell className="w-3 h-3 mr-1" />
                      {getPushStatusLabel(post.pushStatus)}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {(canEdit || canDelete) && (
                    <div className="flex gap-2">
                      {canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Edit clicked');
                            onEdit?.(post);
                          }}
                          className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Delete clicked');
                            onDelete?.(post.id);
                          }}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )}
                  <button
                    onClick={onClose}
                    className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-6 py-6 space-y-6">
                {/* Header Admin Message for Push Failure */}
                {/* μATOM-0525: 공지 상세 배지(SENT/FAILED) 표시 - 실패 시 안내 */}
                {isAdmin() && post.type === 'notice' && post.pushStatus === 'FAILED' && (
                  <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <div>
                      <p className="font-bold">푸시 발송에 실패했습니다.</p>
                      {post.pushError && <p className="mt-1">오류: {post.pushError}</p>}
                      <p className="mt-1">FCM 토큰이 만료되었거나 서버 오류일 수 있습니다. 게시글은 정상적으로 등록되었습니다.</p>
                    </div>
                  </div>
                )}

                {/* Title */}
                <h1 className="text-2xl font-bold">{post.title}</h1>

                {/* Author & Date */}
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                      {author?.realName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {author?.realName || '알 수 없음'}
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

                    {/* μATOM-0501: voteCloseAt 표시 */}
                    {post.voteCloseAt && (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg">
                          <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">투표 마감</div>
                          <div className="font-medium">
                            {format(post.voteCloseAt, 'M월 d일 23:00 (KST)', { locale: ko })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* μATOM-0504: 집계 표시 */}
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

                    {/* μATOM-0502: 내 상태 표시 + μATOM-0503: YES/NO/MAYBE 투표 + μATOM-0505: voteClosed 비활성 */}
                    {user && user.status === 'active' && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          내 출석 상태: {myAttendanceStatus === 'attending' ? '참석' : myAttendanceStatus === 'absent' ? '불참' : myAttendanceStatus === 'maybe' ? '미정' : '미투표'}
                        </div>
                        {post.voteClosed ? (
                          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-sm text-gray-500 dark:text-gray-400">
                            투표가 마감되었습니다
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            <Button
                              variant={myAttendanceStatus === 'attending' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleAttendanceChange('attending')}
                              className={myAttendanceStatus === 'attending' ? 'bg-green-600 hover:bg-green-700' : ''}
                              disabled={post.voteClosed}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              참석
                            </Button>
                            <Button
                              variant={myAttendanceStatus === 'absent' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleAttendanceChange('absent')}
                              className={myAttendanceStatus === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                              disabled={post.voteClosed}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              불참
                            </Button>
                            <Button
                              variant={myAttendanceStatus === 'maybe' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleAttendanceChange('maybe')}
                              className={myAttendanceStatus === 'maybe' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                              disabled={post.voteClosed}
                            >
                              <HelpCircle className="w-4 h-4 mr-1" />
                              미정
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}


                {/* Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {post.content}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-800">
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

                  {/* Comment Form (Restricted) */}
                  {user && user.status !== 'pending' && <CommentForm postId={post.id} />}
                  {user && user.status === 'pending' && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-center text-sm text-gray-500">
                      승인 대기 중에는 댓글을 작성할 수 없습니다.
                    </div>
                  )}
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