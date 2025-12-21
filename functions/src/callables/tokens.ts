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
 *   clubId: 'WINGS',
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
