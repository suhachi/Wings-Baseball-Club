# src/lib/firebase – Firebase 서비스/타입 전체 코드

> 이 문서는 `src-lib-firebase` 그룹에 속한 모든 파일의 실제 코드를 100% 포함합니다.

## src/lib/firebase/auth.service.ts

```ts
// Firebase Authentication Service
import {
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { isAdminRole } from '../../app/lib/auth/roles';
import { auth, db } from './config';
import type { UserDoc, UserRole } from './types';
// --------------------------------------------------------------------------------------------------------------------
// NEW AUTH METHODS (Email/Password)
// --------------------------------------------------------------------------------------------------------------------
export interface SignupParams {
  email: string;
  password: string;
  name: string;
  phone: string;
  clubId: string;
}
export async function signUpWithEmailPassword(params: SignupParams): Promise<UserDoc> {
  const { email, password, name, phone, clubId } = params;
  // 1. Create Auth User
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  // 2. Update Profile
  await updateProfile(user, { displayName: name });
  // 3. Create Firestore Documents (Global User + Club Member)
  // [POLICY] Auto-activate for email signups (No approval needed)
  const now = serverTimestamp();
  const userData: UserDoc = {
    uid: user.uid,
    email: user.email || email,
    realName: name,
    nickname: name, // Default nickname to realName
    phone: phone,
    photoURL: user.photoURL || null,
    role: 'MEMBER',
    status: 'active', // IMMEDIATE ACTIVATION
    createdAt: new Date(), // Type compatibility, will be overwritten by serverTimestamp
    updatedAt: new Date(),
  };
  // Global User
  await setDoc(doc(db, 'users', user.uid), {
    ...userData,
    createdAt: now,
    updatedAt: now,
  });
  // Club Member
  await setDoc(doc(db, 'clubs', clubId, 'members', user.uid), {
    ...userData,
    clubId, // Add clubId to member doc
    createdAt: now,
    updatedAt: now,
  });
  return userData;
}
export async function signInWithEmailPassword(email: string, password: string): Promise<FirebaseUser> {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}
export async function signOutUser(): Promise<void> {
  await signOut(auth);
}
// --------------------------------------------------------------------------------------------------------------------
// LEGACY / SHARED METHODS
// --------------------------------------------------------------------------------------------------------------------
/**
 * [POLICY] Google OAuth Only Login -> Legacy Grace (Hidden Link) handling remains in UI
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  // ... existing code ...
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
 * [POLICY] Simplified Account Creation / Profile Completion
 * New users are created as 'active' (GateMode SOFT) but with 'MEMBER' role.
 */
export async function createAccount(
  user: FirebaseUser,
  realName: string,
  nickname?: string,
  phone?: string
): Promise<UserDoc> {
  try {
    const role: UserRole = 'MEMBER';
    const clubId = 'WINGS'; // Default club
    const userData: UserDoc = {
      uid: user.uid,
      email: user.email || '',
      realName,
      nickname: nickname || user.displayName || '',
      phone: phone || '',
      photoURL: user.photoURL || null,
      role: role,
      status: 'active', // POLICY: Always active on creation (GateMode SOFT handles permissions)
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
    await setDoc(doc(db, 'clubs', clubId, 'members', user.uid), {
      ...userData,
      clubId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return userData;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}
/**
 * Check if user profile (global) exists
 */
export async function checkUserExists(uid: string): Promise<boolean> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  return userSnap.exists();
}
/**
 * Check if membership (club-specific) exists
 */
export async function checkMemberExists(clubId: string, uid: string): Promise<boolean> {
  const memberRef = doc(db, 'clubs', clubId, 'members', uid);
  const memberSnap = await getDoc(memberRef);
  return memberSnap.exists();
}
/**
 * Get current user data with KST dates
 */
export async function getCurrentUserData(uid: string): Promise<UserDoc | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return null;
    }
    const data = userDoc.data() as UserDoc;
    return {
      ...data,
      createdAt: (data.createdAt as any)?.toDate?.() || new Date(),
      updatedAt: (data.updatedAt as any)?.toDate?.() || new Date(),
    } as UserDoc;
  } catch (error: any) {
    if (error.code === 'unavailable') return null;
    console.error('Error getting user data:', error);
    return null;
  }
}
/**
 * Update user profile
 */
/**
 * Update member profile (SSoT) + Global sync
 */
export async function updateMemberData(
  clubId: string,
  uid: string,
  updates: Partial<UserDoc>
): Promise<void> {
  try {
    const memberRef = doc(db, 'clubs', clubId, 'members', uid);
    const userRef = doc(db, 'users', uid);
    const cleanUpdates = JSON.parse(JSON.stringify(updates));
    const sanitizedUpdates = Object.entries(cleanUpdates).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {} as any);
    const timestampedUpdates = {
      ...sanitizedUpdates,
      updatedAt: serverTimestamp(),
    };
    // 1. Update Member Doc (Primary SSoT)
    await setDoc(memberRef, timestampedUpdates, { merge: true });
    // 2. Sync to Global User Doc (Legacy/Global View)
    // [POLICY] Sync only if User Doc exists. Never create orphan user docs from member updates.
    // [POLICY] Strip role/status/clubId to avoid SSoT corruption.
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const globalUpdates = { ...timestampedUpdates };
      delete globalUpdates.role;
      delete globalUpdates.status;
      delete globalUpdates.clubId;
      await setDoc(userRef, globalUpdates, { merge: true });
      console.log(`[updateMemberData] Updated member & synced user doc for ${uid}`);
    } else {
      console.log(`[updateMemberData] Updated member only. Global user doc missing for ${uid}, skipping sync.`);
    }
  } catch (error) {
    console.error('Error updating member data:', error);
    throw error;
  }
}
/**
 * Legacy Global Update (Deprecated for Profile Edit, kept for compatibility)
 */
export async function updateUserData(
  uid: string,
  updates: Partial<UserDoc>
): Promise<void> {
  // Redirect to default club member update if possible, but we don't know clubId here easily without param.
  // For now, we will mark this as "Global Only" but usually we want SSoT.
  // However, the prompt asks to "Find updateUserData/updateUser ... and replace/modify".
  // I will simply replace usages in AuthContext.
  try {
    const userRef = doc(db, 'users', uid);
    const cleanUpdates = JSON.parse(JSON.stringify(updates));
    const sanitizedUpdates = Object.entries(cleanUpdates).reduce((acc, [key, value]) => {
      if (value !== undefined) acc[key] = value;
      return acc;
    }, {} as any);
    await setDoc(
      userRef,
      {
        ...sanitizedUpdates,
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
 * Logout
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}
/**
 * Auth state listener
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}
/**
 * [POLICY] Auto-provision member document if missing (Gate-Level)
 * Ensures user has a member document so they are not blocked by Access Gate.
 */
export async function ensureMemberExists(clubId: string, user: FirebaseUser): Promise<void> {
  const memberRef = doc(db, 'clubs', clubId, 'members', user.uid);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) {
    console.log(`[Auto-Provision] Creating member doc for ${user.uid}`);
    const now = serverTimestamp();
    // Try to get global profile for details
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();
    await setDoc(memberRef, {
      uid: user.uid,
      email: user.email || userData?.email || '',
      realName: userData?.realName || user.displayName || '이름 없음',
      nickname: userData?.nickname || user.displayName || '닉네임',
      phone: userData?.phone || '',
      photoURL: user.photoURL || userData?.photoURL || null,
      role: 'MEMBER',
      status: 'active', // Auto-activated
      clubId,
      createdAt: now,
      updatedAt: now,
    });
  }
}
// --------------------------------------------------------------------------------------------------------------------
// RBAC HELPERS
// --------------------------------------------------------------------------------------------------------------------
export function isAdmin(role: string): boolean {
  return isAdminRole(role);
}
export function isTreasury(role: UserRole): boolean {
  // Finance requires specific trust, but typically Admins can oversee.
  // For now, keeping specific to President/Treasurer + Admin for backup.
  return ['PRESIDENT', 'TREASURER', 'ADMIN'].includes(role);
}
```

