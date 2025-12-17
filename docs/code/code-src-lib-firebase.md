# src/lib/firebase – Firebase 서비스/타입 전체 코드

> 이 문서는 `src-lib-firebase` 그룹에 속한 모든 파일의 실제 코드를 100% 포함합니다.

## src/lib/firebase/auth.service.ts

```ts
```typescript
// Firebase Authentication Service
import {
  signInAnonymously,
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
    const userData: UserDoc = {
      uid: user.uid,
      realName,
      nickname: nickname || user.displayName || '',
      phone: phone,
      photoURL: user.photoURL || undefined,
      role: inviteData.role || 'MEMBER',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Firestore에 사용자 정보 저장
    await setDoc(doc(db, 'users', user.uid), {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
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
 * Legacy: 초대 코드로 회원가입 (익명) - DEPRECATED via AUTH-03
 * 사용하는 곳이 없으면 삭제 예정. 호환성을 위해 남겨둠.
 */
export async function redeemInviteCode(
  inviteCode: string,
  realName: string
): Promise<UserDoc> {
   // Legacy implementation calling new logic steps internally?
   // No, just keep as is or error. Let's redirect to validateInviteCode manually in UI.
   throw new Error('This method is deprecated. Use validateInviteCode + createAccount.');
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
```

## src/lib/firebase/config.ts

```ts
// Firebase Configuration
//
// ⚠️ 중요: 실제 Firebase 프로젝트 설정 값으로 교체하세요
// Firebase Console (https://console.firebase.google.com)에서
// 프로젝트 설정 > 일반 > 내 앱 > Firebase SDK snippet > 구성에서 확인할 수 있습니다
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
const firebaseConfig = {
  // 우선순위: .env 값 > 아래 기본값 (사용자가 제공한 Firebase 설정)
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyACk1-QVyol4r6TKmNcDXHbuv3NwWbjmJU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wings-baseball-club.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wings-baseball-club',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'wings-baseball-club.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '951671719712',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:951671719712:web:9f2b4fb521ec546d43f945',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-HHQYWBCLG4'
};
// Firebase 초기화
const app = initializeApp(firebaseConfig);
// Firebase 서비스 초기화
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-northeast3'); // 서울 리전
// Firestore 오프라인 persistence 활성화 (PWA 지원)
// 단, 개발 환경에서는 여러 탭이 열려있을 수 있으므로 에러를 무시합니다
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db, {
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  }).catch((err) => {
    if (err.code === 'failed-precondition') {
      // 여러 탭이 열려있을 때
      console.warn('⚠️ Firestore persistence failed: Multiple tabs open');
    } else if (err.code === 'unimplemented') {
      // 브라우저가 지원하지 않을 때
      console.warn('⚠️ Firestore persistence not supported');
    } else {
      // 기타 에러는 무시 (예: 오프라인 상태)
      console.warn('⚠️ Firestore persistence warning:', err.code);
    }
  });
}
// 전역 Firebase 에러 핸들러
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  // Firebase 오프라인 관련 에러는 경고로 변경
  const errorMessage = args[0]?.toString() || '';
  if (
    errorMessage.includes('Failed to get document because the client is offline') ||
    errorMessage.includes('[code=unavailable]') ||
    errorMessage.includes('AbortError')
  ) {
    console.warn('⚠️ Firebase offline warning (suppressed):', ...args);
    return;
  }
  originalConsoleError.apply(console, args);
};
export default app;
```

## src/lib/firebase/firestore.service.ts

```ts
// Firebase Firestore Service
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  addDoc,
} from 'firebase/firestore';
import { db } from './config';
import type {
  PostDoc,
  CommentDoc,
  AttendanceDoc,
  FinanceDoc,
  BatterRecordDoc,
  PitcherRecordDoc,
  NotificationDoc,
} from './types';
// Helper to get collection refs
const getClubCol = (clubId: string, colName: string) => collection(db, 'clubs', clubId, colName);
const getClubDoc = (clubId: string, colName: string, docId: string) => doc(db, 'clubs', clubId, colName, docId);
// ===== POSTS =====
/**
 * 게시글 생성
 */
export async function createPost(clubId: string, postData: Omit<PostDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const postsRef = getClubCol(clubId, 'posts');
    const docRef = await addDoc(postsRef, {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating post:', error);
    throw error;
  }
}
/**
 * 게시글 목록 가져오기
 */
export async function getPosts(clubId: string, postType?: string, limitCount: number = 50): Promise<PostDoc[]> {
  try {
    const postsRef = getClubCol(clubId, 'posts');
    let q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    if (postType) {
      q = query(postsRef, where('type', '==', postType), orderBy('createdAt', 'desc'), limit(limitCount));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      startAt: (doc.data().startAt as Timestamp)?.toDate(),
      voteCloseAt: (doc.data().voteCloseAt as Timestamp)?.toDate(),
      closeAt: (doc.data().closeAt as Timestamp)?.toDate(),
      recordingLockedAt: (doc.data().recordingLockedAt as Timestamp)?.toDate(),
      pushSentAt: (doc.data().pushSentAt as Timestamp)?.toDate(),
    })) as PostDoc[];
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
}
/**
 * 특정 게시글 가져오기
 */
export async function getPost(clubId: string, postId: string): Promise<PostDoc | null> {
  try {
    const postDoc = await getDoc(getClubDoc(clubId, 'posts', postId));
    if (!postDoc.exists()) return null;
    const data = postDoc.data();
    return {
      id: postDoc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
      startAt: (data.startAt as Timestamp)?.toDate(),
      voteCloseAt: (data.voteCloseAt as Timestamp)?.toDate(),
      closeAt: (data.closeAt as Timestamp)?.toDate(),
    } as PostDoc;
  } catch (error) {
    console.error('Error getting post:', error);
    return null;
  }
}
/**
 * 게시글 업데이트
 */
export async function updatePost(clubId: string, postId: string, updates: Partial<PostDoc>): Promise<void> {
  try {
    const postRef = getClubDoc(clubId, 'posts', postId);
    await updateDoc(postRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating post:', error);
    throw error;
  }
}
/**
 * 게시글 삭제
 */
export async function deletePost(clubId: string, postId: string): Promise<void> {
  try {
    await deleteDoc(getClubDoc(clubId, 'posts', postId));
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
}
// ===== COMMENTS =====
// Comments are subcollection of posts? No, PRD says `clubs/{clubId}/posts/{postId}/comments/{commentId}`
// BUT Legacy code used a root `comments` collection linked by `postId`.
// PRD is the truth: `clubs/{clubId}/posts/{postId}/comments/{commentId}`.
// I will implement PRD structure.
/**
 * 댓글 추가
 */
export async function addComment(clubId: string, postId: string, commentData: Omit<CommentDoc, 'id' | 'createdAt' | 'updatedAt' | 'postId'>): Promise<string> {
  try {
    const commentsRef = collection(db, 'clubs', clubId, 'posts', postId, 'comments');
    const docRef = await addDoc(commentsRef, {
      ...commentData,
      postId, // keep for redundancy/search if needed
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
}
/**
 * 게시글의 댓글 가져오기
 */
export async function getComments(clubId: string, postId: string): Promise<CommentDoc[]> {
  try {
    const commentsRef = collection(db, 'clubs', clubId, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as CommentDoc[];
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
}
/**
 * 댓글 삭제
 */
export async function deleteComment(clubId: string, postId: string, commentId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'clubs', clubId, 'posts', postId, 'comments', commentId));
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
}
// ===== ATTENDANCE =====
// PRD: `clubs/{clubId}/posts/{postId}/attendance/{userId}`
// Legacy: root `attendance` with `${postId}_${userId}` ID.
// Switching to PRD.
/**
 * 출석 상태 업데이트
 */
export async function updateAttendance(clubId: string, postId: string, userId: string, attendanceData: Omit<AttendanceDoc, 'id' | 'updatedAt' | 'postId' | 'userId'>): Promise<void> {
  try {
    const attendanceRef = doc(db, 'clubs', clubId, 'posts', postId, 'attendance', userId);
    await setDoc(
      attendanceRef,
      {
        ...attendanceData,
        postId,
        userId,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }
}
/**
 * 게시글의 출석 현황 가져오기
 */
export async function getAttendances(clubId: string, postId: string): Promise<AttendanceDoc[]> {
  try {
    const attendanceRef = collection(db, 'clubs', clubId, 'posts', postId, 'attendance');
    const snapshot = await getDocs(attendanceRef);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as AttendanceDoc[];
  } catch (error) {
    console.error('Error getting attendances:', error);
    return [];
  }
}
/**
 * 사용자의 특정 게시글 출석 상태 가져오기
 */
export async function getUserAttendance(clubId: string, postId: string, userId: string): Promise<AttendanceDoc | null> {
  try {
    const attendanceRef = doc(db, 'clubs', clubId, 'posts', postId, 'attendance', userId);
    const attendanceDoc = await getDoc(attendanceRef);
    if (!attendanceDoc.exists()) return null;
    const data = attendanceDoc.data();
    return {
      id: attendanceDoc.id,
      ...data,
      updatedAt: (data.updatedAt as Timestamp)?.toDate() || new Date(),
    } as AttendanceDoc;
  } catch (error) {
    console.error('Error getting user attendance:', error);
    return null;
  }
}
// ===== MEMBERS =====
// PRD: `clubs/{clubId}/members`
/**
 * 전체 회원 목록 가져오기
 */
export async function getMembers(clubId: string): Promise<any[]> {
  try {
    const membersRef = getClubCol(clubId, 'members');
    const q = query(membersRef, where('status', '==', 'active'), orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting members:', error);
    return [];
  }
}
/**
 * 모든 회원 목록 가져오기 (비활성 회원 포함, 관리자용)
 */
export async function getAllMembers(clubId: string): Promise<any[]> {
  try {
    const membersRef = getClubCol(clubId, 'members');
    const q = query(membersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting all members:', error);
    return [];
  }
}
/**
 * 멤버 정보 업데이트 (관리자)
 */
export async function updateMember(clubId: string, userId: string, updates: any): Promise<void> {
  try {
    const memberRef = getClubDoc(clubId, 'members', userId);
    await updateDoc(memberRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating member:', error);
    throw error;
  }
}
// ===== INVITE CODES =====
// PRD: `clubs/{clubId}/invites`
/**
 * 초대 코드 생성
 */
export async function createInviteCode(clubId: string, codeData: Omit<any, 'id' | 'createdAt'>): Promise<string> {
  try {
    // invite code is docId? Yes.
    const inviteRef = getClubDoc(clubId, 'invites', codeData.code);
    await setDoc(inviteRef, {
      ...codeData,
      createdAt: serverTimestamp(),
    });
    return codeData.code;
  } catch (error) {
    console.error('Error creating invite code:', error);
    throw error;
  }
}
/**
 * 초대 코드 목록 가져오기
 */
export async function getInviteCodes(clubId: string): Promise<any[]> {
  try {
    const invitesRef = getClubCol(clubId, 'invites');
    const q = query(invitesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
      expiresAt: (doc.data().expiresAt as Timestamp)?.toDate(),
      usedAt: (doc.data().usedAt as Timestamp)?.toDate(),
    }));
  } catch (error) {
    console.error('Error getting invite codes:', error);
    return [];
  }
}
/**
 * 초대 코드 삭제
 */
export async function deleteInviteCode(clubId: string, code: string): Promise<void> {
  try {
    await deleteDoc(getClubDoc(clubId, 'invites', code));
  } catch (error) {
    console.error('Error deleting invite code:', error);
    throw error;
  }
}
// ===== FINANCE (LEDGER) =====
// PRD: `clubs/{clubId}/ledger` or `dues`.
// Legacy expects `FinanceDoc`. I will map `ledger` to `FinanceDoc`.
/**
 * 회비/회계 내역 추가
 */
export async function addFinance(clubId: string, financeData: Omit<FinanceDoc, 'id' | 'createdAt'>): Promise<string> {
  try {
    // using 'ledger' collection to align with PRD, but keeping type compatibility via mapping
    const ledgerRef = getClubCol(clubId, 'ledger');
    const docRef = await addDoc(ledgerRef, {
      ...financeData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding finance:', error);
    throw error;
  }
}
/**
 * 회비/회계 내역 가져오기
 */
export async function getFinances(clubId: string, limitCount: number = 100): Promise<FinanceDoc[]> {
  try {
    const ledgerRef = getClubCol(clubId, 'ledger');
    const q = query(ledgerRef, orderBy('date', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: (doc.data().date as Timestamp)?.toDate() || new Date(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    })) as FinanceDoc[];
  } catch (error) {
    console.error('Error getting finances:', error);
    return [];
  }
}
/**
 * 회비/회계 내역 삭제
 */
export async function deleteFinance(clubId: string, financeId: string): Promise<void> {
  try {
    await deleteDoc(getClubDoc(clubId, 'ledger', financeId));
  } catch (error) {
    console.error('Error deleting finance:', error);
    throw error;
  }
}
// ===== GAME RECORDS =====
// PRD: `clubs/{clubId}/posts/{postId}/record_batters/{playerId}` etc.
// But legacy used `gameRecords` root collection.
// Let's stick to legacy signature but move data under club -> post?
// Actually, game records are usually tied to a game post.
// PRD says: `clubs/{clubId}/posts/{postId}/record_lineup/...`
// Legacy `saveBatterRecord`: saves to `gameRecords/batters/{gameId}`.
// I'll change it to `clubs/{clubId}/posts/{gameId}/record_batters`.
/**
 * 타자 기록 저장
 */
export async function saveBatterRecord(clubId: string, recordData: Omit<BatterRecordDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const recordsRef = collection(db, 'clubs', clubId, 'posts', recordData.gameId, 'record_batters');
    const docRef = await addDoc(recordsRef, {
      ...recordData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving batter record:', error);
    throw error;
  }
}
/**
 * 투수 기록 저장
 */
export async function savePitcherRecord(clubId: string, recordData: Omit<PitcherRecordDoc, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  try {
    const recordsRef = collection(db, 'clubs', clubId, 'posts', recordData.gameId, 'record_pitchers');
    const docRef = await addDoc(recordsRef, {
      ...recordData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving pitcher record:', error);
    throw error;
  }
}
/**
 * 경기 기록 가져오기
 */
export async function getGameRecords(clubId: string, gameId: string): Promise<{ batters: BatterRecordDoc[]; pitchers: PitcherRecordDoc[] }> {
  try {
    // 타자 기록
    const battersRef = collection(db, 'clubs', clubId, 'posts', gameId, 'record_batters');
    const battersSnapshot = await getDocs(battersRef);
    const batters = battersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as BatterRecordDoc[];
    // 투수 기록
    const pitchersRef = collection(db, 'clubs', clubId, 'posts', gameId, 'record_pitchers');
    const pitchersSnapshot = await getDocs(pitchersRef);
    const pitchers = pitchersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
    })) as PitcherRecordDoc[];
    return { batters, pitchers };
  } catch (error) {
    console.error('Error getting game records:', error);
    return { batters: [], pitchers: [] };
  }
}
// ===== NOTIFICATIONS =====
// PRD: Global or Post-based? Notifications are usually per user.
// Legacy: `notifications` root.
// PRD: `clubs/{clubId}/members/{userId}/notifications`? (Not explicitly defined in list but implied)
// Or just `notifications` root?
// "Notifications Collection ... allow read if owner"
// I will keep it root OR specific to club.
// Since it's a "Club Community PWA", notifications are likely club-scoped (e.g. "Game tomorrow").
// But what if a user is in multiple clubs? Use root.
// HOWEVER, Phase 1 is about "Architecture Refactoring (ClubID)".
// If I move notifications to `clubs/{clubId}/notifications`, it's cleaner.
// For now, let's keep notifications GLOBAL (root) to avoid breaking global status,
// OR put them under `clubs/{clubId}/notifications`?
// Let's go with Global user notifications for now, as `getUserNotifications(userId)` implies getting ALL notifs for a user.
// Wait, `getUserNotifications` queries `collection(db, 'notifications')`.
// If I want to support Club, maybe I should leave it as is for now, OR filter by clubId.
// Let's LEAVE notifications at root for now, as they are user-centric.
// The `firestore.service.ts` update is focused on Club Data.
/**
 * 알림 생성
 */
export async function createNotification(notificationData: Omit<NotificationDoc, 'id' | 'createdAt'>): Promise<string> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const docRef = await addDoc(notificationsRef, {
      ...notificationData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}
/**
 * 사용자 알림 가져오기
 */
export async function getUserNotifications(userId: string, limitCount: number = 50): Promise<NotificationDoc[]> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
    })) as NotificationDoc[];
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}
/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}
/**
 * 모든 알림 읽음 처리
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId), where('read', '==', false));
    const snapshot = await getDocs(q);
    const promises = snapshot.docs.map((doc) =>
      updateDoc(doc.ref, { read: true })
    );
    await Promise.all(promises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}
```

## src/lib/firebase/storage.service.ts

```ts
// Firebase Storage Service
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  UploadTask,
} from 'firebase/storage';
import { storage } from './config';
/**
 * 프로필 사진 업로드
 */
export async function uploadProfilePhoto(
  userId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `profiles/${userId}/${fileName}`);
    if (onProgress) {
      // 진행률 추적
      const uploadTask = uploadBytesResumable(storageRef, file);
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      // 진행률 추적 없이 업로드
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
  } catch (error) {
    console.error('Error uploading profile photo:', error);
    throw error;
  }
}
/**
 * 앨범 미디어 업로드
 */
export async function uploadAlbumMedia(
  file: File,
  type: 'photo' | 'video',
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `albums/${year}/${month}/${fileName}`);
    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file);
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
  } catch (error) {
    console.error('Error uploading album media:', error);
    throw error;
  }
}
/**
 * 게시글 첨부파일 업로드
 */
export async function uploadPostAttachment(
  postId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `posts/${postId}/${fileName}`);
    if (onProgress) {
      const uploadTask = uploadBytesResumable(storageRef, file);
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } else {
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
  } catch (error) {
    console.error('Error uploading post attachment:', error);
    throw error;
  }
}
/**
 * 파일 삭제
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const fileRef = ref(storage, fileUrl);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}
/**
 * 폴더 내 파일 목록 가져오기
 */
export async function listFiles(folderPath: string): Promise<string[]> {
  try {
    const folderRef = ref(storage, folderPath);
    const result = await listAll(folderRef);
    const urls = await Promise.all(
      result.items.map((item) => getDownloadURL(item))
    );
    return urls;
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}
/**
 * 이미지 리사이즈 (클라이언트 사이드)
 */
export async function resizeImage(
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (blob) {
          const resizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        } else {
          reject(new Error('Failed to resize image'));
        }
      }, file.type);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}
/**
 * 파일 유효성 검사
 */
export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSizeMB: number
): { valid: boolean; error?: string } {
  // 타입 검사
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `허용되지 않는 파일 형식입니다. (${allowedTypes.join(', ')})`,
    };
  }
  // 크기 검사
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. (최대 ${maxSizeMB}MB)`,
    };
  }
  return { valid: true };
}
/**
 * 이미지 파일 유효성 검사
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  return validateFile(
    file,
    ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    10 // 10MB
  );
}
/**
 * 비디오 파일 유효성 검사
 */
export function validateVideoFile(file: File): { valid: boolean; error?: string } {
  return validateFile(
    file,
    ['video/mp4', 'video/webm', 'video/quicktime'],
    100 // 100MB
  );
}
```

