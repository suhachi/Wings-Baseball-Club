import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  redeemInviteCode,
  getCurrentUserData,
  updateUserData,
  logout as firebaseLogout,
  onAuthStateChange,
  isAdmin as checkIsAdmin,
  isTreasury as checkIsTreasury,
  canRecordGame,
} from '../../lib/firebase/auth.service';
import type { UserDoc, UserRole } from '../../lib/firebase/types';

// User roles
export type { UserRole };

export interface User {
  id: string;
  realName: string;
  nickname?: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  position?: string;
  backNumber?: string;
  status: 'active' | 'inactive';
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (code: string, realName: string, nickname?: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  isAdmin: () => boolean;
  isTreasury: () => boolean;
  isRecorder: (postId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Firebase 인증 상태 감지
    const unsubscribe = onAuthStateChange(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // Firestore에서 사용자 데이터 가져오기
        const userData = await getCurrentUserData(firebaseUser.uid);
        if (userData) {
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
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (code: string, realName: string, nickname?: string, phone?: string) => {
    try {
      setLoading(true);
      const userData = await redeemInviteCode(code, realName);
      setUser({
        id: userData.id,
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
    } catch (error: any) {
      // Suppress console error for offline state
      if (error.code !== 'unavailable') {
        console.error('❌ Login error:', error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    if (user) {
      try {
        await updateUserData(user.id, updates as Partial<UserDoc>);
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

  const isRecorder = (postId: string) => {
    // 실제로는 Firestore에서 해당 게시글의 recorders 배열을 확인해야 함
    // 지금은 관리자면 기록 가능하도록
    return user ? canRecordGame(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAdmin, isTreasury, isRecorder }}>
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