## src/lib/firebase/comments.moderation.service.ts

```ts
import { functions } from './config';
import { httpsCallable } from 'firebase/functions';
interface ModerateCommentRequest {
    clubId: string;
    postId: string;
    commentId: string;
    action: 'EDIT' | 'DELETE';
    content?: string;
    reason?: string;
    requestId: string;
}
interface ModerateCommentResponse {
    success: boolean;
    action: 'EDIT' | 'DELETE';
    commentId: string;
}
export const adminEditComment = async (
    clubId: string,
    postId: string,
    commentId: string,
    content: string,
    reason?: string
): Promise<void> => {
    const moderateComment = httpsCallable<ModerateCommentRequest, ModerateCommentResponse>(
        functions,
        'moderateComment'
    );
    await moderateComment({
        clubId,
        postId,
        commentId,
        action: 'EDIT',
        content,
        reason,
        requestId: crypto.randomUUID(),
    });
};
export const adminDeleteComment = async (
    clubId: string,
    postId: string,
    commentId: string,
    reason?: string
): Promise<void> => {
    const moderateComment = httpsCallable<ModerateCommentRequest, ModerateCommentResponse>(
        functions,
        'moderateComment'
    );
    await moderateComment({
        clubId,
        postId,
        commentId,
        action: 'DELETE',
        reason,
        requestId: crypto.randomUUID(),
    });
};
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
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';
// Note: getMessaging은 클라이언트에서만 사용하므로 messaging.service.ts에서 import
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
// Firestore 초기화 (New Persistence API)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-northeast3'); // 서울 리전
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

## src/lib/firebase/events.service.ts

```ts
import { httpsCallable } from 'firebase/functions';
import { functions } from './config';
/**
 * 이벤트 게시글 생성 (callable)
 *
 * μATOM-0534: 프론트 이벤트 작성 화면 + callable 호출
 */
