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
