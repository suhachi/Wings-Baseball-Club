import React, { useState } from 'react';
import { X, CheckCircle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useData, Post } from '../contexts/DataContext';
import { toast } from 'sonner';
import { Button } from './ui/button';
interface PollVoteModalProps {
  poll: Post;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const PollVoteModal: React.FC<PollVoteModalProps> = ({
  poll,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { user, isAdmin } = useAuth();
  const { votePoll, getMyVote } = useData();
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const canEdit = user?.id === poll.author.id || isAdmin();

  const myVote = user ? getMyVote(poll.id, user.id) : null;
  const hasVoted = myVote !== null;
  const totalVotes = poll.choices?.reduce((sum, c) => sum + (c.votes?.length || 0), 0) || 0;

  const handleChoiceToggle = (choiceId: string) => {
    if (hasVoted) return;

    if (poll.multi) {
      // 복수 선택
      setSelectedChoices(prev =>
        prev.includes(choiceId)
          ? prev.filter(id => id !== choiceId)
          : [...prev, choiceId]
      );
    } else {
      // 단일 선택
      setSelectedChoices([choiceId]);
    }
  };

  const handleEdit = () => {
    onEdit?.();
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm('투표를 삭제하시겠습니까?')) {
      onDelete?.();
    }
    setShowMenu(false);
  };

  const handleSubmit = async () => {
    if (selectedChoices.length === 0) {
      toast.error('선택지를 선택해주세요');
      return;
    }

    if (!user) {
      toast.error('로그인이 필요합니다');
      return;
    }

    setLoading(true);

    try {
      await votePoll(poll.id, user.id, selectedChoices);
      toast.success('투표가 완료되었습니다');
      onClose();
    } catch (error) {
      console.error('Error voting:', error);
      toast.error('투표 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
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
            className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">{poll.title}</h2>
                <div className="flex items-center gap-2">
                  {canEdit && (
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
                          className="absolute right-0 mt-2 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
                        >
                          <button
                            onClick={handleEdit}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          >
                            <Edit2 className="w-4 h-4" />
                            수정
                          </button>
                          <button
                            onClick={handleDelete}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            삭제
                          </button>
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

              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span>총 {totalVotes}명 참여</span>
                {poll.multi && <span className="text-blue-600 dark:text-blue-400">복수 선택 가능</span>}
                {poll.anonymous && <span className="text-purple-600 dark:text-purple-400">익명 투표</span>}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {hasVoted ? (
                // 투표 완료 - 결과 표시
                <div className="space-y-3">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mb-4">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">투표 완료</span>
                    </div>
                  </div>

                  {poll.choices?.map((choice) => {
                    const percentage = totalVotes > 0 ? (choice.votes || 0) / totalVotes * 100 : 0;
                    const isMyChoice = myVote?.includes(choice.id);

                    return (
                      <div
                        key={choice.id}
                        className={`p-4 rounded-lg border-2 transition-all ${isMyChoice
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{choice.label}</span>
                            {isMyChoice && (
                              <CheckCircle className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {choice.votes || 0}표
                          </span>
                        </div>

                        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className={`h-full ${isMyChoice
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500'
                              }`}
                          />
                        </div>

                        <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    );
                  })}

                  {!poll.anonymous && myVote && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        투표한 선택지
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {poll.choices
                          ?.filter(c => myVote.includes(c.id))
                          .map(choice => (
                            <span
                              key={choice.id}
                              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                            >
                              {choice.label}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // 투표 전 - 선택지 표시
                <div className="space-y-3">
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                    {poll.multi ? '원하는 항목을 모두 선택하세요' : '하나를 선택하세요'}
                  </div>

                  {poll.choices?.map((choice) => {
                    const isSelected = selectedChoices.includes(choice.id);

                    return (
                      <button
                        key={choice.id}
                        onClick={() => handleChoiceToggle(choice.id)}
                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                            ? 'border-blue-500 bg-blue-500'
                            : 'border-gray-300 dark:border-gray-600'
                            }`}>
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-2 h-2 bg-white rounded-full"
                              />
                            )}
                          </div>
                          <span className="font-medium">{choice.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {!hasVoted && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || selectedChoices.length === 0}
                    className="flex-1"
                  >
                    {loading ? '투표 중...' : '투표하기'}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