export const createEventPostFn = httpsCallable<
  {
    clubId: string;
    eventType: 'PRACTICE' | 'GAME';
    title: string;
    content: string;
    startAt: string | number; // ISO string or timestamp
    place: string;
    opponent?: string;
    requestId: string;
  },
  {
    success: boolean;
    postId: string;
    voteCloseAt: string; // ISO string
  }
>(functions, 'createEventPost');
/**
 * 이벤트 게시글 생성
 *
 * @param clubId 클럽 ID
 * @param eventType 이벤트 타입 (PRACTICE | GAME)
 * @param title 제목
 * @param content 내용
 * @param startAt 시작 일시 (Date 또는 ISO string)
 * @param place 장소
 * @param opponent 상대팀 (선택)
 * @returns 게시글 ID 및 투표 마감 시간
 */
export async function createEventPost(
  clubId: string,
  eventType: 'PRACTICE' | 'GAME',
  title: string,
  content: string,
  startAt: Date | string,
  place: string,
  opponent?: string
): Promise<{ postId: string; voteCloseAt: string }> {
  // UUID 생성 (requestId)
  const requestId = crypto.randomUUID();
  // startAt을 ISO string으로 변환
  const startAtISO = typeof startAt === 'string' ? startAt : startAt.toISOString();
  const result = await createEventPostFn({
    clubId,
    eventType,
    title,
    content,
    startAt: startAtISO,
    place,
    opponent,
    requestId,
  });
  return {
    postId: result.data.postId,
    voteCloseAt: result.data.voteCloseAt,
  };
}
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
  startAfter,
  serverTimestamp,
  Timestamp,
  addDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from './config';
import {
  PostDoc,
  CommentDoc,
  AttendanceDoc,
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
  // [RBAC] Client-side create allowed ONLY for 'free' board.
  // notice/event/poll must be created via Cloud Functions (callables).
  if (postData.type !== 'free') {
    throw new Error(`[RBAC] createPost() only supports type 'free'. Use Cloud Functions for type='${postData.type}'.`);
  }
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
 * μATOM-0302: 쿼리 규격 통일 (orderBy createdAt desc, limit N)
 */
export async function getPosts(
  clubId: string,
  postType?: 'notice' | 'free' | 'event',
  limitCount: number = 50,
  lastVisible?: QueryDocumentSnapshot<DocumentData>
): Promise<{ posts: PostDoc[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  try {
    const postsRef = getClubCol(clubId, 'posts');
    let q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    if (postType) {
      q = query(postsRef, where('type', '==', postType), orderBy('createdAt', 'desc'), limit(limitCount));
    }
    if (lastVisible) {
      q = query(q, startAfter(lastVisible));
    }
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (doc.data().updatedAt as Timestamp)?.toDate() || new Date(),
      startAt: (doc.data().startAt as Timestamp)?.toDate(),
      voteCloseAt: (doc.data().voteCloseAt as Timestamp)?.toDate(),
      pushSentAt: (doc.data().pushSentAt as Timestamp)?.toDate(),
    })) as PostDoc[];
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;
    return { posts, lastDoc };
  } catch (error) {
    console.error('Error getting posts:', error);
    return { posts: [], lastDoc: null };
  }
}
/**
 * 특정 게시글 가져오기
 */
