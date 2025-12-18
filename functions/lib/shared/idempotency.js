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
