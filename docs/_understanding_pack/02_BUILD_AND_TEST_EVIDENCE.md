# Build & Test Evidence (Wings PWA v1.1)

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

## 환경 버전
```
node -v => v22.19.0
npx firebase --version => 13.29.1
PowerShell => 5.1.22621.4249
```

## 1) Type-Check
명령:
```powershell
npx tsc --noEmit
```
출력(원문):
```
(에러 없음, 종료 코드 0)
```

## 2) Frontend Build
명령:
```powershell
npm run build
```
출력(원문):
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
종합: 성공 (종료 코드 0)

## 3) Functions Build
명령:
```powershell
cd functions
npm run build
```
출력(원문):
```
> functions@1.0.0 build
> tsc
```
종합: 출력 상 오류 없음 (종료 코드 0)

## 4) Rules Tests (Emulators)
명령:
```powershell
npx firebase emulators:exec --only firestore,auth "npm run test:rules"
```
출력(원문 요약):
```
FAIL  tests/rules/firestore.rules.test.ts (12.073 s)
  Firestore Rules Tests
    √ μATOM-0602: 비멤버 read 차단 (1868 ms)
    √ μATOM-0603: inactive 차단 (482 ms)
    √ μATOM-0604: notice 클라 write 차단 (730 ms)
    √ μATOM-0605: event 클라 write 차단 (135 ms)
    × μATOM-0606: free 작성자만 update/delete (298 ms)
    √ μATOM-0607: comments 작성자만 update/delete (210 ms)
    √ μATOM-0608: attendance 본인만 write (198 ms)
    √ μATOM-0609: voteClosed 이후 attendance write 차단 (151 ms)

  ● μATOM-0606 실패 원문
    FirebaseError: 7 PERMISSION_DENIED:
    false for 'update' @ L39, evaluation error at L111:26 for 'update' @ L111, false for 'update' @ L39, false for 'update' @ L111

Test Suites: 1 failed, 1 total
Tests:       1 failed, 7 passed, 8 total
Snapshots:   0 total
Time:        14.735 s
Ran all test suites matching /tests\\rules\\firestore.rules.test.ts/i.
!  Script exited unsuccessfully (code 1)
```
종합: 실패 (종료 코드 1). 상세 원인은 03_FIREBASE_CONFIG_AND_SECURITY.md에서 라인 근거와 함께 교차 참조.

[이 파일이 커버하는 범위]
- 타입체크/빌드/Functions/Rules 테스트의 원문 로그
- 실행 커맨드와 환경 버전
- 실패 케이스는 사실대로 기록, 추측 없이 근거 제공
