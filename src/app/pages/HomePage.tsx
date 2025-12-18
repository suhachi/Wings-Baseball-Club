import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, Trophy, Clock, Bell, Plus, FileText } from 'lucide-react';
import { useData, Post } from '../contexts/DataContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { format, differenceInHours } from 'date-fns';
import { ko } from 'date-fns/locale';

interface HomePageProps {
  onNavigate: (tab: 'boards', postId?: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const { posts } = useData();

  // Get upcoming events (next 3)
  const upcomingEvents = posts
    .filter(p => p.type === 'event' && p.startAt && p.startAt > new Date())
    .sort((a, b) => (a.startAt?.getTime() || 0) - (b.startAt?.getTime() || 0))
    .slice(0, 3);

  // Get latest notices (2)
  const latestNotices = posts
    .filter(p => p.type === 'notice')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 2);

  // Get next event with deadline
  const nextEventWithDeadline = upcomingEvents[0];
  const hoursUntilDeadline = nextEventWithDeadline?.voteCloseAt
    ? differenceInHours(nextEventWithDeadline.voteCloseAt, new Date())
    : null;

  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <Card className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 border-0 text-white">
            <Users className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">24</div>
            <div className="text-xs opacity-80">활동 멤버</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
            <Calendar className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">3</div>
            <div className="text-xs opacity-80">예정 일정</div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 border-0 text-white">
            <Trophy className="w-5 h-5 mb-2 opacity-80" />
            <div className="text-2xl font-bold">8-5</div>
            <div className="text-xs opacity-80">최근 경기</div>
          </Card>
        </motion.div>

        {/* Deadline Alert */}
        {nextEventWithDeadline && hoursUntilDeadline !== null && hoursUntilDeadline > 0 && hoursUntilDeadline < 48 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 bg-gradient-to-r from-orange-500 to-red-500 border-0 text-white">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold mb-1">출석 투표 마감 임박!</div>
                  <div className="text-sm opacity-90">{nextEventWithDeadline.title}</div>
                  <div className="text-xs opacity-75 mt-1">
                    {hoursUntilDeadline}시간 후 마감 (전날 23:00)
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Upcoming Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              다가오는 일정
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('boards')}
              className="text-blue-600 dark:text-blue-400"
            >
              전체보기
            </Button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length === 0 ? (
              <Card className="p-6 text-center text-gray-500 dark:text-gray-400">
                예정된 일정이 없습니다
              </Card>
            ) : (
              upcomingEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* Latest Notices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5" />
              최신 공지
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('boards')}
              className="text-blue-600 dark:text-blue-400"
            >
              전체보기
            </Button>
          </div>

          <div className="space-y-2">
            {latestNotices.length === 0 ? (
              <Card className="p-6 text-center text-gray-500 dark:text-gray-400">
                공지사항이 없습니다
              </Card>
            ) : (
              latestNotices.map((notice, index) => (
                <NoticeCard
                  key={notice.id}
                  notice={notice}
                  index={index}
                  onNavigate={onNavigate}
                />
              ))
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            빠른 작업
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => nextEventWithDeadline && onNavigate('boards', nextEventWithDeadline.id)}
            >
              <Calendar className="w-6 h-6 text-blue-600" />
              <span className="text-xs">출석하기</span>
            </Button>
            <Button
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => onNavigate('boards')}
            >
              <FileText className="w-6 h-6 text-green-600" />
              <span className="text-xs">글쓰기</span>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

// Event Card Component
const EventCard: React.FC<{
  event: Post;
  index: number;
  onNavigate: (tab: 'boards', postId?: string) => void;
}> = ({ event, index, onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <Card
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onNavigate('boards', event.id)}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
            {event.eventType === 'GAME' ? (
              <Trophy className="w-5 h-5" />
            ) : (
              <Calendar className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={event.eventType === 'GAME' ? 'default' : 'secondary'}>
                {event.eventType === 'GAME' ? '경기' : '연습'}
              </Badge>
              {event.voteClosed && (
                <Badge variant="outline" className="text-xs">마감</Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {event.title}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {event.startAt && format(event.startAt, 'M월 d일 (E) HH:mm', { locale: ko })}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-500 truncate">
              📍 {event.place}
            </div>
            {event.attendanceSummary && (
              <div className="flex items-center gap-3 mt-2 text-xs">
                <span className="text-green-600 dark:text-green-400">
                  참석 {event.attendanceSummary.attending}
                </span>
                <span className="text-red-600 dark:text-red-400">
                  불참 {event.attendanceSummary.absent}
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  미정 {event.attendanceSummary.maybe}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// Notice Card Component
const NoticeCard: React.FC<{
  notice: Post;
  index: number;
  onNavigate: (tab: 'boards', postId?: string) => void;
}> = ({ notice, index, onNavigate }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index }}
    >
      <Card
        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => onNavigate('boards', notice.id)}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg text-white">
            <Bell className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-red-500">공지</Badge>
              {notice.pinned && (
                <Badge variant="outline" className="text-xs">📌 고정</Badge>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">
              {notice.title}
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {format(notice.createdAt, 'M월 d일', { locale: ko })}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};