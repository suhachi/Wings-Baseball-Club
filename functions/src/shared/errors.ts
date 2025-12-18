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

