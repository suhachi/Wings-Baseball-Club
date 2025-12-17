import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Plus,
  Users,
  Target,
  TrendingUp,
  Edit,
  Trash2,
  Check,
  X,
  ChevronRight,
  Circle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Game {
  id: string;
  opponent: string;
  date: Date;
  location: string;
  result?: 'win' | 'lose' | 'draw';
  ourScore?: number;
  opponentScore?: number;
  createdBy: string;
  createdByName: string;
  recorderId?: string;
  recorderName?: string;
}

interface GameRecordPageProps {
  onBack?: () => void;
}

export const GameRecordPage: React.FC<GameRecordPageProps> = ({ onBack }) => {
  const { user, canRecordGame } = useAuth();
  const { members } = useData();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    opponent: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    location: '',
    recorderId: user?.id || '',
  });

  useEffect(() => {
    // Mock games for demo
    setGames([
      {
        id: '1',
        opponent: '강남 야구단',
        date: new Date('2024-03-15'),
        location: '잠실야구장',
        result: 'win',
        ourScore: 12,
        opponentScore: 8,
        createdBy: user?.id || '',
        createdByName: user?.realName || '',
        recorderId: user?.id || '',
        recorderName: user?.realName || '',
      },
      {
        id: '2',
        opponent: '서초 베이스볼',
        date: new Date('2024-03-08'),
        location: '목동야구장',
        result: 'lose',
        ourScore: 5,
        opponentScore: 9,
        createdBy: user?.id || '',
        createdByName: user?.realName || '',
      },
    ]);
  }, []);

  const handleAddGame = () => {
    if (!user) return;
    if (!formData.opponent || !formData.location) {
      toast.error('상대팀과 경기장을 입력하세요');
      return;
    }

    const newGame: Game = {
      id: Date.now().toString(),
      opponent: formData.opponent,
      date: new Date(formData.date),
      location: formData.location,
      createdBy: user.id,
      createdByName: user.realName,
      recorderId: formData.recorderId,
      recorderName:
        members.find((m) => m.id === formData.recorderId)?.realName || '',
    };

    setGames([newGame, ...games]);
    setShowAddForm(false);
    resetForm();
    toast.success('경기가 등록되었습니다');
  };

  const resetForm = () => {
    setFormData({
      opponent: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      location: '',
      recorderId: user?.id || '',
    });
  };

  const handleDeleteGame = (gameId: string) => {
    if (!confirm('정말 이 경기를 삭제하시겠습니까?')) return;
    setGames(games.filter((g) => g.id !== gameId));
    toast.success('경기가 삭제되었습니다');
  };

  // Calculate statistics
  const stats = {
    totalGames: games.length,
    wins: games.filter((g) => g.result === 'win').length,
    losses: games.filter((g) => g.result === 'lose').length,
    draws: games.filter((g) => g.result === 'draw').length,
  };

  const winRate =
    stats.totalGames > 0
      ? ((stats.wins / stats.totalGames) * 100).toFixed(1)
      : '0.0';

  if (!canRecordGame()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 pt-16 pb-20">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">접근 권한 없음</h2>
          <p className="text-gray-600">기록원만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

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

      {/* Stats Cards */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <Trophy className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{stats.totalGames}</p>
            <p className="text-sm opacity-90">총 경기</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-lg"
          >
            <Target className="w-6 h-6 mb-2 opacity-80" />
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-sm opacity-90">승률</p>
          </motion.div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-green-600">{stats.wins}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">승</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-red-600">{stats.losses}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">패</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center shadow-sm">
            <p className="text-xl font-bold text-gray-600">{stats.draws}</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">무</p>
          </div>
        </div>

        {/* Add Button */}
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          경기 등록
        </Button>

        {/* Add Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl p-4 space-y-4"
          >
            <div>
              <Label>상대팀</Label>
              <Input
                value={formData.opponent}
                onChange={(e) =>
                  setFormData({ ...formData, opponent: e.target.value })
                }
                placeholder="예: 강남 야구단"
              />
            </div>

            <div>
              <Label>경기 날짜</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
              />
            </div>

            <div>
              <Label>경기장</Label>
              <Input
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="예: 잠실야구장"
              />
            </div>

            <div>
              <Label>기록원</Label>
              <select
                value={formData.recorderId}
                onChange={(e) =>
                  setFormData({ ...formData, recorderId: e.target.value })
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
              >
                {members
                  .filter((m) => m.status === 'active')
                  .map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.realName}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddGame} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                등록
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
            </div>
          </motion.div>
        )}

        {/* Games List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-600 border-t-transparent"></div>
            </div>
          ) : games.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600">등록된 경기가 없습니다</p>
            </div>
          ) : (
            games.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold">vs {game.opponent}</h3>
                      {game.result && (
                        <span
                          className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                            game.result === 'win'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                              : game.result === 'lose'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {game.result === 'win'
                            ? '승'
                            : game.result === 'lose'
                            ? '패'
                            : '무'}
                        </span>
                      )}
                    </div>

                    {game.ourScore !== undefined &&
                      game.opponentScore !== undefined && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold text-blue-600">
                            {game.ourScore}
                          </span>
                          <span className="text-gray-400">:</span>
                          <span className="text-2xl font-bold text-red-600">
                            {game.opponentScore}
                          </span>
                        </div>
                      )}

                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>📅 {format(game.date, 'yyyy-MM-dd (EEE)', { locale: ko })}</p>
                      <p>📍 {game.location}</p>
                      {game.recorderName && (
                        <p>✍️ 기록원: {game.recorderName}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedGame(game)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteGame(game.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>

                {/* Record Details Button */}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setSelectedGame(game);
                    toast.info('기록 상세 (곧 구현 예정)');
                  }}
                >
                  <Users className="w-4 h-4 mr-2" />
                  라인업 및 기록 보기
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </Button>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Game Detail Modal (placeholder) */}
      {selectedGame && (
        <GameDetailModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
};

// Game Detail Modal Component
const GameDetailModal: React.FC<{
  game: Game;
  onClose: () => void;
}> = ({ game, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">경기 상세</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-bold mb-2">vs {game.opponent}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {format(game.date, 'yyyy-MM-dd (EEE)', { locale: ko })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {game.location}
            </p>
          </div>

          {/* Placeholder for lineup and records */}
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 text-center">
            <Circle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              라인업 및 기록 기능은 곧 추가됩니다
            </p>
          </div>

          <Button onClick={onClose} className="w-full">
            닫기
          </Button>
        </div>
      </motion.div>
    </div>
  );
};