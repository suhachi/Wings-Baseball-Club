# Firebase Full Code Pack

**Generated**: 2025-12-21T14:44:28.290Z
**Scope**: Firebase Configs, Security Rules, Cloud Functions, Frontend SDK Wrappers

## File: firebase.json
```json
{
    "firestore": {
        "rules": "firestore.rules",
        "indexes": "firestore.indexes.json"
    },
    "functions": {
        "source": "functions",
        "runtime": "nodejs20"
    },
    "hosting": {
        "public": "dist",
        "ignore": [
            "firebase.json",
            "**/.*",
            "**/node_modules/**"
        ],
        "rewrites": [
            {
                "source": "**",
                "destination": "/index.html"
            }
        ],
        "headers": [
            {
                "source": "**",
                "headers": [
                    {
                        "key": "Cross-Origin-Opener-Policy",
                        "value": "same-origin-allow-popups"
                    }
                ]
            }
        ]
    },
    "emulators": {
        "auth": {
            "port": 9099
        },
        "firestore": {
            "port": 8080
        },
        "functions": {
            "port": 5001
        },
        "ui": {
            "enabled": true,
            "port": 4000
        },
        "singleProjectMode": true
    }
}
```

## File: .firebaserc
```txt
{
  "projects": {
    "default": "wings-baseball-club"
  }
}

```

## File: firestore.rules
```rules
rules_version = '2';
// Trigger Reload 1
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // Helper Functions
    // ============================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function memberPath(clubId, uid) {
      return /databases/$(database)/documents/clubs/$(clubId)/members/$(uid);
    }

    // [T2] Club ID Hard Lock (Project Policy)
    function isWingsClub(clubId) {
      return clubId == 'WINGS';
    }

    // 공통: isClubMember(clubId) 필수
    function isClubMember(clubId) {
      return isAuthenticated() && exists(memberPath(clubId, request.auth.uid));
    }

    function member(clubId) {
      return get(memberPath(clubId, request.auth.uid)).data;
    }

    function isActiveMember(clubId) {
      return isClubMember(clubId) && member(clubId).status == 'active';
    }

    // [M00-07] M00 Soft Gate: 프로필 필수 필드 확인 (realName, phone)
    // Legacy support: phoneNumber 필드도 인정
    function hasRequiredProfile(clubId) {
      let m = member(clubId);
      return (m.realName != null && m.realName != '')
          && ( (m.phone != null && m.phone != '') || (m.phoneNumber != null && m.phoneNumber != '') );
    }

    function isAdminLike(clubId) {
      return isClubMember(clubId)
        && member(clubId).role in ['PRESIDENT', 'VICE_PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN'];
    }

    // ============================================
    // Default Deny
    // ============================================
    match /{document=**} {
      allow read, write: if false;
    }

    // ============================================
    // Global Collections
    // ============================================

    // Users (Global)
    match /users/{userId} {
      // [M00-FIX] 개인정보 보호: 본인만 조회 가능 (Option A)
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow create: if isAuthenticated() && request.auth.uid == userId;
      // 운영 안전상: 유저 본인만 업데이트
      allow update: if isAuthenticated() && request.auth.uid == userId;
    }


    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated();
    }

    // ============================================
    // Club Collections
    // ============================================

    match /clubs/{clubId} {
      // [T2] Enforce WINGS Club ID
      // If not WINGS, deny all.
      function isTargetClub() {
        return isWingsClub(clubId);
      }

      // 클럽 문서 read는 active member만 - μATOM-0551
      allow read: if isTargetClub() && isActiveMember(clubId);

      // ============================================
      // Members
      // ============================================
      match /members/{memberId} {
        // [M00-FIX] 클럽 멤버만 조회 가능 (Option B) - 외부인 차단 OR 본인
        allow read: if isClubMember(clubId) || request.auth.uid == memberId;
        // [M00-FIX] BackNumber Validation (0-99 or null)
        function isValidBackNumber() {
          let bn = request.resource.data.backNumber;
          return bn == null || (bn is int && bn >= 0 && bn <= 99);
        }

        // 가입 직후 멤버 문서 생성 허용 (단, role은 MEMBER 고정, status는 active 허용)
        allow create: if isAuthenticated() && request.auth.uid == memberId
          && request.resource.data.role == 'MEMBER'
          && request.resource.data.status == 'active'
          && isValidBackNumber();

        // 본인 프로필 일부 수정만 허용하고 싶으면 keys 제한을 추가해야 함(여기선 보수적으로 adminLike만 허용)
        // 본인 프로필 일부 수정만 허용 (키 제한)
        function isSelfProfileUpdateAllowed() {
          return request.resource.data.diff(resource.data).affectedKeys().hasOnly([
            'realName', 'nickname', 'phone', 'phoneNumber', 'photoURL', 'updatedAt', 'backNumber'
          ]);
        }
        allow update: if isAuthenticated() && (
          (request.auth.uid == memberId && isSelfProfileUpdateAllowed() && isValidBackNumber()) || isAdminLike(clubId)
        );
      }

      // ============================================
      // Posts
      // ============================================
      match /posts/{postId} {
        // μATOM-0551: 읽기 isClubMember만 (SOFT Gate: Read Allowed)
        allow read: if isActiveMember(clubId);

        // Posts Create Policy:
        // ... (省略)
        function isPostTypeAllowedForCreate() {
          let postType = request.resource.data.type;
          // notice, event, poll은 Functions-only
          return postType == 'free';
        }

        // [M00-07] hasRequiredProfile 추가
        allow create: if isActiveMember(clubId) && hasRequiredProfile(clubId) && isPostTypeAllowedForCreate();

        // Posts Update/Delete Policy:
        
        function isFreePost() {
          return resource.data.type == 'free';
        }

        // [M00-FIX] isPostAuthor helper definition added
        function isPostAuthor() {
          return resource.data.authorId == request.auth.uid;
        }

        function updatingProtectedPostFields() {
          return request.resource.data.diff(resource.data).affectedKeys().hasAny([
            'authorId','authorName','authorPhotoURL','type'
          ]);
        }

        // [M00-07] hasRequiredProfile 추가
        allow update: if isActiveMember(clubId) && hasRequiredProfile(clubId) && (
             (isFreePost() && isPostAuthor() && !updatingProtectedPostFields())
          || (isAdminLike(clubId)) 
        ); 
        
        allow delete: if isActiveMember(clubId) && hasRequiredProfile(clubId) && (
          isAdminLike(clubId) || (isFreePost() && isPostAuthor())
        );

        // ============================================
        // Comments
        // ============================================
        // μATOM-0554: comments 정책
        // Comments Policy: create는 active 멤버, update/delete는 작성자 또는 adminLike
        match /comments/{commentId} {
          allow read: if isActiveMember(clubId);
          // [M00-07] hasRequiredProfile 추가
          allow create: if isActiveMember(clubId) && hasRequiredProfile(clubId) && request.resource.data.authorId == request.auth.uid;

          // update/delete: author OR adminLike
          // update/delete: author ONLY (Admin uses callable for audit)
          // update/delete: author ONLY (Admin uses callable for audit)
          // 프로필 미완성 상태여도 본인 댓글 수정/삭제 허용 (Cleanup 목적)
          allow update, delete: if isActiveMember(clubId) && (
            resource.data.authorId == request.auth.uid
          );
        }

        // ============================================
        // Attendance
        // ============================================
        // μATOM-0555: attendance 정책
        // Attendance Policy: 본인만 write + voteClosed==false 조건
        match /attendance/{userId} {
          allow read: if isActiveMember(clubId);
          // 본인만, voteClosed==false일 때만 write 허용
          function isVoteOpen() {
            let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
            let closedManual = post.get('voteClosed', false) == true;
            let closedTime = post.keys().hasAll(['voteCloseAt']) && request.time >= post.voteCloseAt;
            return !closedManual && !closedTime;
          }
          // [M00-07] hasRequiredProfile 추가
          allow write: if isActiveMember(clubId) && hasRequiredProfile(clubId)
            && request.auth.uid == userId
            && isVoteOpen();
        }

      }

      // ============================================
      // FCM Tokens
      // ============================================
      // μATOM-0556: tokens/audit/idempotency 클라 write 금지
      match /members/{memberId}/tokens/{tokenId} {
        allow read: if false; // 클라 read 금지
        allow write: if false; // 클라 write 금지 (토큰 등록은 callable만)
      }

      // ============================================
      // Audit / Idempotency
      // ============================================
      // μATOM-0556: 일반회원 접근 차단 (Functions-only)
      match /audit/{docId} {
        allow read, write: if false;
      }

      match /idempotency/{docId} {
        allow read, write: if false;
      }
    }
  }
}

```

## File: firestore.indexes.json
```json
{
    "indexes": [
        {
            "collectionGroup": "posts",
            "queryScope": "COLLECTION",
            "fields": [
                {
                    "fieldPath": "type",
                    "order": "ASCENDING"
                },
                {
                    "fieldPath": "voteCloseAt",
                    "order": "ASCENDING"
                },
                {
                    "fieldPath": "__name__",
                    "order": "ASCENDING"
                }
            ]
        }
    ],
    "fieldOverrides": []
}
```

## File: src/lib/firebase/auth.service.ts
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
    // We try to keep them in sync, but Member Doc is the authority.
    await setDoc(userRef, timestampedUpdates, { merge: true });

    console.log(`[updateMemberData] Updated member & user docs for ${uid}`);

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

## File: src/lib/firebase/comments.moderation.service.ts
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

## File: src/lib/firebase/config.ts
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

## File: src/lib/firebase/events.service.ts
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

## File: src/lib/firebase/firestore.service.ts
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

## File: src/lib/firebase/messaging.service.ts
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

## File: src/lib/firebase/notices.service.ts
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

## File: src/lib/firebase/storage.service.ts
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

## File: src/lib/firebase/types.ts
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

