# Repo Snapshot (Wings PWA v1.1)

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

## git log -n 30 --oneline (원문)
```
fa50621 (HEAD -> feat/atom-14-17-board-comments-notice, origin/feat/atom-14-17-board-comments-notice) feat: Wings Baseball Club PWA v1.1 MVP 리셋 및 구현 완료 (P0-P6)
40d929c (origin/main, main, feat/atom-12-13-fcm-token-registration, feat/atom-11-firestore-rules-v1, feat/atom-08-09-10-access-gate-member-management, feat/atom-05-06-07-audit-idempotency-fcm, feat/atom-02-03-shared-utils, feat/atom-00-01-scaffolding) WIP: fix TS issues and refine pages
5c9c829 WIP: update app pages and Firebase config
a21b481 refactor: Remove invite system, fix admin permissions, and update COOP policy
226a6bc Polish admin, post flows, and Firebase config
a87da8d Refine UI, Firebase flows, and branding
1c4f72d Update app flows, Firebase docs, and assets
bb035b5 Add full code export docs and improvements
3f0d779 Update Firebase integration and admin features
f45a148 Initial commit
```

## 루트 목록 (ls -la 상당, Windows PowerShell)
```
(Get-ChildItem -Force) 출력은 VS Code 터미널로 확인 가능. 주요 항목:
ATOMIC_ANALYSIS_REPORT.md, firebase.json, firestore.rules, index.html, package.json, public/, src/, functions/, tests/
```

## Tree (Depth <= 4, 주요 디렉토리)
```
src/ (app/, lib/, styles/)
functions/ (src/callables, src/scheduled, src/shared)
public/ (manifest.json, sw.js)
tests/ (rules/, e2e/)
```

## 핵심 파일 존재 체크
```
✔ firebase.json
✔ firestore.rules
✔ index.html
✔ public/manifest.json
✔ public/sw.js
✔ src/app/App.tsx
✔ tests/rules/firestore.rules.test.ts
✔ functions/src/index.ts
```

## 라우팅/탭/진입점 후보 목록
- 엔트리: src/main.tsx, src/app/App.tsx
- 탭: BottomNav 렌더 기준(home, boards, my)
- 페이지: src/app/pages/** (HomePage, BoardsPage, MyPage, SettingsPage, NotificationPage, AdminPage, InstallPage 등)

[이 파일이 커버하는 범위]
- 레포 상태/로그의 원문 스냅샷
- 디렉토리 트리와 핵심 파일 존재 확인
- 라우팅/탭/진입점 경로 목록
