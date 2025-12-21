// Firebase Authentication Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  getCurrentUserData,
  updateMemberData, // [New SSoT Update]
  logout as firebaseLogout,
  onAuthStateChange,
  isAdmin as checkIsAdmin,
  isTreasury as checkIsTreasury,
  loginWithGoogle,
  createAccount,
} from '../../lib/firebase/auth.service';
import { getMember } from '../../lib/firebase/firestore.service';
import type { UserRole } from '../../lib/firebase/types';

// μATOM-0404: Gate 성공 시 clubId 컨텍스트 고정
// 기본값은 ClubContext에서 전달받도록 변경 예정
const DEFAULT_CLUB_ID = 'WINGS';

// User roles and constraints re-export
export type { UserRole };

export interface User {
  id: string; // using uid from firebase auth
  realName: string;
  nickname?: string | null;
  phone?: string | null;
  photoURL?: string | null;
  role: UserRole;
  position?: string;
  backNumber?: number | null;
  status: 'pending' | 'active' | 'rejected' | 'withdrawn';
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  memberStatus: 'checking' | 'active' | 'denied' | null;
  currentClubId: string;
  profileComplete: boolean;
  canAct: boolean;

  // New Auth Methods
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  createMsgAccount: (firebaseUser: FirebaseUser, realName: string, nickname?: string, phone?: string) => Promise<void>;

  // Utils
  updateUser: (updates: Partial<User>) => void;
  isAdmin: () => boolean;
  isTreasury: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  clubId?: string; // μATOM-0404: Gate 성공 시 clubId 컨텍스트 고정
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, clubId = DEFAULT_CLUB_ID }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [memberStatus, setMemberStatus] = useState<'checking' | 'active' | 'denied' | null>(null);
  const [currentClubId] = useState<string>(clubId); // μATOM-0404: clubId 컨텍스트 고정

  // μATOM-0401: 로그인 후 members/{uid} 존재 체크
  // μATOM-0402: status==active 검증
  const checkMemberAccess = async (uid: string, clubId: string): Promise<'active' | 'denied'> => {
    try {
      const memberData = await getMember(clubId, uid);

      if (!memberData) {
        // 멤버 문서가 없음
        return 'denied';
      }

      if (memberData.status === 'active') {
        return 'active';
      }

      // status가 'active'가 아님 (pending, rejected, withdrawn 등)
      return 'denied';
    } catch (error) {
      console.error('Error checking member access:', error);
      return 'denied';
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // μATOM-0610: Auto-provision member if missing (Access Gate)
        const { ensureMemberExists } = await import('../../lib/firebase/auth.service');
        await ensureMemberExists(currentClubId, firebaseUser);

        let userObj: User | null = null;
        let userData = await getCurrentUserData(firebaseUser.uid);

        // [FIX-M01] SINGLE SOURCE OF TRUTH: Always fetch Club Member Doc
        // Priority: memberDoc > userData > firebaseUser (legacy fallback)
        const memberDoc = await getMember(currentClubId, firebaseUser.uid);

        if (process.env.NODE_ENV === 'development') {
          console.log('[AuthContext] Member Sync Debug:', {
            uid: firebaseUser.uid,
            memberExists: !!memberDoc,
            memberRole: memberDoc?.role,
            globalRole: userData?.role
          });
        }

        if (memberDoc) {
          // Case A: Member Doc Exists (Primary SSoT)
          userObj = {
            id: firebaseUser.uid,
            realName: memberDoc.realName || userData?.realName || '',
            nickname: memberDoc.nickname || userData?.nickname || firebaseUser.displayName,
            phone: memberDoc.phone || (memberDoc as any).phoneNumber || userData?.phone || '',
            photoURL: memberDoc.photoURL || userData?.photoURL || firebaseUser.photoURL,
            role: memberDoc.role, // <--- CRITICAL: Use Club Role
            position: memberDoc.position,
            backNumber: memberDoc.backNumber,
            status: memberDoc.status,
            createdAt: memberDoc.createdAt,
          };
        } else if (userData) {
          // Case B: Global User only (No Member Doc yet)
          // [PHASE 1.1] Strict SSoT: Access Denied anyway, but ensure Role is safely degraded.
          userObj = {
            id: userData.uid,
            realName: userData.realName,
            nickname: userData.nickname,
            phone: userData.phone || (userData as any).phoneNumber,
            photoURL: userData.photoURL || firebaseUser.photoURL,
            role: 'MEMBER', // [SECURITY] Force MEMBER if no club membership exists. Do not trust global role.
            position: userData.position,
            backNumber: userData.backNumber,
            status: 'pending', // Force pending/checking status effectively
            createdAt: userData.createdAt,
          };
        }

        setUser(userObj);

        // μATOM-0401: 멤버 상태 체크
        setMemberStatus('checking');
        const accessStatus = await checkMemberAccess(firebaseUser.uid, currentClubId);
        setMemberStatus(accessStatus);

      } else {
        setUser(null);
        setMemberStatus(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- New Methods ---

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
      // onAuthStateChange will handle user state update
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Finalize account creation (link auth user with firestore user doc)
  const createMsgAccount = async (
    firebaseUser: FirebaseUser,
    realName: string,
    nickname?: string,
    phone?: string
  ) => {
    setLoading(true);
    try {
      const userData = await createAccount(
        firebaseUser,
        realName,
        nickname,
        phone
      );
      // Manually set user state since onAuthStateChange might have fired before doc creation
      setUser({
        id: userData.uid,
        realName: userData.realName,
        nickname: userData.nickname,
        phone: userData.phone,
        photoURL: userData.photoURL,
        role: userData.role,
        position: userData.position,
        backNumber: userData.backNumber,
        status: userData.status,
        createdAt: userData.createdAt,
      });
    } catch (error) {
      console.error('Account Creation Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // --- Legacy Methods ---

  // μATOM-0405: 로그아웃 시 상태 초기화
  const logout = async () => {
    try {
      await firebaseLogout();
      // 상태 초기화: user, memberStatus 모두 null로 설정
      setUser(null);
      setMemberStatus(null);
      // Note: DataContext의 초기화는 DataContext 내부에서 user 변경 감지하여 처리
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        // [FIX-M01] SSoT Update: Update Member Doc (and syncs to User doc via service)
        await updateMemberData(currentClubId, user.id, updates as Partial<unknown>);
        setUser({ ...user, ...updates });
      } catch (error) {
        console.error('Update user error:', error);
        throw error;
      }
    }
  };

  const isAdmin = () => {
    // [FIX-M01] Unified Admin Check
    return user ? checkIsAdmin(user.role) : false;
  };

  const isTreasury = () => {
    return user ? checkIsTreasury(user.role) : false;
  };

  const profileComplete = React.useMemo(() => {
    if (!user) return false;
    // [M00-05] M00 Soft Gate: realName + phone required
    // user.phone is already populated with fallback to phoneNumber if available
    return !!(user.realName && user.phone);
  }, [user]);

  const canAct = React.useMemo(() => {
    // GATE MODE SOFT: Active member AND Profile Complete
    return memberStatus === 'active' && profileComplete;
  }, [memberStatus, profileComplete]);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      memberStatus,
      currentClubId,
      profileComplete,
      canAct,
      loginWithGoogle: handleLoginWithGoogle,
      createMsgAccount,
      logout,
      updateUser,
      isAdmin,
      isTreasury
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};