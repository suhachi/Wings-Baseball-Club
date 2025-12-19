# 92. Full Source Dump: functions/

**Generated**: 2025-12-19T07:20:34.605Z

## FILE: functions\lib\callables\dues.js
```js
"use strict";
// Callable functions for dues management
// Will be implemented in later ATOMs
Object.defineProperty(exports, "__esModule", { value: true });

```

## FILE: functions\lib\callables\events.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEventPost = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const validate_1 = require("../shared/validate");
const audit_1 = require("../shared/audit");
const idempotency_1 = require("../shared/idempotency");
const time_1 = require("../shared/time");
const paths_1 = require("../shared/paths");
const errors_1 = require("../shared/errors");
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
exports.createEventPost = (0, https_1.onCall)({ region: 'asia-northeast3' }, async (req) => {
    const uid = (0, auth_1.requireAuth)(req);
    const clubId = (0, validate_1.reqString)(req.data?.clubId, 'clubId', 3, 64);
    const eventType = (0, validate_1.reqString)(req.data?.eventType, 'eventType', 4, 20);
    const title = (0, validate_1.reqString)(req.data?.title, 'title', 1, 200);
    const content = (0, validate_1.reqString)(req.data?.content, 'content', 1, 5000);
    const startAt = req.data?.startAt; // ISO string or timestamp
    const place = (0, validate_1.reqString)(req.data?.place, 'place', 1, 200);
    const opponent = (0, validate_1.optString)(req.data?.opponent, 'opponent', 200);
    const requestId = (0, validate_1.reqString)(req.data?.requestId, 'requestId', 1, 128); // 필수 (멱등성용)
    // μATOM-0531: adminLike 권한 확인
    await (0, auth_1.requireRole)(clubId, uid, ['PRESIDENT', 'DIRECTOR', 'ADMIN']);
    // eventType 검증
    if (eventType !== 'PRACTICE' && eventType !== 'GAME') {
        throw errors_1.Err.invalidArgument('Invalid eventType', { eventType, validTypes: ['PRACTICE', 'GAME'] });
    }
    // startAt 검증 및 변환
    if (!startAt) {
        throw errors_1.Err.invalidArgument('startAt is required');
    }
    let startAtDate;
    if (typeof startAt === 'string') {
        startAtDate = new Date(startAt);
    }
    else if (typeof startAt === 'number') {
        startAtDate = new Date(startAt);
    }
    else {
        throw errors_1.Err.invalidArgument('Invalid startAt format');
    }
    if (isNaN(startAtDate.getTime())) {
        throw errors_1.Err.invalidArgument('Invalid startAt date');
    }
    // μATOM-0532: voteCloseAt 계산(전날 23:00 KST) 서버 확정
    const voteCloseAtMillis = (0, time_1.computeVoteCloseAtKST)(startAtDate.getTime());
    const voteCloseAt = new Date(voteCloseAtMillis);
    // 멱등성 키 생성
    const idempotencyKey = `event:${clubId}:${requestId}`;
    return (0, idempotency_1.withIdempotency)(clubId, idempotencyKey, async () => {
        const db = (0, firestore_1.getFirestore)();
        // 작성자 정보 조회
        const memberRef = db.collection('clubs').doc(clubId).collection('members').doc(uid);
        const memberSnap = await memberRef.get();
        const memberData = memberSnap.exists ? memberSnap.data() : null;
        // μATOM-0533: event post 저장(voteClosed=false 초기화)
        const postData = {
            type: 'event',
            eventType,
            title,
            content,
            authorId: uid,
            authorName: memberData?.realName || '',
            authorPhotoURL: memberData?.photoURL || null,
            startAt: firestore_1.FieldValue.serverTimestamp(), // 나중에 실제 startAt으로 업데이트
            place,
            opponent: opponent || null,
            voteCloseAt: voteCloseAt,
            voteClosed: false, // 초기화
            attendanceSummary: {
                attending: 0,
                absent: 0,
                maybe: 0,
            },
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        const postsCol = (0, paths_1.postCol)(clubId);
        const newPostRef = postsCol.doc();
        await newPostRef.set(postData);
        // startAt을 실제 값으로 업데이트 (serverTimestamp 대신)
        await newPostRef.update({
            startAt: startAtDate,
        });
        const postId = newPostRef.id;
        // Audit 기록
        await (0, audit_1.writeAudit)({
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

## FILE: functions\lib\callables\games.js
```js
"use strict";
// Callable functions for game recording management
// Will be implemented in later ATOMs
Object.defineProperty(exports, "__esModule", { value: true });

```

## FILE: functions\lib\callables\invites.js
```js
"use strict";
// Callable functions for invite management
// Will be implemented in later ATOMs
Object.defineProperty(exports, "__esModule", { value: true });

```

## FILE: functions\lib\callables\ledger.js
```js
"use strict";
// Callable functions for ledger (accounting) management
// Will be implemented in later ATOMs
Object.defineProperty(exports, "__esModule", { value: true });

```

## FILE: functions\lib\callables\members.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMemberProfileByAdmin = exports.setMemberRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const paths_1 = require("../shared/paths");
const validate_1 = require("../shared/validate");
const audit_1 = require("../shared/audit");
const idempotency_1 = require("../shared/idempotency");
const errors_1 = require("../shared/errors");
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
exports.setMemberRole = (0, https_1.onCall)({ region: 'asia-northeast3' }, async (req) => {
    const uid = (0, auth_1.requireAuth)(req);
    const clubId = (0, validate_1.reqString)(req.data?.clubId, 'clubId', 3, 64);
    const targetUserId = (0, validate_1.reqString)(req.data?.targetUserId, 'targetUserId', 1, 128);
    const roleStr = (0, validate_1.reqString)(req.data?.role, 'role', 1, 20);
    const requestId = (0, validate_1.optString)(req.data?.requestId, 'requestId', 128);
    // role enum 검증
    const validRoles = ['PRESIDENT', 'DIRECTOR', 'TREASURER', 'ADMIN', 'MEMBER'];
    if (!validRoles.includes(roleStr)) {
        throw errors_1.Err.invalidArgument('Invalid role', { role: roleStr, validRoles });
    }
    const role = roleStr;
    // 멱등성 키 생성
    const idempotencyKey = requestId
        ? `role:${clubId}:${targetUserId}:${requestId}`
        : `role:${clubId}:${targetUserId}:${uid}:${Date.now()}`;
    return (0, idempotency_1.withIdempotency)(clubId, idempotencyKey, async () => {
        // 현재 사용자의 역할 확인
        const actorRole = await (0, auth_1.requireRole)(clubId, uid, ['PRESIDENT', 'DIRECTOR', 'ADMIN']);
        // 타겟 멤버 존재 확인 및 현재 역할 가져오기
        const targetMemberRef = (0, paths_1.memberRef)(clubId, targetUserId);
        const targetMemberSnap = await targetMemberRef.get();
        if (!targetMemberSnap.exists) {
            throw errors_1.Err.notFound('Target member not found', { targetUserId });
        }
        const targetMemberData = targetMemberSnap.data();
        const beforeRole = targetMemberData?.role;
        if (!beforeRole) {
            throw errors_1.Err.internal('Target member role missing');
        }
        // 권한 정책 검증
        if (role === 'TREASURER') {
            // TREASURER는 PRESIDENT만 지정/변경 가능
            if (actorRole !== 'PRESIDENT') {
                throw errors_1.Err.permissionDenied('Only PRESIDENT can assign/change TREASURER role', {
                    required: 'PRESIDENT',
                    actual: actorRole,
                });
            }
        }
        else if (role === 'ADMIN') {
            // ADMIN은 PRESIDENT 또는 DIRECTOR만 부여/회수 가능
            if (actorRole !== 'PRESIDENT' && actorRole !== 'DIRECTOR') {
                throw errors_1.Err.permissionDenied('Only PRESIDENT or DIRECTOR can assign/revoke ADMIN role', {
                    required: ['PRESIDENT', 'DIRECTOR'],
                    actual: actorRole,
                });
            }
        }
        else if (role === 'PRESIDENT' || role === 'DIRECTOR') {
            // PRESIDENT/DIRECTOR 변경은 더 엄격한 정책 필요 (현재는 PRESIDENT만)
            if (actorRole !== 'PRESIDENT') {
                throw errors_1.Err.permissionDenied('Only PRESIDENT can change PRESIDENT/DIRECTOR role', {
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
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        // users 문서도 동기화 (선택적, PRD에 따라 다를 수 있음)
        const userRef = (0, firestore_1.getFirestore)().collection('users').doc(targetUserId);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
            await userRef.update({
                role,
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
        }
        // Audit 기록
        await (0, audit_1.writeAudit)({
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
exports.setMemberProfileByAdmin = (0, https_1.onCall)({ region: 'asia-northeast3' }, async (req) => {
    const uid = (0, auth_1.requireAuth)(req);
    const clubId = (0, validate_1.reqString)(req.data?.clubId, 'clubId', 3, 64);
    const targetUserId = (0, validate_1.reqString)(req.data?.targetUserId, 'targetUserId', 1, 128);
    const position = (0, validate_1.optString)(req.data?.position, 'position', 50);
    const backNumber = (0, validate_1.optNumber)(req.data?.backNumber, 'backNumber', 0, 99);
    const requestId = (0, validate_1.optString)(req.data?.requestId, 'requestId', 128);
    // 관리자 권한 확인
    await (0, auth_1.requireRole)(clubId, uid, ['PRESIDENT', 'DIRECTOR', 'ADMIN']);
    // 멱등성 키 생성
    const idempotencyKey = requestId
        ? `profile:${clubId}:${targetUserId}:${requestId}`
        : `profile:${clubId}:${targetUserId}:${uid}:${Date.now()}`;
    return (0, idempotency_1.withIdempotency)(clubId, idempotencyKey, async () => {
        // 타겟 멤버 존재 확인 및 현재 프로필 가져오기
        const targetMemberRef = (0, paths_1.memberRef)(clubId, targetUserId);
        const targetMemberSnap = await targetMemberRef.get();
        if (!targetMemberSnap.exists) {
            throw errors_1.Err.notFound('Target member not found', { targetUserId });
        }
        const targetMemberData = targetMemberSnap.data();
        const before = {
            position: targetMemberData?.position || null,
            backNumber: targetMemberData?.backNumber || null,
        };
        // 업데이트할 필드 구성
        const updates = {
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
        const userRef = (0, firestore_1.getFirestore)().collection('users').doc(targetUserId);
        const userSnap = await userRef.get();
        if (userSnap.exists) {
            const userUpdates = {
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
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
        await (0, audit_1.writeAudit)({
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

## FILE: functions\lib\callables\notices.js
```js
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNoticeWithPush = void 0;
const functions = __importStar(require("firebase-functions"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../shared/auth");
const validate_1 = require("../shared/validate");
const audit_1 = require("../shared/audit");
const idempotency_1 = require("../shared/idempotency");
const fcm_1 = require("../shared/fcm");
const paths_1 = require("../shared/paths");
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
exports.createNoticeWithPush = functions
    .region('asia-northeast3')
    .https.onCall(async (data, context) => {
    // 1. Auth Check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
    }
    const uid = context.auth.uid;
    const clubId = (0, validate_1.reqString)(data?.clubId, 'clubId', 3, 64);
    const title = (0, validate_1.reqString)(data?.title, 'title', 1, 200);
    const content = (0, validate_1.reqString)(data?.content, 'content', 1, 5000);
    const pinned = (0, validate_1.optBoolean)(data?.pinned, 'pinned') ?? false;
    const requestId = (0, validate_1.reqString)(data?.requestId, 'requestId', 1, 128); // 필수 (멱등성용)
    // 2. Role Check (adminLike)
    // getMemberRole might throw V2 error, but we try to match wire format.
    // If it fails, catch and rethrow V1 error?
    // Let's assume Err helper works or just catch generic.
    try {
        const role = await (0, auth_1.getMemberRole)(clubId, uid);
        if (!['PRESIDENT', 'DIRECTOR', 'ADMIN'].includes(role)) {
            throw new functions.https.HttpsError('permission-denied', 'Insufficient role');
        }
    }
    catch (e) {
        // If it is HttpsError (v2 or v1), rethrow.
        // Check code.
        if (e.code)
            throw e;
        throw new functions.https.HttpsError('internal', 'Role check failed', e.message);
    }
    // 멱등성 키 생성
    const idempotencyKey = `notice:${clubId}:${requestId}`;
    return (0, idempotency_1.withIdempotency)(clubId, idempotencyKey, async () => {
        const db = (0, firestore_1.getFirestore)();
        // 1. 공지 게시글 생성
        const postData = {
            type: 'notice',
            title,
            content,
            authorId: uid,
            authorName: '',
            authorPhotoURL: null,
            pinned,
            pushStatus: 'PENDING',
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        // 작성자 정보 조회
        const memberRef = db.collection('clubs').doc(clubId).collection('members').doc(uid);
        const memberSnap = await memberRef.get();
        if (memberSnap.exists) {
            const memberData = memberSnap.data();
            postData.authorName = memberData?.realName || '';
            postData.authorPhotoURL = memberData?.photoURL || null;
        }
        const postsCol = (0, paths_1.postCol)(clubId);
        const newPostRef = postsCol.doc();
        await newPostRef.set(postData);
        const postId = newPostRef.id;
        // 2. 푸시 발송 (재시도 3회)
        let pushResult = null;
        let pushError = null;
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const fcmResult = await (0, fcm_1.sendToClub)(clubId, {
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
            }
            catch (error) {
                console.error(`푸시 발송 실패 (시도 ${attempt}/${maxRetries}):`, error);
                pushError = error.message || String(error);
                if (attempt === maxRetries) {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        // 3. 푸시 상태 기록
        const pushStatus = pushResult && pushResult.sent > 0 ? 'SENT' : 'FAILED';
        const updateData = {
            pushStatus,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        };
        if (pushStatus === 'SENT') {
            updateData.pushSentAt = firestore_1.FieldValue.serverTimestamp();
        }
        else {
            updateData.pushError = pushError || '푸시 발송 실패';
        }
        await newPostRef.update(updateData);
        // 4. Audit 기록
        await (0, audit_1.writeAudit)({
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

## FILE: functions\lib\callables\polls.js
```js
"use strict";
// Callable functions for poll management
// Will be implemented in later ATOMs
Object.defineProperty(exports, "__esModule", { value: true });

```

## FILE: functions\lib\callables\tokens.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFcmToken = void 0;
const https_1 = require("firebase-functions/v2/https");
const auth_1 = require("../shared/auth");
const validate_1 = require("../shared/validate");
const fcm_1 = require("../shared/fcm");
const audit_1 = require("../shared/audit");
const idempotency_1 = require("../shared/idempotency");
const errors_1 = require("../shared/errors");
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
 *   clubId: 'default-club',
 *   token: 'fcm_token_string',
 *   platform: 'web',
 *   requestId: 'req-uuid-123'
 * });
 */
exports.registerFcmToken = (0, https_1.onCall)({ region: 'asia-northeast3' }, async (req) => {
    const uid = (0, auth_1.requireAuth)(req);
    const clubId = (0, validate_1.reqString)(req.data?.clubId, 'clubId', 3, 64);
    const token = (0, validate_1.reqString)(req.data?.token, 'token', 50, 500); // FCM 토큰은 일반적으로 150자 정도이지만 더 긴 경우도 있음
    const platform = (0, validate_1.optString)(req.data?.platform, 'platform', 20) || 'web';
    const requestId = (0, validate_1.optString)(req.data?.requestId, 'requestId', 128);
    // 플랫폼 검증
    const validPlatforms = ['web', 'ios', 'android'];
    if (!validPlatforms.includes(platform)) {
        throw errors_1.Err.invalidArgument('Invalid platform', { platform, validPlatforms });
    }
    // 멤버 확인
    await (0, auth_1.requireMember)(clubId, uid);
    // 멱등성 키 생성 (토큰 해시 기반으로 중복 방지)
    const idempotencyKey = requestId
        ? `fcm:${clubId}:${uid}:${requestId}`
        : `fcm:${clubId}:${uid}:${token.slice(0, 50)}`; // 토큰 앞부분으로 중복 방지
    return (0, idempotency_1.withIdempotency)(clubId, idempotencyKey, async () => {
        // 토큰 저장 (upsert - 동일 토큰 재등록 시 문서 1개 유지)
        const { tokenId } = await (0, fcm_1.upsertFcmToken)(clubId, uid, token, platform);
        // Audit 기록 (선택적)
        await (0, audit_1.writeAudit)({
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

## FILE: functions\lib\index.js
```js
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("firebase-admin/app");
// Initialize Firebase Admin
(0, app_1.initializeApp)();
// Export callables
__exportStar(require("./callables/members"), exports);
__exportStar(require("./callables/notices"), exports);
__exportStar(require("./callables/tokens"), exports);
__exportStar(require("./callables/events"), exports); // μATOM-0531: createEventPost
// Export scheduled functions
__exportStar(require("./scheduled/closeEventVotes"), exports); // μATOM-0541: closeEventVotes

```

## FILE: functions\lib\scheduled\closeEventVotes.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeEventVotes = void 0;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firestore_1 = require("firebase-admin/firestore");
const fcm_1 = require("../shared/fcm");
const idempotency_1 = require("../shared/idempotency");
const paths_1 = require("../shared/paths");
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
exports.closeEventVotes = (0, scheduler_1.onSchedule)({
    schedule: 'every 5 minutes',
    timeZone: 'Asia/Seoul',
    region: 'asia-northeast3',
}, async (_event) => {
    const now = firestore_1.Timestamp.now();
    // μATOM-0541: scheduled closeEventVotes 쿼리
    // voteCloseAt <= now && voteClosed==false인 게시글 조회
    // 주의: 모든 클럽을 순회해야 함 (현재는 기본 클럽만 처리)
    const defaultClubId = 'default-club'; // TODO: 다중 클럽 지원 시 변경 필요
    const postsCol = (0, paths_1.postCol)(defaultClubId);
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
    const results = await Promise.allSettled(snapshot.docs.map(async (doc) => {
        const postId = doc.id;
        const postData = doc.data();
        // μATOM-0544: idempotency 키 적용
        const idempotencyKey = `closeEventVote:${defaultClubId}:${postId}`;
        return (0, idempotency_1.withIdempotency)(defaultClubId, idempotencyKey, async () => {
            // μATOM-0542: voteClosed=true, voteClosedAt 기록(멱등)
            await doc.ref.update({
                voteClosed: true,
                voteClosedAt: firestore_1.FieldValue.serverTimestamp(),
                updatedAt: firestore_1.FieldValue.serverTimestamp(),
            });
            // attendanceSummary 집계 (선택적, 클라이언트에서도 계산 가능)
            const attendancesSnap = await doc.ref.collection('attendance').get();
            let attending = 0;
            let absent = 0;
            let maybe = 0;
            attendancesSnap.forEach((attendanceDoc) => {
                const status = attendanceDoc.data().status;
                if (status === 'attending')
                    attending++;
                else if (status === 'absent')
                    absent++;
                else if (status === 'maybe')
                    maybe++;
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
                const pushResult = await (0, fcm_1.sendToClub)(defaultClubId, {
                    title: `[일정 마감] ${postData.title}`,
                    body: '출석 투표가 마감되었습니다. 결과를 확인해보세요.',
                    data: {
                        type: 'event',
                        postId,
                        eventType: 'vote_closed',
                    },
                }, 'all');
                console.log(`이벤트 ${postId} 마감 처리 완료. 푸시 발송: ${pushResult.sent}건 성공, ${pushResult.failed}건 실패`);
            }
            catch (error) {
                console.error(`이벤트 ${postId} 마감 푸시 발송 실패:`, error);
                // 푸시 실패해도 마감 처리 itself는 완료 (정책 고정)
            }
            return { postId, success: true };
        });
    }));
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    console.log(`마감 처리 완료: ${successful}건 성공, ${failed}건 실패`);
});

```

## FILE: functions\lib\shared\audit.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeAudit = writeAudit;
const firestore_1 = require("firebase-admin/firestore");
const paths_1 = require("./paths");
/**
 * 대용량 데이터를 요약하여 반환 (최대 크기 제한)
 */
function summarizeData(data, maxSize = 10000) {
    if (data == null)
        return null;
    const str = JSON.stringify(data);
    if (str.length <= maxSize)
        return data;
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
 *   clubId: 'default-club',
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
 *   clubId: 'default-club',
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
 *   clubId: 'default-club',
 *   actorUid: 'admin789',
 *   action: 'GAME_LOCK_RECORDING',
 *   targetType: 'post',
 *   targetId: gamePostId,
 *   before: { recordingLocked: false },
 *   after: { recordingLocked: true },
 * });
 */
async function writeAudit(params) {
    const { clubId, actorUid, action, targetType, targetId, before, after, meta } = params;
    // 대용량 데이터 요약 (성능 최적화)
    const beforeSummary = summarizeData(before);
    const afterSummary = summarizeData(after);
    await (0, paths_1.auditCol)(clubId).add({
        clubId, // 컬렉션 경로에 포함되어 있지만 조회 편의를 위해 중복 저장
        actorUid,
        action: String(action),
        targetType,
        targetId: targetId ?? null,
        before: beforeSummary,
        after: afterSummary,
        meta: meta ?? null,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
}

```

## FILE: functions\lib\shared\auth.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.getMemberRole = getMemberRole;
exports.requireRole = requireRole;
exports.isAdminLike = isAdminLike;
exports.isTreasury = isTreasury;
exports.requireMember = requireMember;
const paths_1 = require("./paths");
const errors_1 = require("./errors");
function requireAuth(req) {
    if (!req.auth?.uid)
        throw errors_1.Err.unauthenticated();
    return req.auth.uid;
}
async function getMemberRole(clubId, uid) {
    const snap = await (0, paths_1.memberRef)(clubId, uid).get();
    if (!snap.exists)
        throw errors_1.Err.permissionDenied('Not a club member');
    const r = snap.data()?.role;
    if (!r)
        throw errors_1.Err.internal('Member role missing');
    return r;
}
async function requireRole(clubId, uid, roles) {
    const r = await getMemberRole(clubId, uid);
    if (!roles.includes(r)) {
        throw errors_1.Err.permissionDenied('Insufficient role', { required: roles, actual: r });
    }
    return r;
}
function isAdminLike(r) {
    return r === 'PRESIDENT' || r === 'DIRECTOR' || r === 'ADMIN';
}
function isTreasury(r) {
    return r === 'PRESIDENT' || r === 'TREASURER';
}
/**
 * 멤버인지 확인 (권한 체크 없이 멤버 존재만 확인)
 *
 * @param clubId 클럽 ID
 * @param uid 사용자 UID
 * @throws permission-denied if not a member
 */
async function requireMember(clubId, uid) {
    const snap = await (0, paths_1.memberRef)(clubId, uid).get();
    if (!snap.exists) {
        throw errors_1.Err.permissionDenied('Not a club member');
    }
}

```

## FILE: functions\lib\shared\errors.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Err = void 0;
const https_1 = require("firebase-functions/v2/https");
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
exports.Err = {
    unauthenticated(msg = 'Authentication required') {
        return new https_1.HttpsError('unauthenticated', msg);
    },
    permissionDenied(msg = 'Permission denied', details) {
        return new https_1.HttpsError('permission-denied', msg, details);
    },
    invalidArgument(msg = 'Invalid argument', details) {
        return new https_1.HttpsError('invalid-argument', msg, details);
    },
    failedPrecondition(msg = 'Failed precondition', details) {
        return new https_1.HttpsError('failed-precondition', msg, details);
    },
    notFound(msg = 'Not found', details) {
        return new https_1.HttpsError('not-found', msg, details);
    },
    alreadyExists(msg = 'Already exists', details) {
        return new https_1.HttpsError('already-exists', msg, details);
    },
    internal(msg = 'Internal error', details) {
        return new https_1.HttpsError('internal', msg, details);
    },
};

```

## FILE: functions\lib\shared\fcm.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsertFcmToken = upsertFcmToken;
exports.deleteUserTokens = deleteUserTokens;
exports.deleteInvalidTokens = deleteInvalidTokens;
exports.getAllTokens = getAllTokens;
exports.getTokensForUids = getTokensForUids;
exports.sendToTokens = sendToTokens;
exports.sendToClub = sendToClub;
const crypto_1 = require("crypto");
const messaging_1 = require("firebase-admin/messaging");
const firestore_1 = require("firebase-admin/firestore");
const paths_1 = require("./paths");
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
 * await upsertFcmToken('default-club', 'user123', 'fcm_token_string', 'web');
 */
async function upsertFcmToken(clubId, uid, token, platform) {
    // 토큰을 해시하여 문서 ID로 사용
    const tokenHash = (0, crypto_1.createHash)('sha256').update(token).digest('hex').slice(0, 64);
    const tokenRef = (0, paths_1.memberTokensCol)(clubId, uid).doc(tokenHash);
    await tokenRef.set({
        token,
        platform,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
        failureCount: 0, // 초기화
    }, { merge: true });
    return { tokenId: tokenHash };
}
/**
 * 사용자의 모든 토큰 삭제
 *
 * @param clubId 클럽 ID
 * @param uid 사용자 UID
 */
async function deleteUserTokens(clubId, uid) {
    const tokensCol = (0, paths_1.memberTokensCol)(clubId, uid);
    const snap = await tokensCol.get();
    const batch = (0, firestore_1.getFirestore)().batch();
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
async function deleteInvalidTokens(clubId, uid, invalidTokenIds) {
    if (invalidTokenIds.length === 0)
        return;
    const batch = (0, firestore_1.getFirestore)().batch();
    invalidTokenIds.forEach((tokenId) => {
        const tokenRef = (0, paths_1.memberTokensCol)(clubId, uid).doc(tokenId);
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
async function getAllTokens(clubId) {
    const db = (0, firestore_1.getFirestore)();
    // collectionGroup을 사용하여 모든 members/{uid}/tokens 조회
    // 단, 현재 Firestore는 collectionGroup에 대한 필터링이 제한적이므로
    // 모든 members를 순회하는 방식 사용 (성능 고려 필요)
    // 방법 1: members 컬렉션을 순회하며 각 멤버의 tokens 조회
    const membersRef = db.collection('clubs').doc(clubId).collection('members');
    const membersSnap = await membersRef.get();
    const tokens = [];
    for (const memberDoc of membersSnap.docs) {
        const uid = memberDoc.id;
        const tokensSnap = await (0, paths_1.memberTokensCol)(clubId, uid).get();
        tokensSnap.forEach((tokenDoc) => {
            const data = tokenDoc.data();
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
async function getTokensForUids(clubId, uids) {
    if (uids.length === 0)
        return [];
    const tokens = [];
    for (const uid of uids) {
        const tokensSnap = await (0, paths_1.memberTokensCol)(clubId, uid).get();
        tokensSnap.forEach((tokenDoc) => {
            const data = tokenDoc.data();
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
async function getAdminUids(clubId) {
    const db = (0, firestore_1.getFirestore)();
    const membersRef = db.collection('clubs').doc(clubId).collection('members');
    const membersSnap = await membersRef
        .where('role', 'in', ['PRESIDENT', 'DIRECTOR', 'ADMIN'])
        .get();
    return membersSnap.docs.map((doc) => doc.id);
}
/**
 * 배열을 청크로 분할
 */
function chunk(arr, size) {
    const out = [];
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
async function sendToTokens(tokens, payload) {
    if (tokens.length === 0) {
        return { sent: 0, failed: 0, invalidTokens: [] };
    }
    const msg = (0, messaging_1.getMessaging)();
    const batches = chunk(tokens, 500); // FCM multicast limit is 500
    let sent = 0;
    let failed = 0;
    const invalidTokens = [];
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
                if (response.error?.code === 'messaging/registration-token-not-registered' ||
                    response.error?.code === 'messaging/invalid-registration-token') {
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
 * await sendToClub('default-club', {
 *   title: '새 공지사항',
 *   body: '중요한 공지가 등록되었습니다.',
 *   data: { postId: 'xyz', type: 'notice' },
 * });
 *
 * @example
 * // 관리자에게만 발송
 * await sendToClub('default-club', {
 *   title: '출석 투표 마감',
 *   body: '오늘 일정의 출석 투표가 마감되었습니다.',
 * }, 'admins');
 *
 * @example
 * // 특정 사용자들에게만 발송
 * await sendToClub('default-club', {
 *   title: '리마인더',
 *   body: '내일 일정을 확인하세요.',
 * }, ['user123', 'user456']);
 */
async function sendToClub(clubId, payload, filter = 'all') {
    let tokens;
    if (filter === 'all') {
        tokens = await getAllTokens(clubId);
    }
    else if (filter === 'admins') {
        const adminUids = await getAdminUids(clubId);
        tokens = await getTokensForUids(clubId, adminUids);
    }
    else {
        // 특정 UID 목록
        tokens = await getTokensForUids(clubId, filter);
    }
    return sendToTokens(tokens, payload);
}

```

## FILE: functions\lib\shared\idempotency.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withIdempotency = withIdempotency;
const crypto_1 = require("crypto");
const firestore_1 = require("firebase-admin/firestore");
const paths_1 = require("./paths");
const errors_1 = require("./errors");
/**
 * 멱등성 처리 (PRD v1.0 Section 13.2)
 *
 * 동일한 requestId로 재호출 시 "중복 생성" 방지
 * 저장 위치: clubs/{clubId}/idempotency/{keyHash}
 */
/**
 * 키를 해시하여 안전한 문서 ID로 변환
 */
function hashKey(key) {
    return (0, crypto_1.createHash)('sha256').update(key).digest('hex').slice(0, 64);
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
async function withIdempotency(clubId, key, handler) {
    // 키를 해시하여 문서 ID로 사용 (길이 제한 및 안전성)
    const keyHash = hashKey(key);
    const ref = (0, paths_1.idemCol)(clubId).doc(keyHash);
    // 이미 처리된 요청인지 확인
    const snap = await ref.get();
    if (snap.exists) {
        const data = snap.data();
        if (data?.status === 'DONE' && data.result !== undefined) {
            // 이미 완료된 요청: 저장된 결과 반환
            return data.result;
        }
        // 처리 중인 요청: 중복 호출 차단
        if (data?.status === 'RUNNING') {
            throw errors_1.Err.internal('Request is already being processed');
        }
        // 실패한 요청: 새로 실행하지 않고 에러 재발생 (선택적)
        // 또는 새로 실행하도록 주석 처리된 로직 사용 가능
    }
    // 원자적으로 문서 생성 시도 (트랜잭션 대신 create 사용)
    try {
        await ref.create({
            key, // 원본 키 저장 (디버깅용)
            createdAt: firestore_1.FieldValue.serverTimestamp(),
            status: 'RUNNING',
        });
    }
    catch (error) {
        // 문서가 이미 존재 (레이스 컨디션)
        const snap2 = await ref.get();
        if (snap2.exists) {
            const data2 = snap2.data();
            if (data2?.status === 'DONE' && data2.result !== undefined) {
                return data2.result;
            }
            // 다른 요청이 먼저 실행 중
            throw errors_1.Err.internal('Idempotency lock failed');
        }
        throw error;
    }
    // 핸들러 실행
    try {
        const result = await handler();
        // 성공: 결과 저장
        await ref.set({
            result,
            status: 'DONE',
            finishedAt: firestore_1.FieldValue.serverTimestamp(),
        }, { merge: true });
        return result;
    }
    catch (error) {
        // 실패: 상태만 기록 (에러는 재발생)
        await ref.set({
            status: 'FAILED',
            finishedAt: firestore_1.FieldValue.serverTimestamp(),
            error: String(error),
        }, { merge: true });
        throw error;
    }
}

```

## FILE: functions\lib\shared\paths.js
```js
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
 * const clubDoc = clubRef('default-club');
 */
function clubRef(clubId) {
    return exports.db.collection('clubs').doc(clubId);
}
/**
 * 멤버 문서 참조 (clubs/{clubId}/members/{uid})
 *
 * @example
 * const memberDoc = memberRef('default-club', 'user123');
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
 * const tokenDoc = memberTokenRef('default-club', 'user123', 'token456');
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
 * const tokensCol = memberTokensCol('default-club', 'user123');
 */
function memberTokensCol(clubId, uid) {
    return memberRef(clubId, uid).collection('tokens');
}
/**
 * 게시글 문서 참조 (clubs/{clubId}/posts/{postId})
 *
 * @example
 * const postDoc = postRef('default-club', 'post456');
 */
function postRef(clubId, postId) {
    return clubRef(clubId).collection('posts').doc(postId);
}
/**
 * 게시글 컬렉션 참조 (clubs/{clubId}/posts)
 *
 * @example
 * const postsCol = postCol('default-club');
 */
function postCol(clubId) {
    return clubRef(clubId).collection('posts');
}
/**
 * 댓글 문서 참조 (clubs/{clubId}/posts/{postId}/comments/{commentId})
 *
 * @example
 * const commentDoc = commentRef('default-club', 'post456', 'comment789');
 */
function commentRef(clubId, postId, commentId) {
    return postRef(clubId, postId).collection('comments').doc(commentId);
}
/**
 * 댓글 컬렉션 참조 (clubs/{clubId}/posts/{postId}/comments)
 *
 * @example
 * const commentsCol = commentCol('default-club', 'post456');
 */
function commentCol(clubId, postId) {
    return postRef(clubId, postId).collection('comments');
}
/**
 * 출석 문서 참조 (clubs/{clubId}/posts/{postId}/attendance/{userId})
 *
 * @example
 * const attendanceDoc = attendanceRef('default-club', 'post456', 'user123');
 */
function attendanceRef(clubId, postId, userId) {
    return postRef(clubId, postId).collection('attendance').doc(userId);
}
/**
 * 출석 컬렉션 참조 (clubs/{clubId}/posts/{postId}/attendance)
 *
 * @example
 * const attendanceCol = attendanceCol('default-club', 'post456');
 */
function attendanceCol(clubId, postId) {
    return postRef(clubId, postId).collection('attendance');
}
/**
 * 감사 로그 컬렉션 참조 (clubs/{clubId}/audit)
 *
 * @example
 * const auditCol = auditCol('default-club');
 */
function auditCol(clubId) {
    return clubRef(clubId).collection('audit');
}
/**
 * FCM 토큰 컬렉션 참조 (clubs/{clubId}/fcmTokens)
 *
 * @example
 * const fcmTokensCol = fcmTokenCol('default-club');
 */
function fcmTokenCol(clubId) {
    return clubRef(clubId).collection('fcmTokens');
}
/**
 * 멱등성 컬렉션 참조 (clubs/{clubId}/idempotency)
 *
 * @example
 * const idemCol = idemCol('default-club');
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

```

## FILE: functions\lib\shared\time.js
```js
"use strict";
/**
 * 시간 계산 유틸리티
 *
 * PRD v1.0 정책: 출석 투표 마감은 "시작일 전날 23:00" (KST 기준)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeVoteCloseAtKST = computeVoteCloseAtKST;
/**
 * 투표 마감 시간 계산 (KST 기준: 시작일 전날 23:00)
 *
 * 정책: 일정 시작일 전날 23:00 KST에 출석 투표 마감
 *
 * @param startAtMillis 시작일 타임스탬프 (밀리초, UTC)
 * @returns voteCloseAt 타임스탬프 (밀리초, UTC)
 *
 * @example
 * const startAt = Date.parse('2025-12-20T10:00:00+09:00'); // 2025년 12월 20일 10:00 KST
 * const voteCloseAt = computeVoteCloseAtKST(startAt);
 * // 결과: 2025년 12월 19일 23:00 KST (UTC로 변환된 타임스탬프)
 */
function computeVoteCloseAtKST(startAtMillis) {
    // 정책: 시작일 전날 23:00 (KST 고정)
    // 
    // 로직:
    // 1. UTC 타임스탬프를 KST로 변환하여 날짜 추출
    // 2. 시작일의 전날을 계산 (KST 기준)
    // 3. 전날 23:00 KST를 UTC 타임스탬프로 변환하여 반환
    //
    // KST = UTC + 9시간
    // KST 00:00 = UTC 15:00 (전날)
    // KST 23:00 = UTC 14:00 (같은 날)
    const start = new Date(startAtMillis);
    // KST 시간으로 변환 (UTC + 9시간)
    const kstTime = start.getTime() + 9 * 60 * 60 * 1000;
    const kstDate = new Date(kstTime);
    // KST 기준 연도/월/일 추출
    const kstYear = kstDate.getUTCFullYear();
    const kstMonth = kstDate.getUTCMonth();
    const kstDay = kstDate.getUTCDate();
    // 전날 계산 (KST 기준)
    const prevDayKST = new Date(Date.UTC(kstYear, kstMonth, kstDay - 1, 23, 0, 0, 0));
    // UTC로 변환 (KST - 9시간)
    return prevDayKST.getTime() - 9 * 60 * 60 * 1000;
}

```

## FILE: functions\lib\shared\validate.js
```js
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reqString = reqString;
exports.optString = optString;
exports.reqArray = reqArray;
exports.reqNumber = reqNumber;
exports.optNumber = optNumber;
exports.reqBoolean = reqBoolean;
exports.optBoolean = optBoolean;
exports.reqTimestamp = reqTimestamp;
exports.optTimestamp = optTimestamp;
exports.reqDate = reqDate;
exports.optDate = optDate;
const errors_1 = require("./errors");
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
function reqString(v, field, min = 1, max = 2000) {
    if (typeof v !== 'string')
        throw errors_1.Err.invalidArgument(`${field} must be a string`);
    const s = v.trim();
    if (s.length < min)
        throw errors_1.Err.invalidArgument(`${field} is required (min ${min} chars)`);
    if (s.length > max)
        throw errors_1.Err.invalidArgument(`${field} is too long (max ${max} chars)`);
    return s;
}
/**
 * 선택 문자열 검증 (null/undefined 허용)
 *
 * @example
 * const nickname = optString(data.nickname, 'nickname', 30);
 */
function optString(v, field, max = 2000) {
    if (v == null)
        return undefined;
    if (typeof v !== 'string')
        throw errors_1.Err.invalidArgument(`${field} must be a string`);
    const s = v.trim();
    if (!s)
        return undefined;
    if (s.length > max)
        throw errors_1.Err.invalidArgument(`${field} is too long (max ${max} chars)`);
    return s;
}
/**
 * 필수 배열 검증
 *
 * @example
 * const recorderIds = reqArray<string>(data.recorderUserIds, 'recorderUserIds', 10);
 */
function reqArray(v, field, maxLen = 50) {
    if (!Array.isArray(v))
        throw errors_1.Err.invalidArgument(`${field} must be an array`);
    if (v.length > maxLen)
        throw errors_1.Err.invalidArgument(`${field} too many items (max ${maxLen})`);
    return v;
}
/**
 * 필수 숫자 검증
 *
 * @example
 * const amount = reqNumber(data.amount, 'amount', 0, 1000000000);
 */
function reqNumber(v, field, min, max) {
    if (typeof v !== 'number' || !Number.isFinite(v)) {
        throw errors_1.Err.invalidArgument(`${field} must be a number`);
    }
    if (min !== undefined && v < min) {
        throw errors_1.Err.invalidArgument(`${field} must be >= ${min}`);
    }
    if (max !== undefined && v > max) {
        throw errors_1.Err.invalidArgument(`${field} must be <= ${max}`);
    }
    return v;
}
/**
 * 선택 숫자 검증 (null/undefined 허용)
 *
 * @example
 * const maxUses = optNumber(data.maxUses, 'maxUses', 1, 9999);
 */
function optNumber(v, field, min, max) {
    if (v == null)
        return undefined;
    return reqNumber(v, field, min, max);
}
/**
 * 필수 불리언 검증
 *
 * @example
 * const pinned = reqBoolean(data.pinned, 'pinned');
 */
function reqBoolean(v, field) {
    if (typeof v !== 'boolean')
        throw errors_1.Err.invalidArgument(`${field} must be a boolean`);
    return v;
}
/**
 * 선택 불리언 검증 (null/undefined 허용, 기본값 반환)
 *
 * @example
 * const anonymous = optBoolean(data.anonymous, 'anonymous', false);
 */
function optBoolean(v, field, defaultValue = false) {
    if (v == null)
        return defaultValue;
    if (typeof v !== 'boolean')
        throw errors_1.Err.invalidArgument(`${field} must be a boolean`);
    return v;
}
/**
 * 타임스탬프(밀리초) 검증 및 정규화
 *
 * @example
 * const startAtMillis = reqTimestamp(data.startAtMillis, 'startAtMillis');
 */
function reqTimestamp(v, field) {
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
function optTimestamp(v, field) {
    if (v == null)
        return undefined;
    return reqTimestamp(v, field);
}
/**
 * 날짜 문자열 검증 (ISO 8601 형식 또는 타임스탬프)
 * Date 객체로 변환하여 반환
 *
 * @example
 * const startDate = reqDate(data.startDate, 'startDate');
 */
function reqDate(v, field) {
    if (v instanceof Date) {
        if (isNaN(v.getTime()))
            throw errors_1.Err.invalidArgument(`${field} is not a valid date`);
        return v;
    }
    if (typeof v === 'string') {
        const date = new Date(v);
        if (isNaN(date.getTime()))
            throw errors_1.Err.invalidArgument(`${field} is not a valid date string`);
        return date;
    }
    if (typeof v === 'number') {
        const date = new Date(reqTimestamp(v, field));
        if (isNaN(date.getTime()))
            throw errors_1.Err.invalidArgument(`${field} is not a valid timestamp`);
        return date;
    }
    throw errors_1.Err.invalidArgument(`${field} must be a Date, timestamp (number), or date string`);
}
/**
 * 선택 날짜 검증
 *
 * @example
 * const expiresAt = optDate(data.expiresAt, 'expiresAt');
 */
function optDate(v, field) {
    if (v == null)
        return undefined;
    return reqDate(v, field);
}

```

## FILE: functions\package.json
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
    "firebase-admin": "^12.6.0",
    "firebase-functions": "^4.7.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^20.11.24"
  },
  "private": true
}


```

## FILE: functions\src\callables\events.ts
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
  await requireRole(clubId, uid, ['PRESIDENT', 'DIRECTOR', 'ADMIN']);

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

  // μATOM-0532: voteCloseAt 계산(전날 23:00 KST) 서버 확정
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

## FILE: functions\src\callables\members.ts
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

## FILE: functions\src\callables\notices.ts
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
      if (!['PRESIDENT', 'DIRECTOR', 'ADMIN'].includes(role)) {
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

## FILE: functions\src\callables\tokens.ts
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
 *   clubId: 'default-club',
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

## FILE: functions\src\index.ts
```ts
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

// Export callables
export * from './callables/members';
export * from './callables/notices';
export * from './callables/tokens';
export * from './callables/events'; // μATOM-0531: createEventPost

// Export scheduled functions
export * from './scheduled/closeEventVotes'; // μATOM-0541: closeEventVotes


```

## FILE: functions\src\scheduled\closeEventVotes.ts
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

## FILE: functions\src\shared\audit.ts
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
  | 'FCM_TOKEN_DELETE';

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
 *   clubId: 'default-club',
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
 *   clubId: 'default-club',
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
 *   clubId: 'default-club',
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

## FILE: functions\src\shared\auth.ts
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

## FILE: functions\src\shared\errors.ts
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

## FILE: functions\src\shared\fcm.ts
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
 * await upsertFcmToken('default-club', 'user123', 'fcm_token_string', 'web');
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
    .where('role', 'in', ['PRESIDENT', 'DIRECTOR', 'ADMIN'])
    .get();
  
  return membersSnap.docs.map((doc) => doc.id);
}

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
 * await sendToClub('default-club', {
 *   title: '새 공지사항',
 *   body: '중요한 공지가 등록되었습니다.',
 *   data: { postId: 'xyz', type: 'notice' },
 * });
 * 
 * @example
 * // 관리자에게만 발송
 * await sendToClub('default-club', {
 *   title: '출석 투표 마감',
 *   body: '오늘 일정의 출석 투표가 마감되었습니다.',
 * }, 'admins');
 * 
 * @example
 * // 특정 사용자들에게만 발송
 * await sendToClub('default-club', {
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

## FILE: functions\src\shared\idempotency.ts
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

## FILE: functions\src\shared\paths.ts
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


```

## FILE: functions\src\shared\time.ts
```ts
/**
 * 시간 계산 유틸리티
 * 
 * PRD v1.0 정책: 출석 투표 마감은 "시작일 전날 23:00" (KST 기준)
 */

/**
 * 투표 마감 시간 계산 (KST 기준: 시작일 전날 23:00)
 * 
 * 정책: 일정 시작일 전날 23:00 KST에 출석 투표 마감
 * 
 * @param startAtMillis 시작일 타임스탬프 (밀리초, UTC)
 * @returns voteCloseAt 타임스탬프 (밀리초, UTC)
 * 
 * @example
 * const startAt = Date.parse('2025-12-20T10:00:00+09:00'); // 2025년 12월 20일 10:00 KST
 * const voteCloseAt = computeVoteCloseAtKST(startAt);
 * // 결과: 2025년 12월 19일 23:00 KST (UTC로 변환된 타임스탬프)
 */
export function computeVoteCloseAtKST(startAtMillis: number): number {
  // 정책: 시작일 전날 23:00 (KST 고정)
  // 
  // 로직:
  // 1. UTC 타임스탬프를 KST로 변환하여 날짜 추출
  // 2. 시작일의 전날을 계산 (KST 기준)
  // 3. 전날 23:00 KST를 UTC 타임스탬프로 변환하여 반환
  //
  // KST = UTC + 9시간
  // KST 00:00 = UTC 15:00 (전날)
  // KST 23:00 = UTC 14:00 (같은 날)

  const start = new Date(startAtMillis);
  
  // KST 시간으로 변환 (UTC + 9시간)
  const kstTime = start.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstTime);
  
  // KST 기준 연도/월/일 추출
  const kstYear = kstDate.getUTCFullYear();
  const kstMonth = kstDate.getUTCMonth();
  const kstDay = kstDate.getUTCDate();
  
  // 전날 계산 (KST 기준)
  const prevDayKST = new Date(Date.UTC(kstYear, kstMonth, kstDay - 1, 23, 0, 0, 0));
  
  // UTC로 변환 (KST - 9시간)
  return prevDayKST.getTime() - 9 * 60 * 60 * 1000;
}


```

## FILE: functions\src\shared\validate.ts
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

## FILE: functions\tsconfig.json
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