## File: functions/package-lock.json
```json
{
  "name": "functions",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "functions",
      "version": "1.0.0",
      "dependencies": {
        "firebase-admin": "^12.0.0",
        "firebase-functions": "^5.1.0"
      },
      "devDependencies": {
        "@types/node": "^20.11.24",
        "typescript": "^5.6.3"
      },
      "engines": {
        "node": "20"
      }
    },
    "node_modules/@fastify/busboy": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/@fastify/busboy/-/busboy-3.2.0.tgz",
      "integrity": "sha512-m9FVDXU3GT2ITSe0UaMA5rU3QkfC/UXtCU8y0gSN/GugTqtVldOBWIB5V6V3sbmenVZUIpU6f+mPEO2+m5iTaA==",
      "license": "MIT"
    },
    "node_modules/@firebase/app-check-interop-types": {
      "version": "0.3.2",
      "resolved": "https://registry.npmjs.org/@firebase/app-check-interop-types/-/app-check-interop-types-0.3.2.tgz",
      "integrity": "sha512-LMs47Vinv2HBMZi49C09dJxp0QT5LwDzFaVGf/+ITHe3BlIhUiLNttkATSXplc89A2lAaeTqjgqVkiRfUGyQiQ==",
      "license": "Apache-2.0"
    },
    "node_modules/@firebase/app-types": {
      "version": "0.9.2",
      "resolved": "https://registry.npmjs.org/@firebase/app-types/-/app-types-0.9.2.tgz",
      "integrity": "sha512-oMEZ1TDlBz479lmABwWsWjzHwheQKiAgnuKxE0pz0IXCVx7/rtlkx1fQ6GfgK24WCrxDKMplZrT50Kh04iMbXQ==",
      "license": "Apache-2.0"
    },
    "node_modules/@firebase/auth-interop-types": {
      "version": "0.2.3",
      "resolved": "https://registry.npmjs.org/@firebase/auth-interop-types/-/auth-interop-types-0.2.3.tgz",
      "integrity": "sha512-Fc9wuJGgxoxQeavybiuwgyi+0rssr76b+nHpj+eGhXFYAdudMWyfBHvFL/I5fEHniUM/UQdFzi9VXJK2iZF7FQ==",
      "license": "Apache-2.0"
    },
    "node_modules/@firebase/component": {
      "version": "0.6.9",
      "resolved": "https://registry.npmjs.org/@firebase/component/-/component-0.6.9.tgz",
      "integrity": "sha512-gm8EUEJE/fEac86AvHn8Z/QW8BvR56TBw3hMW0O838J/1mThYQXAIQBgUv75EqlCZfdawpWLrKt1uXvp9ciK3Q==",
      "license": "Apache-2.0",
      "dependencies": {
        "@firebase/util": "1.10.0",
        "tslib": "^2.1.0"
      }
    },
    "node_modules/@firebase/database": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/@firebase/database/-/database-1.0.8.tgz",
      "integrity": "sha512-dzXALZeBI1U5TXt6619cv0+tgEhJiwlUtQ55WNZY7vGAjv7Q1QioV969iYwt1AQQ0ovHnEW0YW9TiBfefLvErg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@firebase/app-check-interop-types": "0.3.2",
        "@firebase/auth-interop-types": "0.2.3",
        "@firebase/component": "0.6.9",
        "@firebase/logger": "0.4.2",
        "@firebase/util": "1.10.0",
        "faye-websocket": "0.11.4",
        "tslib": "^2.1.0"
      }
    },
    "node_modules/@firebase/database-compat": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/@firebase/database-compat/-/database-compat-1.0.8.tgz",
      "integrity": "sha512-OpeWZoPE3sGIRPBKYnW9wLad25RaWbGyk7fFQe4xnJQKRzlynWeFBSRRAoLE2Old01WXwskUiucNqUUVlFsceg==",
      "license": "Apache-2.0",
      "dependencies": {
        "@firebase/component": "0.6.9",
        "@firebase/database": "1.0.8",
        "@firebase/database-types": "1.0.5",
        "@firebase/logger": "0.4.2",
        "@firebase/util": "1.10.0",
        "tslib": "^2.1.0"
      }
    },
    "node_modules/@firebase/database-types": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/@firebase/database-types/-/database-types-1.0.5.tgz",
      "integrity": "sha512-fTlqCNwFYyq/C6W7AJ5OCuq5CeZuBEsEwptnVxlNPkWCo5cTTyukzAHRSO/jaQcItz33FfYrrFk1SJofcu2AaQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "@firebase/app-types": "0.9.2",
        "@firebase/util": "1.10.0"
      }
    },
    "node_modules/@firebase/logger": {
      "version": "0.4.2",
      "resolved": "https://registry.npmjs.org/@firebase/logger/-/logger-0.4.2.tgz",
      "integrity": "sha512-Q1VuA5M1Gjqrwom6I6NUU4lQXdo9IAQieXlujeHZWvRt1b7qQ0KwBaNAjgxG27jgF9/mUwsNmO8ptBCGVYhB0A==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.1.0"
      }
    },
    "node_modules/@firebase/util": {
      "version": "1.10.0",
      "resolved": "https://registry.npmjs.org/@firebase/util/-/util-1.10.0.tgz",
      "integrity": "sha512-xKtx4A668icQqoANRxyDLBLz51TAbDP9KRfpbKGxiCAW346d0BeJe5vN6/hKxxmWwnZ0mautyv39JxviwwQMOQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "tslib": "^2.1.0"
      }
    },
    "node_modules/@google-cloud/firestore": {
      "version": "7.11.6",
      "resolved": "https://registry.npmjs.org/@google-cloud/firestore/-/firestore-7.11.6.tgz",
      "integrity": "sha512-EW/O8ktzwLfyWBOsNuhRoMi8lrC3clHM5LVFhGvO1HCsLozCOOXRAlHrYBoE6HL42Sc8yYMuCb2XqcnJ4OOEpw==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "@opentelemetry/api": "^1.3.0",
        "fast-deep-equal": "^3.1.1",
        "functional-red-black-tree": "^1.0.1",
        "google-gax": "^4.3.3",
        "protobufjs": "^7.2.6"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@google-cloud/paginator": {
      "version": "5.0.2",
      "resolved": "https://registry.npmjs.org/@google-cloud/paginator/-/paginator-5.0.2.tgz",
      "integrity": "sha512-DJS3s0OVH4zFDB1PzjxAsHqJT6sKVbRwwML0ZBP9PbU7Yebtu/7SWMRzvO2J3nUi9pRNITCfu4LJeooM2w4pjg==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "arrify": "^2.0.0",
        "extend": "^3.0.2"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@google-cloud/projectify": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/@google-cloud/projectify/-/projectify-4.0.0.tgz",
      "integrity": "sha512-MmaX6HeSvyPbWGwFq7mXdo0uQZLGBYCwziiLIGq5JVX+/bdI3SAq6bP98trV5eTWfLuvsMcIC1YJOF2vfteLFA==",
      "license": "Apache-2.0",
      "optional": true,
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/@google-cloud/promisify": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/@google-cloud/promisify/-/promisify-4.0.0.tgz",
      "integrity": "sha512-Orxzlfb9c67A15cq2JQEyVc7wEsmFBmHjZWZYQMUyJ1qivXyMwdyNOs9odi79hze+2zqdTtu1E19IM/FtqZ10g==",
      "license": "Apache-2.0",
      "optional": true,
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@google-cloud/storage": {
      "version": "7.18.0",
      "resolved": "https://registry.npmjs.org/@google-cloud/storage/-/storage-7.18.0.tgz",
      "integrity": "sha512-r3ZwDMiz4nwW6R922Z1pwpePxyRwE5GdevYX63hRmAQUkUQJcBH/79EnQPDv5cOv1mFBgevdNWQfi3tie3dHrQ==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "@google-cloud/paginator": "^5.0.0",
        "@google-cloud/projectify": "^4.0.0",
        "@google-cloud/promisify": "<4.1.0",
        "abort-controller": "^3.0.0",
        "async-retry": "^1.3.3",
        "duplexify": "^4.1.3",
        "fast-xml-parser": "^4.4.1",
        "gaxios": "^6.0.2",
        "google-auth-library": "^9.6.3",
        "html-entities": "^2.5.2",
        "mime": "^3.0.0",
        "p-limit": "^3.0.1",
        "retry-request": "^7.0.0",
        "teeny-request": "^9.0.0",
        "uuid": "^8.0.0"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/@google-cloud/storage/node_modules/uuid": {
      "version": "8.3.2",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-8.3.2.tgz",
      "integrity": "sha512-+NYs2QeMWy+GWFOEm9xnn6HCDp0l7QBD7ml8zLUmJ+93Q5NF0NocErnwkTkXVFNiX3/fpC6afS8Dhb/gz7R7eg==",
      "license": "MIT",
      "optional": true,
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/@grpc/grpc-js": {
      "version": "1.14.3",
      "resolved": "https://registry.npmjs.org/@grpc/grpc-js/-/grpc-js-1.14.3.tgz",
      "integrity": "sha512-Iq8QQQ/7X3Sac15oB6p0FmUg/klxQvXLeileoqrTRGJYLV+/9tubbr9ipz0GKHjmXVsgFPo/+W+2cA8eNcR+XA==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "@grpc/proto-loader": "^0.8.0",
        "@js-sdsl/ordered-map": "^4.4.2"
      },
      "engines": {
        "node": ">=12.10.0"
      }
    },
    "node_modules/@grpc/grpc-js/node_modules/@grpc/proto-loader": {
      "version": "0.8.0",
      "resolved": "https://registry.npmjs.org/@grpc/proto-loader/-/proto-loader-0.8.0.tgz",
      "integrity": "sha512-rc1hOQtjIWGxcxpb9aHAfLpIctjEnsDehj0DAiVfBlmT84uvR0uUtN2hEi/ecvWVjXUGf5qPF4qEgiLOx1YIMQ==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "lodash.camelcase": "^4.3.0",
        "long": "^5.0.0",
        "protobufjs": "^7.5.3",
        "yargs": "^17.7.2"
      },
      "bin": {
        "proto-loader-gen-types": "build/bin/proto-loader-gen-types.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/@grpc/proto-loader": {
      "version": "0.7.15",
      "resolved": "https://registry.npmjs.org/@grpc/proto-loader/-/proto-loader-0.7.15.tgz",
      "integrity": "sha512-tMXdRCfYVixjuFK+Hk0Q1s38gV9zDiDJfWL3h1rv4Qc39oILCu1TRTDt7+fGUI8K4G1Fj125Hx/ru3azECWTyQ==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "lodash.camelcase": "^4.3.0",
        "long": "^5.0.0",
        "protobufjs": "^7.2.5",
        "yargs": "^17.7.2"
      },
      "bin": {
        "proto-loader-gen-types": "build/bin/proto-loader-gen-types.js"
      },
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/@js-sdsl/ordered-map": {
      "version": "4.4.2",
      "resolved": "https://registry.npmjs.org/@js-sdsl/ordered-map/-/ordered-map-4.4.2.tgz",
      "integrity": "sha512-iUKgm52T8HOE/makSxjqoWhe95ZJA1/G1sYsGev2JDKUSS14KAgg1LHb+Ba+IPow0xflbnSkOsZcO08C7w1gYw==",
      "license": "MIT",
      "optional": true,
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/js-sdsl"
      }
    },
    "node_modules/@opentelemetry/api": {
      "version": "1.9.0",
      "resolved": "https://registry.npmjs.org/@opentelemetry/api/-/api-1.9.0.tgz",
      "integrity": "sha512-3giAOQvZiH5F9bMlMiv8+GSPMeqg0dbaeo58/0SlA9sxSqZhnUtxzX9/2FzyhS9sWQf5S0GJE0AKBrFqjpeYcg==",
      "license": "Apache-2.0",
      "optional": true,
      "engines": {
        "node": ">=8.0.0"
      }
    },
    "node_modules/@protobufjs/aspromise": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@protobufjs/aspromise/-/aspromise-1.1.2.tgz",
      "integrity": "sha512-j+gKExEuLmKwvz3OgROXtrJ2UG2x8Ch2YZUxahh+s1F2HZ+wAceUNLkvy6zKCPVRkU++ZWQrdxsUeQXmcg4uoQ==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/base64": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@protobufjs/base64/-/base64-1.1.2.tgz",
      "integrity": "sha512-AZkcAA5vnN/v4PDqKyMR5lx7hZttPDgClv83E//FMNhR2TMcLUhfRUBHCmSl0oi9zMgDDqRUJkSxO3wm85+XLg==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/codegen": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/@protobufjs/codegen/-/codegen-2.0.4.tgz",
      "integrity": "sha512-YyFaikqM5sH0ziFZCN3xDC7zeGaB/d0IUb9CATugHWbd1FRFwWwt4ld4OYMPWu5a3Xe01mGAULCdqhMlPl29Jg==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/eventemitter": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@protobufjs/eventemitter/-/eventemitter-1.1.0.tgz",
      "integrity": "sha512-j9ednRT81vYJ9OfVuXG6ERSTdEL1xVsNgqpkxMsbIabzSo3goCjDIveeGv5d03om39ML71RdmrGNjG5SReBP/Q==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/fetch": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@protobufjs/fetch/-/fetch-1.1.0.tgz",
      "integrity": "sha512-lljVXpqXebpsijW71PZaCYeIcE5on1w5DlQy5WH6GLbFryLUrBD4932W/E2BSpfRJWseIL4v/KPgBFxDOIdKpQ==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "@protobufjs/aspromise": "^1.1.1",
        "@protobufjs/inquire": "^1.1.0"
      }
    },
    "node_modules/@protobufjs/float": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/@protobufjs/float/-/float-1.0.2.tgz",
      "integrity": "sha512-Ddb+kVXlXst9d+R9PfTIxh1EdNkgoRe5tOX6t01f1lYWOvJnSPDBlG241QLzcyPdoNTsblLUdujGSE4RzrTZGQ==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/inquire": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@protobufjs/inquire/-/inquire-1.1.0.tgz",
      "integrity": "sha512-kdSefcPdruJiFMVSbn801t4vFK7KB/5gd2fYvrxhuJYg8ILrmn9SKSX2tZdV6V+ksulWqS7aXjBcRXl3wHoD9Q==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/path": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/@protobufjs/path/-/path-1.1.2.tgz",
      "integrity": "sha512-6JOcJ5Tm08dOHAbdR3GrvP+yUUfkjG5ePsHYczMFLq3ZmMkAD98cDgcT2iA1lJ9NVwFd4tH/iSSoe44YWkltEA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/pool": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@protobufjs/pool/-/pool-1.1.0.tgz",
      "integrity": "sha512-0kELaGSIDBKvcgS4zkjz1PeddatrjYcmMWOlAuAPwAeccUrPHdUqo/J6LiymHHEiJT5NrF1UVwxY14f+fy4WQw==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@protobufjs/utf8": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/@protobufjs/utf8/-/utf8-1.1.0.tgz",
      "integrity": "sha512-Vvn3zZrhQZkkBE8LSuW3em98c0FwgO4nxzv6OdSxPKJIEKY2bGbHn+mhGIPerzI4twdxaP8/0+06HBpwf345Lw==",
      "license": "BSD-3-Clause"
    },
    "node_modules/@tootallnate/once": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/@tootallnate/once/-/once-2.0.0.tgz",
      "integrity": "sha512-XCuKFP5PS55gnMVu3dty8KPatLqUoy/ZYzDzAGCQ8JNFCkLXzmI7vNHCR+XpbZaMWQK/vQubr7PkYq8g470J/A==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 10"
      }
    },
    "node_modules/@types/body-parser": {
      "version": "1.19.6",
      "resolved": "https://registry.npmjs.org/@types/body-parser/-/body-parser-1.19.6.tgz",
      "integrity": "sha512-HLFeCYgz89uk22N5Qg3dvGvsv46B8GLvKKo1zKG4NybA8U2DiEO3w9lqGg29t/tfLRJpJ6iQxnVw4OnB7MoM9g==",
      "license": "MIT",
      "dependencies": {
        "@types/connect": "*",
        "@types/node": "*"
      }
    },
    "node_modules/@types/caseless": {
      "version": "0.12.5",
      "resolved": "https://registry.npmjs.org/@types/caseless/-/caseless-0.12.5.tgz",
      "integrity": "sha512-hWtVTC2q7hc7xZ/RLbxapMvDMgUnDvKvMOpKal4DrMyfGBUfB1oKaZlIRr6mJL+If3bAP6sV/QneGzF6tJjZDg==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/@types/connect": {
      "version": "3.4.38",
      "resolved": "https://registry.npmjs.org/@types/connect/-/connect-3.4.38.tgz",
      "integrity": "sha512-K6uROf1LD88uDQqJCktA4yzL1YYAK6NgfsI0v/mTgyPKWsX1CnJ0XPSDhViejru1GcRkLWb8RlzFYJRqGUbaug==",
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/cors": {
      "version": "2.8.19",
      "resolved": "https://registry.npmjs.org/@types/cors/-/cors-2.8.19.tgz",
      "integrity": "sha512-mFNylyeyqN93lfe/9CSxOGREz8cpzAhH+E93xJ4xWQf62V8sQ/24reV2nyzUWM6H6Xji+GGHpkbLe7pVoUEskg==",
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/express": {
      "version": "4.17.3",
      "resolved": "https://registry.npmjs.org/@types/express/-/express-4.17.3.tgz",
      "integrity": "sha512-I8cGRJj3pyOLs/HndoP+25vOqhqWkAZsWMEmq1qXy/b/M3ppufecUwaK2/TVDVxcV61/iSdhykUjQQ2DLSrTdg==",
      "license": "MIT",
      "dependencies": {
        "@types/body-parser": "*",
        "@types/express-serve-static-core": "*",
        "@types/serve-static": "*"
      }
    },
    "node_modules/@types/express-serve-static-core": {
      "version": "5.1.0",
      "resolved": "https://registry.npmjs.org/@types/express-serve-static-core/-/express-serve-static-core-5.1.0.tgz",
      "integrity": "sha512-jnHMsrd0Mwa9Cf4IdOzbz543y4XJepXrbia2T4b6+spXC2We3t1y6K44D3mR8XMFSXMCf3/l7rCgddfx7UNVBA==",
      "license": "MIT",
      "dependencies": {
        "@types/node": "*",
        "@types/qs": "*",
        "@types/range-parser": "*",
        "@types/send": "*"
      }
    },
    "node_modules/@types/http-errors": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/@types/http-errors/-/http-errors-2.0.5.tgz",
      "integrity": "sha512-r8Tayk8HJnX0FztbZN7oVqGccWgw98T/0neJphO91KkmOzug1KkofZURD4UaD5uH8AqcFLfdPErnBod0u71/qg==",
      "license": "MIT"
    },
    "node_modules/@types/jsonwebtoken": {
      "version": "9.0.10",
      "resolved": "https://registry.npmjs.org/@types/jsonwebtoken/-/jsonwebtoken-9.0.10.tgz",
      "integrity": "sha512-asx5hIG9Qmf/1oStypjanR7iKTv0gXQ1Ov/jfrX6kS/EO0OFni8orbmGCn0672NHR3kXHwpAwR+B368ZGN/2rA==",
      "license": "MIT",
      "dependencies": {
        "@types/ms": "*",
        "@types/node": "*"
      }
    },
    "node_modules/@types/long": {
      "version": "4.0.2",
      "resolved": "https://registry.npmjs.org/@types/long/-/long-4.0.2.tgz",
      "integrity": "sha512-MqTGEo5bj5t157U6fA/BiDynNkn0YknVdh48CMPkTSpFTVmvao5UQmm7uEF6xBEo7qIMAlY/JSleYaE6VOdpaA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/@types/mime": {
      "version": "1.3.5",
      "resolved": "https://registry.npmjs.org/@types/mime/-/mime-1.3.5.tgz",
      "integrity": "sha512-/pyBZWSLD2n0dcHE3hq8s8ZvcETHtEuF+3E7XVt0Ig2nvsVQXdghHVcEkIWjy9A0wKfTn97a/PSDYohKIlnP/w==",
      "license": "MIT"
    },
    "node_modules/@types/ms": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/@types/ms/-/ms-2.1.0.tgz",
      "integrity": "sha512-GsCCIZDE/p3i96vtEqx+7dBUGXrc7zeSK3wwPHIaRThS+9OhWIXRqzs4d6k1SVU8g91DrNRWxWUGhp5KXQb2VA==",
      "license": "MIT"
    },
    "node_modules/@types/node": {
      "version": "20.19.27",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-20.19.27.tgz",
      "integrity": "sha512-N2clP5pJhB2YnZJ3PIHFk5RkygRX5WO/5f0WC08tp0wd+sv0rsJk3MqWn3CbNmT2J505a5336jaQj4ph1AdMug==",
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.21.0"
      }
    },
    "node_modules/@types/qs": {
      "version": "6.14.0",
      "resolved": "https://registry.npmjs.org/@types/qs/-/qs-6.14.0.tgz",
      "integrity": "sha512-eOunJqu0K1923aExK6y8p6fsihYEn/BYuQ4g0CxAAgFc4b/ZLN4CrsRZ55srTdqoiLzU2B2evC+apEIxprEzkQ==",
      "license": "MIT"
    },
    "node_modules/@types/range-parser": {
      "version": "1.2.7",
      "resolved": "https://registry.npmjs.org/@types/range-parser/-/range-parser-1.2.7.tgz",
      "integrity": "sha512-hKormJbkJqzQGhziax5PItDUTMAM9uE2XXQmM37dyd4hVM+5aVl7oVxMVUiVQn2oCQFN/LKCZdvSM0pFRqbSmQ==",
      "license": "MIT"
    },
    "node_modules/@types/request": {
      "version": "2.48.13",
      "resolved": "https://registry.npmjs.org/@types/request/-/request-2.48.13.tgz",
      "integrity": "sha512-FGJ6udDNUCjd19pp0Q3iTiDkwhYup7J8hpMW9c4k53NrccQFFWKRho6hvtPPEhnXWKvukfwAlB6DbDz4yhH5Gg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@types/caseless": "*",
        "@types/node": "*",
        "@types/tough-cookie": "*",
        "form-data": "^2.5.5"
      }
    },
    "node_modules/@types/send": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/@types/send/-/send-1.2.1.tgz",
      "integrity": "sha512-arsCikDvlU99zl1g69TcAB3mzZPpxgw0UQnaHeC1Nwb015xp8bknZv5rIfri9xTOcMuaVgvabfIRA7PSZVuZIQ==",
      "license": "MIT",
      "dependencies": {
        "@types/node": "*"
      }
    },
    "node_modules/@types/serve-static": {
      "version": "2.2.0",
      "resolved": "https://registry.npmjs.org/@types/serve-static/-/serve-static-2.2.0.tgz",
      "integrity": "sha512-8mam4H1NHLtu7nmtalF7eyBH14QyOASmcxHhSfEoRyr0nP/YdoesEtU+uSRvMe96TW/HPTtkoKqQLl53N7UXMQ==",
      "license": "MIT",
      "dependencies": {
        "@types/http-errors": "*",
        "@types/node": "*"
      }
    },
    "node_modules/@types/tough-cookie": {
      "version": "4.0.5",
      "resolved": "https://registry.npmjs.org/@types/tough-cookie/-/tough-cookie-4.0.5.tgz",
      "integrity": "sha512-/Ad8+nIOV7Rl++6f1BdKxFSMgmoqEoYbHRpPcx3JEfv8VRsQe9Z4mCXeJBzxs7mbHY/XOZZuXlRNfhpVPbs6ZA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/abort-controller": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/abort-controller/-/abort-controller-3.0.0.tgz",
      "integrity": "sha512-h8lQ8tacZYnR3vNQTgibj+tODHI5/+l06Au2Pcriv/Gmet0eaj4TwWH41sO9wnHDiQsEj19q0drzdWdeAHtweg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "event-target-shim": "^5.0.0"
      },
      "engines": {
        "node": ">=6.5"
      }
    },
    "node_modules/accepts": {
      "version": "1.3.8",
      "resolved": "https://registry.npmjs.org/accepts/-/accepts-1.3.8.tgz",
      "integrity": "sha512-PYAthTa2m2VKxuvSD3DPC/Gy+U+sOA1LAuT8mkmRuvw+NACSaeXEQ+NHcVF7rONl6qcaxV3Uuemwawk+7+SJLw==",
      "license": "MIT",
      "dependencies": {
        "mime-types": "~2.1.34",
        "negotiator": "0.6.3"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/agent-base": {
      "version": "7.1.4",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-7.1.4.tgz",
      "integrity": "sha512-MnA+YT8fwfJPgBx3m60MNqakm30XOkyIoH1y6huTQvC0PwZG7ki8NacLBcrPbNoo8vEZy7Jpuk7+jMO+CUovTQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/ansi-regex": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-5.0.1.tgz",
      "integrity": "sha512-quJQXlTSUGL2LH9SUXo8VwsY4soanhgo6LNSm84E1LBcE8s3O0wpdiRzyR9z/ZZJMlMWv37qOOb9pdJlMUEKFQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/ansi-styles": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-4.3.0.tgz",
      "integrity": "sha512-zbB9rCJAT1rbjiVDb2hqKFHNYLxgtk8NURxZ3IZwD3F6NtxbXZQCnnSi1Lkx+IDohdPlFp222wVALIheZJQSEg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "color-convert": "^2.0.1"
      },
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
      }
    },
    "node_modules/array-flatten": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/array-flatten/-/array-flatten-1.1.1.tgz",
      "integrity": "sha512-PCVAQswWemu6UdxsDFFX/+gVeYqKAod3D3UVm91jHwynguOwAvYPhx8nNlM++NqRcK6CxxpUafjmhIdKiHibqg==",
      "license": "MIT"
    },
    "node_modules/arrify": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/arrify/-/arrify-2.0.1.tgz",
      "integrity": "sha512-3duEwti880xqi4eAMN8AyR4a0ByT90zoYdLlevfrvU43vb0YZwZVfxOgxWrLXXXpyugL0hNZc9G6BiB5B3nUug==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/async-retry": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/async-retry/-/async-retry-1.3.3.tgz",
      "integrity": "sha512-wfr/jstw9xNi/0teMHrRW7dsz3Lt5ARhYNZ2ewpadnhaIp5mbALhOAP+EAdsC7t4Z6wqsDVv9+W6gm1Dk9mEyw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "retry": "0.13.1"
      }
    },
    "node_modules/asynckit": {
      "version": "0.4.0",
      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/base64-js": {
      "version": "1.5.1",
      "resolved": "https://registry.npmjs.org/base64-js/-/base64-js-1.5.1.tgz",
      "integrity": "sha512-AKpaYlHn8t4SVbOHCy+b5+KKgvR4vrsD8vbvrbiQJps7fKDTkjkDry6ji0rUJjC0kzbNePLwzxq8iypo41qeWA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT",
      "optional": true
    },
    "node_modules/bignumber.js": {
      "version": "9.3.1",
      "resolved": "https://registry.npmjs.org/bignumber.js/-/bignumber.js-9.3.1.tgz",
      "integrity": "sha512-Ko0uX15oIUS7wJ3Rb30Fs6SkVbLmPBAKdlm7q9+ak9bbIeFf0MwuBsQV6z7+X768/cHsfg+WlysDWJcmthjsjQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": "*"
      }
    },
    "node_modules/body-parser": {
      "version": "1.20.4",
      "resolved": "https://registry.npmjs.org/body-parser/-/body-parser-1.20.4.tgz",
      "integrity": "sha512-ZTgYYLMOXY9qKU/57FAo8F+HA2dGX7bqGc71txDRC1rS4frdFI5R7NhluHxH6M0YItAP0sHB4uqAOcYKxO6uGA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "~3.1.2",
        "content-type": "~1.0.5",
        "debug": "2.6.9",
        "depd": "2.0.0",
        "destroy": "~1.2.0",
        "http-errors": "~2.0.1",
        "iconv-lite": "~0.4.24",
        "on-finished": "~2.4.1",
        "qs": "~6.14.0",
        "raw-body": "~2.5.3",
        "type-is": "~1.6.18",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8",
        "npm": "1.2.8000 || >= 1.4.16"
      }
    },
    "node_modules/buffer-equal-constant-time": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/buffer-equal-constant-time/-/buffer-equal-constant-time-1.0.1.tgz",
      "integrity": "sha512-zRpUiDwd/xk6ADqPMATG8vc9VPrkck7T07OIx0gnjmJAnHnTVXNQG3vfvWNuiZIkwu9KrKdA1iJKfsfTVxE6NA==",
      "license": "BSD-3-Clause"
    },
    "node_modules/bytes": {
      "version": "3.1.2",
      "resolved": "https://registry.npmjs.org/bytes/-/bytes-3.1.2.tgz",
      "integrity": "sha512-/Nf7TyzTx6S3yRJObOAV7956r8cr2+Oj8AC5dt8wSP3BQAoeX58NoHyCU8P8zGkNXStjTSi6fzO6F0pBdcYbEg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/call-bind-apply-helpers": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/call-bound": {
      "version": "1.0.4",
      "resolved": "https://registry.npmjs.org/call-bound/-/call-bound-1.0.4.tgz",
      "integrity": "sha512-+ys997U96po4Kx/ABpBCqhA9EuxJaQWDQg7295H4hBphv3IZg0boBKuwYpt4YXp6MZ5AmZQnU/tyMTlRpaSejg==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "get-intrinsic": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/cliui": {
      "version": "8.0.1",
      "resolved": "https://registry.npmjs.org/cliui/-/cliui-8.0.1.tgz",
      "integrity": "sha512-BSeNnyus75C4//NQ9gQt1/csTXyo/8Sb+afLAkzAptFuMsod9HFokGNudZpi/oQV73hnVK+sR+5PVRMd+Dr7YQ==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "string-width": "^4.2.0",
        "strip-ansi": "^6.0.1",
        "wrap-ansi": "^7.0.0"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/color-convert": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/color-convert/-/color-convert-2.0.1.tgz",
      "integrity": "sha512-RRECPsj7iu/xb5oKYcsFHSppFNnsj/52OVTRKb4zP5onXwVF3zVmmToNcOfGC+CRDpfK/U584fMg38ZHCaElKQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "color-name": "~1.1.4"
      },
      "engines": {
        "node": ">=7.0.0"
      }
    },
    "node_modules/color-name": {
      "version": "1.1.4",
      "resolved": "https://registry.npmjs.org/color-name/-/color-name-1.1.4.tgz",
      "integrity": "sha512-dOy+3AuW3a2wNbZHIuMZpTcgjGuLU/uBL/ubcZF9OXbDo8ff4O8yVp5Bf0efS8uEoYo5q4Fx7dY9OgQGXgAsQA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/combined-stream": {
      "version": "1.0.8",
      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "delayed-stream": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/content-disposition": {
      "version": "0.5.4",
      "resolved": "https://registry.npmjs.org/content-disposition/-/content-disposition-0.5.4.tgz",
      "integrity": "sha512-FveZTNuGw04cxlAiWbzi6zTAL/lhehaWbTtgluJh4/E95DqMwTmha3KZN1aAWA8cFIhHzMZUvLevkw5Rqk+tSQ==",
      "license": "MIT",
      "dependencies": {
        "safe-buffer": "5.2.1"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/content-type": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/content-type/-/content-type-1.0.5.tgz",
      "integrity": "sha512-nTjqfcBFEipKdXCv4YDQWCfmcLZKm81ldF0pAopTvyrFGVbcR6P/VAAd5G7N+0tTr8QqiU0tFadD6FK4NtJwOA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie": {
      "version": "0.7.2",
      "resolved": "https://registry.npmjs.org/cookie/-/cookie-0.7.2.tgz",
      "integrity": "sha512-yki5XnKuf750l50uGTllt6kKILY4nQ1eNIQatoXEByZ5dWgnKqbnqmTrBE5B4N7lrMJKQ2ytWMiTO2o0v6Ew/w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/cookie-signature": {
      "version": "1.0.7",
      "resolved": "https://registry.npmjs.org/cookie-signature/-/cookie-signature-1.0.7.tgz",
      "integrity": "sha512-NXdYc3dLr47pBkpUCHtKSwIOQXLVn8dZEuywboCOJY/osA0wFSLlSawr3KN8qXJEyX66FcONTH8EIlVuK0yyFA==",
      "license": "MIT"
    },
    "node_modules/cors": {
      "version": "2.8.5",
      "resolved": "https://registry.npmjs.org/cors/-/cors-2.8.5.tgz",
      "integrity": "sha512-KIHbLJqu73RGr/hnbrO9uBeixNGuvSQjul/jdFvS/KFSIH1hWVd1ng7zOHx+YrEfInLG7q4n6GHQ9cDtxv/P6g==",
      "license": "MIT",
      "dependencies": {
        "object-assign": "^4",
        "vary": "^1"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/debug": {
      "version": "2.6.9",
      "resolved": "https://registry.npmjs.org/debug/-/debug-2.6.9.tgz",
      "integrity": "sha512-bC7ElrdJaJnPbAP+1EotYvqZsb3ecl5wi6Bfi6BJTUcNowp6cvspg0jXznRTKDjm/E7AdgFBVeAPVMNcKGsHMA==",
      "license": "MIT",
      "dependencies": {
        "ms": "2.0.0"
      }
    },
    "node_modules/delayed-stream": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=0.4.0"
      }
    },
    "node_modules/depd": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
      "integrity": "sha512-g7nH6P6dyDioJogAAGprGpCtVImJhpPk/roCzdb3fIh61/s/nPsfR6onyMwkCAR/OlC3yBC0lESvUoQEAssIrw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/destroy": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/destroy/-/destroy-1.2.0.tgz",
      "integrity": "sha512-2sJGJTaXIIaR1w4iJSNoN0hnMY7Gpc/n8D4qSCJw8QqFWXf7cuAgnEHxBpweaVcPevC2l3KpjYCx3NypQQgaJg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8",
        "npm": "1.2.8000 || >= 1.4.16"
      }
    },
    "node_modules/dunder-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.1",
        "es-errors": "^1.3.0",
        "gopd": "^1.2.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/duplexify": {
      "version": "4.1.3",
      "resolved": "https://registry.npmjs.org/duplexify/-/duplexify-4.1.3.tgz",
      "integrity": "sha512-M3BmBhwJRZsSx38lZyhE53Csddgzl5R7xGJNk7CVddZD6CcmwMCH8J+7AprIrQKH7TonKxaCjcv27Qmf+sQ+oA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "end-of-stream": "^1.4.1",
        "inherits": "^2.0.3",
        "readable-stream": "^3.1.1",
        "stream-shift": "^1.0.2"
      }
    },
    "node_modules/ecdsa-sig-formatter": {
      "version": "1.0.11",
      "resolved": "https://registry.npmjs.org/ecdsa-sig-formatter/-/ecdsa-sig-formatter-1.0.11.tgz",
      "integrity": "sha512-nagl3RYrbNv6kQkeJIpt6NJZy8twLB/2vtz6yN9Z4vRKHN4/QZJIEbqohALSgwKdnksuY3k5Addp5lg8sVoVcQ==",
      "license": "Apache-2.0",
      "dependencies": {
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/ee-first": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
      "integrity": "sha512-WMwm9LhRUo+WUaRN+vRuETqG89IgZphVSNkdFgeb6sS/E4OrDIN7t48CAewSHXc6C8lefD8KKfr5vY61brQlow==",
      "license": "MIT"
    },
    "node_modules/emoji-regex": {
      "version": "8.0.0",
      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
      "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/encodeurl": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/encodeurl/-/encodeurl-2.0.0.tgz",
      "integrity": "sha512-Q0n9HRi4m6JuGIV1eFlmvJB7ZEVxu93IrMyiMsGC0lrMJMWzRgx6WGquyfQgZVb31vhGgXnfmPNNXmxnOkRBrg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/end-of-stream": {
      "version": "1.4.5",
      "resolved": "https://registry.npmjs.org/end-of-stream/-/end-of-stream-1.4.5.tgz",
      "integrity": "sha512-ooEGc6HP26xXq/N+GCGOT0JKCLDGrq2bQUZrQ7gyrJiZANJ/8YDTxTpQBXGMn+WbIQXNVpyWymm7KYVICQnyOg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "once": "^1.4.0"
      }
    },
    "node_modules/es-define-property": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-errors": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
      "integrity": "sha512-Zf5H2Kxt2xjTvbJvP2ZWLEICxA6j+hAmMzIlypy4xcBg1vKVnx89Wy0GbS+kf5cwCVFFzdCFh2XSCFNULS6csw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-object-atoms": {
      "version": "1.1.1",
      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.1.tgz",
      "integrity": "sha512-FGgH2h8zKNim9ljj7dankFPcICIK9Cp5bm+c2gQSYePhpaG5+esrLODihIorn+Pe6FGJzWhXQotPv73jTaldXA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/es-set-tostringtag": {
      "version": "2.1.0",
      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.6",
        "has-tostringtag": "^1.0.2",
        "hasown": "^2.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/escalade": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
      "integrity": "sha512-WUj2qlxaQtO4g6Pq5c29GTcWGDyd8itL8zTlipgECz3JesAiiOKotd8JU6otB3PACgG6xkJUyVhboMS+bje/jA==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/escape-html": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/escape-html/-/escape-html-1.0.3.tgz",
      "integrity": "sha512-NiSupZ4OeuGwr68lGIeym/ksIZMJodUGOSCZ/FSnTxcrekbvqrgdUxlJOMpijaKZVjAJrWrGs/6Jy8OMuyj9ow==",
      "license": "MIT"
    },
    "node_modules/etag": {
      "version": "1.8.1",
      "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
      "integrity": "sha512-aIL5Fx7mawVa300al2BnEE4iNvo1qETxLrPI/o05L7z6go7fCw1J6EQmbK4FmJ2AS7kgVF/KEZWufBfdClMcPg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/event-target-shim": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/event-target-shim/-/event-target-shim-5.0.1.tgz",
      "integrity": "sha512-i/2XbnSz/uxRCU6+NdVJgKWDTM427+MqYbkQzD321DuCQJUqOuJKIA0IM2+W2xtYHdKOmZ4dR6fExsd4SXL+WQ==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=6"
      }
    },
    "node_modules/express": {
      "version": "4.22.1",
      "resolved": "https://registry.npmjs.org/express/-/express-4.22.1.tgz",
      "integrity": "sha512-F2X8g9P1X7uCPZMA3MVf9wcTqlyNp7IhH5qPCI0izhaOIYXaW9L535tGA3qmjRzpH+bZczqq7hVKxTR4NWnu+g==",
      "license": "MIT",
      "dependencies": {
        "accepts": "~1.3.8",
        "array-flatten": "1.1.1",
        "body-parser": "~1.20.3",
        "content-disposition": "~0.5.4",
        "content-type": "~1.0.4",
        "cookie": "~0.7.1",
        "cookie-signature": "~1.0.6",
        "debug": "2.6.9",
        "depd": "2.0.0",
        "encodeurl": "~2.0.0",
        "escape-html": "~1.0.3",
        "etag": "~1.8.1",
        "finalhandler": "~1.3.1",
        "fresh": "~0.5.2",
        "http-errors": "~2.0.0",
        "merge-descriptors": "1.0.3",
        "methods": "~1.1.2",
        "on-finished": "~2.4.1",
        "parseurl": "~1.3.3",
        "path-to-regexp": "~0.1.12",
        "proxy-addr": "~2.0.7",
        "qs": "~6.14.0",
        "range-parser": "~1.2.1",
        "safe-buffer": "5.2.1",
        "send": "~0.19.0",
        "serve-static": "~1.16.2",
        "setprototypeof": "1.2.0",
        "statuses": "~2.0.1",
        "type-is": "~1.6.18",
        "utils-merge": "1.0.1",
        "vary": "~1.1.2"
      },
      "engines": {
        "node": ">= 0.10.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/extend": {
      "version": "3.0.2",
      "resolved": "https://registry.npmjs.org/extend/-/extend-3.0.2.tgz",
      "integrity": "sha512-fjquC59cD7CyW6urNXK0FBufkZcoiGG80wTuPujX590cB5Ttln20E2UB4S/WARVqhXffZl2LNgS+gQdPIIim/g==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/farmhash-modern": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/farmhash-modern/-/farmhash-modern-1.1.0.tgz",
      "integrity": "sha512-6ypT4XfgqJk/F3Yuv4SX26I3doUjt0GTG4a+JgWxXQpxXzTBq8fPUeGHfcYMMDPHJHm3yPOSjaeBwBGAHWXCdA==",
      "license": "MIT",
      "engines": {
        "node": ">=18.0.0"
      }
    },
    "node_modules/fast-deep-equal": {
      "version": "3.1.3",
      "resolved": "https://registry.npmjs.org/fast-deep-equal/-/fast-deep-equal-3.1.3.tgz",
      "integrity": "sha512-f3qQ9oQy9j2AhBe/H9VC91wLmKBCCU/gDOnKNAYG5hswO7BLKj09Hc5HYNz9cGI++xlpDCIgDaitVs03ATR84Q==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/fast-xml-parser": {
      "version": "4.5.3",
      "resolved": "https://registry.npmjs.org/fast-xml-parser/-/fast-xml-parser-4.5.3.tgz",
      "integrity": "sha512-RKihhV+SHsIUGXObeVy9AXiBbFwkVk7Syp8XgwN5U3JV416+Gwp/GO9i0JYKmikykgz/UHRrrV4ROuZEo/T0ig==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/NaturalIntelligence"
        }
      ],
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "strnum": "^1.1.1"
      },
      "bin": {
        "fxparser": "src/cli/cli.js"
      }
    },
    "node_modules/faye-websocket": {
      "version": "0.11.4",
      "resolved": "https://registry.npmjs.org/faye-websocket/-/faye-websocket-0.11.4.tgz",
      "integrity": "sha512-CzbClwlXAuiRQAlUyfqPgvPoNKTckTPGfwZV4ZdAhVcP2lh9KUxJg2b5GkE7XbjKQ3YJnQ9z6D9ntLAlB+tP8g==",
      "license": "Apache-2.0",
      "dependencies": {
        "websocket-driver": ">=0.5.1"
      },
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/finalhandler": {
      "version": "1.3.2",
      "resolved": "https://registry.npmjs.org/finalhandler/-/finalhandler-1.3.2.tgz",
      "integrity": "sha512-aA4RyPcd3badbdABGDuTXCMTtOneUCAYH/gxoYRTZlIJdF0YPWuGqiAsIrhNnnqdXGswYk6dGujem4w80UJFhg==",
      "license": "MIT",
      "dependencies": {
        "debug": "2.6.9",
        "encodeurl": "~2.0.0",
        "escape-html": "~1.0.3",
        "on-finished": "~2.4.1",
        "parseurl": "~1.3.3",
        "statuses": "~2.0.2",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/firebase-admin": {
      "version": "12.7.0",
      "resolved": "https://registry.npmjs.org/firebase-admin/-/firebase-admin-12.7.0.tgz",
      "integrity": "sha512-raFIrOyTqREbyXsNkSHyciQLfv8AUZazehPaQS1lZBSCDYW74FYXU0nQZa3qHI4K+hawohlDbywZ4+qce9YNxA==",
      "license": "Apache-2.0",
      "dependencies": {
        "@fastify/busboy": "^3.0.0",
        "@firebase/database-compat": "1.0.8",
        "@firebase/database-types": "1.0.5",
        "@types/node": "^22.0.1",
        "farmhash-modern": "^1.1.0",
        "jsonwebtoken": "^9.0.0",
        "jwks-rsa": "^3.1.0",
        "node-forge": "^1.3.1",
        "uuid": "^10.0.0"
      },
      "engines": {
        "node": ">=14"
      },
      "optionalDependencies": {
        "@google-cloud/firestore": "^7.7.0",
        "@google-cloud/storage": "^7.7.0"
      }
    },
    "node_modules/firebase-admin/node_modules/@types/node": {
      "version": "22.19.3",
      "resolved": "https://registry.npmjs.org/@types/node/-/node-22.19.3.tgz",
      "integrity": "sha512-1N9SBnWYOJTrNZCdh/yJE+t910Y128BoyY+zBLWhL3r0TYzlTmFdXrPwHL9DyFZmlEXNQQolTZh3KHV31QDhyA==",
      "license": "MIT",
      "dependencies": {
        "undici-types": "~6.21.0"
      }
    },
    "node_modules/firebase-functions": {
      "version": "5.1.1",
      "resolved": "https://registry.npmjs.org/firebase-functions/-/firebase-functions-5.1.1.tgz",
      "integrity": "sha512-KkyKZE98Leg/C73oRyuUYox04PQeeBThdygMfeX+7t1cmKWYKa/ZieYa89U8GHgED+0mF7m7wfNZOfbURYxIKg==",
      "license": "MIT",
      "dependencies": {
        "@types/cors": "^2.8.5",
        "@types/express": "4.17.3",
        "cors": "^2.8.5",
        "express": "^4.17.1",
        "protobufjs": "^7.2.2"
      },
      "bin": {
        "firebase-functions": "lib/bin/firebase-functions.js"
      },
      "engines": {
        "node": ">=14.10.0"
      },
      "peerDependencies": {
        "firebase-admin": "^11.10.0 || ^12.0.0"
      }
    },
    "node_modules/form-data": {
      "version": "2.5.5",
      "resolved": "https://registry.npmjs.org/form-data/-/form-data-2.5.5.tgz",
      "integrity": "sha512-jqdObeR2rxZZbPSGL+3VckHMYtu+f9//KXBsVny6JSX/pa38Fy+bGjuG8eW/H6USNQWhLi8Num++cU2yOCNz4A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "asynckit": "^0.4.0",
        "combined-stream": "^1.0.8",
        "es-set-tostringtag": "^2.1.0",
        "hasown": "^2.0.2",
        "mime-types": "^2.1.35",
        "safe-buffer": "^5.2.1"
      },
      "engines": {
        "node": ">= 0.12"
      }
    },
    "node_modules/forwarded": {
      "version": "0.2.0",
      "resolved": "https://registry.npmjs.org/forwarded/-/forwarded-0.2.0.tgz",
      "integrity": "sha512-buRG0fpBtRHSTCOASe6hD258tEubFoRLb4ZNA6NxMVHNw2gOcwHo9wyablzMzOA5z9xA9L1KNjk/Nt6MT9aYow==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/fresh": {
      "version": "0.5.2",
      "resolved": "https://registry.npmjs.org/fresh/-/fresh-0.5.2.tgz",
      "integrity": "sha512-zJ2mQYM18rEFOudeV4GShTGIQ7RbzA7ozbU9I/XBpm7kqgMywgmylMwXHxZJmkVoYkna9d2pVXVXPdYTP9ej8Q==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/function-bind": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/function-bind/-/function-bind-1.1.2.tgz",
      "integrity": "sha512-7XHNxH7qX9xG5mIwxkhumTox/MIRNcOgDrxWsMt2pAr23WHp6MrRlN7FBSFpCpr+oVO0F744iUgR82nJMfG2SA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/functional-red-black-tree": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/functional-red-black-tree/-/functional-red-black-tree-1.0.1.tgz",
      "integrity": "sha512-dsKNQNdj6xA3T+QlADDA7mOSlX0qiMINjn0cgr+eGHGsbSHzTabcIogz2+p/iqP1Xs6EP/sS2SbqH+brGTbq0g==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/gaxios": {
      "version": "6.7.1",
      "resolved": "https://registry.npmjs.org/gaxios/-/gaxios-6.7.1.tgz",
      "integrity": "sha512-LDODD4TMYx7XXdpwxAVRAIAuB0bzv0s+ywFonY46k126qzQHT9ygyoa9tncmOiQmmDrik65UYsEkv3lbfqQ3yQ==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "extend": "^3.0.2",
        "https-proxy-agent": "^7.0.1",
        "is-stream": "^2.0.0",
        "node-fetch": "^2.6.9",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/gaxios/node_modules/uuid": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-9.0.1.tgz",
      "integrity": "sha512-b+1eJOlsR9K8HJpow9Ok3fiWOWSIcIzXodvv0rQjVoOVNpWMpxf1wZNpt4y9h10odCNrqnYp1OBzRktckBe3sA==",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "optional": true,
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/gcp-metadata": {
      "version": "6.1.1",
      "resolved": "https://registry.npmjs.org/gcp-metadata/-/gcp-metadata-6.1.1.tgz",
      "integrity": "sha512-a4tiq7E0/5fTjxPAaH4jpjkSv/uCaU2p5KC6HVGrvl0cDjA8iBZv4vv1gyzlmK0ZUKqwpOyQMKzZQe3lTit77A==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "gaxios": "^6.1.1",
        "google-logging-utils": "^0.0.2",
        "json-bigint": "^1.0.0"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/get-caller-file": {
      "version": "2.0.5",
      "resolved": "https://registry.npmjs.org/get-caller-file/-/get-caller-file-2.0.5.tgz",
      "integrity": "sha512-DyFP3BM/3YHTQOCUL/w0OZHR0lpKeGrxotcHWcqNEdnltqFwXVfhEBQ94eIo34AfQpo0rGki4cyIiftY06h2Fg==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": "6.* || 8.* || >= 10.*"
      }
    },
    "node_modules/get-intrinsic": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
      "license": "MIT",
      "dependencies": {
        "call-bind-apply-helpers": "^1.0.2",
        "es-define-property": "^1.0.1",
        "es-errors": "^1.3.0",
        "es-object-atoms": "^1.1.1",
        "function-bind": "^1.1.2",
        "get-proto": "^1.0.1",
        "gopd": "^1.2.0",
        "has-symbols": "^1.1.0",
        "hasown": "^2.0.2",
        "math-intrinsics": "^1.1.0"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/get-proto": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
      "license": "MIT",
      "dependencies": {
        "dunder-proto": "^1.0.1",
        "es-object-atoms": "^1.0.0"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/google-auth-library": {
      "version": "9.15.1",
      "resolved": "https://registry.npmjs.org/google-auth-library/-/google-auth-library-9.15.1.tgz",
      "integrity": "sha512-Jb6Z0+nvECVz+2lzSMt9u98UsoakXxA2HGHMCxh+so3n90XgYWkq5dur19JAJV7ONiJY22yBTyJB1TSkvPq9Ng==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "base64-js": "^1.3.0",
        "ecdsa-sig-formatter": "^1.0.11",
        "gaxios": "^6.1.1",
        "gcp-metadata": "^6.1.0",
        "gtoken": "^7.0.0",
        "jws": "^4.0.0"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/google-gax": {
      "version": "4.6.1",
      "resolved": "https://registry.npmjs.org/google-gax/-/google-gax-4.6.1.tgz",
      "integrity": "sha512-V6eky/xz2mcKfAd1Ioxyd6nmA61gao3n01C+YeuIwu3vzM9EDR6wcVzMSIbLMDXWeoi9SHYctXuKYC5uJUT3eQ==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "@grpc/grpc-js": "^1.10.9",
        "@grpc/proto-loader": "^0.7.13",
        "@types/long": "^4.0.0",
        "abort-controller": "^3.0.0",
        "duplexify": "^4.0.0",
        "google-auth-library": "^9.3.0",
        "node-fetch": "^2.7.0",
        "object-hash": "^3.0.0",
        "proto3-json-serializer": "^2.0.2",
        "protobufjs": "^7.3.2",
        "retry-request": "^7.0.0",
        "uuid": "^9.0.1"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/google-gax/node_modules/uuid": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-9.0.1.tgz",
      "integrity": "sha512-b+1eJOlsR9K8HJpow9Ok3fiWOWSIcIzXodvv0rQjVoOVNpWMpxf1wZNpt4y9h10odCNrqnYp1OBzRktckBe3sA==",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "optional": true,
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/google-logging-utils": {
      "version": "0.0.2",
      "resolved": "https://registry.npmjs.org/google-logging-utils/-/google-logging-utils-0.0.2.tgz",
      "integrity": "sha512-NEgUnEcBiP5HrPzufUkBzJOD/Sxsco3rLNo1F1TNf7ieU8ryUzBhqba8r756CjLX7rn3fHl6iLEwPYuqpoKgQQ==",
      "license": "Apache-2.0",
      "optional": true,
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/gopd": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/gtoken": {
      "version": "7.1.0",
      "resolved": "https://registry.npmjs.org/gtoken/-/gtoken-7.1.0.tgz",
      "integrity": "sha512-pCcEwRi+TKpMlxAQObHDQ56KawURgyAf6jtIY046fJ5tIv3zDe/LEIubckAO8fj6JnAxLdmWkUfNyulQ2iKdEw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "gaxios": "^6.0.0",
        "jws": "^4.0.0"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/has-symbols": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/has-tostringtag": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "has-symbols": "^1.0.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/hasown": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.2.tgz",
      "integrity": "sha512-0hJU9SCPvmMzIBdZFqNPXWa6dqh7WdH0cII9y+CyS8rG3nL48Bclra9HmKhVVUHyPWNH5Y7xDwAB7bfgSjkUMQ==",
      "license": "MIT",
      "dependencies": {
        "function-bind": "^1.1.2"
      },
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/html-entities": {
      "version": "2.6.0",
      "resolved": "https://registry.npmjs.org/html-entities/-/html-entities-2.6.0.tgz",
      "integrity": "sha512-kig+rMn/QOVRvr7c86gQ8lWXq+Hkv6CbAH1hLu+RG338StTpE8Z0b44SDVaqVu7HGKf27frdmUYEs9hTUX/cLQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/mdevils"
        },
        {
          "type": "patreon",
          "url": "https://patreon.com/mdevils"
        }
      ],
      "license": "MIT",
      "optional": true
    },
    "node_modules/http-errors": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.1.tgz",
      "integrity": "sha512-4FbRdAX+bSdmo4AUFuS0WNiPz8NgFt+r8ThgNWmlrjQjt1Q7ZR9+zTlce2859x4KSXrwIsaeTqDoKQmtP8pLmQ==",
      "license": "MIT",
      "dependencies": {
        "depd": "~2.0.0",
        "inherits": "~2.0.4",
        "setprototypeof": "~1.2.0",
        "statuses": "~2.0.2",
        "toidentifier": "~1.0.1"
      },
      "engines": {
        "node": ">= 0.8"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/express"
      }
    },
    "node_modules/http-parser-js": {
      "version": "0.5.10",
      "resolved": "https://registry.npmjs.org/http-parser-js/-/http-parser-js-0.5.10.tgz",
      "integrity": "sha512-Pysuw9XpUq5dVc/2SMHpuTY01RFl8fttgcyunjL7eEMhGM3cI4eOmiCycJDVCo/7O7ClfQD3SaI6ftDzqOXYMA==",
      "license": "MIT"
    },
    "node_modules/http-proxy-agent": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/http-proxy-agent/-/http-proxy-agent-5.0.0.tgz",
      "integrity": "sha512-n2hY8YdoRE1i7r6M0w9DIw5GgZN0G25P8zLCRQ8rjXtTU3vsNFBI/vWK/UIeE6g5MUUz6avwAPXmL6Fy9D/90w==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@tootallnate/once": "2",
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/http-proxy-agent/node_modules/agent-base": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
      "integrity": "sha512-RZNwNclF7+MS/8bDg70amg32dyeZGZxiDuQmZxKLAlQjr3jGyLx+4Kkk58UO7D2QdgFIQCovuSuZESne6RG6XQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "debug": "4"
      },
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/http-proxy-agent/node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/http-proxy-agent/node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/https-proxy-agent": {
      "version": "7.0.6",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-7.0.6.tgz",
      "integrity": "sha512-vK9P5/iUfdl95AI+JVyUuIcVtd4ofvtrOr3HNtM2yxC9bnMbEdp3x01OhQNnjb8IJYi38VlTE3mBXwcfvywuSw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "agent-base": "^7.1.2",
        "debug": "4"
      },
      "engines": {
        "node": ">= 14"
      }
    },
    "node_modules/https-proxy-agent/node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/https-proxy-agent/node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/iconv-lite": {
      "version": "0.4.24",
      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.4.24.tgz",
      "integrity": "sha512-v3MXnZAcvnywkTUEZomIActle7RXXeedOR31wwl7VlyoXO4Qi9arvSenNQWne1TcRwhCL1HwLI21bEqdpj8/rA==",
      "license": "MIT",
      "dependencies": {
        "safer-buffer": ">= 2.1.2 < 3"
      },
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/inherits": {
      "version": "2.0.4",
      "resolved": "https://registry.npmjs.org/inherits/-/inherits-2.0.4.tgz",
      "integrity": "sha512-k/vGaX4/Yla3WzyMCvTQOXYeIHvqOKtnqBduzTHpzpQZzAskKMhZ2K+EnBiSM9zGSoIFeMpXKxa4dYeZIQqewQ==",
      "license": "ISC"
    },
    "node_modules/ipaddr.js": {
      "version": "1.9.1",
      "resolved": "https://registry.npmjs.org/ipaddr.js/-/ipaddr.js-1.9.1.tgz",
      "integrity": "sha512-0KI/607xoxSToH7GjN1FfSbLoU0+btTicjsQSWQlh/hZykN8KpmMf7uYwPW3R+akZ6R/w18ZlXSHBYXiYUPO3g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/is-fullwidth-code-point": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/is-fullwidth-code-point/-/is-fullwidth-code-point-3.0.0.tgz",
      "integrity": "sha512-zymm5+u+sCsSWyD9qNaejV3DFvhCKclKdizYaJUuHA83RLjb7nSuGnddCHGv0hk+KY7BMAlsWeK4Ueg6EV6XQg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/is-stream": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/is-stream/-/is-stream-2.0.1.tgz",
      "integrity": "sha512-hFoiJiTl63nn+kstHGBtewWSKnQLpyb155KHheA1l39uvtO9nWIop1p3udqPcUd/xbF1VLMO4n7OI6p7RbngDg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=8"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/jose": {
      "version": "4.15.9",
      "resolved": "https://registry.npmjs.org/jose/-/jose-4.15.9.tgz",
      "integrity": "sha512-1vUQX+IdDMVPj4k8kOxgUqlcK518yluMuGZwqlr44FS1ppZB/5GWh4rZG89erpOBOJjU/OBsnCVFfapsRz6nEA==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/panva"
      }
    },
    "node_modules/json-bigint": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/json-bigint/-/json-bigint-1.0.0.tgz",
      "integrity": "sha512-SiPv/8VpZuWbvLSMtTDU8hEfrZWg/mH/nV/b4o0CYbSxu1UIQPLdwKOCIyLQX+VIPO5vrLX3i8qtqFyhdPSUSQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "bignumber.js": "^9.0.0"
      }
    },
    "node_modules/jsonwebtoken": {
      "version": "9.0.3",
      "resolved": "https://registry.npmjs.org/jsonwebtoken/-/jsonwebtoken-9.0.3.tgz",
      "integrity": "sha512-MT/xP0CrubFRNLNKvxJ2BYfy53Zkm++5bX9dtuPbqAeQpTVe0MQTFhao8+Cp//EmJp244xt6Drw/GVEGCUj40g==",
      "license": "MIT",
      "dependencies": {
        "jws": "^4.0.1",
        "lodash.includes": "^4.3.0",
        "lodash.isboolean": "^3.0.3",
        "lodash.isinteger": "^4.0.4",
        "lodash.isnumber": "^3.0.3",
        "lodash.isplainobject": "^4.0.6",
        "lodash.isstring": "^4.0.1",
        "lodash.once": "^4.0.0",
        "ms": "^2.1.1",
        "semver": "^7.5.4"
      },
      "engines": {
        "node": ">=12",
        "npm": ">=6"
      }
    },
    "node_modules/jsonwebtoken/node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/jwa": {
      "version": "2.0.1",
      "resolved": "https://registry.npmjs.org/jwa/-/jwa-2.0.1.tgz",
      "integrity": "sha512-hRF04fqJIP8Abbkq5NKGN0Bbr3JxlQ+qhZufXVr0DvujKy93ZCbXZMHDL4EOtodSbCWxOqR8MS1tXA5hwqCXDg==",
      "license": "MIT",
      "dependencies": {
        "buffer-equal-constant-time": "^1.0.1",
        "ecdsa-sig-formatter": "1.0.11",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/jwks-rsa": {
      "version": "3.2.0",
      "resolved": "https://registry.npmjs.org/jwks-rsa/-/jwks-rsa-3.2.0.tgz",
      "integrity": "sha512-PwchfHcQK/5PSydeKCs1ylNym0w/SSv8a62DgHJ//7x2ZclCoinlsjAfDxAAbpoTPybOum/Jgy+vkvMmKz89Ww==",
      "license": "MIT",
      "dependencies": {
        "@types/express": "^4.17.20",
        "@types/jsonwebtoken": "^9.0.4",
        "debug": "^4.3.4",
        "jose": "^4.15.4",
        "limiter": "^1.1.5",
        "lru-memoizer": "^2.2.0"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/jwks-rsa/node_modules/@types/express": {
      "version": "4.17.25",
      "resolved": "https://registry.npmjs.org/@types/express/-/express-4.17.25.tgz",
      "integrity": "sha512-dVd04UKsfpINUnK0yBoYHDF3xu7xVH4BuDotC/xGuycx4CgbP48X/KF/586bcObxT0HENHXEU8Nqtu6NR+eKhw==",
      "license": "MIT",
      "dependencies": {
        "@types/body-parser": "*",
        "@types/express-serve-static-core": "^4.17.33",
        "@types/qs": "*",
        "@types/serve-static": "^1"
      }
    },
    "node_modules/jwks-rsa/node_modules/@types/express-serve-static-core": {
      "version": "4.19.7",
      "resolved": "https://registry.npmjs.org/@types/express-serve-static-core/-/express-serve-static-core-4.19.7.tgz",
      "integrity": "sha512-FvPtiIf1LfhzsaIXhv/PHan/2FeQBbtBDtfX2QfvPxdUelMDEckK08SM6nqo1MIZY3RUlfA+HV8+hFUSio78qg==",
      "license": "MIT",
      "dependencies": {
        "@types/node": "*",
        "@types/qs": "*",
        "@types/range-parser": "*",
        "@types/send": "*"
      }
    },
    "node_modules/jwks-rsa/node_modules/@types/send": {
      "version": "0.17.6",
      "resolved": "https://registry.npmjs.org/@types/send/-/send-0.17.6.tgz",
      "integrity": "sha512-Uqt8rPBE8SY0RK8JB1EzVOIZ32uqy8HwdxCnoCOsYrvnswqmFZ/k+9Ikidlk/ImhsdvBsloHbAlewb2IEBV/Og==",
      "license": "MIT",
      "dependencies": {
        "@types/mime": "^1",
        "@types/node": "*"
      }
    },
    "node_modules/jwks-rsa/node_modules/@types/serve-static": {
      "version": "1.15.10",
      "resolved": "https://registry.npmjs.org/@types/serve-static/-/serve-static-1.15.10.tgz",
      "integrity": "sha512-tRs1dB+g8Itk72rlSI2ZrW6vZg0YrLI81iQSTkMmOqnqCaNr/8Ek4VwWcN5vZgCYWbg/JJSGBlUaYGAOP73qBw==",
      "license": "MIT",
      "dependencies": {
        "@types/http-errors": "*",
        "@types/node": "*",
        "@types/send": "<1"
      }
    },
    "node_modules/jwks-rsa/node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/jwks-rsa/node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/jws": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/jws/-/jws-4.0.1.tgz",
      "integrity": "sha512-EKI/M/yqPncGUUh44xz0PxSidXFr/+r0pA70+gIYhjv+et7yxM+s29Y+VGDkovRofQem0fs7Uvf4+YmAdyRduA==",
      "license": "MIT",
      "dependencies": {
        "jwa": "^2.0.1",
        "safe-buffer": "^5.0.1"
      }
    },
    "node_modules/limiter": {
      "version": "1.1.5",
      "resolved": "https://registry.npmjs.org/limiter/-/limiter-1.1.5.tgz",
      "integrity": "sha512-FWWMIEOxz3GwUI4Ts/IvgVy6LPvoMPgjMdQ185nN6psJyBJ4yOpzqm695/h5umdLJg2vW3GR5iG11MAkR2AzJA=="
    },
    "node_modules/lodash.camelcase": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/lodash.camelcase/-/lodash.camelcase-4.3.0.tgz",
      "integrity": "sha512-TwuEnCnxbc3rAvhf/LbG7tJUDzhqXyFnv3dtzLOPgCG/hODL7WFnsbwktkD7yUV0RrreP/l1PALq/YSg6VvjlA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/lodash.clonedeep": {
      "version": "4.5.0",
      "resolved": "https://registry.npmjs.org/lodash.clonedeep/-/lodash.clonedeep-4.5.0.tgz",
      "integrity": "sha512-H5ZhCF25riFd9uB5UCkVKo61m3S/xZk1x4wA6yp/L3RFP6Z/eHH1ymQcGLo7J3GMPfm0V/7m1tryHuGVxpqEBQ==",
      "license": "MIT"
    },
    "node_modules/lodash.includes": {
      "version": "4.3.0",
      "resolved": "https://registry.npmjs.org/lodash.includes/-/lodash.includes-4.3.0.tgz",
      "integrity": "sha512-W3Bx6mdkRTGtlJISOvVD/lbqjTlPPUDTMnlXZFnVwi9NKJ6tiAk6LVdlhZMm17VZisqhKcgzpO5Wz91PCt5b0w==",
      "license": "MIT"
    },
    "node_modules/lodash.isboolean": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isboolean/-/lodash.isboolean-3.0.3.tgz",
      "integrity": "sha512-Bz5mupy2SVbPHURB98VAcw+aHh4vRV5IPNhILUCsOzRmsTmSQ17jIuqopAentWoehktxGd9e/hbIXq980/1QJg==",
      "license": "MIT"
    },
    "node_modules/lodash.isinteger": {
      "version": "4.0.4",
      "resolved": "https://registry.npmjs.org/lodash.isinteger/-/lodash.isinteger-4.0.4.tgz",
      "integrity": "sha512-DBwtEWN2caHQ9/imiNeEA5ys1JoRtRfY3d7V9wkqtbycnAmTvRRmbHKDV4a0EYc678/dia0jrte4tjYwVBaZUA==",
      "license": "MIT"
    },
    "node_modules/lodash.isnumber": {
      "version": "3.0.3",
      "resolved": "https://registry.npmjs.org/lodash.isnumber/-/lodash.isnumber-3.0.3.tgz",
      "integrity": "sha512-QYqzpfwO3/CWf3XP+Z+tkQsfaLL/EnUlXWVkIk5FUPc4sBdTehEqZONuyRt2P67PXAk+NXmTBcc97zw9t1FQrw==",
      "license": "MIT"
    },
    "node_modules/lodash.isplainobject": {
      "version": "4.0.6",
      "resolved": "https://registry.npmjs.org/lodash.isplainobject/-/lodash.isplainobject-4.0.6.tgz",
      "integrity": "sha512-oSXzaWypCMHkPC3NvBEaPHf0KsA5mvPrOPgQWDsbg8n7orZ290M0BmC/jgRZ4vcJ6DTAhjrsSYgdsW/F+MFOBA==",
      "license": "MIT"
    },
    "node_modules/lodash.isstring": {
      "version": "4.0.1",
      "resolved": "https://registry.npmjs.org/lodash.isstring/-/lodash.isstring-4.0.1.tgz",
      "integrity": "sha512-0wJxfxH1wgO3GrbuP+dTTk7op+6L41QCXbGINEmD+ny/G/eCqGzxyCsh7159S+mgDDcoarnBw6PC1PS5+wUGgw==",
      "license": "MIT"
    },
    "node_modules/lodash.once": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/lodash.once/-/lodash.once-4.1.1.tgz",
      "integrity": "sha512-Sb487aTOCr9drQVL8pIxOzVhafOjZN9UU54hiN8PU3uAiSV7lx1yYNpbNmex2PK6dSJoNTSJUUswT651yww3Mg==",
      "license": "MIT"
    },
    "node_modules/long": {
      "version": "5.3.2",
      "resolved": "https://registry.npmjs.org/long/-/long-5.3.2.tgz",
      "integrity": "sha512-mNAgZ1GmyNhD7AuqnTG3/VQ26o760+ZYBPKjPvugO8+nLbYfX6TVpJPseBvopbdY+qpZ/lKUnmEc1LeZYS3QAA==",
      "license": "Apache-2.0"
    },
    "node_modules/lru-cache": {
      "version": "6.0.0",
      "resolved": "https://registry.npmjs.org/lru-cache/-/lru-cache-6.0.0.tgz",
      "integrity": "sha512-Jo6dJ04CmSjuznwJSS3pUeWmd/H0ffTlkXXgwZi+eq1UCmqQwCh+eLsYOYCwY991i2Fah4h1BEMCx4qThGbsiA==",
      "license": "ISC",
      "dependencies": {
        "yallist": "^4.0.0"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/lru-memoizer": {
      "version": "2.3.0",
      "resolved": "https://registry.npmjs.org/lru-memoizer/-/lru-memoizer-2.3.0.tgz",
      "integrity": "sha512-GXn7gyHAMhO13WSKrIiNfztwxodVsP8IoZ3XfrJV4yH2x0/OeTO/FIaAHTY5YekdGgW94njfuKmyyt1E0mR6Ug==",
      "license": "MIT",
      "dependencies": {
        "lodash.clonedeep": "^4.5.0",
        "lru-cache": "6.0.0"
      }
    },
    "node_modules/math-intrinsics": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      }
    },
    "node_modules/media-typer": {
      "version": "0.3.0",
      "resolved": "https://registry.npmjs.org/media-typer/-/media-typer-0.3.0.tgz",
      "integrity": "sha512-dq+qelQ9akHpcOl/gUVRTxVIOkAJ1wR3QAvb4RsVjS8oVoFjDGTc679wJYmUmknUF5HwMLOgb5O+a3KxfWapPQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/merge-descriptors": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/merge-descriptors/-/merge-descriptors-1.0.3.tgz",
      "integrity": "sha512-gaNvAS7TZ897/rVaZ0nMtAyxNyi/pdbjbAwUpFQpN70GqnVfOiXpeUUMKRBmzXaSQ8DdTX4/0ms62r2K+hE6mQ==",
      "license": "MIT",
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/methods": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/methods/-/methods-1.1.2.tgz",
      "integrity": "sha512-iclAHeNqNm68zFtnZ0e+1L2yUIdvzNoauKU4WBA3VvH/vPFieF7qfRlwUZU+DA9P9bPXIS90ulxoUoCH23sV2w==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/mime/-/mime-3.0.0.tgz",
      "integrity": "sha512-jSCU7/VB1loIWBZe14aEYHU/+1UMEHoaO7qxCOVJOw9GgH72VAWppxNcjU+x9a2k3GSIBXNKxXQFqRvvZ7vr3A==",
      "license": "MIT",
      "optional": true,
      "bin": {
        "mime": "cli.js"
      },
      "engines": {
        "node": ">=10.0.0"
      }
    },
    "node_modules/mime-db": {
      "version": "1.52.0",
      "resolved": "https://registry.npmjs.org/mime-db/-/mime-db-1.52.0.tgz",
      "integrity": "sha512-sPU4uV7dYlvtWJxwwxHD0PuihVNiE7TyAbQ5SWxDCB9mUYvOgroQOwYQQOKPJ8CIbE+1ETVlOoK1UC2nU3gYvg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/mime-types": {
      "version": "2.1.35",
      "resolved": "https://registry.npmjs.org/mime-types/-/mime-types-2.1.35.tgz",
      "integrity": "sha512-ZDY+bPm5zTTF+YpCrAU9nK0UgICYPT0QtT1NZWFv4s++TNkcgVaT0g6+4R2uI4MjQjzysHB1zxuWL50hzaeXiw==",
      "license": "MIT",
      "dependencies": {
        "mime-db": "1.52.0"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/ms": {
      "version": "2.0.0",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.0.0.tgz",
      "integrity": "sha512-Tpp60P6IUJDTuOq/5Z8cdskzJujfwqfOTkrwIwj7IRISpnkJnT6SyJ4PCPnGMoFjC9ddhal5KVIYtAt97ix05A==",
      "license": "MIT"
    },
    "node_modules/negotiator": {
      "version": "0.6.3",
      "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
      "integrity": "sha512-+EUsqGPLsM+j/zdChZjsnX51g4XrHFOIXwfnCVPGlQk/k5giakcKsuxCObBRu6DSm9opw/O6slWbJdghQM4bBg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/node-fetch": {
      "version": "2.7.0",
      "resolved": "https://registry.npmjs.org/node-fetch/-/node-fetch-2.7.0.tgz",
      "integrity": "sha512-c4FRfUm/dbcWZ7U+1Wq0AwCyFL+3nt2bEw05wfxSz+DWpWsitgmSgYmy2dQdWyKC1694ELPqMs/YzUSNozLt8A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "whatwg-url": "^5.0.0"
      },
      "engines": {
        "node": "4.x || >=6.0.0"
      },
      "peerDependencies": {
        "encoding": "^0.1.0"
      },
      "peerDependenciesMeta": {
        "encoding": {
          "optional": true
        }
      }
    },
    "node_modules/node-forge": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/node-forge/-/node-forge-1.3.3.tgz",
      "integrity": "sha512-rLvcdSyRCyouf6jcOIPe/BgwG/d7hKjzMKOas33/pHEr6gbq18IK9zV7DiPvzsz0oBJPme6qr6H6kGZuI9/DZg==",
      "license": "(BSD-3-Clause OR GPL-2.0)",
      "engines": {
        "node": ">= 6.13.0"
      }
    },
    "node_modules/object-assign": {
      "version": "4.1.1",
      "resolved": "https://registry.npmjs.org/object-assign/-/object-assign-4.1.1.tgz",
      "integrity": "sha512-rJgTQnkUnH1sFw8yT6VSU3zD3sWmu6sZhIseY8VX+GRu3P6F7Fu+JNDoXfklElbLJSnc3FUQHVe4cU5hj+BcUg==",
      "license": "MIT",
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/object-hash": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/object-hash/-/object-hash-3.0.0.tgz",
      "integrity": "sha512-RSn9F68PjH9HqtltsSnqYC1XXoWe9Bju5+213R98cNGttag9q9yAOTzdbsqvIa7aNm5WffBZFpWYr2aWrklWAw==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/object-inspect": {
      "version": "1.13.4",
      "resolved": "https://registry.npmjs.org/object-inspect/-/object-inspect-1.13.4.tgz",
      "integrity": "sha512-W67iLl4J2EXEGTbfeHCffrjDfitvLANg0UlX3wFUUSTx92KXRFegMHUVgSqE+wvhAbi4WqjGg9czysTV2Epbew==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/on-finished": {
      "version": "2.4.1",
      "resolved": "https://registry.npmjs.org/on-finished/-/on-finished-2.4.1.tgz",
      "integrity": "sha512-oVlzkg3ENAhCk2zdv7IJwd/QUD4z2RxRwpkcGY8psCVcCYZNq4wYnVWALHM+brtuJjePWiYF/ClmuDr8Ch5+kg==",
      "license": "MIT",
      "dependencies": {
        "ee-first": "1.1.1"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/once": {
      "version": "1.4.0",
      "resolved": "https://registry.npmjs.org/once/-/once-1.4.0.tgz",
      "integrity": "sha512-lNaJgI+2Q5URQBkccEKHTQOPaXdUxnZZElQTZY0MFUAuaEqe1E+Nyvgdz/aIyNi6Z9MzO5dv1H8n58/GELp3+w==",
      "license": "ISC",
      "optional": true,
      "dependencies": {
        "wrappy": "1"
      }
    },
    "node_modules/p-limit": {
      "version": "3.1.0",
      "resolved": "https://registry.npmjs.org/p-limit/-/p-limit-3.1.0.tgz",
      "integrity": "sha512-TYOanM3wGwNGsZN2cVTYPArw454xnXj5qmWF1bEoAc4+cU/ol7GVh7odevjp1FNHduHc3KZMcFduxU5Xc6uJRQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "yocto-queue": "^0.1.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    },
    "node_modules/parseurl": {
      "version": "1.3.3",
      "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
      "integrity": "sha512-CiyeOxFT/JZyN5m0z9PfXw4SCBJ6Sygz1Dpl0wqjlhDEGGBP1GnsUVEL0p63hoG1fcj3fHynXi9NYO4nWOL+qQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/path-to-regexp": {
      "version": "0.1.12",
      "resolved": "https://registry.npmjs.org/path-to-regexp/-/path-to-regexp-0.1.12.tgz",
      "integrity": "sha512-RA1GjUVMnvYFxuqovrEqZoxxW5NUZqbwKtYz/Tt7nXerk0LbLblQmrsgdeOxV5SFHf0UDggjS/bSeOZwt1pmEQ==",
      "license": "MIT"
    },
    "node_modules/proto3-json-serializer": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/proto3-json-serializer/-/proto3-json-serializer-2.0.2.tgz",
      "integrity": "sha512-SAzp/O4Yh02jGdRc+uIrGoe87dkN/XtwxfZ4ZyafJHymd79ozp5VG5nyZ7ygqPM5+cpLDjjGnYFUkngonyDPOQ==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "protobufjs": "^7.2.5"
      },
      "engines": {
        "node": ">=14.0.0"
      }
    },
    "node_modules/protobufjs": {
      "version": "7.5.4",
      "resolved": "https://registry.npmjs.org/protobufjs/-/protobufjs-7.5.4.tgz",
      "integrity": "sha512-CvexbZtbov6jW2eXAvLukXjXUW1TzFaivC46BpWc/3BpcCysb5Vffu+B3XHMm8lVEuy2Mm4XGex8hBSg1yapPg==",
      "hasInstallScript": true,
      "license": "BSD-3-Clause",
      "dependencies": {
        "@protobufjs/aspromise": "^1.1.2",
        "@protobufjs/base64": "^1.1.2",
        "@protobufjs/codegen": "^2.0.4",
        "@protobufjs/eventemitter": "^1.1.0",
        "@protobufjs/fetch": "^1.1.0",
        "@protobufjs/float": "^1.0.2",
        "@protobufjs/inquire": "^1.1.0",
        "@protobufjs/path": "^1.1.2",
        "@protobufjs/pool": "^1.1.0",
        "@protobufjs/utf8": "^1.1.0",
        "@types/node": ">=13.7.0",
        "long": "^5.0.0"
      },
      "engines": {
        "node": ">=12.0.0"
      }
    },
    "node_modules/proxy-addr": {
      "version": "2.0.7",
      "resolved": "https://registry.npmjs.org/proxy-addr/-/proxy-addr-2.0.7.tgz",
      "integrity": "sha512-llQsMLSUDUPT44jdrU/O37qlnifitDP+ZwrmmZcoSKyLKvtZxpyV0n2/bD/N4tBAAZ/gJEdZU7KMraoK1+XYAg==",
      "license": "MIT",
      "dependencies": {
        "forwarded": "0.2.0",
        "ipaddr.js": "1.9.1"
      },
      "engines": {
        "node": ">= 0.10"
      }
    },
    "node_modules/qs": {
      "version": "6.14.0",
      "resolved": "https://registry.npmjs.org/qs/-/qs-6.14.0.tgz",
      "integrity": "sha512-YWWTjgABSKcvs/nWBi9PycY/JiPJqOD4JA6o9Sej2AtvSGarXxKC3OQSk4pAarbdQlKAh5D4FCQkJNkW+GAn3w==",
      "license": "BSD-3-Clause",
      "dependencies": {
        "side-channel": "^1.1.0"
      },
      "engines": {
        "node": ">=0.6"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/range-parser": {
      "version": "1.2.1",
      "resolved": "https://registry.npmjs.org/range-parser/-/range-parser-1.2.1.tgz",
      "integrity": "sha512-Hrgsx+orqoygnmhFbKaHE6c296J+HTAQXoxEF6gNupROmmGJRoyzfG3ccAveqCBrwr/2yxQ5BVd/GTl5agOwSg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/raw-body": {
      "version": "2.5.3",
      "resolved": "https://registry.npmjs.org/raw-body/-/raw-body-2.5.3.tgz",
      "integrity": "sha512-s4VSOf6yN0rvbRZGxs8Om5CWj6seneMwK3oDb4lWDH0UPhWcxwOWw5+qk24bxq87szX1ydrwylIOp2uG1ojUpA==",
      "license": "MIT",
      "dependencies": {
        "bytes": "~3.1.2",
        "http-errors": "~2.0.1",
        "iconv-lite": "~0.4.24",
        "unpipe": "~1.0.0"
      },
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/readable-stream": {
      "version": "3.6.2",
      "resolved": "https://registry.npmjs.org/readable-stream/-/readable-stream-3.6.2.tgz",
      "integrity": "sha512-9u/sniCrY3D5WdsERHzHE4G2YCXqoG5FTHUiCC4SIbr6XcLZBY05ya9EKjYek9O5xOAwjGq+1JdGBAS7Q9ScoA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "inherits": "^2.0.3",
        "string_decoder": "^1.1.1",
        "util-deprecate": "^1.0.1"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/require-directory": {
      "version": "2.1.1",
      "resolved": "https://registry.npmjs.org/require-directory/-/require-directory-2.1.1.tgz",
      "integrity": "sha512-fGxEI7+wsG9xrvdjsrlmL22OMTTiHRwAMroiEeMgq8gzoLC/PQr7RsRDSTLUg/bZAZtF+TVIkHc6/4RIKrui+Q==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=0.10.0"
      }
    },
    "node_modules/retry": {
      "version": "0.13.1",
      "resolved": "https://registry.npmjs.org/retry/-/retry-0.13.1.tgz",
      "integrity": "sha512-XQBQ3I8W1Cge0Seh+6gjj03LbmRFWuoszgK9ooCpwYIrhhoO80pfq4cUkU5DkknwfOfFteRwlZ56PYOGYyFWdg==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">= 4"
      }
    },
    "node_modules/retry-request": {
      "version": "7.0.2",
      "resolved": "https://registry.npmjs.org/retry-request/-/retry-request-7.0.2.tgz",
      "integrity": "sha512-dUOvLMJ0/JJYEn8NrpOaGNE7X3vpI5XlZS/u0ANjqtcZVKnIxP7IgCFwrKTxENw29emmwug53awKtaMm4i9g5w==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "@types/request": "^2.48.8",
        "extend": "^3.0.2",
        "teeny-request": "^9.0.0"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/safe-buffer": {
      "version": "5.2.1",
      "resolved": "https://registry.npmjs.org/safe-buffer/-/safe-buffer-5.2.1.tgz",
      "integrity": "sha512-rp3So07KcdmmKbGvgaNxQSJr7bGVSVk5S9Eq1F+ppbRo70+YeaDxkw5Dd8NPN+GD6bjnYm2VuPuCXmpuYvmCXQ==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/feross"
        },
        {
          "type": "patreon",
          "url": "https://www.patreon.com/feross"
        },
        {
          "type": "consulting",
          "url": "https://feross.org/support"
        }
      ],
      "license": "MIT"
    },
    "node_modules/safer-buffer": {
      "version": "2.1.2",
      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
      "license": "MIT"
    },
    "node_modules/semver": {
      "version": "7.7.3",
      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.3.tgz",
      "integrity": "sha512-SdsKMrI9TdgjdweUSR9MweHA4EJ8YxHn8DFaDisvhVlUOe4BF1tLD7GAj0lIqWVl+dPb/rExr0Btby5loQm20Q==",
      "license": "ISC",
      "bin": {
        "semver": "bin/semver.js"
      },
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/send": {
      "version": "0.19.2",
      "resolved": "https://registry.npmjs.org/send/-/send-0.19.2.tgz",
      "integrity": "sha512-VMbMxbDeehAxpOtWJXlcUS5E8iXh6QmN+BkRX1GARS3wRaXEEgzCcB10gTQazO42tpNIya8xIyNx8fll1OFPrg==",
      "license": "MIT",
      "dependencies": {
        "debug": "2.6.9",
        "depd": "2.0.0",
        "destroy": "1.2.0",
        "encodeurl": "~2.0.0",
        "escape-html": "~1.0.3",
        "etag": "~1.8.1",
        "fresh": "~0.5.2",
        "http-errors": "~2.0.1",
        "mime": "1.6.0",
        "ms": "2.1.3",
        "on-finished": "~2.4.1",
        "range-parser": "~1.2.1",
        "statuses": "~2.0.2"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/send/node_modules/mime": {
      "version": "1.6.0",
      "resolved": "https://registry.npmjs.org/mime/-/mime-1.6.0.tgz",
      "integrity": "sha512-x0Vn8spI+wuJ1O6S7gnbaQg8Pxh4NNHb7KSINmEWKiPE4RKOplvijn+NkmYmmRgP68mc70j2EbeTFRsrswaQeg==",
      "license": "MIT",
      "bin": {
        "mime": "cli.js"
      },
      "engines": {
        "node": ">=4"
      }
    },
    "node_modules/send/node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT"
    },
    "node_modules/serve-static": {
      "version": "1.16.3",
      "resolved": "https://registry.npmjs.org/serve-static/-/serve-static-1.16.3.tgz",
      "integrity": "sha512-x0RTqQel6g5SY7Lg6ZreMmsOzncHFU7nhnRWkKgWuMTu5NN0DR5oruckMqRvacAN9d5w6ARnRBXl9xhDCgfMeA==",
      "license": "MIT",
      "dependencies": {
        "encodeurl": "~2.0.0",
        "escape-html": "~1.0.3",
        "parseurl": "~1.3.3",
        "send": "~0.19.1"
      },
      "engines": {
        "node": ">= 0.8.0"
      }
    },
    "node_modules/setprototypeof": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/setprototypeof/-/setprototypeof-1.2.0.tgz",
      "integrity": "sha512-E5LDX7Wrp85Kil5bhZv46j8jOeboKq5JMmYM3gVGdGH8xFpPWXUMsNrlODCrkoxMEeNi/XZIwuRvY4XNwYMJpw==",
      "license": "ISC"
    },
    "node_modules/side-channel": {
      "version": "1.1.0",
      "resolved": "https://registry.npmjs.org/side-channel/-/side-channel-1.1.0.tgz",
      "integrity": "sha512-ZX99e6tRweoUXqR+VBrslhda51Nh5MTQwou5tnUDgbtyM0dBgmhEDtWGP/xbKn6hqfPRHujUNwz5fy/wbbhnpw==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3",
        "side-channel-list": "^1.0.0",
        "side-channel-map": "^1.0.1",
        "side-channel-weakmap": "^1.0.2"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-list": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/side-channel-list/-/side-channel-list-1.0.0.tgz",
      "integrity": "sha512-FCLHtRD/gnpCiCHEiJLOwdmFP+wzCmDEkc9y7NsYxeF4u7Btsn1ZuwgwJGxImImHicJArLP4R0yX4c2KCrMrTA==",
      "license": "MIT",
      "dependencies": {
        "es-errors": "^1.3.0",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-map": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/side-channel-map/-/side-channel-map-1.0.1.tgz",
      "integrity": "sha512-VCjCNfgMsby3tTdo02nbjtM/ewra6jPHmpThenkTYh8pG9ucZ/1P8So4u4FGBek/BjpOVsDCMoLA/iuBKIFXRA==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/side-channel-weakmap": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/side-channel-weakmap/-/side-channel-weakmap-1.0.2.tgz",
      "integrity": "sha512-WPS/HvHQTYnHisLo9McqBHOJk2FkHO/tlpvldyrnem4aeQp4hai3gythswg6p01oSoTl58rcpiFAjF2br2Ak2A==",
      "license": "MIT",
      "dependencies": {
        "call-bound": "^1.0.2",
        "es-errors": "^1.3.0",
        "get-intrinsic": "^1.2.5",
        "object-inspect": "^1.13.3",
        "side-channel-map": "^1.0.1"
      },
      "engines": {
        "node": ">= 0.4"
      },
      "funding": {
        "url": "https://github.com/sponsors/ljharb"
      }
    },
    "node_modules/statuses": {
      "version": "2.0.2",
      "resolved": "https://registry.npmjs.org/statuses/-/statuses-2.0.2.tgz",
      "integrity": "sha512-DvEy55V3DB7uknRo+4iOGT5fP1slR8wQohVdknigZPMpMstaKJQWhwiYBACJE3Ul2pTnATihhBYnRhZQHGBiRw==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/stream-events": {
      "version": "1.0.5",
      "resolved": "https://registry.npmjs.org/stream-events/-/stream-events-1.0.5.tgz",
      "integrity": "sha512-E1GUzBSgvct8Jsb3v2X15pjzN1tYebtbLaMg+eBOUOAxgbLoSbT2NS91ckc5lJD1KfLjId+jXJRgo0qnV5Nerg==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "stubs": "^3.0.0"
      }
    },
    "node_modules/stream-shift": {
      "version": "1.0.3",
      "resolved": "https://registry.npmjs.org/stream-shift/-/stream-shift-1.0.3.tgz",
      "integrity": "sha512-76ORR0DO1o1hlKwTbi/DM3EXWGf3ZJYO8cXX5RJwnul2DEg2oyoZyjLNoQM8WsvZiFKCRfC1O0J7iCvie3RZmQ==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/string_decoder": {
      "version": "1.3.0",
      "resolved": "https://registry.npmjs.org/string_decoder/-/string_decoder-1.3.0.tgz",
      "integrity": "sha512-hkRX8U1WjJFd8LsDJ2yQ/wWWxaopEsABU1XfkM8A+j0+85JAGppt16cr1Whg6KIbb4okU6Mql6BOj+uup/wKeA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "safe-buffer": "~5.2.0"
      }
    },
    "node_modules/string-width": {
      "version": "4.2.3",
      "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
      "integrity": "sha512-wKyQRQpjJ0sIp62ErSZdGsjMJWsap5oRNihHhu6G7JVO/9jIB6UyevL+tXuOqrng8j/cxKTWyWUwvSTriiZz/g==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "emoji-regex": "^8.0.0",
        "is-fullwidth-code-point": "^3.0.0",
        "strip-ansi": "^6.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strip-ansi": {
      "version": "6.0.1",
      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-6.0.1.tgz",
      "integrity": "sha512-Y38VPSHcqkFrCpFnQ9vuSXmquuv5oXOKpGeT6aGrr3o3Gc9AlVa6JBfUSOCnbxGGZF+/0ooI7KrPuUSztUdU5A==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-regex": "^5.0.1"
      },
      "engines": {
        "node": ">=8"
      }
    },
    "node_modules/strnum": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/strnum/-/strnum-1.1.2.tgz",
      "integrity": "sha512-vrN+B7DBIoTTZjnPNewwhx6cBA/H+IS7rfW68n7XxC1y7uoiGQBxaKzqucGUgavX15dJgiGztLJ8vxuEzwqBdA==",
      "funding": [
        {
          "type": "github",
          "url": "https://github.com/sponsors/NaturalIntelligence"
        }
      ],
      "license": "MIT",
      "optional": true
    },
    "node_modules/stubs": {
      "version": "3.0.0",
      "resolved": "https://registry.npmjs.org/stubs/-/stubs-3.0.0.tgz",
      "integrity": "sha512-PdHt7hHUJKxvTCgbKX9C1V/ftOcjJQgz8BZwNfV5c4B6dcGqlpelTbJ999jBGZ2jYiPAwcX5dP6oBwVlBlUbxw==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/teeny-request": {
      "version": "9.0.0",
      "resolved": "https://registry.npmjs.org/teeny-request/-/teeny-request-9.0.0.tgz",
      "integrity": "sha512-resvxdc6Mgb7YEThw6G6bExlXKkv6+YbuzGg9xuXxSgxJF7Ozs+o8Y9+2R3sArdWdW8nOokoQb1yrpFB0pQK2g==",
      "license": "Apache-2.0",
      "optional": true,
      "dependencies": {
        "http-proxy-agent": "^5.0.0",
        "https-proxy-agent": "^5.0.0",
        "node-fetch": "^2.6.9",
        "stream-events": "^1.0.5",
        "uuid": "^9.0.0"
      },
      "engines": {
        "node": ">=14"
      }
    },
    "node_modules/teeny-request/node_modules/agent-base": {
      "version": "6.0.2",
      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
      "integrity": "sha512-RZNwNclF7+MS/8bDg70amg32dyeZGZxiDuQmZxKLAlQjr3jGyLx+4Kkk58UO7D2QdgFIQCovuSuZESne6RG6XQ==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "debug": "4"
      },
      "engines": {
        "node": ">= 6.0.0"
      }
    },
    "node_modules/teeny-request/node_modules/debug": {
      "version": "4.4.3",
      "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
      "integrity": "sha512-RGwwWnwQvkVfavKVt22FGLw+xYSdzARwm0ru6DhTVA3umU5hZc28V3kO4stgYryrTlLpuvgI9GiijltAjNbcqA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ms": "^2.1.3"
      },
      "engines": {
        "node": ">=6.0"
      },
      "peerDependenciesMeta": {
        "supports-color": {
          "optional": true
        }
      }
    },
    "node_modules/teeny-request/node_modules/https-proxy-agent": {
      "version": "5.0.1",
      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-5.0.1.tgz",
      "integrity": "sha512-dFcAjpTQFgoLMzC2VwU+C/CbS7uRL0lWmxDITmqm7C+7F0Odmj6s9l6alZc6AELXhrnggM2CeWSXHGOdX2YtwA==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "agent-base": "6",
        "debug": "4"
      },
      "engines": {
        "node": ">= 6"
      }
    },
    "node_modules/teeny-request/node_modules/ms": {
      "version": "2.1.3",
      "resolved": "https://registry.npmjs.org/ms/-/ms-2.1.3.tgz",
      "integrity": "sha512-6FlzubTLZG3J2a/NVCAleEhjzq5oxgHyaCU9yYXvcLsvoVaHJq/s5xXI6/XXP6tz7R9xAOtHnSO/tXtF3WRTlA==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/teeny-request/node_modules/uuid": {
      "version": "9.0.1",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-9.0.1.tgz",
      "integrity": "sha512-b+1eJOlsR9K8HJpow9Ok3fiWOWSIcIzXodvv0rQjVoOVNpWMpxf1wZNpt4y9h10odCNrqnYp1OBzRktckBe3sA==",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "optional": true,
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/toidentifier": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/toidentifier/-/toidentifier-1.0.1.tgz",
      "integrity": "sha512-o5sSPKEkg/DIQNmH43V0/uerLrpzVedkUh8tGNvaeXpfpuwjKenlSox/2O/BTlZUtEe+JG7s5YhEz608PlAHRA==",
      "license": "MIT",
      "engines": {
        "node": ">=0.6"
      }
    },
    "node_modules/tr46": {
      "version": "0.0.3",
      "resolved": "https://registry.npmjs.org/tr46/-/tr46-0.0.3.tgz",
      "integrity": "sha512-N3WMsuqV66lT30CrXNbEjx4GEwlow3v6rr4mCcv6prnfwhS01rkgyFdjPNBYd9br7LpXV1+Emh01fHnq2Gdgrw==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/tslib": {
      "version": "2.8.1",
      "resolved": "https://registry.npmjs.org/tslib/-/tslib-2.8.1.tgz",
      "integrity": "sha512-oJFu94HQb+KVduSUQL7wnpmqnfmLsOA/nAh6b6EH0wCEoK0/mPeXU6c3wKDV83MkOuHPRHtSXKKU99IBazS/2w==",
      "license": "0BSD"
    },
    "node_modules/type-is": {
      "version": "1.6.18",
      "resolved": "https://registry.npmjs.org/type-is/-/type-is-1.6.18.tgz",
      "integrity": "sha512-TkRKr9sUTxEH8MdfuCSP7VizJyzRNMjj2J2do2Jr3Kym598JVdEksuzPQCnlFPW4ky9Q+iA+ma9BGm06XQBy8g==",
      "license": "MIT",
      "dependencies": {
        "media-typer": "0.3.0",
        "mime-types": "~2.1.24"
      },
      "engines": {
        "node": ">= 0.6"
      }
    },
    "node_modules/typescript": {
      "version": "5.9.3",
      "resolved": "https://registry.npmjs.org/typescript/-/typescript-5.9.3.tgz",
      "integrity": "sha512-jl1vZzPDinLr9eUt3J/t7V6FgNEw9QjvBPdysz9KfQDD41fQrC2Y4vKQdiaUpFT4bXlb1RHhLpp8wtm6M5TgSw==",
      "dev": true,
      "license": "Apache-2.0",
      "bin": {
        "tsc": "bin/tsc",
        "tsserver": "bin/tsserver"
      },
      "engines": {
        "node": ">=14.17"
      }
    },
    "node_modules/undici-types": {
      "version": "6.21.0",
      "resolved": "https://registry.npmjs.org/undici-types/-/undici-types-6.21.0.tgz",
      "integrity": "sha512-iwDZqg0QAGrg9Rav5H4n0M64c3mkR59cJ6wQp+7C4nI0gsmExaedaYLNO44eT4AtBBwjbTiGPMlt2Md0T9H9JQ==",
      "license": "MIT"
    },
    "node_modules/unpipe": {
      "version": "1.0.0",
      "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
      "integrity": "sha512-pjy2bYhSsufwWlKwPc+l3cN7+wuJlK6uz0YdJEOlQDbl6jo/YlPi4mb8agUkVC8BF7V8NuzeyPNqRksA3hztKQ==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/util-deprecate": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/util-deprecate/-/util-deprecate-1.0.2.tgz",
      "integrity": "sha512-EPD5q1uXyFxJpCrLnCc1nHnq3gOa6DZBocAIiI2TaSCA7VCJ1UJDMagCzIkXNsUYfD1daK//LTEQ8xiIbrHtcw==",
      "license": "MIT",
      "optional": true
    },
    "node_modules/utils-merge": {
      "version": "1.0.1",
      "resolved": "https://registry.npmjs.org/utils-merge/-/utils-merge-1.0.1.tgz",
      "integrity": "sha512-pMZTvIkT1d+TFGvDOqodOclx0QWkkgi6Tdoa8gC8ffGAAqz9pzPTZWAybbsHHoED/ztMtkv/VoYTYyShUn81hA==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.4.0"
      }
    },
    "node_modules/uuid": {
      "version": "10.0.0",
      "resolved": "https://registry.npmjs.org/uuid/-/uuid-10.0.0.tgz",
      "integrity": "sha512-8XkAphELsDnEGrDxUOHB3RGvXz6TeuYSGEZBOjtTtPm2lwhGBjLgOzLHB63IUWfBpNucQjND6d3AOudO+H3RWQ==",
      "funding": [
        "https://github.com/sponsors/broofa",
        "https://github.com/sponsors/ctavan"
      ],
      "license": "MIT",
      "bin": {
        "uuid": "dist/bin/uuid"
      }
    },
    "node_modules/vary": {
      "version": "1.1.2",
      "resolved": "https://registry.npmjs.org/vary/-/vary-1.1.2.tgz",
      "integrity": "sha512-BNGbWLfd0eUPabhkXUVm0j8uuvREyTh5ovRa/dyow/BqAbZJyC+5fU+IzQOzmAKzYqYRAISoRhdQr3eIZ/PXqg==",
      "license": "MIT",
      "engines": {
        "node": ">= 0.8"
      }
    },
    "node_modules/webidl-conversions": {
      "version": "3.0.1",
      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-3.0.1.tgz",
      "integrity": "sha512-2JAn3z8AR6rjK8Sm8orRC0h/bcl/DqL7tRPdGZ4I1CjdF+EaMLmYxBHyXuKL849eucPFhvBoxMsflfOb8kxaeQ==",
      "license": "BSD-2-Clause",
      "optional": true
    },
    "node_modules/websocket-driver": {
      "version": "0.7.4",
      "resolved": "https://registry.npmjs.org/websocket-driver/-/websocket-driver-0.7.4.tgz",
      "integrity": "sha512-b17KeDIQVjvb0ssuSDF2cYXSg2iztliJ4B9WdsuB6J952qCPKmnVq4DyW5motImXHDC1cBT/1UezrJVsKw5zjg==",
      "license": "Apache-2.0",
      "dependencies": {
        "http-parser-js": ">=0.5.1",
        "safe-buffer": ">=5.1.0",
        "websocket-extensions": ">=0.1.1"
      },
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/websocket-extensions": {
      "version": "0.1.4",
      "resolved": "https://registry.npmjs.org/websocket-extensions/-/websocket-extensions-0.1.4.tgz",
      "integrity": "sha512-OqedPIGOfsDlo31UNwYbCFMSaO9m9G/0faIHj5/dZFDMFqPTcx6UwqyOy3COEaEOg/9VsGIpdqn62W5KhoKSpg==",
      "license": "Apache-2.0",
      "engines": {
        "node": ">=0.8.0"
      }
    },
    "node_modules/whatwg-url": {
      "version": "5.0.0",
      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-5.0.0.tgz",
      "integrity": "sha512-saE57nupxk6v3HY35+jzBwYa0rKSy0XR8JSxZPwgLr7ys0IBzhGviA1/TUGJLmSVqs8pb9AnvICXEuOHLprYTw==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "tr46": "~0.0.3",
        "webidl-conversions": "^3.0.0"
      }
    },
    "node_modules/wrap-ansi": {
      "version": "7.0.0",
      "resolved": "https://registry.npmjs.org/wrap-ansi/-/wrap-ansi-7.0.0.tgz",
      "integrity": "sha512-YVGIj2kamLSTxw6NsZjoBxfSwsn0ycdesmc4p+Q21c5zPuZ1pl+NfxVdxPtdHvmNVOQ6XSYG4AUtyt/Fi7D16Q==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "ansi-styles": "^4.0.0",
        "string-width": "^4.1.0",
        "strip-ansi": "^6.0.0"
      },
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/chalk/wrap-ansi?sponsor=1"
      }
    },
    "node_modules/wrappy": {
      "version": "1.0.2",
      "resolved": "https://registry.npmjs.org/wrappy/-/wrappy-1.0.2.tgz",
      "integrity": "sha512-l4Sp/DRseor9wL6EvV2+TuQn63dMkPjZ/sp9XkghTEbV9KlPS1xUsZ3u7/IQO4wxtcFB4bgpQPRcR3QCvezPcQ==",
      "license": "ISC",
      "optional": true
    },
    "node_modules/y18n": {
      "version": "5.0.8",
      "resolved": "https://registry.npmjs.org/y18n/-/y18n-5.0.8.tgz",
      "integrity": "sha512-0pfFzegeDWJHJIAmTLRP2DwHjdF5s7jo9tuztdQxAhINCdvS+3nGINqPd00AphqJR/0LhANUS6/+7SCb98YOfA==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": ">=10"
      }
    },
    "node_modules/yallist": {
      "version": "4.0.0",
      "resolved": "https://registry.npmjs.org/yallist/-/yallist-4.0.0.tgz",
      "integrity": "sha512-3wdGidZyq5PB084XLES5TpOSRA3wjXAlIWMhum2kRcv/41Sn2emQ0dycQW4uZXLejwKvg6EsvbdlVL+FYEct7A==",
      "license": "ISC"
    },
    "node_modules/yargs": {
      "version": "17.7.2",
      "resolved": "https://registry.npmjs.org/yargs/-/yargs-17.7.2.tgz",
      "integrity": "sha512-7dSzzRQ++CKnNI/krKnYRV7JKKPUXMEh61soaHKg9mrWEhzFWhFnxPxGl+69cD1Ou63C13NUPCnmIcrvqCuM6w==",
      "license": "MIT",
      "optional": true,
      "dependencies": {
        "cliui": "^8.0.1",
        "escalade": "^3.1.1",
        "get-caller-file": "^2.0.5",
        "require-directory": "^2.1.1",
        "string-width": "^4.2.3",
        "y18n": "^5.0.5",
        "yargs-parser": "^21.1.1"
      },
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/yargs-parser": {
      "version": "21.1.1",
      "resolved": "https://registry.npmjs.org/yargs-parser/-/yargs-parser-21.1.1.tgz",
      "integrity": "sha512-tVpsJW7DdjecAiFpbIB1e3qxIQsE6NoPc5/eTdrbbIC4h0LVsWhnoa3g+m2HclBIujHzsxZ4VJVA+GUuc2/LBw==",
      "license": "ISC",
      "optional": true,
      "engines": {
        "node": ">=12"
      }
    },
    "node_modules/yocto-queue": {
      "version": "0.1.0",
      "resolved": "https://registry.npmjs.org/yocto-queue/-/yocto-queue-0.1.0.tgz",
      "integrity": "sha512-rVksvsnNCdJ/ohGc6xgPwyN8eheCxsiLM8mxuE/t/mOVqJewPuO1miLpTHQiRgTKCLexL4MeAFVagts7HmNZ2Q==",
      "license": "MIT",
      "optional": true,
      "engines": {
        "node": ">=10"
      },
      "funding": {
        "url": "https://github.com/sponsors/sindresorhus"
      }
    }
  }
}

```

