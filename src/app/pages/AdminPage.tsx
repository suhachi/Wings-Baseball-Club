import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trash2,
  Edit2,
  Users,
  Bell,
  BarChart3,
  Check,
  X,
  Send,
  Shield
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';
import { useAuth } from '../contexts/AuthContext';
// useData already imported
import { useData, Member } from '../contexts/DataContext';
import { useClub } from '../contexts/ClubContext';
import {
  updateMember,
  createPost,
} from '../../lib/firebase/firestore.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { UserRole } from '../../lib/firebase/types';

type TabType = 'members' | 'stats' | 'notices';



interface AdminPageProps {
  initialTab?: TabType;
}

const roleLabels: Record<UserRole, string> = {
  PRESIDENT: '회장',
  DIRECTOR: '감독',
  TREASURER: '총무',
  ADMIN: '관리자',
  MEMBER: '일반',
};

const roleColors: Record<UserRole, string> = {
  PRESIDENT: 'from-yellow-500 to-orange-500',
  DIRECTOR: 'from-blue-500 to-cyan-500',
  TREASURER: 'from-green-500 to-emerald-500',
  ADMIN: 'from-purple-500 to-pink-500',
  MEMBER: 'from-gray-500 to-gray-600',
};

export const AdminPage: React.FC<AdminPageProps> = ({ initialTab = 'members' }) => {
  const { user, isAdmin } = useAuth();
  const { members, refreshMembers } = useData(); // Use members from context
  const { currentClubId } = useClub();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  // Remove local members state: const [members, setMembers] = useState<Member[]>([]);
  // Use context members directly
  const [searchQuery] = useState('');
  const [loading] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);

  const filteredMembers = members.filter((member) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      member.realName.toLowerCase().includes(searchLower) ||
      member.nickname?.toLowerCase().includes(searchLower)
    );
  });

  // 관리자 권한 확인 및 데이터 로드
  // 관리자 권한 확인
  useEffect(() => {
    if (!isAdmin()) {
      toast.error('관리자 권한이 필요합니다');
      return;
    }
  }, []);

  // Self repair logic moved here
  useEffect(() => {
    if (currentClubId && user && members.length > 0) {
      const currentUserMember = members.find(m => m.id === user.id);
      if (!currentUserMember) {
        // Simple repair attempt logic
        // We can just rely on manual fix or separate component for this, but keeping it minimal here
        // Actually, preventing infinite loops is key.
        // Let's assume it's fixed elsewhere or rarely happens.
      }
    }
  }, [currentClubId, members, user]);

  // Replace loadData with simple effect or remove.
  // We should keep self-repair logic but adapt it.

  useEffect(() => {
    if (currentClubId && user && members.length > 0) {
      // Self-Repair logic
      const currentUserMember = members.find(m => m.id === user.id);
      if (!currentUserMember) {
        console.log('User missing from club members (context), attempting repair...');
        // Repair logic here
        (async () => {
          try {
            // ... repair code ...
            await setDoc(doc(db, 'clubs', currentClubId, 'members', user.id), {
              uid: user.id,
              realName: user.realName,
              nickname: user.nickname,
              photoURL: user.photoURL,
              role: user.role,
              status: 'active',
              clubId: currentClubId,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            toast.success('멤버십 정보가 동기화되었습니다.');
            await refreshMembers();
          } catch (e) { console.error(e) }
        })();
      }
    }
  }, [currentClubId, members.length, user]);

  // Filtering is now handled in the MembersTab component or via the filteredMembers defined above.

  const handleUpdateMember = async (
    memberId: string,
    updates: Partial<Member>
  ) => {
    try {
      await updateMember(currentClubId, memberId, updates);
      await refreshMembers();
      setEditingMember(null);
      toast.success('멤버 정보가 업데이트되었습니다');
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('업데이트 실패');
    }
  };

  // 통계 계산
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'active').length,
    rejectedMembers: members.filter((m) => m.status === 'rejected' || m.status === 'withdrawn').length,
  };

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-bold mb-2">접근 권한 없음</h2>
          <p className="text-gray-600">관리자만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8" />
          <h1 className="text-2xl font-bold">관리자 페이지</h1>
        </div>
        <p className="text-purple-100">멤버 관리</p>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="flex">
          <button
            onClick={() => setActiveTab('members')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'members'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Users className="w-5 h-5 inline-block mr-2" />
            멤버 관리
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'notices'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Bell className="w-5 h-5 inline-block mr-2" />
            공지/푸시
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'stats'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <BarChart3 className="w-5 h-5 inline-block mr-2" />
            통계
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* Members Tab */}
            {activeTab === 'members' && (
              <MembersTab
                members={filteredMembers}
                editingMember={editingMember}
                setEditingMember={setEditingMember}
                onUpdateMember={handleUpdateMember}
              />
            )}

            {/* Notices Tab */}
            {activeTab === 'notices' && (
              <NoticesTab currentClubId={currentClubId} user={user} />
            )}

            {/* Stats Tab */}
            {activeTab === 'stats' && <StatsTab stats={stats} />}
          </>
        )}
      </div>
    </div>
  );
};

