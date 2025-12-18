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

