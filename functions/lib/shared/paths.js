"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.clubRef = clubRef;
exports.memberRef = memberRef;
exports.memberTokenRef = memberTokenRef;
exports.memberTokensCol = memberTokensCol;
exports.postRef = postRef;
exports.postCol = postCol;
exports.commentRef = commentRef;
exports.commentCol = commentCol;
exports.attendanceRef = attendanceRef;
exports.attendanceCol = attendanceCol;
exports.auditCol = auditCol;
exports.fcmTokenCol = fcmTokenCol;
exports.idemCol = idemCol;
exports.userRef = userRef;
exports.notificationRef = notificationRef;
exports.notificationCol = notificationCol;
const firestore_1 = require("firebase-admin/firestore");
/**
 * Firestore 경로 헬퍼 (PRD v1.0 Section 4.1 컬렉션 구조 기준)
 *
 * 컬렉션 경로를 코드 상수로 통일하여 오타/분기 방지
 */
exports.db = (0, firestore_1.getFirestore)();
/**
 * 클럽 문서 참조
 *
 * @example
 * const clubDoc = clubRef('WINGS');
 */
function clubRef(clubId) {
    return exports.db.collection('clubs').doc(clubId);
}
/**
 * 멤버 문서 참조 (clubs/{clubId}/members/{uid})
 *
 * @example
 * const memberDoc = memberRef('WINGS', 'user123');
 */
function memberRef(clubId, uid) {
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
function memberTokenRef(clubId, uid, tokenId) {
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
function memberTokensCol(clubId, uid) {
    return memberRef(clubId, uid).collection('tokens');
}
/**
 * 게시글 문서 참조 (clubs/{clubId}/posts/{postId})
 *
 * @example
 * const postDoc = postRef('WINGS', 'post456');
 */
function postRef(clubId, postId) {
    return clubRef(clubId).collection('posts').doc(postId);
}
/**
 * 게시글 컬렉션 참조 (clubs/{clubId}/posts)
 *
 * @example
 * const postsCol = postCol('WINGS');
 */
function postCol(clubId) {
    return clubRef(clubId).collection('posts');
}
/**
 * 댓글 문서 참조 (clubs/{clubId}/posts/{postId}/comments/{commentId})
 *
 * @example
 * const commentDoc = commentRef('WINGS', 'post456', 'comment789');
 */
function commentRef(clubId, postId, commentId) {
    return postRef(clubId, postId).collection('comments').doc(commentId);
}
/**
 * 댓글 컬렉션 참조 (clubs/{clubId}/posts/{postId}/comments)
 *
 * @example
 * const commentsCol = commentCol('WINGS', 'post456');
 */
function commentCol(clubId, postId) {
    return postRef(clubId, postId).collection('comments');
}
/**
 * 출석 문서 참조 (clubs/{clubId}/posts/{postId}/attendance/{userId})
 *
 * @example
 * const attendanceDoc = attendanceRef('WINGS', 'post456', 'user123');
 */
function attendanceRef(clubId, postId, userId) {
    return postRef(clubId, postId).collection('attendance').doc(userId);
}
/**
 * 출석 컬렉션 참조 (clubs/{clubId}/posts/{postId}/attendance)
 *
 * @example
 * const attendanceCol = attendanceCol('WINGS', 'post456');
 */
function attendanceCol(clubId, postId) {
    return postRef(clubId, postId).collection('attendance');
}
/**
 * 감사 로그 컬렉션 참조 (clubs/{clubId}/audit)
 *
 * @example
 * const auditCol = auditCol('WINGS');
 */
function auditCol(clubId) {
    return clubRef(clubId).collection('audit');
}
/**
 * FCM 토큰 컬렉션 참조 (clubs/{clubId}/fcmTokens)
 *
 * @example
 * const fcmTokensCol = fcmTokenCol('WINGS');
 */
function fcmTokenCol(clubId) {
    return clubRef(clubId).collection('fcmTokens');
}
/**
 * 멱등성 컬렉션 참조 (clubs/{clubId}/idempotency)
 *
 * @example
 * const idemCol = idemCol('WINGS');
 */
function idemCol(clubId) {
    return clubRef(clubId).collection('idempotency');
}
/**
 * 전역 사용자 문서 참조 (users/{uid})
 *
 * @example
 * const userDoc = userRef('user123');
 */
function userRef(uid) {
    return exports.db.collection('users').doc(uid);
}
/**
 * 알림 문서 참조 (notifications/{notificationId})
 *
 * @example
 * const notificationDoc = notificationRef('notif123');
 */
function notificationRef(notificationId) {
    return exports.db.collection('notifications').doc(notificationId);
}
/**
 * 알림 컬렉션 참조 (notifications)
 *
 * @example
 * const notificationsCol = notificationCol();
 */
function notificationCol() {
    return exports.db.collection('notifications');
}
