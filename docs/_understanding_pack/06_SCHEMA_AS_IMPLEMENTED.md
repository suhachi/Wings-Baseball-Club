# Firestore Schema (As Implemented) — Wings PWA v1.1

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

## 컬렉션 트리 (클럽 기준)
- clubs/{clubId}
  - members/{memberId}
    - tokens/{tokenId}
  - posts/{postId}
    - comments/{commentId}
    - attendance/{userId}
  - audit/{docId}
  - idempotency/{docId}

## 엔티티별 필드 키 (근거 파일 경로)
- members: (근거: 클라이언트 컨텍스트/멤버 조회, functions에서 authorName/photoURL 참조)
  - role, status(active), realName, photoURL, createdAt, updatedAt
- posts: (근거: functions/src/callables/events.ts — 생성 시 세팅 필드)
  - type(event|free|notice), eventType(PRACTICE|GAME), title, content
  - authorId, authorName, authorPhotoURL
  - startAt(Date), place, opponent?
  - voteCloseAt(Date), voteClosed(boolean), voteClosedAt?
  - attendanceSummary: { attending, absent, maybe }
  - createdAt, updatedAt
- comments: (근거: firestore.rules 정책과 UI 컴포넌트)
  - authorId, content, createdAt, updatedAt
- attendance: (근거: rules/클라 투표 UI)
  - status(attending|absent|maybe), updatedAt
- tokens: (근거: functions/src/shared/paths.ts)
  - token (문자열), platform, createdAt
- audit: (근거: writeAudit 호출)
  - action(EVENT_CREATE 등), actorUid, targetType, targetId, meta, createdAt
- idempotency: (근거: withIdempotency)
  - key, createdAt/ttl, lastResult

## 타임스탬프 타입 근거
- 서버시간: `FieldValue.serverTimestamp()` 사용 (근거: events.ts 생성/업데이트, scheduled/closeEventVotes.ts 업데이트)
- `startAt`: 최초 set 후 즉시 실제 Date로 update (근거: events.ts)

## 사용 위치 매핑 예시
- `voteClosed`: 클라 투표 UI 비활성 (PostDetailModal), rules에서 attendance write 제한
- `attendanceSummary`: UI 표시 및 closeEventVotes 집계 업데이트

[이 파일이 커버하는 범위]
- 실구현 컬렉션/필드 구조와 근거 파일
- 타임스탬프 타입과 출처
- 규칙/함수/클라 연결 매핑
