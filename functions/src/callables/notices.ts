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
