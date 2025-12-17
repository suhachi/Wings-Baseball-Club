import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Target,
  Edit,
  ChevronRight,
  X,
  Lock,
  Unlock,
  AlertTriangle,
  Calendar,
  MapPin
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData, Post } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { MemberPicker } from '../components/MemberPicker';

interface GameRecordPageProps {
  onBack?: () => void;
}

export const GameRecordPage: React.FC<GameRecordPageProps> = () => {
  const { user } = useAuth();
  const { posts } = useData();
  const [selectedGame, setSelectedGame] = useState<Post | null>(null);

  // Filter for games (events with eventType === 'GAME')
  const games = posts
    .filter((p: Post) => p.type === 'event' && p.eventType === 'GAME')
    .sort((a: Post, b: Post) => (b.startAt?.getTime() || 0) - (a.startAt?.getTime() || 0));

  return (
    <div className="pb-20 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-8 h-8" />
          <h1 className="text-2xl font-bold">경기 기록</h1>
        </div>
        <p className="text-orange-100">라인업 및 타자/투수 기록 관리</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Games List */}
        <div className="space-y-3">
          {games.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>등록된 경기 일정이 없습니다</p>
            </Card>
          ) : (
            games.map((game: Post, index: number) => (
              <GameCard
                key={game.id}
                game={game}
                index={index}
                onClick={() => setSelectedGame(game)}
              />
            ))
          )}
        </div>
      </div>

      {/* Game Detail Modal */}
      <AnimatePresence>
        {selectedGame && (
          <GameDetailModal
            game={selectedGame}
            onClose={() => setSelectedGame(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Game Card Component
const GameCard: React.FC<{
  game: Post;
  index: number;
  onClick: () => void;
}> = ({ game, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className="p-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99] transition-transform"
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className={`${game.recordingLocked ? 'bg-gray-100 text-gray-600' : 'bg-green-50 text-green-700 border-green-200'}`}>
                {game.recordingLocked ? '마감됨' : '기록중'}
              </Badge>
              <h3 className="text-lg font-bold">vs {game.opponent || '상대팀 미정'}</h3>
            </div>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {game.startAt ? format(game.startAt, 'M월 d일 (E) HH:mm', { locale: ko }) : '미정'}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {game.place || '장소 미정'}
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </Card>
    </motion.div>
  );
};

// Game Detail Modal Component (With Gatekeeper & Lock Logic)
const GameDetailModal: React.FC<{
  game: Post;
  onClose: () => void;
}> = ({ game, onClose }) => {
  const { user, isAdmin } = useAuth();
  const { updatePost, members } = useData();
  const [isLocking, setIsLocking] = useState(false);

  // Gatekeeper Logic
  const canEdit = React.useMemo(() => {
    if (!user) return false;
    if (game.recordingLocked) return false; // Locked games are readonly for everyone except maybe unlocking (admin only)
    if (isAdmin()) return true;
    if (game.recorders && game.recorders.includes(user.id)) return true;
    return false;
  }, [user, game, isAdmin]);

  const canLock = React.useMemo(() => {
    if (!user) return false;
    // Admin or designated recorders can lock
    return !game.recordingLocked && (isAdmin() || (game.recorders && game.recorders.includes(user.id)));
  }, [user, game, isAdmin]);

  const canUnlock = React.useMemo(() => {
    // Only Admin can unlock
    return game.recordingLocked && isAdmin();
  }, [game, isAdmin]);

  const handleToggleLock = async () => {
    if (!confirm(game.recordingLocked ? '기록 입력을 다시 허용하시겠습니까?' : '경기를 종료하고 기록을 마감하시겠습니까?\n마감 후에는 수정할 수 없습니다.')) {
      return;
    }

    setIsLocking(true);
    try {
      await updatePost(game.id, {
        recordingLocked: !game.recordingLocked,
        recordingLockedAt: !game.recordingLocked ? new Date() : undefined, // If unlocking, clear date? or just new date. Actually logic above clears it if not locked? No, logic above sets it if !locked. Wait.
        // Original logic: recordingLocked: !game.recordingLocked
        // If it WAS locked, it becomes UNLOCKED.
        // If it WAS NOT locked, it becomes LOCKED.
        // So `!game.recordingLocked` is the NEW state.
        // If new state is TRUE (Locked), set date and by.
        recordingLockedBy: !game.recordingLocked ? user?.id : undefined
      });
      toast.success(game.recordingLocked ? '기록 잠금이 해제되었습니다' : '경기 기록이 마감되었습니다');
      if (game.recordingLocked) {
        onClose(); // Close modal on lock to refresh state view implies clarity
      }
    } catch (error) {
      console.error('Error toggling lock:', error);
      toast.error('상태 변경 실패');
    } finally {
      setIsLocking(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white dark:bg-gray-900 z-10">
          <h2 className="font-bold text-lg">경기 기록 관리</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Game Status Banner */}
          <div className={`p-4 rounded-xl border flex items-center gap-3 ${game.recordingLocked
            ? 'bg-gray-100 border-gray-200 text-gray-700'
            : 'bg-green-50 border-green-200 text-green-700'
            }`}>
            {game.recordingLocked ? <Lock className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            <div>
              <p className="font-bold">{game.recordingLocked ? '기록 마감됨' : '기록 입력 중'}</p>
              <p className="text-xs opacity-80">
                {game.recordingLocked
                  ? '관리자만 잠금을 해제할 수 있습니다.'
                  : '기록원 및 관리자가 수정할 수 있습니다.'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                vs {game.opponent}
                <Badge variant="outline">{game.place}</Badge>
              </h3>
              <p className="text-gray-500">
                {game.startAt ? format(game.startAt, 'yyyy년 M월 d일 HH:mm', { locale: ko }) : ''}
              </p>
            </div>

            {/* Recorders Selection */}
            {isAdmin() && (
              <div className="space-y-2">
                <MemberPicker
                  label="기록원 배정"
                  selectedMemberIds={game.recorders || []}
                  onSelectionChange={async (ids) => {
                    try {
                      await updatePost(game.id, { recorders: ids });
                    } catch (error) {
                      toast.error('기록원 변경 실패');
                    }
                  }}
                  maxSelection={5}
                />
                <p className="text-xs text-gray-500">
                  기록원으로 지정되면 해당 경기의 기록을 입력할 수 있습니다.
                </p>
              </div>
            )}

            {!isAdmin() && game.recorders && game.recorders.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  배정된 기록원
                </label>
                <div className="flex flex-wrap gap-2">
                  {game.recorders.map(id => {
                    const member = members.find(m => m.id === id);
                    if (!member) return null;
                    return (
                      <Badge key={id} variant="secondary">
                        {member.realName}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Placeholder for Record Input UI */}
            <div className="p-8 border-2 border-dashed rounded-xl text-center space-y-2">
              <Target className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="font-medium text-gray-500">기록 입력 UI 영역</p>
              {canEdit ? (
                <p className="text-sm text-blue-600">작성 권한이 있습니다</p>
              ) : (
                <p className="text-sm text-red-500 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  읽기 전용 모드
                </p>
              )}
            </div>

            {/* Lock/Unlock Actions */}
            <div className="flex gap-2 pt-4 border-t dark:border-gray-800">
              {(canLock || canUnlock) ? (
                <Button
                  className={`w-full ${canLock ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
                  onClick={handleToggleLock}
                  disabled={isLocking}
                >
                  {isLocking ? (
                    '처리 중...'
                  ) : canLock ? (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      경기 종료 및 기록 마감
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4 mr-2" />
                      기록 잠금 해제 (관리자)
                    </>
                  )}
                </Button>
              ) : (
                <Button className="w-full" variant="outline" onClick={onClose}>
                  닫기
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};