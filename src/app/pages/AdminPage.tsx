import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Ticket,
  BarChart3,
  Shield,
  UserPlus,
  Activity,
  Edit2,
  Trash2,
  Check,
  X,
  Plus,
  Bell,
  Send,
} from 'lucide-react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore helpers directly for repair
import { db } from '../../lib/firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClub } from '../contexts/ClubContext';
import {
  getAllMembers,
  updateMember,
  getInviteCodes,
  createInviteCode,
  deleteInviteCode,
  updateInviteCode,
  createPost,
} from '../../lib/firebase/firestore.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { UserRole, PostDoc, InviteCodeDoc } from '../../lib/firebase/types';

type TabType = 'members' | 'invites' | 'stats' | 'notices';

interface Member {
  id: string;
  realName: string;
  nickname?: string;
  role: UserRole;
  position?: string;
  backNumber?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

interface InviteCode extends InviteCodeDoc {
  id: string; // InviteCodeDoc has code as key, but sometimes we map id. Firestore service returns id same as code.
}

interface AdminPageProps {
  onBack?: () => void;
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

export const AdminPage: React.FC<AdminPageProps> = ({ onBack, initialTab = 'members' }) => {
  const { user, isAdmin } = useAuth();
  const { currentClubId } = useClub();
  const { posts, members: activeMembers } = useData();
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [showCreateInvite, setShowCreateInvite] = useState(false);

  // 관리자 권한 확인 및 데이터 로드
  useEffect(() => {
    if (!isAdmin()) {
      toast.error('관리자 권한이 필요합니다');
      return;
    }
    if (currentClubId) {
      loadData();
    }
  }, [currentClubId]); // currentClubId 변경 시 재실행

  const loadData = async () => {
    if (!currentClubId) return; // Guard against undefined clubId
    setLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        getAllMembers(currentClubId),
        getInviteCodes(currentClubId),
      ]);
      setMembers(membersData);
      setInviteCodes(invitesData);

      // Self-Repair: If current user is not in the list, add them.
      // This handles legacy admins created before the createAccount fix.
      if (user && !membersData.find((m) => m.id === user.id)) {
        console.log('User missing from club members, repairing...');
        try {
          await setDoc(doc(db, 'clubs', currentClubId, 'members', user.id), {
            uid: user.id, // Collection expects uid field often, map id to uid if needed or keep consistent. Let's use user.id which is uid.
            realName: user.realName,
            nickname: user.nickname,
            photoURL: user.photoURL,
            role: user.role, // Use current role
            status: 'active',
            clubId: currentClubId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          toast.success('멤버십 정보가 동기화되었습니다.');
          // Reload to show the new member
          const updatedMembers = await getAllMembers(currentClubId);
          setMembers(updatedMembers);
        } catch (err) {
          console.error('Auto-repair failed:', err);
        }
      }

    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMember = async (
    memberId: string,
    updates: Partial<Member>
  ) => {
    try {
      await updateMember(currentClubId, memberId, updates);
      await loadData();
      setEditingMember(null);
      toast.success('멤버 정보가 업데이트되었습니다');
    } catch (error) {
      console.error('Error updating member:', error);
      toast.error('업데이트 실패');
    }
  };

  const handleCreateInviteCode = async (data: {
    code: string;
    role: UserRole;
    maxUses: number;
    expiresAt?: Date;
  }) => {
    try {
      await createInviteCode(currentClubId, {
        code: data.code,
        role: data.role,
        createdBy: user!.id,
        createdByName: user!.realName,
        isUsed: false,
        maxUses: data.maxUses,
        currentUses: 0,
        expiresAt: data.expiresAt,
      });
      await loadData();
      setShowCreateInvite(false);
      toast.success('초대 코드가 생성되었습니다');
    } catch (error) {
      console.error('Error creating invite code:', error);
      toast.error('초대 코드 생성 실패');
    }
  };

  const handleDeleteInviteCode = async (code: string) => {
    if (!confirm('정말 이 초대 코드를 삭제하시겠습니까?')) return;

    try {
      await deleteInviteCode(currentClubId, code);
      await loadData();
      toast.success('초대 코드가 삭제되었습니다');
    } catch (error) {
      console.error('Error deleting invite code:', error);
      toast.error('삭제 실패');
    }
  };

  const handleUpdateInviteCode = async (code: string, updates: Partial<InviteCode>) => {
    try {
      await updateInviteCode(currentClubId, code, updates);
      await loadData();
      toast.success('초대 코드가 수정되었습니다');
    } catch (error) {
      console.error('Error updating invite code:', error);
      toast.error('수정 실패');
    }
  };

  // 통계 계산
  const stats = {
    totalMembers: members.length,
    activeMembers: members.filter((m) => m.status === 'active').length,
    inactiveMembers: members.filter((m) => m.status === 'inactive').length,
    totalPosts: posts.length,
    totalInviteCodes: inviteCodes.length,
    usedInviteCodes: inviteCodes.filter((i) => i.isUsed).length,
    availableInviteCodes: inviteCodes.filter((i) => !i.isUsed).length,
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
        <p className="text-purple-100">멤버 및 초대 코드 관리</p>
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
            onClick={() => setActiveTab('invites')}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${activeTab === 'invites'
              ? 'text-purple-600 border-b-2 border-purple-600'
              : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            <Ticket className="w-5 h-5 inline-block mr-2" />
            초대 코드
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
                members={members}
                editingMember={editingMember}
                setEditingMember={setEditingMember}
                onUpdateMember={handleUpdateMember}
              />
            )}

            {/* Invites Tab */}
            {activeTab === 'invites' && (
              <InvitesTab
                inviteCodes={inviteCodes}
                showCreateInvite={showCreateInvite}
                setShowCreateInvite={setShowCreateInvite}
                onCreateInviteCode={handleCreateInviteCode}
                onDeleteInviteCode={handleDeleteInviteCode}
                onUpdateInviteCode={handleUpdateInviteCode}
              />

            )}

            {/* Notices Tab */}
            {activeTab === 'notices' && <NoticesTab currentClubId={currentClubId} user={user!} />}

            {/* Stats Tab */}
            {activeTab === 'stats' && <StatsTab stats={stats} />}
          </>
        )}
      </div>
    </div>
  );
};

