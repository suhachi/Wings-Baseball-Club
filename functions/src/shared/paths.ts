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
 * const clubDoc = clubRef('default-club');
 */
export function clubRef(clubId: string) {
  return db.collection('clubs').doc(clubId);
}

/**
 * 멤버 문서 참조 (clubs/{clubId}/members/{uid})
 * 
 * @example
 * const memberDoc = memberRef('default-club', 'user123');
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
 * const tokenDoc = memberTokenRef('default-club', 'user123', 'token456');
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
 * const tokensCol = memberTokensCol('default-club', 'user123');
 */
export function memberTokensCol(clubId: string, uid: string) {
  return memberRef(clubId, uid).collection('tokens');
}

/**
 * 게시글 문서 참조 (clubs/{clubId}/posts/{postId})
 * 
 * @example
 * const postDoc = postRef('default-club', 'post456');
 */
export function postRef(clubId: string, postId: string) {
  return clubRef(clubId).collection('posts').doc(postId);
}

/**
 * 게시글 컬렉션 참조 (clubs/{clubId}/posts)
 * 
 * @example
 * const postsCol = postCol('default-club');
 */
export function postCol(clubId: string) {
  return clubRef(clubId).collection('posts');
}

/**
 * 댓글 문서 참조 (clubs/{clubId}/posts/{postId}/comments/{commentId})
 * 
 * @example
 * const commentDoc = commentRef('default-club', 'post456', 'comment789');
 */
export function commentRef(clubId: string, postId: string, commentId: string) {
  return postRef(clubId, postId).collection('comments').doc(commentId);
}

/**
 * 댓글 컬렉션 참조 (clubs/{clubId}/posts/{postId}/comments)
 * 
 * @example
 * const commentsCol = commentCol('default-club', 'post456');
 */
export function commentCol(clubId: string, postId: string) {
  return postRef(clubId, postId).collection('comments');
}

/**
 * 출석 문서 참조 (clubs/{clubId}/posts/{postId}/attendance/{userId})
 * 
 * @example
 * const attendanceDoc = attendanceRef('default-club', 'post456', 'user123');
 */
export function attendanceRef(clubId: string, postId: string, userId: string) {
  return postRef(clubId, postId).collection('attendance').doc(userId);
}

/**
 * 출석 컬렉션 참조 (clubs/{clubId}/posts/{postId}/attendance)
 * 
 * @example
 * const attendanceCol = attendanceCol('default-club', 'post456');
 */
export function attendanceCol(clubId: string, postId: string) {
  return postRef(clubId, postId).collection('attendance');
}

/**
 * 감사 로그 컬렉션 참조 (clubs/{clubId}/audit)
 * 
 * @example
 * const auditCol = auditCol('default-club');
 */
export function auditCol(clubId: string) {
  return clubRef(clubId).collection('audit');
}

/**
 * FCM 토큰 컬렉션 참조 (clubs/{clubId}/fcmTokens)
 * 
 * @example
 * const fcmTokensCol = fcmTokenCol('default-club');
 */
export function fcmTokenCol(clubId: string) {
  return clubRef(clubId).collection('fcmTokens');
}

/**
 * 멱등성 컬렉션 참조 (clubs/{clubId}/idempotency)
 * 
 * @example
 * const idemCol = idemCol('default-club');
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

