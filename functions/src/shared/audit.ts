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