## File: functions/package.json
```json
{
  "name": "functions",
  "version": "1.0.0",
  "description": "Cloud Functions for Wings Baseball Club PWA",
  "main": "lib/index.js",
  "type": "commonjs",
  "engines": {
    "node": "20"
  },
  "scripts": {
    "build": "tsc",
    "serve": "npm run build && firebase emulators:start --only functions",
    "shell": "npm run build && firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^5.1.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^20.11.24"
  },
  "private": true
}
```

## File: functions/src/callables/comments.moderation.ts
```ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { writeAudit } from '../shared/audit';

// Note: If db is not exported from index, use admin.firestore()
const firestore = admin.firestore();

interface ModerateCommentRequest {
    clubId: string;
    postId: string;
    commentId: string;
    action: 'EDIT' | 'DELETE';
    content?: string;      // required if EDIT
    reason?: string;       // optional, recommended
    requestId: string;      // required for idempotency
}

export const moderateComment = onCall<ModerateCommentRequest>({ region: 'asia-northeast3' }, async (request) => {
    // V2: request.data, request.auth
    const { data, auth } = request;

    // 1. Auth Check
    if (!auth) {
        throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const uid = auth.uid;
    const { clubId, postId, commentId, action, content, reason, requestId } = data;

    if (!clubId || !postId || !commentId || !action || !requestId) {
        throw new HttpsError('invalid-argument', 'Missing required fields.');
    }

    if (action === 'EDIT' && !content?.trim()) {
        throw new HttpsError('invalid-argument', 'Content is required for EDIT.');
    }

    // 2. Role Check (Admin/President/Director/Treasurer)
    const memberSnap = await firestore.collection('clubs').doc(clubId).collection('members').doc(uid).get();
    if (!memberSnap.exists) {
        throw new HttpsError('permission-denied', 'Member profile not found.');
    }
    const memberData = memberSnap.data();
    const role = memberData?.role;

    // Align with isAdminLike
    if (!['PRESIDENT', 'VICE_PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN'].includes(role)) {
        throw new HttpsError('permission-denied', 'Insufficient permissions for moderation.');
    }

    // 3. Target Comment Check
    const commentRef = firestore
        .collection('clubs').doc(clubId)
        .collection('posts').doc(postId)
        .collection('comments').doc(commentId);

    const commentSnap = await commentRef.get();
    if (!commentSnap.exists) {
        throw new HttpsError('not-found', 'Comment not found.');
    }
    const beforeData = commentSnap.data();

    // 4. Exec Action
    try {
        if (action === 'EDIT') {
            const trimmedContent = content!.trim();
            await commentRef.update({
                content: trimmedContent,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                editedAt: admin.firestore.FieldValue.serverTimestamp(),
                editedBy: uid,
                editReason: reason || null,
                editedByRole: role
            });

            // Audit
            await writeAudit({
                clubId,
                actorUid: uid,
                action: 'COMMENT_EDIT',
                targetType: 'comment',
                targetId: commentId,
                before: beforeData,
                after: { ...beforeData, content: trimmedContent, editedBy: uid }, // approximation
                meta: { postId, commentId, reason, action, via: 'callable', requestId }
            });

        } else if (action === 'DELETE') {
            await commentRef.delete();

            // Audit
            await writeAudit({
                clubId,
                actorUid: uid,
                action: 'COMMENT_DELETE',
                targetType: 'comment',
                targetId: commentId,
                before: beforeData,
                after: null,
                meta: { postId, commentId, reason, action, via: 'callable', requestId }
            });
        }
    } catch (error) {
        console.error(`[moderateComment] Error:`, error);
        throw new HttpsError('internal', 'Moderation failed.');
    }

    return { success: true, action, commentId };
});

```

