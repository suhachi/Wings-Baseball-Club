# Cloud Functions Map (Wings PWA v1.1)

[공통 헤더]
- 생성일시(KST): 2025-12-19
- 브랜치: feat/atom-14-17-board-comments-notice
- 생성자: GitHub Copilot (READ-ONLY 모드)
- 민감정보 마스킹: 프로젝트ID/도메인/토큰 등은 **** 처리
- git status -sb:
```
## feat/atom-14-17-board-comments-notice
 M .firebase/hosting.ZGlzdA.cache
 D jest.config.js
 M package-lock.json
 M package.json
 M src/app/components/CreatePostModal.tsx
 M tests/rules/firestore.rules.test.ts
?? docs/ADMIN_MANUAL_v1.1.md
?? jest.config.cjs
?? scripts/post_v1.1_announcement.cjs
?? scripts/post_v1.1_announcement.js
```

## index.ts (전문)
```ts
import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

// Export callables
export * from './callables/members';
export * from './callables/notices';
export * from './callables/tokens';
export * from './callables/events'; // μATOM-0531: createEventPost

// Export scheduled functions
export * from './scheduled/closeEventVotes'; // μATOM-0541: closeEventVotes
```

## Callables 목록
- createEventPost (근거: functions/src/callables/events.ts)
  - 트리거: onCall (region: asia-northeast3)
  - 권한검사: `requireAuth` + `requireRole(clubId, uid, ['PRESIDENT','DIRECTOR','ADMIN'])`
  - 입력: `clubId`, `eventType`(PRACTICE|GAME), `title`, `content`, `startAt`, `place`, `opponent?`, `requestId`
  - 로직: voteCloseAt=전날 23:00 KST(`computeVoteCloseAtKST` 근거), post 생성(voteClosed=false, attendanceSummary 0), Audit `EVENT_CREATE`
  - 반환: `{ success: true, postId, voteCloseAt }`
  - 라인 근거: 파일 상단 주석(μATOM-0531~0533), `requireRole`, `computeVoteCloseAtKST`, `postCol`, `writeAudit`

- createNoticeWithPush 등(notices.ts) — 공지 생성+푸시(라인 근거는 해당 파일 전문에서 확인 필요)
- tokens 관련 callable(tokens.ts) — 토큰 등록/관리(Functions-only 정책과 일치)
- members 관련 callable(members.ts) — 멤버 관련 서버 작업

## Scheduled: closeEventVotes (전문)
```ts
export const closeEventVotes = onSchedule({
  schedule: 'every 5 minutes',
  timeZone: 'Asia/Seoul',
  region: 'asia-northeast3',
}, async (_event) => {
  const now = Timestamp.now();
  const defaultClubId = 'default-club'; // TODO: 다중 클럽 지원 시 변경 필요
  const postsCol = postCol(defaultClubId);
  const query = postsCol
    .where('type', '==', 'event')
    .where('voteClosed', '==', false)
    .where('voteCloseAt', '<=', now);
  const snapshot = await query.get();
  if (snapshot.empty) { console.log('마감할 이벤트가 없습니다'); return; }
  const results = await Promise.allSettled(snapshot.docs.map(async (doc) => {
    const postId = doc.id; const postData = doc.data();
    const idempotencyKey = `closeEventVote:${defaultClubId}:${postId}`; // withIdempotency
    return withIdempotency(defaultClubId, idempotencyKey, async () => {
      await doc.ref.update({ voteClosed: true, voteClosedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() });
      // attendanceSummary 집계
      const attendancesSnap = await doc.ref.collection('attendance').get();
      let attending = 0, absent = 0, maybe = 0;
      attendancesSnap.forEach((a) => { const s = a.data().status; if (s==='attending') attending++; else if (s==='absent') absent++; else if (s==='maybe') maybe++; });
      await doc.ref.update({ attendanceSummary: { attending, absent, maybe } });
      // 마감 푸시 발송
      try { const pushResult = await sendToClub(defaultClubId, { title: `[일정 마감] ${postData.title}`, body: '출석 투표가 마감되었습니다. 결과를 확인해보세요.', data: { type: 'event', postId, eventType: 'vote_closed' } }, 'all');
        console.log(`이벤트 ${postId} 마감 처리 완료. 푸시 발송: ${pushResult.sent}건 성공, ${pushResult.failed}건 실패`);
      } catch (error) { console.error(`이벤트 ${postId} 마감 푸시 발송 실패:`, error); }
      return { postId, success: true };
    });
  }));
  const successful = results.filter((r) => r.status === 'fulfilled').length; const failed = results.filter((r) => r.status === 'rejected').length;
  console.log(`마감 처리 완료: ${successful}건 성공, ${failed}건 실패`);
});
```
- 스케줄/타임존: `every 5 minutes`, `Asia/Seoul` (근거: onSchedule 옵션)
- 멱등성: `withIdempotency(defaultClubId, idempotencyKey, ...)` 사용 (근거: 코드)
- 푸시 흐름: `sendToClub(defaultClubId, payload, 'all')` 호출 (근거: 코드)

## voteCloseAt 계산 함수 (전문)
```ts
export function computeVoteCloseAtKST(startAtMillis: number): number {
  const start = new Date(startAtMillis);
  const kstTime = start.getTime() + 9 * 60 * 60 * 1000;
  const kstDate = new Date(kstTime);
  const kstYear = kstDate.getUTCFullYear();
  const kstMonth = kstDate.getUTCMonth();
  const kstDay = kstDate.getUTCDate();
  const prevDayKST = new Date(Date.UTC(kstYear, kstMonth, kstDay - 1, 23, 0, 0, 0));
  return prevDayKST.getTime() - 9 * 60 * 60 * 1000;
}
```
- 설명: 시작일(UTC)을 KST(+9h) 기준 날짜로 변환 → 전날 23:00(KST) → 다시 UTC millis로 환산
- 근거 라인: functions/src/shared/time.ts 전부

[이 파일이 커버하는 범위]
- Functions 엔트리/콜러블/스케줄러 구조와 근거
- voteCloseAt 계산 전문과 정책 설명
- 멱등성/푸시 흐름 라인 근거
