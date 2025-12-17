// Firebase Authentication Service
import {
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  limit,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from './config';
import type { UserDoc, UserRole } from './types';

// Invite Code Data Interface
export interface InviteCodeData {
  code: string;
  role: UserRole;
  isUsed: boolean;
  maxUses: number;
  currentUses: number;
  expiresAt?: Timestamp;
}

/**
 * 1. 초대 코드 유효성 검증 (로그인 전 단계)
 * 유효하면 초대 코드 데이터를 반환하고, 아니면 에러를 던짐.
 */
export async function validateInviteCode(inviteCode: string): Promise<InviteCodeData> {
  try {
    const inviteCodesRef = collection(db, 'inviteCodes');
    const q = query(inviteCodesRef, where('code', '==', inviteCode), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('존재하지 않는 초대 코드입니다.');
    }

    const inviteDoc = querySnapshot.docs[0];
    const inviteData = inviteDoc.data() as InviteCodeData;

    if (inviteData.isUsed && inviteData.currentUses >= inviteData.maxUses) {
      throw new Error('이미 사용된 초대 코드입니다.');
    }

    if (inviteData.expiresAt && inviteData.expiresAt.toDate() < new Date()) {
      throw new Error('만료된 초대 코드입니다.');
    }

    return inviteData;
  } catch (error: any) {
    if (error.code === 'unavailable') {
      throw new Error('인터넷 연결을 확인해주세요.');
    }
    throw error;
  }
}

/**
 * 2-A. 구글 로그인
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    console.error('Google Login Error:', error);
    throw error;
  }
}

/**
 * 2-B. 이메일 회원가입
 */
export async function signUpWithEmail(email: string, password: string, name: string): Promise<FirebaseUser> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: name });
    return result.user;
  } catch (error: any) {
    console.error('Email SignUp Error:', error);
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('이미 사용 중인 이메일입니다.');
    }
    throw error;
  }
}

/**
 * 2-C. 이메일 로그인
 */
export async function loginWithEmail(email: string, password: string): Promise<FirebaseUser> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Email Login Error:', error);
    if (error.code === 'auth/invalid-credential') {
      throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    throw error;
  }
}


/**
 * 3. 계정 생성 (로그인 성공 후 Firestore 처리)
 * 초대 코드 사용 처리 및 UserDoc 생성
 */
export async function createAccount(
  user: FirebaseUser,
  inviteCode: string,
  realName: string,
  nickname?: string,
  phone?: string
): Promise<UserDoc> {
  try {
    // 초대 코드 데이터 다시 가져오기 (Doc Ref 필요)
    const inviteCodesRef = collection(db, 'inviteCodes');
    const q = query(inviteCodesRef, where('code', '==', inviteCode), limit(1));
    const querySnapshot = await getDocs(q);

    // 이 시점에서 코드가 없거나 만료되었을 수도 있지만, 
    // validateInviteCode를 통과했다고 가정하고 진행 (혹은 여기서 다시 검증)
    if (querySnapshot.empty) throw new Error('Invalid code during creation');

    const inviteDoc = querySnapshot.docs[0];
    const inviteData = inviteDoc.data();
    const clubId = inviteData.clubId; // Get clubId from invite

    const userData: UserDoc = {
      uid: user.uid,
      realName,
      nickname: nickname || user.displayName || '',
      phone: phone || null,
      photoURL: user.photoURL || null,
      role: inviteData.role || 'MEMBER',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 1. Write to global users collection (Profile)
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Add to Club Members collection (Membership)
    if (clubId) {
      await setDoc(doc(db, 'clubs', clubId, 'members', user.uid), {
        ...userData,
        clubId, // Store clubId in member doc too
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    // 초대 코드 사용 처리
    await setDoc(
      inviteDoc.ref,
      {
        isUsed: true,
        usedBy: user.uid,
        usedByName: realName,
        usedAt: serverTimestamp(),
        currentUses: inviteData.currentUses + 1,
      },
      { merge: true }
    );

    return userData;
  } catch (error) {
    console.error('Error creating account:', error);
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