## File: functions/src/callables/events.ts
```ts
import { onCall } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { requireAuth, requireRole } from '../shared/auth';
import { reqString, optString } from '../shared/validate';
import { writeAudit } from '../shared/audit';
import { withIdempotency } from '../shared/idempotency';
import { computeVoteCloseAtKST } from '../shared/time';
import { postCol } from '../shared/paths';
import { Err } from '../shared/errors';

/**
 * 이벤트 게시글 생성 (callable)
 * 
 * μATOM-0531: createEventPost 스켈레톤/권한검사
 * μATOM-0532: voteCloseAt 계산(전날 23:00 KST) 서버 확정
 * μATOM-0533: event post 저장(voteClosed=false 초기화)
 * 
 * 권한: adminLike (PRESIDENT | DIRECTOR | ADMIN)
 * 멱등: withIdempotency
 * 
 * 로직:
 * 1. 입력 검증 (eventType, startAt, place 필수)
 * 2. voteCloseAt 계산 (startAt 전날 23:00 KST)
 * 3. event post 생성 (type="event", voteClosed=false)
 * 4. audit: EVENT_CREATE
 */
export const createEventPost = onCall({ region: 'asia-northeast3' }, async (req) => {
  const uid = requireAuth(req);
  const clubId = reqString(req.data?.clubId, 'clubId', 3, 64);
  const eventType = reqString(req.data?.eventType, 'eventType', 4, 20) as 'PRACTICE' | 'GAME';
  const title = reqString(req.data?.title, 'title', 1, 200);
  const content = reqString(req.data?.content, 'content', 1, 5000);
  const startAt = req.data?.startAt; // ISO string or timestamp
  const place = reqString(req.data?.place, 'place', 1, 200);
  const opponent = optString(req.data?.opponent, 'opponent', 200);
  const requestId = reqString(req.data?.requestId, 'requestId', 1, 128); // 필수 (멱등성용)

  // μATOM-0531: adminLike 권한 확인
  await requireRole(clubId, uid, ['PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN']);

  // eventType 검증
  if (eventType !== 'PRACTICE' && eventType !== 'GAME') {
    throw Err.invalidArgument('Invalid eventType', { eventType, validTypes: ['PRACTICE', 'GAME'] });
  }

  // startAt 검증 및 변환
  if (!startAt) {
    throw Err.invalidArgument('startAt is required');
  }

  let startAtDate: Date;
  if (typeof startAt === 'string') {
    startAtDate = new Date(startAt);
  } else if (typeof startAt === 'number') {
    startAtDate = new Date(startAt);
  } else {
    throw Err.invalidArgument('Invalid startAt format');
  }

  if (isNaN(startAtDate.getTime())) {
    throw Err.invalidArgument('Invalid startAt date');
  }

  // μATOM-0532: voteCloseAt 계산(전날 21:00 KST) 서버 확정
  const voteCloseAtMillis = computeVoteCloseAtKST(startAtDate.getTime());
  const voteCloseAt = new Date(voteCloseAtMillis);

  // 멱등성 키 생성
  const idempotencyKey = `event:${clubId}:${requestId}`;

  return withIdempotency(clubId, idempotencyKey, async () => {
    const db = getFirestore();

    // 작성자 정보 조회
    const memberRef = db.collection('clubs').doc(clubId).collection('members').doc(uid);
    const memberSnap = await memberRef.get();
    const memberData = memberSnap.exists ? memberSnap.data() : null;

    // μATOM-0533: event post 저장(voteClosed=false 초기화)
    const postData = {
      type: 'event' as const,
      eventType,
      title,
      content,
      authorId: uid,
      authorName: memberData?.realName || '',
      authorPhotoURL: memberData?.photoURL || null,
      startAt: FieldValue.serverTimestamp(), // 나중에 실제 startAt으로 업데이트
      place,
      opponent: opponent || null,
      voteCloseAt: voteCloseAt,
      voteClosed: false, // 초기화
      attendanceSummary: {
        attending: 0,
        absent: 0,
        maybe: 0,
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    const postsCol = postCol(clubId);
    const newPostRef = postsCol.doc();
    await newPostRef.set(postData);

    // startAt을 실제 값으로 업데이트 (serverTimestamp 대신)
    await newPostRef.update({
      startAt: startAtDate,
    });

    const postId = newPostRef.id;

    // Audit 기록
    await writeAudit({
      clubId,
      actorUid: uid,
      action: 'EVENT_CREATE',
      targetType: 'post',
      targetId: postId,
      meta: {
        eventType,
        title,
        startAt: startAtDate.toISOString(),
        voteCloseAt: voteCloseAt.toISOString(),
      },
    });

    return {
      success: true,
      postId,
      voteCloseAt: voteCloseAt.toISOString(),
    };
  });
});

```

