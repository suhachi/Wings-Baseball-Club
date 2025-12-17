// Firebase Authentication Service
import {
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { UserDoc, UserRole } from './types';

/**
 * 초대 코드로 회원가입
 */
export async function redeemInviteCode(
  inviteCode: string,
  realName: string
): Promise<UserDoc> {
  try {
    // 1. 초대 코드 확인
    const inviteCodeRef = doc(db, 'inviteCodes', inviteCode);
    const inviteDoc = await getDoc(inviteCodeRef);

    if (!inviteDoc.exists()) {
      throw new Error('존재하지 않는 초대 코드입니다.');
    }

    const inviteData = inviteDoc.data() as any;

    if (inviteData.isUsed && inviteData.currentUses >= inviteData.maxUses) {
      throw new Error('이미 사용된 초대 코드입니다.');
    }

    if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
      throw new Error('만료된 초대 코드입니다.');
    }

    // 2. 익명 로그인
    const firebaseUser = await signInAnonymously(auth).then((cred) => cred.user);

    const userData: UserDoc = {
      id: firebaseUser.uid,
      realName,
      role: inviteData.role || 'MEMBER',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 3. Firestore에 사용자 정보 저장
    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 4. 초대 코드 사용 처리
    await setDoc(
      inviteCodeRef,
      {
        isUsed: true,
        usedBy: firebaseUser.uid,
        usedByName: realName,
        usedAt: serverTimestamp(),
        currentUses: inviteData.currentUses + 1,
      },
      { merge: true }
    );

    return userData;
  } catch (error: any) {
    // Firebase offline error handling
    if (error.code === 'unavailable') {
      console.warn('Firebase is offline. Please check your internet connection.');
      throw new Error('인터넷 연결을 확인해주세요.');
    }
    console.error('❌ Error redeeming invite code:', error);
    throw error;
  }
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUserData(uid: string): Promise<UserDoc | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    } as UserDoc;
  } catch (error: any) {
    // Firebase offline error handling
    if (error.code === 'unavailable') {
      console.warn('Firebase is offline. Using cached data if available.');
      return null;
    }
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * 사용자 정보 업데이트
 */
export async function updateUserData(
  uid: string,
  updates: Partial<UserDoc>
): Promise<void> {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * 인증 상태 감지
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * 초대 코드 생성 (관리자만)
 */
export async function createInviteCode(
  code: string,
  role: UserRole,
  createdBy: string,
  createdByName: string,
  maxUses: number = 1,
  expiresInDays?: number
): Promise<void> {
  try {
    const inviteCodeData: any = {
      code,
      role,
      createdBy,
      createdByName,
      createdAt: serverTimestamp(),
      isUsed: false,
      maxUses,
      currentUses: 0,
    };

    if (expiresInDays) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      inviteCodeData.expiresAt = expiresAt;
    }

    await setDoc(doc(db, 'inviteCodes', code), inviteCodeData);
  } catch (error) {
    console.error('Error creating invite code:', error);
    throw error;
  }
}

/**
 * 초대 코드 목록 가져오기 (관리자만)
 */
export async function getInviteCodes(): Promise<any[]> {
  try {
    const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
    const inviteCodesRef = collection(db, 'inviteCodes');
    const q = query(inviteCodesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      usedAt: doc.data().usedAt?.toDate(),
      expiresAt: doc.data().expiresAt?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting invite codes:', error);
    return [];
  }
}

/**
 * 사용자 역할 확인 함수들
 */
export function isAdmin(role: UserRole): boolean {
  return ['PRESIDENT', 'DIRECTOR', 'ADMIN'].includes(role);
}

export function isTreasury(role: UserRole): boolean {
  return ['PRESIDENT', 'TREASURER'].includes(role);
}

export function canManageMembers(role: UserRole): boolean {
  return ['PRESIDENT', 'DIRECTOR', 'ADMIN'].includes(role);
}

export function canCreatePosts(role: UserRole): boolean {
  return true; // 모든 회원 가능
}

export function canDeletePosts(role: UserRole): boolean {
  return ['PRESIDENT', 'DIRECTOR', 'ADMIN'].includes(role);
}

export function canManageFinance(role: UserRole): boolean {
  return ['PRESIDENT', 'TREASURER'].includes(role);
}

export function canRecordGame(role: UserRole): boolean {
  return ['PRESIDENT', 'DIRECTOR', 'ADMIN'].includes(role);
}