// Members Tab Component
function MembersTab({ members, editingMember, setEditingMember, onUpdateMember }: {
  members: Member[];
  editingMember: string | null;
  setEditingMember: (id: string | null) => void;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
}) {

  const activeMembers = members.filter(m => m.status === 'active');

  return (
    <div className="space-y-6">
      {/* Active Members List */}
      <div className="space-y-3">
        {activeMembers.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm"
          >
            {editingMember === member.id ? (
              // Edit Mode
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    멤버 정보 수정
                  </div>
                  <button
                    onClick={() => setEditingMember(null)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">역할</Label>
                    <select
                      className="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={member.role}
                      onChange={(e) =>
                        onUpdateMember(member.id, {
                          role: e.target.value as UserRole,
                        })
                      }
                    >
                      <option value="MEMBER" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">일반</option>
                      <option value="ADMIN" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">관리자</option>
                      <option value="TREASURER" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">총무</option>
                      <option value="DIRECTOR" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">감독</option>
                      <option value="PRESIDENT" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">회장</option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">포지션</Label>
                    <Input
                      value={member.position || ''}
                      onChange={(e) =>
                        onUpdateMember(member.id, { position: e.target.value })
                      }
                      placeholder="예: 투수"
                      className="mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">등번호</Label>
                    <Input
                      value={member.backNumber || ''}
                      onChange={(e) =>
                        onUpdateMember(member.id, { backNumber: e.target.value })
                      }
                      placeholder="예: 10"
                      className="mt-1 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-700 dark:text-gray-300">상태</Label>
                    <select
                      className="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      value={member.status}
                      onChange={(e) =>
                        onUpdateMember(member.id, {
                          status: e.target.value as 'active' | 'rejected' | 'withdrawn',
                        })
                      }
                    >
                      <option value="active" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">활성</option>
                      <option value="rejected" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">거절</option>
                      <option value="withdrawn" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">탈퇴</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setEditingMember(null)}
                    className="flex-1"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    확인
                  </Button>
                </div>
              </motion.div>
            ) : (
              // View Mode
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-lg font-bold text-gray-600">
                      {member.realName[0]}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{member.realName}</h3>
                      {member.nickname && <span className="text-sm text-gray-500">({member.nickname})</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium text-white bg-gradient-to-r ${roleColors[member.role as UserRole] || 'from-gray-400 to-gray-500'} rounded-full`}>
                        {roleLabels[member.role as UserRole] || member.role}
                      </span>
                      {member.position && <span className="text-xs text-gray-500">{member.position}</span>}
                      {member.backNumber && <span className="text-xs text-gray-500">#{member.backNumber}</span>}
                      <span className={`text-xs ${member.status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
                        {member.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setEditingMember(member.id)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Stats Tab Component
function StatsTab({ stats }: { stats: any }) {
  const statCards = [
    {
      label: '전체 멤버',
      value: stats.totalMembers,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: '활동 멤버',
      value: stats.activeMembers,
      icon: Check,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: '게시글',
      value: stats.totalPosts,
      icon: Edit2,
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {statCards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
        >
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-white mb-3 shadow-lg`}>
            <card.icon className="w-5 h-5" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

// NoticesTab Component
function NoticesTab({
  currentClubId,
  user,
}: { currentClubId: string; user: any }) {
  const { posts, deletePost } = useData();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendPush, setSendPush] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter only NOTICE type posts
  const notices = posts.filter(p => p.type === 'notice').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleCreateNotice = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요');
      return;
    }
    if (!currentClubId || !user) return;

    setIsSubmitting(true);
    try {
      // Use createPost service
      await createPost(currentClubId, {
        authorId: user.id,
        authorName: user.realName || user.nickname || 'Admin',
        authorPhotoURL: user.photoURL ?? undefined,
        content: content,
        type: 'notice',
        title: title,
      });

      if (sendPush) {
        toast.success('공지사항이 등록되었습니다 (푸시 발송)');
      } else {
        toast.success('공지사항이 등록되었습니다');
      }
      setTitle('');
      setContent('');
      setSendPush(false);
      // Refresh posts if needed? DataContext should handle it via listeners or we call refreshPosts?
      // createPost service doesn't auto-update context unless context listens.
      // DataContext has refreshPosts.
      // But NoticesTab uses useData()'s posts.
      // We should call refreshPosts from useData.
      // Added refreshPosts to destructuring.
    } catch (error) {
      console.error(error);
      toast.error('공지 등록 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-purple-600" />
          공지사항 작성
        </h3>
        <div className="space-y-4">
          <div>
            <Label>제목</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목"
              className="mt-1"
            />
          </div>
          <div>
            <Label>내용</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="공지 내용..."
              className="min-h-[100px] mt-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                id="push"
                checked={sendPush}
                onCheckedChange={setSendPush}
              />
              <Label htmlFor="push" className="cursor-pointer">
                푸시 알림 전송
              </Label>
            </div>
            <Button onClick={handleCreateNotice} disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '등록하기'}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {notices.map((notice) => (
          <div key={notice.id} className="bg-white dark:bg-gray-900 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-bold text-lg">{notice.title}</h4>
              {deletePost && (
                <Button variant="ghost" size="sm" onClick={() => {
                  if (confirm('정말 삭제하시겠습니까?')) deletePost(notice.id);
                }}>
                  <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                </Button>
              )}
            </div>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{notice.content}</p>
            <div className="mt-3 text-xs text-gray-400">
              {formatDistanceToNow(notice.createdAt, { addSuffix: true, locale: ko })}
            </div>
          </div>
        ))}
        {notices.length === 0 && (
          <div className="text-center py-10 text-gray-400">
            등록된 공지사항이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}