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
export const setMemberRole = onCall(async (req) => {
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
export const setMemberProfileByAdmin = onCall(async (req) => {
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
