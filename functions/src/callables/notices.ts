import { onCall } from 'firebase-functions/v2/https';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { requireAuth, requireRole } from '../shared/auth';
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
 */
export const createNoticeWithPush = onCall(async (req) => {
  const uid = requireAuth(req);
  const clubId = reqString(req.data?.clubId, 'clubId', 3, 64);
  const title = reqString(req.data?.title, 'title', 1, 200);
  const content = reqString(req.data?.content, 'content', 1, 5000);
  const pinned = optBoolean(req.data?.pinned, 'pinned') ?? false;
  const requestId = reqString(req.data?.requestId, 'requestId', 1, 128); // 필수 (멱등성용)

  // adminLike 권한 확인
  await requireRole(clubId, uid, ['PRESIDENT', 'DIRECTOR', 'ADMIN']);

  // 멱등성 키 생성
  const idempotencyKey = `notice:${clubId}:${requestId}`;

  return withIdempotency(clubId, idempotencyKey, async () => {
    const db = getFirestore();

    // 1. 공지 게시글 생성
    const postData = {
      type: 'notice',
      title,
      content,
      authorId: uid,
      authorName: '', // 나중에 members에서 조회하여 채워넣기
      authorPhotoURL: null,
      pinned,
      pushStatus: 'PENDING' as const,
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

        // 성공 (sent > 0) 또는 실패했지만 재시도 횟수 초과
        if (pushResult && (pushResult.sent > 0 || attempt === maxRetries)) {
          break;
        }

        // 실패했지만 재시도 가능
        if (attempt < maxRetries) {
          // 1초 대기 후 재시도
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        console.error(`푸시 발송 실패 (시도 ${attempt}/${maxRetries}):`, error);
        pushError = error.message || String(error);

        if (attempt === maxRetries) {
          // 최종 실패
          break;
        }

        // 재시도 전 대기
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
