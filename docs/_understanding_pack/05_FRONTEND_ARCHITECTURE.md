# Frontend Architecture (Wings PWA v1.1)

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

## 앱 IA
- Bottom Tabs: home, boards, my (근거: src/app/App.tsx의 `activeTab` 및 `BottomNav` 렌더)
- Boards 탭 내 3분류: 공지/자유/이벤트 (근거: BoardsPage 구현)
- 주요 페이지: HomePage, BoardsPage, MyPage, SettingsPage, NotificationPage, AdminPage, InstallPage

## 라우팅 방식 (근거 라인)
- state 기반: `currentPage`로 분기 렌더 (근거: src/app/App.tsx)
- `/install` path 특례: `window.location.pathname === '/install'` 시 `currentPage='install'` (근거: App.tsx 상단 useEffect)
- 내비게이션: `handlePageChange(page)`로 state 전환, BottomNav는 탭 간 전환 반영 (근거: App.tsx 내 핸들러들)

## Access Gate 흐름 (근거 라인)
- `useAuth()`에서 `memberStatus` 활용: 'denied' → AccessDeniedPage, 'checking' → 로딩, 'active' → 정상 진입 (근거: App.tsx 중간 분기)
- 로그인 전: `!user && currentPage !== 'install'` → LoginPage (근거: App.tsx 로그인 분기)

## FCM 흐름 (근거 라인)
- 초기화 훅: `useFcm()` 호출(권한 확인/토큰 등록/포그라운드 수신) (근거: App.tsx 상단 `useFcm` 호출)
- 서비스 워커: public/sw.js (Install/Activate/Fetch/Push/notificationclick 구현)
- 토큰 저장 경로: Functions에서 `members/{uid}/tokens/{tokenId}` (클라 write 금지, callable 전용 — 근거: firestore.rules, functions/src/callables/tokens.ts)

## 주요 컴포넌트/페이지 역할 맵
- TopBar/BottomNav/InstallPrompt/Toaster: 공통 레이아웃/알림
- BoardsPage: 공지/자유/이벤트 리스트 렌더, 이벤트는 시작일 기준 정렬
- PostDetailModal: 이벤트 메타(시작일/장소/상대/마감시간), attendance 요약, 투표 UI(voteClosed 시 비활성)
- CreatePostModal: 이벤트 생성은 callable(`createEventPost`) 경유, 폼 검증 최소화(서버 확정)
- MyPage: FCM 권한/토큰 등록 UX, 재시도 버튼 제공

[이 파일이 커버하는 범위]
- 프론트 구조/탭/라우팅/Access Gate/FCM 흐름
- 실제 파일 경로/라인 근거 기반 요약
- 핵심 컴포넌트/페이지 역할 맵
