import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Trophy, MapPin, Users, Clock, CheckCircle2, XCircle, HelpCircle, Plus } from 'lucide-react';
import { useData, Post, AttendanceStatus } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { CreatePostModal } from '../components/CreatePostModal';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import { MemberPicker } from '../components/MemberPicker';

export const SchedulePage: React.FC = () => {
  const { posts, updateAttendance, getMyAttendance } = useData();
  const { user, isAdmin } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<Post | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Filter events
  const events = posts
    .filter(p => p.type === 'event')
    .sort((a, b) => (b.startAt?.getTime() || 0) - (a.startAt?.getTime() || 0));

  const upcomingEvents = events.filter(e => e.startAt && e.startAt > new Date());
  const pastEvents = events.filter(e => e.startAt && e.startAt <= new Date());

  const handleAttendance = (eventId: string, status: AttendanceStatus) => {
    if (!user) return;

    const event = posts.find(p => p.id === eventId);
    if (event?.voteClosed) {
      toast.error('투표가 마감되었습니다');
      return;
    }

    updateAttendance(eventId, user.id, status);
    toast.success('출석 상태가 변경되었습니다');
  };

  return (
    <div className="pb-20 pt-16">
      <div className="max-w-md mx-auto">
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full sticky top-14 z-30 bg-white dark:bg-gray-900 border-b">
            <TabsTrigger value="upcoming" className="flex-1">
              예정 ({upcomingEvents.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1">
              지난 일정 ({pastEvents.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="p-4 space-y-3 mt-0">
            {upcomingEvents.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                예정된 일정이 없습니다
              </Card>
            ) : (
              upcomingEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  myStatus={user ? getMyAttendance(event.id, user.id) : 'none'}
                  onAttendance={handleAttendance}
                  onClick={() => setSelectedEvent(event)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="p-4 space-y-3 mt-0">
            {pastEvents.length === 0 ? (
              <Card className="p-8 text-center text-gray-500">
                지난 일정이 없습니다
              </Card>
            ) : (
              pastEvents.map((event, index) => (
                <EventCard
                  key={event.id}
                  event={event}
                  index={index}
                  myStatus={user ? getMyAttendance(event.id, user.id) : 'none'}
                  onAttendance={handleAttendance}
                  onClick={() => setSelectedEvent(event)}
                  isPast
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Event Detail Modal */}
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            myStatus={user ? getMyAttendance(selectedEvent.id, user.id) : 'none'}
            onClose={() => setSelectedEvent(null)}
            onAttendance={handleAttendance}
          />
        )}

        {/* Create Event Button */}
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            className="w-full mt-4"
          >
            <Plus className="w-4 h-4 mr-1" />
            일정 추가
          </Button>
        )}

        {/* Create Post Modal */}
        <CreatePostModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          defaultType="event"
        />
      </div>
    </div>
  );
};

// Event Card Component
const EventCard: React.FC<{
  event: Post;
  index: number;
  myStatus: AttendanceStatus;
  onAttendance: (eventId: string, status: AttendanceStatus) => void;
  onClick: () => void;
  isPast?: boolean;
}> = ({ event, index, myStatus, onAttendance, onClick, isPast }) => {
  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case 'attending': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'maybe': return 'bg-yellow-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusText = (status: AttendanceStatus) => {
    switch (status) {
      case 'attending': return '참석';
      case 'absent': return '불참';
      case 'maybe': return '미정';
      default: return '미응답';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index }}
    >
      <Card className={`overflow-hidden ${isPast ? 'opacity-75' : ''}`}>
        {/* Header with gradient */}
        <div
          className={`p-4 ${event.eventType === 'GAME'
            ? 'bg-gradient-to-r from-blue-500 to-blue-600'
            : 'bg-gradient-to-r from-green-500 to-green-600'
            } text-white`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {event.eventType === 'GAME' ? '경기' : '연습'}
              </Badge>
              {event.voteClosed && (
                <Badge variant="secondary" className="bg-white/20 text-white border-0">
                  마감
                </Badge>
              )}
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(myStatus)} text-white`}>
              {getStatusText(myStatus)}
            </div>
          </div>

          <h3 className="font-bold text-lg mb-1">{event.title}</h3>
          {event.opponent && (
            <p className="text-sm opacity-90">vs {event.opponent}</p>
          )}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Date & Time */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            {event.startAt && format(event.startAt, 'M월 d일 (E) HH:mm', { locale: ko })}
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4" />
            {event.place}
          </div>

          {/* Deadline */}
          {event.voteCloseAt && !event.voteClosed && (
            <div className="flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
              <Clock className="w-4 h-4" />
              투표 마감: {format(event.voteCloseAt, 'M월 d일 23:00', { locale: ko })}
            </div>
          )}

          {/* Summary */}
          {event.attendanceSummary && (
            <div className="flex items-center gap-4 pt-2 border-t dark:border-gray-700">
              <div className="flex items-center gap-1 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-green-600 font-medium">{event.attendanceSummary.attending}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-red-600 font-medium">{event.attendanceSummary.absent}</span>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <HelpCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-yellow-600 font-medium">{event.attendanceSummary.maybe}</span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {!event.voteClosed && !isPast && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <Button
                variant={myStatus === 'attending' ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAttendance(event.id, 'attending');
                }}
                className={myStatus === 'attending' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                참석
              </Button>
              <Button
                variant={myStatus === 'absent' ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAttendance(event.id, 'absent');
                }}
                className={myStatus === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                <XCircle className="w-4 h-4 mr-1" />
                불참
              </Button>
              <Button
                variant={myStatus === 'maybe' ? 'default' : 'outline'}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAttendance(event.id, 'maybe');
                }}
                className={myStatus === 'maybe' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                미정
              </Button>
            </div>
          )}

          {/* Detail Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClick}
            className="w-full"
          >
            자세히 보기
          </Button>
        </div>
      </Card>
    </motion.div>
  );
};

// Event Detail Modal
const EventDetailModal: React.FC<{
  event: Post;
  myStatus: AttendanceStatus;
  onClose: () => void;
  onAttendance: (eventId: string, status: AttendanceStatus) => void;
}> = ({ event, myStatus, onClose, onAttendance }) => {
  const { user, isAdmin } = useAuth();
  const { updatePost } = useData();
  const [isEditingRecorders, setIsEditingRecorders] = useState(false);
  const [recorderIds, setRecorderIds] = useState<string[]>(event.recorders || []);
  const [isSavingRecorders, setIsSavingRecorders] = useState(false);

  // Sync recorderIds when event changes
  React.useEffect(() => {
    setRecorderIds(event.recorders || []);
  }, [event.recorders]);

  const handleSaveRecorders = async () => {
    setIsSavingRecorders(true);
    try {
      await updatePost(event.id, { recorders: recorderIds });
      toast.success('기록원이 지정되었습니다');
      setIsEditingRecorders(false);
    } catch (error) {
      console.error('Error updating recorders:', error);
      toast.error('기록원 지정 실패');
    } finally {
      setIsSavingRecorders(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-4">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
          <h2 className="font-bold text-xl text-center">{event.title}</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Event Info */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">일시</div>
                <div className="font-medium">
                  {event.startAt && format(event.startAt, 'M월 d일 (E) HH:mm', { locale: ko })}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">장소</div>
                <div className="font-medium">{event.place}</div>
              </div>
            </div>

            {event.opponent && (
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">상대팀</div>
                  <div className="font-medium">{event.opponent}</div>
                </div>
              </div>
            )}
          </div>

          {/* Game Recorders Section (Only for Games and Admins) */}
          {event.eventType === 'GAME' && isAdmin() && (
            <div className="p-4 border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/10 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-purple-800 dark:text-purple-300 flex items-center gap-2">
                  <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">기록원</Badge>
                  관리
                </div>
                {!isEditingRecorders ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditingRecorders(true)}
                    className="h-8 text-xs"
                  >
                    편집
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveRecorders}
                      disabled={isSavingRecorders}
                      className="h-8 text-xs"
                    >
                      저장
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingRecorders(false)}
                      className="h-8 text-xs"
                    >
                      취소
                    </Button>
                  </div>
                )}
              </div>

              {isEditingRecorders ? (
                <MemberPicker
                  selectedMemberIds={recorderIds}
                  onSelectionChange={setRecorderIds}
                  label="기록원 선택"
                />
              ) : (
                <div className="text-sm">
                  {recorderIds.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      <SelectedRecordersList recorderIds={recorderIds} />
                    </div>
                  ) : (
                    <span className="text-gray-500">배정된 기록원이 없습니다.</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attendance Summary */}
          {event.attendanceSummary && (
            <Card className="p-4 bg-gray-50 dark:bg-gray-800">
              <div className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                참석 현황
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">참석</span>
                  <span className="font-medium text-green-600">{event.attendanceSummary.attending}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">불참</span>
                  <span className="font-medium text-red-600">{event.attendanceSummary.absent}명</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">미정</span>
                  <span className="font-medium text-yellow-600">{event.attendanceSummary.maybe}명</span>
                </div>
              </div>
            </Card>
          )}

          {/* Content */}
          {event.content && (
            <div>
              <div className="text-sm font-medium mb-2">상세 내용</div>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                {event.content}
              </p>
            </div>
          )}

          {/* Voting Buttons */}
          {!event.voteClosed && (
            <div className="space-y-3">
              <div className="text-sm font-medium">출석 투표</div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={myStatus === 'attending' ? 'default' : 'outline'}
                  onClick={() => onAttendance(event.id, 'attending')}
                  className={myStatus === 'attending' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  참석
                </Button>
                <Button
                  variant={myStatus === 'absent' ? 'default' : 'outline'}
                  onClick={() => onAttendance(event.id, 'absent')}
                  className={myStatus === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  불참
                </Button>
                <Button
                  variant={myStatus === 'maybe' ? 'default' : 'outline'}
                  onClick={() => onAttendance(event.id, 'maybe')}
                  className={myStatus === 'maybe' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  미정
                </Button>
              </div>
            </div>
          )}

          {event.voteClosed && (
            <Card className="p-4 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <div className="text-sm text-orange-800 dark:text-orange-200 text-center">
                ⏰ 투표가 마감되었습니다
              </div>
            </Card>
          )}

          <Button variant="outline" onClick={onClose} className="w-full">
            닫기
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Helper component to display list of recorder names
const SelectedRecordersList: React.FC<{ recorderIds: string[] }> = ({ recorderIds }) => {
  const { members } = useData();
  return (
    <>
      {recorderIds.map((id) => {
        const member = members.find(m => m.id === id);
        if (!member) return null;
        return (
          <span key={id} className="text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">{member.realName}</span>
        )
      })}
    </>
  );
};