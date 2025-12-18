// Firebase Authentication Context
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  getCurrentUserData,
  updateUserData,
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
const DEFAULT_CLUB_ID = 'default-club';

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
  backNumber?: string;
  status: 'pending' | 'active' | 'rejected' | 'withdrawn';
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  memberStatus: 'checking' | 'active' | 'denied' | null; // μATOM-0401~0402: 멤버 상태 체크
  currentClubId: string; // μATOM-0404: Gate 성공 시 clubId 컨텍스트 고정

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
        const userData = await getCurrentUserData(firebaseUser.uid);
        if (userData) {
          const userObj = {
            id: userData.uid,
            realName: userData.realName,
            nickname: userData.nickname,
            phone: userData.phone,
            photoURL: userData.photoURL || firebaseUser.photoURL || undefined,
            role: userData.role,
            position: userData.position,
            backNumber: userData.backNumber,
            status: userData.status,
            createdAt: userData.createdAt,
          };
          setUser(userObj);

          // μATOM-0401: 멤버 상태 체크 (members/{uid} 존재 확인)
          // μATOM-0402: status==active 검증
          setMemberStatus('checking');
          const accessStatus = await checkMemberAccess(userData.uid, currentClubId);
          setMemberStatus(accessStatus);
        } else {
          // Logged in but no UserDoc (e.g. fresh signup before createAccount called)
          // Do NOT set user yet, let the UI handle the 'creating account' state flow
          setMemberStatus('denied');
        }
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
        await updateUserData(user.id, updates as Partial<unknown>); // Cast to unknown then UserDoc properly if needed
        setUser({ ...user, ...updates });
      } catch (error) {
        console.error('Update user error:', error);
        throw error;
      }
    }
  };

  const isAdmin = () => {
    return user ? checkIsAdmin(user.role) : false;
  };

  const isTreasury = () => {
    return user ? checkIsTreasury(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      memberStatus,
      currentClubId, // μATOM-0404: clubId 컨텍스트 고정
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