## File: functions/src/callables/members.ts
```ts
import { onCall } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { requireAuth, requireRole, Role } from '../shared/auth';
import { memberRef } from '../shared/paths';
import { reqString, optString, optNumber } from '../shared/validate';
import { writeAudit } from '../shared/audit';
import { withIdempotency } from '../shared/idempotency';
import { Err } from '../shared/errors';

/**
 * 멤버 역할 변경 (callable)
 * 
 * ATOM-09: ADMIN/TREASURER 정책
 * 
 * 권한:
 * - ADMIN 부여/회수: PRESIDENT | DIRECTOR
 * - TREASURER 지정/변경: PRESIDENT만
 * 
 * @example
 * // ADMIN 역할 부여 (PRESIDENT 또는 DIRECTOR만 가능)
 * await setMemberRole({ clubId, targetUserId, role: 'ADMIN', requestId });
 * 
 * // TREASURER 지정 (PRESIDENT만 가능)
 * await setMemberRole({ clubId, targetUserId, role: 'TREASURER', requestId });
 */
export const setMemberRole = onCall({ region: 'asia-northeast3' }, async (req) => {
  const uid = requireAuth(req);
  const clubId = reqString(req.data?.clubId, 'clubId', 3, 64);
  const targetUserId = reqString(req.data?.targetUserId, 'targetUserId', 1, 128);
  const roleStr = reqString(req.data?.role, 'role', 1, 20);
  const requestId = optString(req.data?.requestId, 'requestId', 128);

  // role enum 검증
  const validRoles: Role[] = ['PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN', 'MEMBER'];
  if (!validRoles.includes(roleStr as Role)) {
    throw Err.invalidArgument('Invalid role', { role: roleStr, validRoles });
  }
  const role = roleStr as Role;

  // 멱등성 키 생성
  const idempotencyKey = requestId
    ? `role:${clubId}:${targetUserId}:${requestId}`
    : `role:${clubId}:${targetUserId}:${uid}:${Date.now()}`;

  return withIdempotency(clubId, idempotencyKey, async () => {
    // 현재 사용자의 역할 확인
    const actorRole = await requireRole(clubId, uid, ['PRESIDENT', 'DIRECTOR', 'ADMIN']);

    // 타겟 멤버 존재 확인 및 현재 역할 가져오기
    const targetMemberRef = memberRef(clubId, targetUserId);
    const targetMemberSnap = await targetMemberRef.get();
    if (!targetMemberSnap.exists) {
      throw Err.notFound('Target member not found', { targetUserId });
    }
    const targetMemberData = targetMemberSnap.data();
    const beforeRole = targetMemberData?.role as Role | undefined;
    if (!beforeRole) {
      throw Err.internal('Target member role missing');
    }

    // 권한 정책 검증
    if (role === 'TREASURER') {
      // TREASURER는 PRESIDENT만 지정/변경 가능
      if (actorRole !== 'PRESIDENT') {
        throw Err.permissionDenied('Only PRESIDENT can assign/change TREASURER role', {
          required: 'PRESIDENT',
          actual: actorRole,
        });
      }
    } else if (role === 'ADMIN') {
      // ADMIN은 PRESIDENT 또는 DIRECTOR만 부여/회수 가능
      if (actorRole !== 'PRESIDENT' && actorRole !== 'DIRECTOR') {
        throw Err.permissionDenied('Only PRESIDENT or DIRECTOR can assign/revoke ADMIN role', {
          required: ['PRESIDENT', 'DIRECTOR'],
          actual: actorRole,
        });
      }
    } else if (role === 'PRESIDENT' || role === 'DIRECTOR') {
      // PRESIDENT/DIRECTOR 변경은 더 엄격한 정책 필요 (현재는 PRESIDENT만)
      if (actorRole !== 'PRESIDENT') {
        throw Err.permissionDenied('Only PRESIDENT can change PRESIDENT/DIRECTOR role', {
          required: 'PRESIDENT',
          actual: actorRole,
        });
      }
    }
    // MEMBER는 adminLike 모두 가능

    // 역할 변경 (before/after 동일하면 스킵)
    if (beforeRole === role) {
      return { success: true, message: 'Role unchanged', role };
    }

    // 역할 업데이트
    await targetMemberRef.update({
      role,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // users 문서도 동기화 (선택적, PRD에 따라 다를 수 있음)
    const userRef = getFirestore().collection('users').doc(targetUserId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      await userRef.update({
        role,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    // Audit 기록
    await writeAudit({
      clubId,
      actorUid: uid,
      action: 'MEMBER_ROLE_CHANGE',
      targetType: 'member',
      targetId: targetUserId,
      before: { role: beforeRole },
      after: { role },
    });

    return { success: true, role, beforeRole };
  });
});

/**
 * 관리자가 멤버 프로필 수정 (callable)
 * 
 * ATOM-10: 포지션/백넘버는 관리자 지정
 * 
 * 권한: adminLike (PRESIDENT | DIRECTOR | ADMIN)
 * 
 * @example
 * await setMemberProfileByAdmin({
 *   clubId,
 *   targetUserId,
 *   position: 'SS',
 *   backNumber: 7,
 *   requestId
 * });
 */
export const setMemberProfileByAdmin = onCall({ region: 'asia-northeast3' }, async (req) => {
  const uid = requireAuth(req);
  const clubId = reqString(req.data?.clubId, 'clubId', 3, 64);
  const targetUserId = reqString(req.data?.targetUserId, 'targetUserId', 1, 128);
  const position = optString(req.data?.position, 'position', 50);
  const backNumber = optNumber(req.data?.backNumber, 'backNumber', 0, 99);
  const requestId = optString(req.data?.requestId, 'requestId', 128);

  // 관리자 권한 확인
  await requireRole(clubId, uid, ['PRESIDENT', 'DIRECTOR', 'ADMIN']);

  // 멱등성 키 생성
  const idempotencyKey = requestId
    ? `profile:${clubId}:${targetUserId}:${requestId}`
    : `profile:${clubId}:${targetUserId}:${uid}:${Date.now()}`;

  return withIdempotency(clubId, idempotencyKey, async () => {
    // 타겟 멤버 존재 확인 및 현재 프로필 가져오기
    const targetMemberRef = memberRef(clubId, targetUserId);
    const targetMemberSnap = await targetMemberRef.get();
    if (!targetMemberSnap.exists) {
      throw Err.notFound('Target member not found', { targetUserId });
    }
    const targetMemberData = targetMemberSnap.data();
    const before = {
      position: targetMemberData?.position || null,
      backNumber: targetMemberData?.backNumber || null,
    };

    // 업데이트할 필드 구성
    const updates: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (position !== undefined) {
      updates.position = position || null; // 빈 문자열은 null로 저장
    }
    if (backNumber !== undefined) {
      updates.backNumber = backNumber || null;
    }

    // 프로필 업데이트
    await targetMemberRef.update(updates);

    // users 문서도 동기화 (선택적)
    const userRef = getFirestore().collection('users').doc(targetUserId);
    const userSnap = await userRef.get();
    if (userSnap.exists) {
      const userUpdates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (position !== undefined) {
        userUpdates.position = position || null;
      }
      if (backNumber !== undefined) {
        userUpdates.backNumber = backNumber || null;
      }
      await userRef.update(userUpdates);
    }

    // Audit 기록
    const after = {
      position: position !== undefined ? (position || null) : before.position,
      backNumber: backNumber !== undefined ? (backNumber || null) : before.backNumber,
    };
    await writeAudit({
      clubId,
      actorUid: uid,
      action: 'MEMBER_PROFILE_UPDATE',
      targetType: 'member',
      targetId: targetUserId,
      before,
      after,
    });

    return { success: true, before, after };
  });
});

```