// Members Tab Component
const MembersTab: React.FC<{
  members: Member[];
  editingMember: string | null;
  setEditingMember: (id: string | null) => void;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
}> = ({ members, editingMember, setEditingMember, onUpdateMember }) => {
  const [editData, setEditData] = useState<Partial<Member>>({});



  const startEdit = (member: Member) => {
    setEditingMember(member.id);
    setEditData({
      role: member.role,
      position: member.position,
      backNumber: member.backNumber,
      status: member.status,
    });
  };

  return (
    <div className="space-y-3">
      {members.map((member, index) => (
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
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  멤버 정보 수정
                </h3>
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
                        status: e.target.value as 'active' | 'inactive',
                      })
                    }
                  >
                    <option value="active" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">활성</option>
                    <option value="inactive" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">비활성</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onUpdateMember(member.id, editData)}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  저장
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingMember(null)}
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  취소
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
                    {member.nickname && (
                      <span className="text-sm text-gray-500">
                        ({member.nickname})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs font-medium text-white bg-gradient-to-r ${roleColors[member.role]
                        } rounded-full`}
                    >
                      {roleLabels[member.role]}
                    </span>
                    {member.position && (
                      <span className="text-xs text-gray-500">
                        {member.position}
                      </span>
                    )}
                    {member.backNumber && (
                      <span className="text-xs text-gray-500">
                        #{member.backNumber}
                      </span>
                    )}
                    <span
                      className={`text-xs ${member.status === 'active'
                        ? 'text-green-600'
                        : 'text-gray-400'
                        }`}
                    >
                      {member.status === 'active' ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => startEdit(member)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

// Invites Tab Component
const InvitesTab: React.FC<{
  inviteCodes: InviteCode[];
  showCreateInvite: boolean;
  setShowCreateInvite: (show: boolean) => void;
  onCreateInviteCode: (data: any) => void;
  onDeleteInviteCode: (code: string) => void;
  onUpdateInviteCode: (code: string, updates: Partial<InviteCode>) => void;
}> = ({
  inviteCodes,
  showCreateInvite,
  setShowCreateInvite,
  onCreateInviteCode,
  onDeleteInviteCode,
  onUpdateInviteCode,
}) => {
    const [newCode, setNewCode] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('MEMBER');
    const [maxUses, setMaxUses] = useState(1);

    // Edit States
    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [editRole, setEditRole] = useState<UserRole>('MEMBER');
    const [editMaxUses, setEditMaxUses] = useState(1);

    const startEdit = (invite: InviteCode) => {
      setEditingCode(invite.code);
      setEditRole(invite.role);
      setEditMaxUses(invite.maxUses);
    };

    const handleUpdate = () => {
      if (!editingCode) return;
      onUpdateInviteCode(editingCode, {
        role: editRole,
        maxUses: editMaxUses,
      });
      setEditingCode(null);
    };

    const handleCreate = () => {
      if (!newCode.trim()) {
        toast.error('초대 코드를 입력하세요');
        return;
      }
      onCreateInviteCode({
        code: newCode.trim().toUpperCase(),
        role: newRole,
        maxUses,
      });
      setNewCode('');
      setNewRole('MEMBER');
      setMaxUses(1);
    };

    return (
      <div className="space-y-4">
        {/* Create Button */}
        <Button
          onClick={() => setShowCreateInvite(!showCreateInvite)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          초대 코드 생성
        </Button>

        {/* Create Form */}
        {showCreateInvite && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-4 space-y-4"
          >
            <div>
              <Label>초대 코드</Label>
              <Input
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="예: WINGS2024"
                className="uppercase"
              />
            </div>
            <div>
              <Label>역할</Label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="MEMBER">일반</option>
                <option value="ADMIN">관리자</option>
                <option value="TREASURER">총무</option>
                <option value="DIRECTOR">감독</option>
                <option value="PRESIDENT">회장</option>
              </select>
            </div>
            <div>
              <Label>최대 사용 횟수</Label>
              <Input
                type="number"
                value={maxUses}
                onChange={(e) => setMaxUses(parseInt(e.target.value) || 1)}
                min="1"
              />
            </div>
            <Button onClick={handleCreate} className="w-full">
              생성하기
            </Button>
          </motion.div>
        )}

        {/* Invite Codes List */}
        <div className="space-y-3">
          {inviteCodes.map((invite, index) => (
            <motion.div
              key={invite.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl p-4 ${invite.isUsed
                ? 'bg-gray-100 dark:bg-gray-800'
                : 'bg-white dark:bg-gray-900 shadow-sm'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold font-mono">
                      {invite.code}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full ${invite.isUsed
                        ? 'bg-gray-300 text-gray-700'
                        : 'bg-green-100 text-green-700'
                        }`}
                    >
                      {invite.isUsed ? '사용됨' : '사용 가능'}
                    </span>
                    <span
                      className={`ml-2 px-2 py-0.5 text-xs font-medium text-white bg-gradient-to-r ${roleColors[invite.role]} rounded-full`}
                    >
                      {roleLabels[invite.role]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    생성자: {invite.createdByName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(invite.createdAt, {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </p>
                </div>
                {!invite.isUsed && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(invite)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDeleteInviteCode(invite.code)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Edit Mode Form */}
              {editingCode === invite.code && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-3"
                >
                  <div>
                    <Label>역할 수정</Label>
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as UserRole)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="MEMBER">일반</option>
                      <option value="ADMIN">관리자</option>
                      <option value="TREASURER">총무</option>
                      <option value="DIRECTOR">감독</option>
                      <option value="PRESIDENT">회장</option>
                    </select>
                  </div>
                  <div>
                    <Label>최대 사용 횟수 수정</Label>
                    <Input
                      type="number"
                      value={editMaxUses}
                      onChange={(e) => setEditMaxUses(parseInt(e.target.value) || 1)}
                      min="1"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={() => setEditingCode(null)}>취소</Button>
                    <Button size="sm" onClick={handleUpdate}>저장</Button>
                  </div>
                </motion.div>
              )}

              {invite.isUsed && invite.usedByName && (
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    사용자: {invite.usedByName}
                  </p>
                  {invite.usedAt && (
                    <p className="text-xs text-gray-500">
                      사용일:{' '}
                      {formatDistanceToNow(invite.usedAt, {
                        addSuffix: true,
                        locale: ko,
                      })}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

// Stats Tab Component
const StatsTab: React.FC<{ stats: any }> = ({ stats }) => {
  const statCards = [
    {
      label: '전체 멤버',
      value: stats.totalMembers,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: '활성 멤버',
      value: stats.activeMembers,
      icon: UserPlus,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: '비활성 멤버',
      value: stats.inactiveMembers,
      icon: Users,
      color: 'from-gray-500 to-gray-600',
    },
    {
      label: '전체 게시글',
      value: stats.totalPosts,
      icon: Activity,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: '전체 초대코드',
      value: stats.totalInviteCodes,
      icon: Ticket,
      color: 'from-orange-500 to-red-500',
    },
    {
      label: '사용된 초대코드',
      value: stats.usedInviteCodes,
      icon: Check,
      color: 'from-teal-500 to-cyan-500',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 text-white shadow-lg`}
          >
            <stat.icon className="w-8 h-8 mb-2 opacity-80" />
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm opacity-90">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// NoticesTab Component
const NoticesTab: React.FC<{ currentClubId: string; user: any }> = ({
  currentClubId,
  user,
}) => {
  const { posts, deletePost, updatePost } = useData();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sendPush, setSendPush] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filter notices
  const notices = posts
    .filter((p) => p.type === 'notice')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const handleEdit = (notice: any) => {
    setEditingId(notice.id);
    setTitle(notice.title);
    setContent(notice.content);
    setSendPush(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setSendPush(true);
  };

  const handleDelete = async (noticeId: string) => {
    if (!confirm('정말 이 공지를 삭제하시겠습니까?')) return;
    try {
      await deletePost(noticeId);
      toast.success('공지가 삭제되었습니다');
    } catch (error) {
      toast.error('삭제 실패');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력하세요');
      return;
    }

    if (!confirm(editingId ? '공지사항을 수정하시겠습니까?' : '공지사항을 등록하시겠습니까?' + (sendPush ? '\n(멤버들에게 푸시 알림이 발송됩니다)' : ''))) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updatePost(editingId, {
          title: title.trim(),
          content: content.trim(),
          pushStatus: sendPush ? 'PENDING' : undefined,
        });
        toast.success('공지사항이 수정되었습니다');
        setEditingId(null);
      } else {
        const postData: Omit<PostDoc, 'id' | 'createdAt' | 'updatedAt'> = {
          type: 'notice',
          title: title.trim(),
          content: content.trim(),
          authorId: user.id,
          authorName: user.realName,
          authorPhotoURL: user.photoURL,
          pushStatus: sendPush ? 'PENDING' : undefined,
        };
        await createPost(currentClubId, postData);
        toast.success('공지사항이 등록되었습니다');
      }

      setTitle('');
      setContent('');
      setSendPush(true);
    } catch (error) {
      console.error('Error saving notice:', error);
      toast.error('저장 실패');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-bold">{editingId ? '공지 수정' : '새 공지 작성'}</h2>
          </div>
          {editingId && (
            <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
              취소
            </Button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="notice-title">제목</Label>
            <Input
              id="notice-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지사항 제목을 입력하세요"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="notice-content">내용</Label>
            <Textarea
              id="notice-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="mt-1 min-h-[150px]"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${sendPush ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-500'}`}>
                <Send className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">푸시 알림 발송</p>
                <p className="text-xs text-gray-500">
                  {editingId ? '수정 시에도 알림을 다시 보낼 수 있습니다' : '모든 멤버에게 알림을 보냅니다'}
                </p>
              </div>
            </div>
            <Switch
              checked={sendPush}
              onCheckedChange={setSendPush}
            />
          </div>

          <Button
            onClick={handleSubmit}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                처리 중...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? '수정하기' : '등록하기'}
              </div>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Notice List */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg px-2">등록된 공지 ({notices.length})</h3>
        {notices.map((notice) => (
          <motion.div
            key={notice.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 ${editingId === notice.id ? 'ring-2 ring-purple-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{notice.title}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">{notice.content}</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{formatDistanceToNow(notice.createdAt, { addSuffix: true, locale: ko })}</span>
                  {notice.pushStatus && (
                    <Badge variant="outline" className="text-[10px] h-5">
                      {notice.pushStatus === 'SENT' ? '푸시완료' : '푸시미발송'}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(notice)}>
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(notice.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 text-sm text-blue-700 dark:text-blue-300">
        <Activity className="w-5 h-5 flex-shrink-0" />
        <p>
          공지사항은 메인 홈 화면 최상단에 고정될 수 있으며, 푸시 알림을 활성화하면 앱을 설치한 모든 멤버에게 즉시 알림이 전송됩니다.
        </p>
      </div>
    </div>
  );
};