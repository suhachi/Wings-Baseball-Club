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
import {
  UserDoc,
  PostDoc,
  CommentDoc,
  InviteCodeDoc,
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
    // Standardizing on ROOT 'inviteCodes' collection to match auth.service.ts
    const inviteRef = doc(db, 'inviteCodes', codeData.code); // Use code as ID
    await setDoc(inviteRef, {
      ...codeData,
      clubId, // Save clubId to know which club this invite belongs to
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
export async function getInviteCodes(clubId: string): Promise<InviteCodeDoc[]> {
  try {
    const invitesRef = collection(db, 'inviteCodes');
    // Filter by clubId
    const q = query(invitesRef, where('clubId', '==', clubId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: (doc.data().createdAt as Timestamp)?.toDate(),
      expiresAt: (doc.data().expiresAt as Timestamp)?.toDate(),
      usedAt: (doc.data().usedAt as Timestamp)?.toDate(),
    })) as unknown as InviteCodeDoc[];
  } catch (error) {
    console.error('Error getting invite codes:', error);
    return [];
  }
}

/**
 * 초대 코드 삭제
 */
export async function deleteInviteCode(_clubId: string, code: string): Promise<void> {
  try {
    // Delete from root collection
    await deleteDoc(doc(db, 'inviteCodes', code));
  } catch (error) {
    console.error('Error deleting invite code:', error);
    throw error;
  }
}

/**
 * 초대 코드 수정 (역할, 최대 사용 횟수, 만료일 등)
 */
export async function updateInviteCode(
  _clubId: string,
  code: string,
  updates: Partial<any>
): Promise<void> {
  try {
    const inviteRef = doc(db, 'inviteCodes', code);
    await updateDoc(inviteRef, {
      ...updates,
      // No updatedAt field in current schema, but good to have if we added it
    });
  } catch (error) {
    console.error('Error updating invite code:', error);
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