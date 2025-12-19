import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { sendToClub } from '../shared/fcm';
import { withIdempotency } from '../shared/idempotency';
import { postCol } from '../shared/paths';

/**
 * 이벤트 투표 마감 스케줄러
 * 
 * μATOM-0541: scheduled closeEventVotes 쿼리
 * μATOM-0542: voteClosed=true, voteClosedAt 기록(멱등)
 * μATOM-0543: 마감 푸시 발송(필수)
 * μATOM-0544: idempotency 키 적용
 * 
 * 실행 주기: 5분마다 (Cloud Scheduler)
 * 
 * 로직:
 * 1. voteCloseAt <= now && voteClosed==false인 게시글 조회
 * 2. 각 게시글에 대해:
 *    - 멱등성 키로 중복 실행 방지
 *    - voteClosed=true, voteClosedAt=now로 업데이트
 *    - 마감 푸시 발송 (필수)
 *    - attendanceSummary 집계
 */
export const closeEventVotes = onSchedule({
  schedule: 'every 5 minutes',
  timeZone: 'Asia/Seoul',
  region: 'asia-northeast3',
}, async (_event) => {
  const now = Timestamp.now();

  // μATOM-0541: scheduled closeEventVotes 쿼리
  // voteCloseAt <= now && voteClosed==false인 게시글 조회
  // 주의: 모든 클럽을 순회해야 함 (현재는 기본 클럽만 처리)
  const defaultClubId = 'default-club'; // TODO: 다중 클럽 지원 시 변경 필요

  const postsCol = postCol(defaultClubId);
  const query = postsCol
    .where('type', '==', 'event')
    .where('voteClosed', '==', false)
    .where('voteCloseAt', '<=', now);

  const snapshot = await query.get();

  if (snapshot.empty) {
    console.log('마감할 이벤트가 없습니다');
    return;
  }

  console.log(`마감할 이벤트 ${snapshot.size}개 발견`);

  const results = await Promise.allSettled(
    snapshot.docs.map(async (doc) => {
      const postId = doc.id;
      const postData = doc.data();

      // μATOM-0544: idempotency 키 적용
      const idempotencyKey = `closeEventVote:${defaultClubId}:${postId}`;

      return withIdempotency(defaultClubId, idempotencyKey, async () => {
        // μATOM-0542: voteClosed=true, voteClosedAt 기록(멱등)
        await doc.ref.update({
          voteClosed: true,
          voteClosedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        // attendanceSummary 집계 (선택적, 클라이언트에서도 계산 가능)
        const attendancesSnap = await doc.ref.collection('attendance').get();
        let attending = 0;
        let absent = 0;
        let maybe = 0;

        attendancesSnap.forEach((attendanceDoc) => {
          const status = attendanceDoc.data().status;
          if (status === 'attending') attending++;
          else if (status === 'absent') absent++;
          else if (status === 'maybe') maybe++;
        });

        await doc.ref.update({
          attendanceSummary: {
            attending,
            absent,
            maybe,
          },
        });

        // μATOM-0543: 마감 푸시 발송(필수)
        try {
          const pushResult = await sendToClub(
            defaultClubId,
            {
              title: `[일정 마감] ${postData.title}`,
              body: '출석 투표가 마감되었습니다. 결과를 확인해보세요.',
              data: {
                type: 'event',
                postId,
                eventType: 'vote_closed',
              },
            },
            'all'
          );

          console.log(`이벤트 ${postId} 마감 처리 완료. 푸시 발송: ${pushResult.sent}건 성공, ${pushResult.failed}건 실패`);
        } catch (error: any) {
          console.error(`이벤트 ${postId} 마감 푸시 발송 실패:`, error);
          // 푸시 실패해도 마감 처리 itself는 완료 (정책 고정)
        }

        return { postId, success: true };
      });
    })
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  console.log(`마감 처리 완료: ${successful}건 성공, ${failed}건 실패`);
});