## src/lib/firebase/types.ts

```ts
// Firebase Firestore 데이터 타입 정의
export type UserRole = 'PRESIDENT' | 'DIRECTOR' | 'TREASURER' | 'ADMIN' | 'MEMBER';
export type PostType = 'notice' | 'free' | 'event' | 'meetup' | 'poll' | 'game' | 'album';
export type EventType = 'PRACTICE' | 'GAME';
export type GameType = 'LEAGUE' | 'PRACTICE';
export type AttendanceStatus = 'attending' | 'absent' | 'maybe' | 'none';
export type MediaType = 'photo' | 'video';
export type PushStatus = 'SENT' | 'FAILED' | 'PENDING';
export type NotificationType = 'notice' | 'comment' | 'like' | 'event' | 'mention' | 'system';
// User Document
export interface UserDoc {
  uid: string;
  realName: string;
  nickname?: string;
  phone?: string;
  photoURL?: string;
  role: UserRole;
  position?: string;
  backNumber?: string;
  status: 'active' | 'inactive';
  invitedBy?: string;
  inviteCode?: string;
  createdAt: Date;
  updatedAt: Date;
}
// Invite Code Document
export interface InviteCodeDoc {
  code: string;
  role: UserRole;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  expiresAt?: Date;
  usedBy?: string;
  usedByName?: string;
  usedAt?: Date;
  isUsed: boolean;
  maxUses: number;
  currentUses: number;
}
// Post Document
export interface PostDoc {
  id: string;
  type: PostType;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  pinned?: boolean;
  // Event specific
  eventType?: EventType;
  startAt?: Date;
  place?: string;
  opponent?: string;
  voteCloseAt?: Date;
  voteClosed?: boolean;
  // Poll specific
  choices?: Array<{ id: string; label: string; votes: string[] }>; // votes: userId[]
  multi?: boolean;
  anonymous?: boolean;
  closeAt?: Date;
  closed?: boolean;
  // Game specific
  gameType?: GameType;
  score?: { our: number; opp: number };
  recorders?: string[]; // userId[]
  recordingLocked?: boolean;
  recordingLockedAt?: Date;
  recordingLockedBy?: string;
  // Album specific
  mediaUrls?: string[];
  mediaType?: MediaType;
  // Push specific (notice only)
  pushStatus?: PushStatus;
  pushSentAt?: Date;
}
// Comment Document
export interface CommentDoc {
  id: string;
  postId: string;
  content: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
}
// Attendance Document
export interface AttendanceDoc {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  status: AttendanceStatus;
  updatedAt: Date;
}
// Finance Document (회비/회계)
export interface FinanceDoc {
  id: string;
  type: 'income' | 'expense';
  category: 'dues' | 'event' | 'equipment' | 'other';
  amount: number;
  description: string;
  date: Date;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  // 회비 specific
  duesPaidBy?: string;
  duesPaidByName?: string;
  duesMonth?: string; // YYYY-MM
}
// Game Record Document (타자 기록)
export interface BatterRecordDoc {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  position: string;
  battingOrder: number;
  // 타석 결과
  atBats: string[]; // ['1B', 'K', 'GO', '2B', 'HR'] 등
  hits: number;
  runs: number;
  rbis: number;
  walks: number;
  strikeouts: number;
  createdAt: Date;
  updatedAt: Date;
}
// Game Record Document (투수 기록)
export interface PitcherRecordDoc {
  id: string;
  gameId: string;
  playerId: string;
  playerName: string;
  // 투구 내용
  innings: number; // 이닝 수 (소수점: 1.1 = 1과 1/3이닝)
  pitches: number; // 투구 수
  hitsAllowed: number;
  runsAllowed: number;
  earnedRuns: number;
  walks: number;
  strikeouts: number;
  createdAt: Date;
  updatedAt: Date;
}
// Notification Document (알림)
export interface NotificationDoc {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}
// Activity Log Document
export interface ActivityLogDoc {
  id: string;
  userId: string;
  userName: string;
  type: 'post' | 'comment' | 'attendance' | 'vote';
  action: string;
  target?: string;
  createdAt: Date;
}
```