export async function getPost(clubId: string, postId: string): Promise<PostDoc | null> {
  try {
    const postDoc = await getDoc(getClubDoc(clubId, 'posts', postId));
    if (!postDoc.exists()) return null;
    const data = postDoc.data() as any;
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
 * 댓글 업데이트
 */
export async function updateComment(clubId: string, postId: string, commentId: string, updates: Partial<CommentDoc>): Promise<void> {
  try {
    const commentRef = doc(db, 'clubs', clubId, 'posts', postId, 'comments', commentId);
    await updateDoc(commentRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
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
 * 특정 멤버 조회 (clubs/{clubId}/members/{uid})
 * ATOM-08: Access Gate에서 사용
 */
export async function getMember(clubId: string, uid: string): Promise<any | null> {
  try {
    const memberRef = getClubDoc(clubId, 'members', uid);
    const memberDoc = await getDoc(memberRef);
    if (!memberDoc.exists()) {
      return null;
    }
    const data = memberDoc.data();
    return {
      id: memberDoc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate(),
      updatedAt: (data.updatedAt as Timestamp)?.toDate(),
    };
  } catch (error) {
    console.error('Error getting member:', error);
    return null;
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

## src/lib/firebase/messaging.service.ts

```ts
// Firebase Cloud Messaging Service
// ATOM-13: FCM 클라이언트 구현
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { httpsCallable } from 'firebase/functions';
import app, { functions } from './config';
// Note: toast는 foreground 메시지 핸들러에서만 사용
// FCM 토큰 등록 Function
const registerFcmTokenFn = httpsCallable<{
  clubId: string;
  token: string;
  platform?: 'web' | 'android' | 'ios';
  requestId?: string;
}, { success: boolean; tokenId: string }>(functions, 'registerFcmToken');
// ⚠️ [시니어 엔지니어링] 번들 리로딩/중복 초기화 상황에서도 경고가 과도하게 쌓이지 않도록 window 전역 플래그 사용
const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY || '';
function checkVapidKey(): boolean {
  if (!VAPID_KEY) {
    if (typeof window !== 'undefined' && !(window as any).__WINGS_WARNED_NO_VAPID) {
      console.warn('⚠️ [FCM] VAPID 키가 설정되지 않았습니다. 환경 변수 VITE_FCM_VAPID_KEY를 확인하세요.');
      (window as any).__WINGS_WARNED_NO_VAPID = true;
    }
    return false;
  }
  return true;
}
let messagingInstance: Messaging | null = null;
/**
 * FCM Messaging 인스턴스 초기화
 */
export function getMessagingInstance(): Messaging | null {
  if (typeof window === 'undefined') {
    // 서버 사이드에서는 null 반환
    return null;
  }
  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(app);
    } catch (error) {
      console.error('FCM 초기화 실패:', error);
      return null;
    }
  }
  return messagingInstance;
}
/**
 * 알림 권한 상태 조회
 */
export async function getNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}
/**
 * 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission === 'denied') {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return 'denied';
  }
}
/**
 * FCM 토큰 발급 및 등록 결과 타입
 */
export interface FcmRegisterResult {
  ok: boolean;
  token?: string;
  reason?: 'CONFIG_REQUIRED' | 'PERMISSION_DENIED' | 'UNSUPPORTED_BROWSER' | 'UNKNOWN';
}
/**
 * FCM 토큰 발급 및 등록
 */
export async function registerFcmToken(clubId: string): Promise<FcmRegisterResult> {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'UNKNOWN' };
  }
  const messaging = getMessagingInstance();
  if (!messaging) {
    console.error('FCM Messaging 인스턴스를 초기화할 수 없습니다');
    return { ok: false, reason: 'UNKNOWN' };
  }
  // 권한 확인
  const permission = await getNotificationPermission();
  if (permission !== 'granted') {
    console.warn('알림 권한이 허용되지 않았습니다:', permission);
    return { ok: false, reason: 'PERMISSION_DENIED' };
  }
  // VAPID 키 확인
  if (!checkVapidKey()) {
    return { ok: false, reason: 'CONFIG_REQUIRED' };
  }
  try {
    // FCM 토큰 발급
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
    });
    if (!token) {
      console.warn('FCM 토큰을 발급받을 수 없습니다');
      return { ok: false, reason: 'UNKNOWN' };
    }
    // 플랫폼 감지 (간단한 방법)
    const platform = detectPlatform();
    // 서버에 토큰 등록
    try {
      await registerFcmTokenFn({
        clubId,
        token,
        platform,
        requestId: `client-${Date.now()}`,
      });
      console.log('FCM 토큰 등록 완료:', token.substring(0, 20) + '...');
    } catch (error: any) {
      console.error('FCM 토큰 등록 실패:', error);
      // 토큰은 발급되었으나 서버 등록만 실패한 경우
    }
    return { ok: true, token };
  } catch (error: any) {
    console.error('FCM 토큰 발급 실패:', error);
    let reason: FcmRegisterResult['reason'] = 'UNKNOWN';
    if (error.code === 'messaging/permission-blocked') {
      console.error('알림 권한이 차단되었습니다');
      reason = 'PERMISSION_DENIED';
    } else if (error.code === 'messaging/unsupported-browser') {
      console.error('FCM을 지원하지 않는 브라우저입니다');
      reason = 'UNSUPPORTED_BROWSER';
    }
    return { ok: false, reason };
  }
}
/**
 * 플랫폼 감지 (간단한 방법)
 */
function detectPlatform(): 'web' | 'android' | 'ios' {
  if (typeof window === 'undefined') {
    return 'web';
  }
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  if (/android/i.test(userAgent)) {
    return 'android';
  }
  if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
    return 'ios';
  }
  return 'web';
}
/**
 * Foreground 메시지 수신 핸들러 등록
 */
export function onForegroundMessage(
  callback: (payload: {
    title?: string;
    body?: string;
    data?: Record<string, string>;
  }) => void
): () => void {
  const messaging = getMessagingInstance();
  if (!messaging) {
    return () => { };
  }
  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground 메시지 수신:', payload);
      const notification = payload.notification;
      if (notification) {
        callback({
          title: notification.title,
          body: notification.body,
          data: payload.data as Record<string, string> | undefined,
        });
        // 토스트 알림은 useFcm에서 처리하도록 콜백 전달
        // toast는 클라이언트 코드에서 직접 사용
      }
    });
    return unsubscribe;
  } catch (error) {
    console.error('Foreground 메시지 핸들러 등록 실패:', error);
    return () => { };
  }
}
```

## src/lib/firebase/notices.service.ts

```ts
import { httpsCallable } from 'firebase/functions';
import { functions } from './config';
/**
 * 공지 작성 및 푸시 발송 (callable)
 *
 * ATOM-17: createNoticeWithPush 클라이언트 호출
 */
export const createNoticeWithPushFn = httpsCallable<
  {
    clubId: string;
    title: string;
    content: string;
    pinned?: boolean;
    requestId: string;
  },
  {
    success: boolean;
    postId: string;
    pushStatus: 'SENT' | 'FAILED';
    pushResult: {
      sent: number;
      failed: number;
    } | null;
  }
>(functions, 'createNoticeWithPush');
/**
 * 공지 작성 및 푸시 발송
 *
 * @param clubId 클럽 ID
 * @param title 제목
 * @param content 내용
 * @param pinned 고정 여부
 * @returns 게시글 ID 및 푸시 상태
 */
export async function createNoticeWithPush(
  clubId: string,
  title: string,
  content: string,
  pinned: boolean = false
): Promise<{ postId: string; pushStatus: 'SENT' | 'FAILED'; pushResult: { sent: number; failed: number } | null }> {
  // UUID 생성 (requestId)
  const requestId = crypto.randomUUID();
  const result = await createNoticeWithPushFn({
    clubId,
    title,
    content,
    pinned,
    requestId,
  });
  return {
    postId: result.data.postId,
    pushStatus: result.data.pushStatus,
    pushResult: result.data.pushResult,
  };
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
export type PostType = 'notice' | 'free' | 'event';
export type EventType = 'PRACTICE' | 'GAME';
export type AttendanceStatus = 'attending' | 'absent' | 'maybe' | 'none';
export type PushStatus = 'SENT' | 'FAILED' | 'PENDING';
export type NotificationType = 'notice' | 'comment' | 'like' | 'event' | 'mention' | 'system';
// User Document
export interface UserDoc {
  uid: string;
  email: string; // [v2.0] Essential
  realName: string; // [v2.0] Essential
  phone: string; // [v2.0] Essential
  nickname?: string | null;
  photoURL?: string | null;
  role: UserRole;
  position?: string;
  backNumber?: number | null;
  status: 'pending' | 'active' | 'rejected' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
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
  commentCount?: number;
  // Event specific
  eventType?: EventType;
  startAt?: Date | null;
  place?: string | null;
  opponent?: string | null;
  voteCloseAt?: Date;
  voteClosed?: boolean;
  // Push specific (notice only)
  pushStatus?: PushStatus;
  pushSentAt?: Date;
  pushError?: string;
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
