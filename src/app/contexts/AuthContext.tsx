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
  canRecordGame,
  loginWithGoogle,
  loginWithEmail,
  signUpWithEmail,
  createAccount,
  validateInviteCode,
  InviteCodeData
} from '../../lib/firebase/auth.service';
import type { UserRole } from '../../lib/firebase/types';

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
  status: 'active' | 'inactive';
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;

  // New Auth Methods
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<FirebaseUser>;

  // Account Creation (Linking Auth + Invite Code)
  createMsgAccount: (firebaseUser: FirebaseUser, inviteCode: string, realName: string, nickname?: string, phone?: string) => Promise<void>;

  // Utils
  checkInviteCode: (code: string) => Promise<InviteCodeData>;
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
    const unsubscribe = onAuthStateChange(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const userData = await getCurrentUserData(firebaseUser.uid);
        if (userData) {
          setUser({
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
          });
        } else {
          // Logged in but no UserDoc (e.g. fresh signup before createAccount called)
          // Do NOT set user yet, let the UI handle the 'creating account' state flow
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- New Methods ---

  const signInWithGoogle = async () => {
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

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await loginWithEmail(email, pass);
    } catch (error) {
      console.error('Email Sign In Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      return await signUpWithEmail(email, pass, name);
    } catch (error) {
      console.error('Email Register Error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Finalize account creation (link auth user with firestore user doc using invite code)
  const createMsgAccount = async (
    firebaseUser: FirebaseUser,
    inviteCode: string,
    realName: string,
    nickname?: string,
    phone?: string
  ) => {
    setLoading(true);
    try {
      const userData = await createAccount(
        firebaseUser,
        inviteCode,
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

  const checkInviteCode = async (code: string) => {
    return await validateInviteCode(code);
  }

  // --- Legacy Methods ---

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

  const isRecorder = (_postId: string) => {
    return user ? canRecordGame(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      registerWithEmail,
      createMsgAccount,
      checkInviteCode,
      logout,
      updateUser,
      isAdmin,
      isTreasury,
      isRecorder
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