## File: functions/src/callables/notices.ts
```ts
import * as functions from 'firebase-functions';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMemberRole } from '../shared/auth';
import { reqString, optBoolean } from '../shared/validate';
import { writeAudit } from '../shared/audit';
import { withIdempotency } from '../shared/idempotency';
import { sendToClub } from '../shared/fcm';
import { postCol } from '../shared/paths';

/**
 * 공지 작성 및 푸시 발송 (callable)
 * 
 * ATOM-16: createNoticeWithPush
 * 
 * 권한: adminLike (PRESIDENT | DIRECTOR | ADMIN)
 * 멱등: withIdempotency
 * 
 * 로직:
 * 1. notice post 생성 (type="notice")
 * 2. sendToClub로 푸시 발송 (재시도 3회)
 * 3. post에 pushStatus:"SENT"|"FAILED", pushSentAt?, pushError? 기록
 * 4. audit: NOTICE_CREATE
 * 
 * 정책: 푸시 실패해도 게시글은 유지 (정책 고정)
 * 
 * REFACTOR: Standardized to Gen 1 to ensure compatibility with cloudfunctions.net URL pattern.
 */
export const createNoticeWithPush = functions
  .region('asia-northeast3')
  .https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const uid = context.auth.uid;

    const clubId = reqString(data?.clubId, 'clubId', 3, 64);
    const title = reqString(data?.title, 'title', 1, 200);
    const content = reqString(data?.content, 'content', 1, 5000);
    const pinned = optBoolean(data?.pinned, 'pinned') ?? false;
    const requestId = reqString(data?.requestId, 'requestId', 1, 128); // 필수 (멱등성용)

    // 2. Role Check (adminLike)
    // getMemberRole might throw V2 error, but we try to match wire format.
    // If it fails, catch and rethrow V1 error?
    // Let's assume Err helper works or just catch generic.
    try {
      const role = await getMemberRole(clubId, uid);
      if (!['PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN'].includes(role)) {
        throw new functions.https.HttpsError('permission-denied', 'Insufficient role');
      }
    } catch (e: any) {
      // If it is HttpsError (v2 or v1), rethrow.
      // Check code.
      if (e.code) throw e;
      throw new functions.https.HttpsError('internal', 'Role check failed', e.message);
    }

    // 멱등성 키 생성
    const idempotencyKey = `notice:${clubId}:${requestId}`;

    return withIdempotency(clubId, idempotencyKey, async () => {
      const db = getFirestore();

      // 1. 공지 게시글 생성
      const postData: any = {
        type: 'notice',
        title,
        content,
        authorId: uid,
        authorName: '',
        authorPhotoURL: null,
        pinned,
        pushStatus: 'PENDING',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      // 작성자 정보 조회
      const memberRef = db.collection('clubs').doc(clubId).collection('members').doc(uid);
      const memberSnap = await memberRef.get();
      if (memberSnap.exists) {
        const memberData = memberSnap.data();
        postData.authorName = memberData?.realName || '';
        postData.authorPhotoURL = memberData?.photoURL || null;
      }

      const postsCol = postCol(clubId);
      const newPostRef = postsCol.doc();
      await newPostRef.set(postData);

      const postId = newPostRef.id;

      // 2. 푸시 발송 (재시도 3회)
      let pushResult: { sent: number; failed: number; invalidTokens: string[] } | null = null;
      let pushError: string | null = null;
      const maxRetries = 3;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const fcmResult = await sendToClub(clubId, {
            title: `[공지] ${title}`,
            body: content.length > 100 ? content.substring(0, 100) + '...' : content,
            data: {
              type: 'notice',
              postId,
            },
          }, 'all');
          pushResult = {
            sent: fcmResult.sent,
            failed: fcmResult.failed,
            invalidTokens: fcmResult.invalidTokens || [],
          };

          if (pushResult && (pushResult.sent > 0 || attempt === maxRetries)) {
            break;
          }

          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error: any) {
          console.error(`푸시 발송 실패 (시도 ${attempt}/${maxRetries}):`, error);
          pushError = error.message || String(error);

          if (attempt === maxRetries) {
            break;
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 3. 푸시 상태 기록
      const pushStatus: 'SENT' | 'FAILED' = pushResult && pushResult.sent > 0 ? 'SENT' : 'FAILED';
      const updateData: any = {
        pushStatus,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (pushStatus === 'SENT') {
        updateData.pushSentAt = FieldValue.serverTimestamp();
      } else {
        updateData.pushError = pushError || '푸시 발송 실패';
      }

      await newPostRef.update(updateData);

      // 4. Audit 기록
      await writeAudit({
        clubId,
        actorUid: uid,
        action: 'NOTICE_CREATE',
        targetType: 'post',
        targetId: postId,
        meta: {
          title,
          pushStatus,
          pushSent: pushResult?.sent || 0,
          pushFailed: pushResult?.failed || 0,
        },
      });

      return {
        success: true,
        postId,
        pushStatus,
        pushResult: pushResult ? {
          sent: pushResult.sent,
          failed: pushResult.failed,
        } : null,
      };
    });
  });

```

