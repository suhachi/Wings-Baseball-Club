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
exports.createEventPost = (0, https_1.onCall)(async (req) => {
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
