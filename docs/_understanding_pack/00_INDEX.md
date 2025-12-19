# Project Understanding Pack — Index (Wings PWA v1.1)

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

## 파일 목록과 목적
- 00_INDEX.md: 전체 내비게이션, 범위 요약, 재현 커맨드
- 01_REPO_SNAPSHOT.md: 레포 상태 증거(상태/로그/트리/핵심파일 존재)
- 02_BUILD_AND_TEST_EVIDENCE.md: 빌드/타입체크/Functions/Rules 테스트 원문 로그
- 03_FIREBASE_CONFIG_AND_SECURITY.md: Firebase 구성 및 보안 규칙 전문 + 라인 근거 요약
- 04_FUNCTIONS_MAP.md: Functions 엔트리/콜러블/스케줄러/시간계산 구현 근거 포함 맵
- 05_FRONTEND_ARCHITECTURE.md: 프론트 구조/탭/라우팅/Access Gate/FCM 흐름 근거
- 06_SCHEMA_AS_IMPLEMENTED.md: 실제 스키마(컬렉션/필드)와 파일 근거 매핑
- 90_FULL_SOURCE_DUMP_ROOT.md: 루트/설정/공용 파일 원문 100% 덤프
- 91_FULL_SOURCE_DUMP_SRC.md: src/** 전체 원문 100% 덤프
- 92_FULL_SOURCE_DUMP_FUNCTIONS.md: functions/** 전체 원문 100% 덤프
- 93_FULL_SOURCE_DUMP_TESTS.md: tests/** 전체 원문 100% 덤프
- 99_KNOWN_LIMITATIONS_AND_NEXT_HOOKS.md: 사실 기반 한계/리스크/다음 훅 포인트

## 프로젝트 요약 (v1.1)
- 기능: 멤버 전용 커뮤니티(PWA), 공지/자유/이벤트 게시, 출석 투표(YES/NO/MAYBE), 푸시(Foreground/Background), 관리자용 공지/이벤트 작성(Functions 경유), 스케줄러 기반 마감 처리
- 제외 범위: 경기 기록/재무/초대 시스템 등 비핵심 모듈 (레포 파일 근거 참조)
- 핵심 정책:
  - Access Gate: `memberStatus`가 active인 멤버만 접근 (근거: src/app/App.tsx)
  - Functions 경유 쓰기: notice/event 생성은 클라이언트 금지, callable 전용 (근거: firestore.rules)
  - voteCloseAt: 시작일 전날 23:00 KST (근거: functions/src/shared/time.ts)
  - FCM 2종: 공지/마감 알림 (근거: callables/notices.ts, scheduled/closeEventVotes.ts)

## “어디서 답을 찾나” 매핑
- 배포/빌드 재현: 02_BUILD_AND_TEST_EVIDENCE.md
- 규칙/보안 모델: 03_FIREBASE_CONFIG_AND_SECURITY.md
- 서버 함수 전체/흐름: 04_FUNCTIONS_MAP.md, 92_FULL_SOURCE_DUMP_FUNCTIONS.md
- 클라이언트 라우팅/탭/화면: 05_FRONTEND_ARCHITECTURE.md, 91_FULL_SOURCE_DUMP_SRC.md
- 스키마/필드: 06_SCHEMA_AS_IMPLEMENTED.md
- 전체 소스: 90~93_* FULL_SOURCE_* 파일들

## 재현 커맨드 요약
```powershell
# 타입체크
npx tsc --noEmit

# 프런트 빌드
npm run build

# Functions 빌드
cd functions
npm run build
cd ..

# Rules 테스트 (에뮬레이터)
npx firebase --version
node -v
npx firebase emulators:exec --only firestore,auth "npm run test:rules"
```

[이 파일이 커버하는 범위]
- 전체 산출물 맵과 탐색 가이드
- 프로젝트 핵심 정책과 근거 파일 연결
- 재현 커맨드 요약