## File: functions/src/callables/tokens.ts
```ts
import { onCall } from 'firebase-functions/v2/https';
import { requireAuth, requireMember } from '../shared/auth';
import { reqString, optString } from '../shared/validate';
import { upsertFcmToken } from '../shared/fcm';
import { writeAudit } from '../shared/audit';
import { withIdempotency } from '../shared/idempotency';
import { Err } from '../shared/errors';

/**
 * FCM 토큰 등록 (callable)
 * 
 * ATOM-12: FCM 토큰 등록
 * 
 * 권한: requireMember (isActiveMember)
 * 저장: clubs/{clubId}/members/{uid}/tokens/{tokenHash}
 * 
 * @example
 * await registerFcmToken({
 *   clubId: 'WINGS',
 *   token: 'fcm_token_string',
 *   platform: 'web',
 *   requestId: 'req-uuid-123'
 * });
 */
export const registerFcmToken = onCall({ region: 'asia-northeast3' }, async (req) => {
  const uid = requireAuth(req);
  const clubId = reqString(req.data?.clubId, 'clubId', 3, 64);
  const token = reqString(req.data?.token, 'token', 50, 500); // FCM 토큰은 일반적으로 150자 정도이지만 더 긴 경우도 있음
  const platform = optString(req.data?.platform, 'platform', 20) || 'web';
  const requestId = optString(req.data?.requestId, 'requestId', 128);

  // 플랫폼 검증
  const validPlatforms = ['web', 'ios', 'android'];
  if (!validPlatforms.includes(platform)) {
    throw Err.invalidArgument('Invalid platform', { platform, validPlatforms });
  }

  // 멤버 확인
  await requireMember(clubId, uid);

  // 멱등성 키 생성 (토큰 해시 기반으로 중복 방지)
  const idempotencyKey = requestId
    ? `fcm:${clubId}:${uid}:${requestId}`
    : `fcm:${clubId}:${uid}:${token.slice(0, 50)}`; // 토큰 앞부분으로 중복 방지

  return withIdempotency(clubId, idempotencyKey, async () => {
    // 토큰 저장 (upsert - 동일 토큰 재등록 시 문서 1개 유지)
    const { tokenId } = await upsertFcmToken(clubId, uid, token, platform);

    // Audit 기록 (선택적)
    await writeAudit({
      clubId,
      actorUid: uid,
      action: 'FCM_TOKEN_REGISTER',
      targetType: 'fcmToken',
      targetId: tokenId,
      meta: { platform, tokenLength: token.length },
    });

    return { success: true, tokenId, platform };
  });
});

```

## File: functions/src/index.ts
```ts
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

// Export callables
export * from './callables/members';
export * from './callables/notices';
export * from './callables/tokens';
export * from './callables/events'; // μATOM-0531: createEventPost
export * from './callables/comments.moderation'; // C03-04: Comment Moderation

// Export scheduled functions
// Export scheduled functions
// Export triggers
export * from './triggers/comments.commentCount'; // C03-05: Comment Count Trigger


```

## File: functions/src/scheduled/closeEventVotes.ts
```ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { sendToClub } from '../shared/fcm';
import { withIdempotency } from '../shared/idempotency';
import { postCol } from '../shared/paths';

/**
 * 이벤트 투표 마감 스케줄러
 * 
 * μATOM-0541: scheduled closeEventVotes 쿼리
 * μATOM-0542: voteClosed=true, voteClosedAt 기록(멱등)
 * μATOM-0543: 마감 푸시 발송(필수)
 * μATOM-0544: idempotency 키 적용
 * 
 * 실행 주기: 5분마다 (Cloud Scheduler)
 * 
 * 로직:
 * 1. voteCloseAt <= now && voteClosed==false인 게시글 조회
 * 2. 각 게시글에 대해:
 *    - 멱등성 키로 중복 실행 방지
 *    - voteClosed=true, voteClosedAt=now로 업데이트
 *    - 마감 푸시 발송 (필수)
 *    - attendanceSummary 집계
 */
export const closeEventVotes = onSchedule({
  schedule: 'every 5 minutes',
  timeZone: 'Asia/Seoul',
  region: 'asia-northeast3',
}, async (_event) => {
  const now = Timestamp.now();

  // μATOM-0541: scheduled closeEventVotes 쿼리
  // voteCloseAt <= now && voteClosed==false인 게시글 조회
  // 주의: 모든 클럽을 순회해야 함 (현재는 기본 클럽만 처리)
  const defaultClubId = 'default-club'; // TODO: 다중 클럽 지원 시 변경 필요

  const postsCol = postCol(defaultClubId);
  const query = postsCol
    .where('type', '==', 'event')
    .where('voteClosed', '==', false)
    .where('voteCloseAt', '<=', now);

  const snapshot = await query.get();

  if (snapshot.empty) {
    console.log('마감할 이벤트가 없습니다');
    return;
  }

  console.log(`마감할 이벤트 ${snapshot.size}개 발견`);

  const results = await Promise.allSettled(
    snapshot.docs.map(async (doc) => {
      const postId = doc.id;
      const postData = doc.data();

      // μATOM-0544: idempotency 키 적용
      const idempotencyKey = `closeEventVote:${defaultClubId}:${postId}`;

      return withIdempotency(defaultClubId, idempotencyKey, async () => {
        // μATOM-0542: voteClosed=true, voteClosedAt 기록(멱등)
        await doc.ref.update({
          voteClosed: true,
          voteClosedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // attendanceSummary 집계 (선택적, 클라이언트에서도 계산 가능)
        const attendancesSnap = await doc.ref.collection('attendance').get();
        let attending = 0;
        let absent = 0;
        let maybe = 0;

        attendancesSnap.forEach((attendanceDoc) => {
          const status = attendanceDoc.data().status;
          if (status === 'attending') attending++;
          else if (status === 'absent') absent++;
          else if (status === 'maybe') maybe++;
        });

        await doc.ref.update({
          attendanceSummary: {
            attending,
            absent,
            maybe,
          },
        });

        // μATOM-0543: 마감 푸시 발송(필수)
        try {
          const pushResult = await sendToClub(
            defaultClubId,
            {
              title: `[일정 마감] ${postData.title}`,
              body: '출석 투표가 마감되었습니다. 결과를 확인해보세요.',
              data: {
                type: 'event',
                postId,
                eventType: 'vote_closed',
              },
            },
            'all'
          );

          console.log(`이벤트 ${postId} 마감 처리 완료. 푸시 발송: ${pushResult.sent}건 성공, ${pushResult.failed}건 실패`);
        } catch (error: any) {
          console.error(`이벤트 ${postId} 마감 푸시 발송 실패:`, error);
          // 푸시 실패해도 마감 처리 itself는 완료 (정책 고정)
        }

        return { postId, success: true };
      });
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`마감 처리 완료: ${successful}건 성공, ${failed}건 실패`);
});

```

## File: functions/src/shared/audit.ts
```ts
import { FieldValue } from 'firebase-admin/firestore';
import { auditCol } from './paths';

/**
 * Audit 기록 파이프라인
 * 
 * PRD v1.0 Section 11.2/11.3, 13.4 기준
 * 고권한 변경(역할/권한/공지푸시/마감/기록원/LOCK/회계승인)은 audit 기록 필수
 */

/**
 * Audit Action 네이밍 규칙
 * 
 * - MEMBER_ROLE_CHANGE: 멤버 역할 변경
 * - MEMBER_STATUS_CHANGE: 멤버 상태 변경 (pending → active 등)
 * - MEMBER_PROFILE_UPDATE: 관리자가 멤버 프로필 수정
 * - NOTICE_CREATE: 공지 생성
 * - NOTICE_UPDATE: 공지 수정
 * - NOTICE_DELETE: 공지 삭제
 * - EVENT_CLOSE: 출석 투표 마감
 */
export type AuditAction =
  | 'MEMBER_ROLE_CHANGE'
  | 'MEMBER_STATUS_CHANGE'
  | 'MEMBER_PROFILE_UPDATE'
  | 'NOTICE_CREATE'
  | 'NOTICE_UPDATE'
  | 'NOTICE_DELETE'
  | 'EVENT_CLOSE'
  | 'FCM_TOKEN_REGISTER'
  | 'FCM_TOKEN_DELETE'
  | 'COMMENT_EDIT'
  | 'COMMENT_DELETE';

export interface AuditParams {
  clubId: string;
  actorUid: string;
  action: string | AuditAction;
  targetType: string;
  targetId?: string;
  before?: unknown;
  after?: unknown;
  meta?: unknown;
}

/**
 * 대용량 데이터를 요약하여 반환 (최대 크기 제한)
 */
function summarizeData(data: unknown, maxSize = 10000): unknown {
  if (data == null) return null;
  const str = JSON.stringify(data);
  if (str.length <= maxSize) return data;
  // 요약: 타입과 키만 포함
  if (typeof data === 'object' && !Array.isArray(data)) {
    return {
      _summary: true,
      _type: 'object',
      _keys: Object.keys(data),
      _size: str.length,
    };
  }
  if (Array.isArray(data)) {
    return {
      _summary: true,
      _type: 'array',
      _length: data.length,
      _size: str.length,
    };
  }
  return {
    _summary: true,
    _type: typeof data,
    _size: str.length,
  };
}

/**
 * Audit 기록 작성
 * 
 * 고권한 변경 시 호출 필수 (PRD v1.0 Section 11.2)
 * 
 * @example
 * // 멤버 상태 변경 (승인)
 * await writeAudit({
 *   clubId: 'WINGS',
 *   actorUid: 'admin123',
 *   action: 'MEMBER_STATUS_CHANGE',
 *   targetType: 'member',
 *   targetId: 'user789',
 *   before: { status: 'pending' },
 *   after: { status: 'active' },
 * });
 * 
 * @example
 * // 공지 생성
 * await writeAudit({
 *   clubId: 'WINGS',
 *   actorUid: 'admin456',
 *   action: 'NOTICE_CREATE',
 *   targetType: 'post',
 *   targetId: postId,
 *   meta: { pushStatus: 'SENT' },
 * });
 * 
 * @example
 * // 경기 기록 마감
 * await writeAudit({
 *   clubId: 'WINGS',
 *   actorUid: 'admin789',
 *   action: 'GAME_LOCK_RECORDING',
 *   targetType: 'post',
 *   targetId: gamePostId,
 *   before: { recordingLocked: false },
 *   after: { recordingLocked: true },
 * });
 */
export async function writeAudit(params: AuditParams): Promise<void> {
  const { clubId, actorUid, action, targetType, targetId, before, after, meta } = params;

  // 대용량 데이터 요약 (성능 최적화)
  const beforeSummary = summarizeData(before);
  const afterSummary = summarizeData(after);

  await auditCol(clubId).add({
    clubId, // 컬렉션 경로에 포함되어 있지만 조회 편의를 위해 중복 저장
    actorUid,
    action: String(action),
    targetType,
    targetId: targetId ?? null,
    before: beforeSummary,
    after: afterSummary,
    meta: meta ?? null,
    createdAt: FieldValue.serverTimestamp(),
  });
}


```

## File: functions/src/shared/auth.ts
```ts
import { CallableRequest } from 'firebase-functions/v2/https';
import { memberRef } from './paths';
import { Err } from './errors';

export type Role = 'PRESIDENT' | 'DIRECTOR' | 'TREASURER' | 'ADMIN' | 'MEMBER';

export function requireAuth(req: CallableRequest): string {
  if (!req.auth?.uid) throw Err.unauthenticated();
  return req.auth.uid;
}

export async function getMemberRole(clubId: string, uid: string): Promise<Role> {
  const snap = await memberRef(clubId, uid).get();
  if (!snap.exists) throw Err.permissionDenied('Not a club member');
  const r = snap.data()?.role as Role | undefined;
  if (!r) throw Err.internal('Member role missing');
  return r;
}

export async function requireRole(clubId: string, uid: string, roles: Role[]): Promise<Role> {
  const r = await getMemberRole(clubId, uid);
  if (!roles.includes(r)) {
    throw Err.permissionDenied('Insufficient role', { required: roles, actual: r });
  }
  return r;
}

export function isAdminLike(r: Role): boolean {
  return r === 'PRESIDENT' || r === 'DIRECTOR' || r === 'ADMIN';
}

export function isTreasury(r: Role): boolean {
  return r === 'PRESIDENT' || r === 'TREASURER';
}

/**
 * 멤버인지 확인 (권한 체크 없이 멤버 존재만 확인)
 * 
 * @param clubId 클럽 ID
 * @param uid 사용자 UID
 * @throws permission-denied if not a member
 */
export async function requireMember(clubId: string, uid: string): Promise<void> {
  const snap = await memberRef(clubId, uid).get();
  if (!snap.exists) {
    throw Err.permissionDenied('Not a club member');
  }
}


```

## File: functions/src/shared/errors.ts
```ts
import { HttpsError } from 'firebase-functions/v2/https';

/**
 * 공통 에러 헬퍼 (PRD v1.0 Section 13.3 에러/응답 규격 준수)
 * 
 * 모든 callable 함수에서 사용하는 표준화된 에러 생성 유틸리티
 * 에러 코드 매핑:
 * - unauthenticated: 로그인 필요
 * - permission-denied: 권한 부족
 * - invalid-argument: 입력값 오류
 * - failed-precondition: 상태 충돌 (LOCK 후 수정 등)
 * - not-found: 대상 문서 없음
 * - already-exists: 중복 (이미 멤버, 이미 사용된 초대 등)
 * - internal: 서버 오류
 * 
 * @example
 * // 인증 오류
 * throw Err.unauthenticated('로그인이 필요합니다');
 * 
 * // 권한 오류
 * throw Err.permissionDenied('관리자만 접근 가능합니다', { requiredRole: 'ADMIN' });
 * 
 * // 입력값 오류
 * throw Err.invalidArgument('clubId는 필수입니다');
 * 
 * // 상태 충돌
 * throw Err.failedPrecondition('이미 마감된 경기입니다', { recordingLocked: true });
 * 
 * // 문서 없음
 * throw Err.notFound('게시글을 찾을 수 없습니다', { postId: 'xyz' });
 * 
 * // 중복
 * throw Err.alreadyExists('이미 사용된 초대 코드입니다');
 * 
 * // 서버 오류
 * throw Err.internal('데이터베이스 오류가 발생했습니다', { error: err });
 */
export const Err = {
  unauthenticated(msg = 'Authentication required'): HttpsError {
    return new HttpsError('unauthenticated', msg);
  },

  permissionDenied(msg = 'Permission denied', details?: unknown): HttpsError {
    return new HttpsError('permission-denied', msg, details);
  },

  invalidArgument(msg = 'Invalid argument', details?: unknown): HttpsError {
    return new HttpsError('invalid-argument', msg, details);
  },

  failedPrecondition(msg = 'Failed precondition', details?: unknown): HttpsError {
    return new HttpsError('failed-precondition', msg, details);
  },

  notFound(msg = 'Not found', details?: unknown): HttpsError {
    return new HttpsError('not-found', msg, details);
  },

  alreadyExists(msg = 'Already exists', details?: unknown): HttpsError {
    return new HttpsError('already-exists', msg, details);
  },

  internal(msg = 'Internal error', details?: unknown): HttpsError {
    return new HttpsError('internal', msg, details);
  },
};


```

## File: functions/src/shared/fcm.ts
```ts
import { createHash } from 'crypto';
import { getMessaging } from 'firebase-admin/messaging';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { memberTokensCol } from './paths';

/**
 * FCM 토큰 저장 + 발송 유틸리티
 * 
 * PRD v1.0 Section 13.4: 토큰 저장 구조
 * - 저장 위치: clubs/{clubId}/members/{uid}/tokens/{tokenId}
 * - collectionGroup을 사용하여 전체 클럽 토큰 조회 가능
 */

export interface FCMTokenData {
  token: string;
  platform: string; // 'web' | 'ios' | 'android'
  updatedAt: FirebaseFirestore.Timestamp;
  failureCount?: number; // 실패 카운트 (선택적)
}

export interface FCMSendResult {
  sent: number;
  failed: number;
  invalidTokens: string[]; // 무효한 토큰 목록
}

/**
 * FCM 토큰 저장/업데이트
 * 
 * PRD v1.0 Section 13.4: clubs/{clubId}/members/{uid}/tokens/{tokenId}
 * 
 * @param clubId 클럽 ID
 * @param uid 사용자 UID
 * @param token FCM 토큰
 * @param platform 플랫폼 ('web' | 'ios' | 'android')
 * @returns 토큰 문서 ID (해시)
 * 
 * @example
 * await upsertFcmToken('WINGS', 'user123', 'fcm_token_string', 'web');
 */
export async function upsertFcmToken(
  clubId: string,
  uid: string,
  token: string,
  platform: string
): Promise<{ tokenId: string }> {
  // 토큰을 해시하여 문서 ID로 사용
  const tokenHash = createHash('sha256').update(token).digest('hex').slice(0, 64);
  const tokenRef = memberTokensCol(clubId, uid).doc(tokenHash);

  await tokenRef.set(
    {
      token,
      platform,
      updatedAt: FieldValue.serverTimestamp(),
      failureCount: 0, // 초기화
    },
    { merge: true }
  );

  return { tokenId: tokenHash };
}

/**
 * 사용자의 모든 토큰 삭제
 * 
 * @param clubId 클럽 ID
 * @param uid 사용자 UID
 */
export async function deleteUserTokens(clubId: string, uid: string): Promise<void> {
  const tokensCol = memberTokensCol(clubId, uid);
  const snap = await tokensCol.get();
  const batch = getFirestore().batch();

  snap.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

/**
 * 무효한 토큰 삭제
 * 
 * @param clubId 클럽 ID
 * @param uid 사용자 UID
 * @param invalidTokenIds 삭제할 토큰 ID 목록
 */
export async function deleteInvalidTokens(
  clubId: string,
  uid: string,
  invalidTokenIds: string[]
): Promise<void> {
  if (invalidTokenIds.length === 0) return;

  const batch = getFirestore().batch();
  invalidTokenIds.forEach((tokenId) => {
    const tokenRef = memberTokensCol(clubId, uid).doc(tokenId);
    batch.delete(tokenRef);
  });

  await batch.commit();
}

/**
 * 클럽의 모든 활성 멤버의 토큰 조회
 * 
 * collectionGroup 쿼리 사용: clubs/{clubId}/members/{uid}/tokens
 * 
 * @param clubId 클럽 ID
 * @returns 모든 토큰 목록
 */
export async function getAllTokens(clubId: string): Promise<string[]> {
  const db = getFirestore();

  // collectionGroup을 사용하여 모든 members/{uid}/tokens 조회
  // 단, 현재 Firestore는 collectionGroup에 대한 필터링이 제한적이므로
  // 모든 members를 순회하는 방식 사용 (성능 고려 필요)

  // 방법 1: members 컬렉션을 순회하며 각 멤버의 tokens 조회
  const membersRef = db.collection('clubs').doc(clubId).collection('members');
  const membersSnap = await membersRef.get();

  const tokens: string[] = [];

  for (const memberDoc of membersSnap.docs) {
    const uid = memberDoc.id;
    const tokensSnap = await memberTokensCol(clubId, uid).get();
    tokensSnap.forEach((tokenDoc) => {
      const data = tokenDoc.data() as FCMTokenData | undefined;
      if (data?.token && typeof data.token === 'string' && data.token.length > 0) {
        tokens.push(data.token);
      }
    });
  }

  return tokens;
}

/**
 * 특정 사용자들의 토큰 조회
 * 
 * @param clubId 클럽 ID
 * @param uids 사용자 UID 목록
 * @returns 토큰 목록
 */
export async function getTokensForUids(clubId: string, uids: string[]): Promise<string[]> {
  if (uids.length === 0) return [];

  const tokens: string[] = [];

  for (const uid of uids) {
    const tokensSnap = await memberTokensCol(clubId, uid).get();
    tokensSnap.forEach((tokenDoc) => {
      const data = tokenDoc.data() as FCMTokenData | undefined;
      if (data?.token && typeof data.token === 'string' && data.token.length > 0) {
        tokens.push(data.token);
      }
    });
  }

  return tokens;
}

/**
 * 관리자 역할인 멤버들의 UID 조회
 * 
 * @param clubId 클럽 ID
 * @returns 관리자 UID 목록
 */
async function getAdminUids(clubId: string): Promise<string[]> {
  const db = getFirestore();
  const membersRef = db.collection('clubs').doc(clubId).collection('members');
  const membersSnap = await membersRef
    .where('role', 'in', ['PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN'])
    .get();

  return membersSnap.docs.map((doc) => doc.id);
}

export const __test__ = { getAdminUids };


/**
 * 배열을 청크로 분할
 */
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/**
 * FCM 메시지 발송 (토큰 목록)
 * 
 * @param tokens FCM 토큰 목록
 * @param payload 알림 페이로드
 * @returns 발송 결과
 */
export async function sendToTokens(
  tokens: string[],
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<FCMSendResult> {
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, invalidTokens: [] };
  }

  const msg = getMessaging();
  const batches = chunk(tokens, 500); // FCM multicast limit is 500
  let sent = 0;
  let failed = 0;
  const invalidTokens: string[] = [];

  for (const batchTokens of batches) {
    const res = await msg.sendEachForMulticast({
      tokens: batchTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data ?? {},
    });

    sent += res.successCount;
    failed += res.failureCount;

    // 실패한 토큰 추적
    res.responses.forEach((response, index) => {
      if (!response.success) {
        const token = batchTokens[index];
        // 무효한 토큰 오류 코드 (registration-token-not-registered 등)
        if (
          response.error?.code === 'messaging/registration-token-not-registered' ||
          response.error?.code === 'messaging/invalid-registration-token'
        ) {
          invalidTokens.push(token);
        }
      }
    });
  }

  return { sent, failed, invalidTokens };
}

/**
 * 클럽 전체 또는 필터링된 대상에게 FCM 발송
 * 
 * PRD v1.0 Section 13.4: sendToClub(clubId, payload, filter?)
 * 
 * @param clubId 클럽 ID
 * @param payload 알림 페이로드
 * @param filter 필터 옵션
 *   - 'all': 전체 멤버 (기본값)
 *   - 'admins': 관리자만 (PRESIDENT, DIRECTOR, ADMIN)
 *   - string[]: 특정 UID 목록
 * @returns 발송 결과
 * 
 * @example
 * // 전체 멤버에게 공지 푸시
 * await sendToClub('WINGS', {
 *   title: '새 공지사항',
 *   body: '중요한 공지가 등록되었습니다.',
 *   data: { postId: 'xyz', type: 'notice' },
 * });
 * 
 * @example
 * // 관리자에게만 발송
 * await sendToClub('WINGS', {
 *   title: '출석 투표 마감',
 *   body: '오늘 일정의 출석 투표가 마감되었습니다.',
 * }, 'admins');
 * 
 * @example
 * // 특정 사용자들에게만 발송
 * await sendToClub('WINGS', {
 *   title: '리마인더',
 *   body: '내일 일정을 확인하세요.',
 * }, ['user123', 'user456']);
 */
export async function sendToClub(
  clubId: string,
  payload: { title: string; body: string; data?: Record<string, string> },
  filter: 'all' | 'admins' | string[] = 'all'
): Promise<FCMSendResult> {
  let tokens: string[];

  if (filter === 'all') {
    tokens = await getAllTokens(clubId);
  } else if (filter === 'admins') {
    const adminUids = await getAdminUids(clubId);
    tokens = await getTokensForUids(clubId, adminUids);
  } else {
    // 특정 UID 목록
    tokens = await getTokensForUids(clubId, filter);
  }

  return sendToTokens(tokens, payload);
}


```

