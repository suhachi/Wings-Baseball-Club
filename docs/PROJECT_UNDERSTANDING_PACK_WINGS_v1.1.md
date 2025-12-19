# Wings Baseball Club PWA — Project Understanding Pack (v1.1)

## 1. Overview
- 목적: v1.1 구현 결과의 전면적 이해/감사/재현을 위한 단일 문서 팩
- 범위: 리포지토리 상태, 빌드/타입체크 출력, Firebase 설정/보안 규칙, 소스 트리/핵심 파일, 전체 소스 덤프(점진 추가)
- 스택: React 18 + TypeScript + Vite + Tailwind v4, Firebase (Auth/Firestore/Storage), PWA(Service Worker/Manifest)
- 라우팅: 커스텀 state 기반. App에서 `currentPage`로 처리 (react-router-dom 사용하지 않음)

---

## 2. Repository Status & Recent History
### 2.1 Branch Status (git status -sb)
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

### 2.2 Recent Commits (git log -n 30 --oneline)
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

---

## 3. Build & Type-Check Evidence
### 3.1 Type-Check (`npm run type-check`)
```
> @figma/my-make-file@0.0.1 type-check
> tsc --noEmit
```
(에러 없음)

### 3.2 Build (`npm run build`)
```
vite v6.3.5 building for production...
✓ 2905 modules transformed.
[plugin vite:reporter]
(!) D:/projectsing/Wings Baseball Club Community PWA/src/lib/firebase/auth.service.ts is dynamically imported by D:/projectsing/Wings Baseball Club Community PWA/src/app/pages/LoginPage.tsx but also statically imported by D:/projectsing/Wings Baseball Club Community PWA/src/app/contexts/AuthContext.tsx, D:/projectsing/Wings Baseball Club Community PWA/src/app/pages/LoginPage.tsx, dynamic import will not move module into another chunk.

dist/index.html                     1.28 kB │ gzip:   0.63 kB
dist/assets/index-DVOnlRss.css    129.03 kB │ gzip:  19.39 kB
dist/assets/index-Du_I5nir.js   1,168.38 kB │ gzip: 306.23 kB

(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 10.51s
```

요약: 빌드 성공, 청크 크기 경고는 정보 차원의 권고사항.

---

## 4. Firebase Config & Security Rules
### 4.1 firebase.json
```json
{
  "firestore": {"rules": "firestore.rules"},
  "functions": {"source": "functions", "runtime": "nodejs20"},
  "hosting": {"public": "dist", "ignore": ["firebase.json","**/.*","**/node_modules/**"], "rewrites": [{"source":"**","destination":"/index.html"}]},
  "emulators": {"auth": {"port":9099}, "firestore": {"port":8080}, "functions": {"port":5001}, "ui": {"enabled": true, "port": 4000}, "singleProjectMode": true}
}
```

### 4.2 firestore.rules (요약/전문)
- 핵심 정책:
  - `isActiveMember`만 클럽/게시글/댓글/출석 읽기 허용
  - 게시글 생성: 클라이언트는 `free`만 허용; `notice`/`event`는 Functions 전용
  - 게시글 수정/삭제: 작성자 또는 `isAdminLike`
  - 댓글: 작성자 또는 `isAdminLike`
  - 출석(attendance): 본인만 write + `voteClosed == false`일 때만
  - `members/{memberId}/tokens`, `/audit`, `/idempotency`: 클라이언트 read/write 금지 (Functions-only)

```text
[전문은 리포지토리의 firestore.rules 참조]
```

---

## 5. PWA Assets & Entrypoints
### 5.1 index.html
```html
<!DOCTYPE html>
<html lang="ko"> ... (생략) ... </html>
```

### 5.2 public/manifest.json
```json
{
  "name": "WINGS BASEBALL CLUB",
  "short_name": "WINGS",
  "description": "윙스 야구동호회 커뮤니티",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#2563eb",
  "theme_color": "#2563eb",
  "orientation": "portrait",
  "icons": [ { "src": "/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable" }, ... ]
}
```

### 5.3 public/sw.js (요약)
- Install/Activate/Fetch 캐시 전략
- Firebase 관련 요청은 네트워크 우선
- 정적 자산은 캐시 우선, 동적 캐시 저장
- FCM Background `push` / `notificationclick` 핸들러 포함

```js
// 전문은 리포지토리의 public/sw.js 참조
```

---

## 6. App Entrypoint & Routing
### 6.1 src/main.tsx (요약)
- AbortError 억제, Vite preview 경고 억제 래퍼
- `ReactDOM.createRoot(...).render(<App />)`

### 6.2 src/app/App.tsx (요약)
- 멤버 상태 가드(`memberStatus`): denied/checking/active 처리
- state 기반 라우팅: `currentPage`로 페이지 전환
- `/install` path 직접 처리
- `TopBar`, `BottomNav`, `InstallPrompt`, `Toaster` 포함

전문 파일 링크:
- [src/main.tsx](../src/main.tsx)
- [src/app/App.tsx](../src/app/App.tsx)

---

## 7. Tooling & Config
- 빌드: [vite.config.ts](../vite.config.ts)
- 패키지: [package.json](../package.json)
- Firebase 설정: [firebase.json](../firebase.json)
- 보안 규칙: [firestore.rules](../firestore.rules)
- HTML 엔트리: [index.html](../index.html)
- PWA 자산: [public/manifest.json](../public/manifest.json), [public/sw.js](../public/sw.js)

---

## 8. Source Code Dump (Plan)
- 대상: `src/**`, `public/**`, `tests/**`, `scripts/**`, 루트 설정 파일들
- 제외: `node_modules/**`, `dist/**`, `.git/**`, `.firebase/**`
- 방식: 파일별 섹션으로 헤더와 경로 표기 후 코드 블록 삽입
- 크기: 매우 큼 → 문서 하단에 점진적으로 추가/업데이트

다음 커밋에서 전체 소스 덤프를 문서 하단에 순차 삽입합니다.
