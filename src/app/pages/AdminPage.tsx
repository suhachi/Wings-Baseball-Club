import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  Ticket,
  BarChart3,
  Shield,
  UserPlus,
  Mail,
  Calendar,
  TrendingUp,
  Activity,
  Edit2,
  Trash2,
  Check,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useClub } from '../contexts/ClubContext';
import {
  getAllMembers,
  updateMember,
  getInviteCodes,
  createInviteCode,
  deleteInviteCode,
} from '../../lib/firebase/firestore.service';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { UserRole } from '../../lib/firebase/types';

type TabType = 'members' | 'invites' | 'stats';

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

interface InviteCode {
  id: string;
  code: string;
  role: UserRole;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  expiresAt?: Date;
  isUsed: boolean;
  usedBy?: string;
  usedByName?: string;
  usedAt?: Date;
  maxUses: number;
  currentUses: number;
}

interface AdminPageProps {
  onBack?: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onBack }) => {
  const { user, isAdmin } = useAuth();
  const { currentClubId } = useClub();
  const { posts, members: activeMembers } = useData();
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [showCreateInvite, setShowCreateInvite] = useState(false);

  // 관리자 권한 확인
  useEffect(() => {
    if (!isAdmin()) {
      toast.error('관리자 권한이 필요합니다');
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, invitesData] = await Promise.all([
        getAllMembers(currentClubId),
        getInviteCodes(currentClubId),
      ]);
      setMembers(membersData);
      setInviteCodes(invitesData);
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
              />
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
const MembersTab: React.FC<{
  members: Member[];
  editingMember: string | null;
  setEditingMember: (id: string | null) => void;
  onUpdateMember: (id: string, updates: Partial<Member>) => void;
}> = ({ members, editingMember, setEditingMember, onUpdateMember }) => {
  const [editData, setEditData] = useState<Partial<Member>>({});

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
            <div className="space-y-4">
              <div>
                <Label>역할</Label>
                <select
                  value={editData.role}
                  onChange={(e) =>
                    setEditData({ ...editData, role: e.target.value as UserRole })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="MEMBER">일반</option>
                  <option value="ADMIN">관리자</option>
                  <option value="TREASURER">총무</option>
                  <option value="DIRECTOR">감독</option>
                  <option value="PRESIDENT">회장</option>
                </select>
              </div>
              <div>
                <Label>포지션</Label>
                <Input
                  value={editData.position || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, position: e.target.value })
                  }
                  placeholder="예: 투수"
                />
              </div>
              <div>
                <Label>등번호</Label>
                <Input
                  value={editData.backNumber || ''}
                  onChange={(e) =>
                    setEditData({ ...editData, backNumber: e.target.value })
                  }
                  placeholder="예: 10"
                />
              </div>
              <div>
                <Label>상태</Label>
                <select
                  value={editData.status}
                  onChange={(e) =>
                    setEditData({
                      ...editData,
                      status: e.target.value as 'active' | 'inactive',
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                </select>
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
            </div>
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
}> = ({
  inviteCodes,
  showCreateInvite,
  setShowCreateInvite,
  onCreateInviteCode,
  onDeleteInviteCode,
}) => {
    const [newCode, setNewCode] = useState('');
    const [newRole, setNewRole] = useState<UserRole>('MEMBER');
    const [maxUses, setMaxUses] = useState(1);

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
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDeleteInviteCode(invite.code)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
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