## File: functions/src/shared/idempotency.ts
```ts
import { createHash } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { idemCol } from './paths';
import { Err } from './errors';

/**
 * 멱등성 처리 (PRD v1.0 Section 13.2)
 * 
 * 동일한 requestId로 재호출 시 "중복 생성" 방지
 * 저장 위치: clubs/{clubId}/idempotency/{keyHash}
 */

/**
 * 키를 해시하여 안전한 문서 ID로 변환
 */
function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex').slice(0, 64);
}

/**
 * 멱등성 래퍼 함수
 * 
 * 동일한 key로 이미 처리된 요청이면 이전 결과를 반환
 * key가 길 수 있으므로 해시 처리하여 문서 ID로 사용
 * 
 * 상태:
 * - RUNNING: 처리 중 (다른 요청은 에러 발생)
 * - DONE: 처리 완료 (결과 반환)
 * - FAILED: 처리 실패 (에러 재발생)
 * 
 * @param clubId 클럽 ID
 * @param key 멱등성 키 (일반적으로 requestId 또는 클라이언트에서 전달한 UUID)
 * @param handler 실제 실행할 함수
 * @returns handler 실행 결과
 * 
 * @example
 * // 공지 생성 (requestId로 중복 방지)
 * const result = await withIdempotency(
 *   clubId,
 *   data.requestId,
 *   async () => {
 *     const postRef = await postCol(clubId).add({ ... });
 *     await sendPushNotification(...);
 *     return { postId: postRef.id };
 *   }
 * );
 * 
 * @example
 * // 멤버 역할 변경
 * const result = await withIdempotency(
 *   clubId,
 *   `role_change_${targetUid}_${requestId}`,
 *   async () => {
 *     await memberRef(clubId, targetUid).update({ role: newRole });
 *     return { success: true };
 *   }
 * );
 * 
 * @example
 * // 경기 기록 마감
 * const result = await withIdempotency(
 *   clubId,
 *   `lock_game_${postId}_${uid}`,
 *   async () => {
 *     await postRef(clubId, postId).update({ recordingLocked: true });
 *     await writeAudit({ ... });
 *     return { success: true };
 *   }
 * );
 */
export async function withIdempotency<T>(
  clubId: string,
  key: string,
  handler: () => Promise<T>
): Promise<T> {
  // 키를 해시하여 문서 ID로 사용 (길이 제한 및 안전성)
  const keyHash = hashKey(key);
  const ref = idemCol(clubId).doc(keyHash);

  // 이미 처리된 요청인지 확인
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data();
    if (data?.status === 'DONE' && data.result !== undefined) {
      // 이미 완료된 요청: 저장된 결과 반환
      return data.result as T;
    }
    // 처리 중인 요청: 중복 호출 차단
    if (data?.status === 'RUNNING') {
      throw Err.internal('Request is already being processed');
    }
    // 실패한 요청: 새로 실행하지 않고 에러 재발생 (선택적)
    // 또는 새로 실행하도록 주석 처리된 로직 사용 가능
  }

  // 원자적으로 문서 생성 시도 (트랜잭션 대신 create 사용)
  try {
    await ref.create({
      key, // 원본 키 저장 (디버깅용)
      createdAt: FieldValue.serverTimestamp(),
      status: 'RUNNING',
    });
  } catch (error: any) {
    // 문서가 이미 존재 (레이스 컨디션)
    const snap2 = await ref.get();
    if (snap2.exists) {
      const data2 = snap2.data();
      if (data2?.status === 'DONE' && data2.result !== undefined) {
        return data2.result as T;
      }
      // 다른 요청이 먼저 실행 중
      throw Err.internal('Idempotency lock failed');
    }
    throw error;
  }

  // 핸들러 실행
  try {
    const result = await handler();
    // 성공: 결과 저장
    await ref.set(
      {
        result,
        status: 'DONE',
        finishedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return result;
  } catch (error) {
    // 실패: 상태만 기록 (에러는 재발생)
    await ref.set(
      {
        status: 'FAILED',
        finishedAt: FieldValue.serverTimestamp(),
        error: String(error),
      },
      { merge: true }
    );
    throw error;
  }
}


```

## File: functions/src/shared/paths.ts
```ts
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Firestore 경로 헬퍼 (PRD v1.0 Section 4.1 컬렉션 구조 기준)
 * 
 * 컬렉션 경로를 코드 상수로 통일하여 오타/분기 방지
 */

export const db = getFirestore();

/**
 * 클럽 문서 참조
 * 
 * @example
 * const clubDoc = clubRef('WINGS');
 */
export function clubRef(clubId: string) {
  return db.collection('clubs').doc(clubId);
}

/**
 * 멤버 문서 참조 (clubs/{clubId}/members/{uid})
 * 
 * @example
 * const memberDoc = memberRef('WINGS', 'user123');
 */
export function memberRef(clubId: string, uid: string) {
  return clubRef(clubId).collection('members').doc(uid);
}

/**
 * 멤버 FCM 토큰 문서 참조 (clubs/{clubId}/members/{uid}/tokens/{tokenId})
 * 
 * PRD v1.0 Section 13.4: 토큰 저장 구조
 * 
 * @example
 * const tokenDoc = memberTokenRef('WINGS', 'user123', 'token456');
 */
export function memberTokenRef(clubId: string, uid: string, tokenId: string) {
  return memberRef(clubId, uid).collection('tokens').doc(tokenId);
}

/**
 * 멤버 FCM 토큰 컬렉션 참조 (clubs/{clubId}/members/{uid}/tokens)
 * 
 * PRD v1.0 Section 13.4: 토큰 저장 구조
 * 
 * @example
 * const tokensCol = memberTokensCol('WINGS', 'user123');
 */
export function memberTokensCol(clubId: string, uid: string) {
  return memberRef(clubId, uid).collection('tokens');
}

/**
 * 게시글 문서 참조 (clubs/{clubId}/posts/{postId})
 * 
 * @example
 * const postDoc = postRef('WINGS', 'post456');
 */
export function postRef(clubId: string, postId: string) {
  return clubRef(clubId).collection('posts').doc(postId);
}

/**
 * 게시글 컬렉션 참조 (clubs/{clubId}/posts)
 * 
 * @example
 * const postsCol = postCol('WINGS');
 */
export function postCol(clubId: string) {
  return clubRef(clubId).collection('posts');
}

/**
 * 댓글 문서 참조 (clubs/{clubId}/posts/{postId}/comments/{commentId})
 * 
 * @example
 * const commentDoc = commentRef('WINGS', 'post456', 'comment789');
 */
export function commentRef(clubId: string, postId: string, commentId: string) {
  return postRef(clubId, postId).collection('comments').doc(commentId);
}

/**
 * 댓글 컬렉션 참조 (clubs/{clubId}/posts/{postId}/comments)
 * 
 * @example
 * const commentsCol = commentCol('WINGS', 'post456');
 */
export function commentCol(clubId: string, postId: string) {
  return postRef(clubId, postId).collection('comments');
}

/**
 * 출석 문서 참조 (clubs/{clubId}/posts/{postId}/attendance/{userId})
 * 
 * @example
 * const attendanceDoc = attendanceRef('WINGS', 'post456', 'user123');
 */
export function attendanceRef(clubId: string, postId: string, userId: string) {
  return postRef(clubId, postId).collection('attendance').doc(userId);
}

/**
 * 출석 컬렉션 참조 (clubs/{clubId}/posts/{postId}/attendance)
 * 
 * @example
 * const attendanceCol = attendanceCol('WINGS', 'post456');
 */
export function attendanceCol(clubId: string, postId: string) {
  return postRef(clubId, postId).collection('attendance');
}

/**
 * 감사 로그 컬렉션 참조 (clubs/{clubId}/audit)
 * 
 * @example
 * const auditCol = auditCol('WINGS');
 */
export function auditCol(clubId: string) {
  return clubRef(clubId).collection('audit');
}

/**
 * FCM 토큰 컬렉션 참조 (clubs/{clubId}/fcmTokens)
 * 
 * @example
 * const fcmTokensCol = fcmTokenCol('WINGS');
 */
export function fcmTokenCol(clubId: string) {
  return clubRef(clubId).collection('fcmTokens');
}

/**
 * 멱등성 컬렉션 참조 (clubs/{clubId}/idempotency)
 * 
 * @example
 * const idemCol = idemCol('WINGS');
 */
export function idemCol(clubId: string) {
  return clubRef(clubId).collection('idempotency');
}

/**
 * 전역 사용자 문서 참조 (users/{uid})
 * 
 * @example
 * const userDoc = userRef('user123');
 */
export function userRef(uid: string) {
  return db.collection('users').doc(uid);
}



/**
 * 알림 문서 참조 (notifications/{notificationId})
 * 
 * @example
 * const notificationDoc = notificationRef('notif123');
 */
export function notificationRef(notificationId: string) {
  return db.collection('notifications').doc(notificationId);
}

/**
 * 알림 컬렉션 참조 (notifications)
 * 
 * @example
 * const notificationsCol = notificationCol();
 */
export function notificationCol() {
  return db.collection('notifications');
}


```

## File: functions/src/shared/time.ts
```ts
/**
 * 시간 계산 유틸리티
 * 
 * PRD v1.0 정책: 출석 투표 마감은 "시작일 전날 21:00" (KST 기준)
 */

/**
 * 투표 마감 시간 계산 (KST 기준: 시작일 전날 21:00)
 * 
 * 정책: 일정 시작일 전날 21:00 KST에 출석 투표 마감
 * 
 * @param startAtMillis 시작일 타임스탬프 (밀리초, UTC)
 * @returns voteCloseAt 타임스탬프 (밀리초, UTC)
 * 
 * @example
 * const startAt = Date.parse('2025-12-20T10:00:00+09:00'); // 2025년 12월 20일 10:00 KST
 * const voteCloseAt = computeVoteCloseAtKST(startAt);
 * // 결과: 2025년 12월 19일 21:00 KST (UTC로 변환된 타임스탬프)
 */
export function computeVoteCloseAtKST(startAtMillis: number): number {
  // 정책: 시작일 전날 21:00 (KST 고정)
  // 
  // 로직:
  // 1. UTC 타임스탬프를 KST로 변환하여 날짜 추출
  // 2. 시작일의 전날을 계산 (KST 기준)
  // 3. 전날 21:00 KST를 UTC 타임스탬프로 변환하여 반환
  //
  // KST = UTC + 9시간
  // KST 00:00 = UTC 15:00 (전날)
  // KST 21:00 = UTC 12:00 (같은 날)

  const start = new Date(startAtMillis);

  // KST 시간으로 변환 (UTC + 9시간)
  const kstTime = start.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstTime);

  // KST 기준 연도/월/일 추출
  const kstYear = kstDate.getUTCFullYear();
  const kstMonth = kstDate.getUTCMonth();
  const kstDay = kstDate.getUTCDate();

  // 전날 계산 (KST 기준)
  const prevDayKST = new Date(Date.UTC(kstYear, kstMonth, kstDay - 1, 21, 0, 0, 0));

  // UTC로 변환 (KST - 9시간)
  return prevDayKST.getTime() - 9 * 60 * 60 * 1000;
}


```

## File: functions/src/shared/validate.ts
```ts
import { Err } from './errors';

/**
 * 입력 검증 유틸리티
 * 
 * 모든 callable 함수의 입력값 검증에 사용
 */

/**
 * 필수 문자열 검증
 * 
 * @example
 * const title = reqString(data.title, 'title', 2, 100);
 */
export function reqString(v: unknown, field: string, min = 1, max = 2000): string {
  if (typeof v !== 'string') throw Err.invalidArgument(`${field} must be a string`);
  const s = v.trim();
  if (s.length < min) throw Err.invalidArgument(`${field} is required (min ${min} chars)`);
  if (s.length > max) throw Err.invalidArgument(`${field} is too long (max ${max} chars)`);
  return s;
}

/**
 * 선택 문자열 검증 (null/undefined 허용)
 * 
 * @example
 * const nickname = optString(data.nickname, 'nickname', 30);
 */
export function optString(v: unknown, field: string, max = 2000): string | undefined {
  if (v == null) return undefined;
  if (typeof v !== 'string') throw Err.invalidArgument(`${field} must be a string`);
  const s = v.trim();
  if (!s) return undefined;
  if (s.length > max) throw Err.invalidArgument(`${field} is too long (max ${max} chars)`);
  return s;
}

/**
 * 필수 배열 검증
 * 
 * @example
 * const recorderIds = reqArray<string>(data.recorderUserIds, 'recorderUserIds', 10);
 */
export function reqArray<T>(v: unknown, field: string, maxLen = 50): T[] {
  if (!Array.isArray(v)) throw Err.invalidArgument(`${field} must be an array`);
  if (v.length > maxLen) throw Err.invalidArgument(`${field} too many items (max ${maxLen})`);
  return v as T[];
}

/**
 * 필수 숫자 검증
 * 
 * @example
 * const amount = reqNumber(data.amount, 'amount', 0, 1000000000);
 */
export function reqNumber(v: unknown, field: string, min?: number, max?: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) {
    throw Err.invalidArgument(`${field} must be a number`);
  }
  if (min !== undefined && v < min) {
    throw Err.invalidArgument(`${field} must be >= ${min}`);
  }
  if (max !== undefined && v > max) {
    throw Err.invalidArgument(`${field} must be <= ${max}`);
  }
  return v;
}

/**
 * 선택 숫자 검증 (null/undefined 허용)
 * 
 * @example
 * const maxUses = optNumber(data.maxUses, 'maxUses', 1, 9999);
 */
export function optNumber(v: unknown, field: string, min?: number, max?: number): number | undefined {
  if (v == null) return undefined;
  return reqNumber(v, field, min, max);
}

/**
 * 필수 불리언 검증
 * 
 * @example
 * const pinned = reqBoolean(data.pinned, 'pinned');
 */
export function reqBoolean(v: unknown, field: string): boolean {
  if (typeof v !== 'boolean') throw Err.invalidArgument(`${field} must be a boolean`);
  return v;
}

/**
 * 선택 불리언 검증 (null/undefined 허용, 기본값 반환)
 * 
 * @example
 * const anonymous = optBoolean(data.anonymous, 'anonymous', false);
 */
export function optBoolean(v: unknown, field: string, defaultValue = false): boolean {
  if (v == null) return defaultValue;
  if (typeof v !== 'boolean') throw Err.invalidArgument(`${field} must be a boolean`);
  return v;
}

/**
 * 타임스탬프(밀리초) 검증 및 정규화
 * 
 * @example
 * const startAtMillis = reqTimestamp(data.startAtMillis, 'startAtMillis');
 */
export function reqTimestamp(v: unknown, field: string): number {
  const num = reqNumber(v, field, 0);
  // 타임스탬프는 일반적으로 1970-01-01 이후의 값 (음수 불가)
  // 2100년 이후의 미래 타임스탬프도 제한하지 않음 (유효성 범위는 호출자가 결정)
  return Math.floor(num); // 소수점 제거
}

/**
 * 선택 타임스탬프(밀리초) 검증
 * 
 * @example
 * const expiresAt = optTimestamp(data.expiresAt, 'expiresAt');
 */
export function optTimestamp(v: unknown, field: string): number | undefined {
  if (v == null) return undefined;
  return reqTimestamp(v, field);
}

/**
 * 날짜 문자열 검증 (ISO 8601 형식 또는 타임스탬프)
 * Date 객체로 변환하여 반환
 * 
 * @example
 * const startDate = reqDate(data.startDate, 'startDate');
 */
export function reqDate(v: unknown, field: string): Date {
  if (v instanceof Date) {
    if (isNaN(v.getTime())) throw Err.invalidArgument(`${field} is not a valid date`);
    return v;
  }
  if (typeof v === 'string') {
    const date = new Date(v);
    if (isNaN(date.getTime())) throw Err.invalidArgument(`${field} is not a valid date string`);
    return date;
  }
  if (typeof v === 'number') {
    const date = new Date(reqTimestamp(v, field));
    if (isNaN(date.getTime())) throw Err.invalidArgument(`${field} is not a valid timestamp`);
    return date;
  }
  throw Err.invalidArgument(`${field} must be a Date, timestamp (number), or date string`);
}

/**
 * 선택 날짜 검증
 * 
 * @example
 * const expiresAt = optDate(data.expiresAt, 'expiresAt');
 */
export function optDate(v: unknown, field: string): Date | undefined {
  if (v == null) return undefined;
  return reqDate(v, field);
}


```

## File: functions/src/triggers/comments.commentCount.ts
```ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * [C03-05] Comment Count Trigger
 * 
 * Maintains `commentCount` on the parent Post document.
 * - onCreate: +1
 * - onDelete: -1 (min 0)
 * Uses transaction to ensure concurrency safety.
 */
export const onCommentCreate = functions.firestore
    .document('clubs/{clubId}/posts/{postId}/comments/{commentId}')
    .onCreate(async (_snap, context) => {
        const { clubId, postId } = context.params;
        const postRef = db.doc(`clubs/${clubId}/posts/${postId}`);

        return db.runTransaction(async (t) => {
            const postSnap = await t.get(postRef);
            if (!postSnap.exists) {
                console.log(`[commentCount] Post ${postId} does not exist. Skipping decrement.`);
                return;
            }
            const currentCount = postSnap.data()?.commentCount || 0;
            t.update(postRef, { commentCount: currentCount + 1 });
        });
    });

export const onCommentDelete = functions.firestore
    .document('clubs/{clubId}/posts/{postId}/comments/{commentId}')
    .onDelete(async (_snap, context) => {
        const { clubId, postId } = context.params;
        const postRef = db.doc(`clubs/${clubId}/posts/${postId}`);

        return db.runTransaction(async (t) => {
            const postSnap = await t.get(postRef);
            if (!postSnap.exists) {
                console.log(`[commentCount] Post ${postId} does not exist. Skipping decrement.`);
                return;
            }
            const currentCount = postSnap.data()?.commentCount || 0;
            const newCount = Math.max(0, currentCount - 1);
            t.update(postRef, { commentCount: newCount });
        });
    });

```

## File: functions/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "outDir": "lib",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "forceConsistentCasingInFileNames": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}


```

