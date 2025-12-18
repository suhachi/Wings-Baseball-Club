# μATOM-0001 결과: 레포 트리 스냅샷 (READ-ONLY)

**수집 일시**: 2024년 (현재)  
**작업 방식**: READ-ONLY (코드 변경 없음)  
**근거**: 파일 경로, 디렉토리 구조, package.json 내용

---

## (A) 루트 구조 요약

### 작업 디렉토리
- **경로**: `D:\projectsing\Wings Baseball Club Community PWA`

### 주요 디렉토리 (루트 레벨)
```
.
├── .firebase/          (Firebase 캐시)
├── .git/              (Git 저장소)
├── .github/           (GitHub Actions/워크플로우)
├── dist/              (빌드 출력물)
├── docs/              (문서)
├── functions/         (Cloud Functions)
├── guidelines/        (가이드라인)
├── handoff_pack/      (인수인계 문서)
├── node_modules/      (의존성)
├── public/            (정적 파일)
├── scripts/           (스크립트)
└── src/               (소스 코드)
```

### 루트 파일 (주요 설정/문서)
- `package.json` ✅
- `tsconfig.json` ✅
- `vite.config.ts` ✅
- `firebase.json` ✅
- `.firebaserc` ✅
- `firestore.rules` ✅
- `firestore.indexes.json` ❌ (존재하지 않음)
- `index.html` ✅
- 다수의 `.md` 문서 파일 (리포트/문서)

---

## (B) 핵심 파일 체크(존재/경로)

| 파일/디렉토리 | 존재 여부 | 경로 |
|--------------|----------|------|
| `package.json` | ✅ | 루트 |
| `tsconfig.json` | ✅ | 루트 |
| `vite.config.ts` | ✅ | 루트 |
| `firebase.json` | ✅ | 루트 |
| `.firebaserc` | ✅ | 루트 |
| `firestore.rules` | ✅ | 루트 |
| `firestore.indexes.json` | ❌ | 없음 |
| `functions/` | ✅ | 루트 |
| `functions/package.json` | ✅ | `functions/` |
| `functions/src/` | ✅ | `functions/src/` |
| `src/` | ✅ | 루트 |
| `src/app/` | ✅ | `src/app/` |
| `src/lib/` | ✅ | `src/lib/` |
| `public/` | ✅ | 루트 |
| `index.html` | ✅ | 루트 |

---

## (C) package.json 스크립트/런타임 요약

### 루트 `package.json` 스크립트

| 스크립트 | 명령어 | 용도 |
|---------|--------|------|
| `build` | `vite build` | 프론트엔드 프로덕션 빌드 |
| `build:functions` | `cd functions && npm run build` | Functions 빌드 |
| `dev` | `vite` | 개발 서버 실행 |
| `export:code` | `node scripts/export-code-to-md.mjs` | 코드 문서화 |
| `type-check` | `tsc --noEmit` | TypeScript 타입 체크 |

### 루트 `package.json` 주요 의존성

**프레임워크/런타임:**
- `react`: 18.3.1
- `react-dom`: 18.3.1
- `vite`: 6.3.5 (devDependencies)

**UI 라이브러리:**
- `@radix-ui/*`: 다양한 UI 컴포넌트 (accordion, dialog, dropdown-menu, tabs 등)
- `@mui/material`: 7.3.5
- `@mui/icons-material`: 7.3.5
- `lucide-react`: 0.487.0 (아이콘)
- `motion`: 12.23.24 (애니메이션)

**Firebase:**
- `firebase`: ^12.7.0

**기타:**
- `sonner`: 2.0.3 (토스트)
- `date-fns`: 3.6.0 (날짜 처리)
- `react-hook-form`: 7.55.0 (폼 관리)
- `tailwind-merge`: 3.2.0 (Tailwind CSS 유틸)

**빌드 도구:**
- `@tailwindcss/vite`: 4.1.12
- `@vitejs/plugin-react`: 4.7.0
- `typescript`: ^5.2.2

### Functions `package.json` 스크립트

| 스크립트 | 명령어 | 용도 |
|---------|--------|------|
| `build` | `tsc` | TypeScript 컴파일 |
| `serve` | `npm run build && firebase emulators:start --only functions` | 에뮬레이터 실행 |
| `deploy` | `firebase deploy --only functions` | Functions 배포 |
| `logs` | `firebase functions:log` | 로그 확인 |

### Functions `package.json` 의존성

**Firebase:**
- `firebase-admin`: ^12.6.0
- `firebase-functions`: ^4.7.0

**개발 도구:**
- `typescript`: ^5.6.3
- `@types/node`: ^20.11.24

**런타임:**
- `node`: 20 (engines)

---

## (D) Functions 폴더 구조

### `functions/src/` 구조

```
functions/src/
├── callables/
│   ├── dues.ts          (회비 - v1.1 제외 대상)
│   ├── events.ts        (이벤트 - v1.1 유지)
│   ├── games.ts         (경기 기록 - v1.1 제외 대상)
│   ├── ledger.ts        (회계 - v1.1 제외 대상)
│   ├── members.ts       (멤버 관리 - v1.1 유지)
│   ├── notices.ts       (공지 - v1.1 유지)
│   ├── polls.ts         (투표 게시판 - v1.1 제외 대상)
│   └── tokens.ts         (FCM 토큰 - v1.1 유지)
├── scheduled/
│   └── closeEventVotes.ts  (마감 스케줄러 - v1.1 유지)
├── shared/
│   ├── audit.ts         (감사 로그)
│   ├── auth.ts          (인증/권한)
│   ├── errors.ts        (에러 처리)
│   ├── fcm.ts           (FCM 유틸)
│   ├── idempotency.ts   (멱등성)
│   ├── paths.ts         (경로 헬퍼)
│   ├── time.ts          (시간 처리)
│   └── validate.ts      (검증)
└── index.ts             (엔트리 포인트)
```

### `functions/src/index.ts` Export 현황

**현재 Export (활성):**
- `./callables/members`
- `./callables/notices`
- `./callables/tokens`
- `./scheduled/closeEventVotes`

**주석 처리됨 (미구현/제외 예정):**
- `./callables/events` (주석)
- `./callables/polls` (주석)
- `./callables/dues` (주석)
- `./callables/ledger` (주석)
- `./callables/games` (주석)

**참고:** `invites.ts`는 이미 제거됨 (파일 없음)

---

## (E) src/ 폴더 구조

### `src/app/` 구조

```
src/app/
├── App.tsx                    (메인 앱 컴포넌트 - 라우팅/탭 관리)
├── components/
│   ├── BottomNav.tsx          (하단 네비게이션 - 탭 컴포넌트)
│   ├── TopBar.tsx             (상단 바)
│   ├── CommentForm.tsx        (댓글 작성)
│   ├── CommentList.tsx        (댓글 리스트)
│   ├── CreateNoticeModal.tsx  (공지 작성 모달)
│   ├── CreatePostModal.tsx    (게시글 작성 모달)
│   ├── PostDetailModal.tsx    (게시글 상세)
│   ├── PollVoteModal.tsx      (투표 모달 - v1.1 제외 대상?)
│   ├── game-record/           (경기 기록 - v1.1 제외 대상)
│   │   ├── BatterTable.tsx
│   │   ├── PitcherTable.tsx
│   │   └── LineupEditor.tsx
│   └── ui/                    (shadcn/ui 컴포넌트)
├── contexts/
│   ├── AuthContext.tsx        (인증 컨텍스트)
│   ├── ClubContext.tsx        (클럽 컨텍스트)
│   ├── DataContext.tsx        (데이터 컨텍스트)
│   └── ThemeContext.tsx       (테마 컨텍스트)
├── hooks/
│   └── useFcm.ts             (FCM 훅)
└── pages/
    ├── LoginPage.tsx          (로그인)
    ├── AccessDeniedPage.tsx  (접근 거부)
    ├── HomePage.tsx           (홈)
    ├── BoardsPage.tsx         (게시판)
    ├── SchedulePage.tsx       (일정)
    ├── AlbumPage.tsx          (앨범 - v1.1 제외 대상)
    ├── FinancePage.tsx        (회계 - v1.1 제외 대상)
    ├── GameRecordPage.tsx     (경기 기록 - v1.1 제외 대상)
    ├── AdminPage.tsx          (관리자)
    ├── MyPage.tsx             (내정보)
    ├── SettingsPage.tsx       (설정)
    ├── NotificationPage.tsx   (알림)
    ├── MyActivityPage.tsx     (내 활동)
    ├── ApprovalPendingPage.tsx (승인 대기 - v1.1 제외 대상?)
    └── InstallPage.tsx         (설치 페이지)
```

### `src/lib/` 구조

```
src/lib/
├── constants/
│   └── app-info.ts
├── firebase/
│   ├── config.ts              (Firebase 설정)
│   ├── auth.service.ts        (인증 서비스)
│   ├── firestore.service.ts   (Firestore 서비스)
│   ├── messaging.service.ts   (FCM 서비스)
│   ├── notices.service.ts     (공지 서비스)
│   ├── storage.service.ts     (Storage 서비스)
│   └── types.ts               (타입 정의)
└── utils/
    └── userAgent.ts
```

### `src/main.tsx`
- **경로**: `src/main.tsx`
- **역할**: 앱 진입점 (React 렌더링)

---

## (F) 다음 μATOM-0002 진입점 후보 파일 (라우팅/탭/네비)

### 메인 진입점
1. **`src/main.tsx`** - React 앱 진입점
2. **`src/app/App.tsx`** - 메인 앱 컴포넌트 (라우팅/탭 관리)

### 라우팅/탭 관련
3. **`src/app/App.tsx`** - 라우팅 로직 포함 (라인 27: `PageType`, 라인 36: `activeTab`, 라인 37: `currentPage`)
4. **`src/app/components/BottomNav.tsx`** - 하단 탭 네비게이션 컴포넌트

### 페이지 컴포넌트 (라우팅 대상)
5. **`src/app/pages/LoginPage.tsx`** - 로그인 페이지
6. **`src/app/pages/AccessDeniedPage.tsx`** - 접근 거부 페이지
7. **`src/app/pages/HomePage.tsx`** - 홈 페이지
8. **`src/app/pages/BoardsPage.tsx`** - 게시판 페이지
9. **`src/app/pages/SchedulePage.tsx`** - 일정 페이지
10. **`src/app/pages/MyPage.tsx`** - 내정보 페이지
11. **`src/app/pages/SettingsPage.tsx`** - 설정 페이지
12. **`src/app/pages/AdminPage.tsx`** - 관리자 페이지
13. **`src/app/pages/AlbumPage.tsx`** - 앨범 페이지 (v1.1 제외 대상)
14. **`src/app/pages/FinancePage.tsx`** - 회계 페이지 (v1.1 제외 대상)
15. **`src/app/pages/GameRecordPage.tsx`** - 경기 기록 페이지 (v1.1 제외 대상)
16. **`src/app/pages/NotificationPage.tsx`** - 알림 페이지
17. **`src/app/pages/MyActivityPage.tsx`** - 내 활동 페이지
18. **`src/app/pages/ApprovalPendingPage.tsx`** - 승인 대기 페이지 (v1.1 제외 대상?)
19. **`src/app/pages/InstallPage.tsx`** - 설치 페이지

### 컨텍스트 (상태 관리/라우팅 보조)
20. **`src/app/contexts/AuthContext.tsx`** - 인증 상태 (Access Gate 포함 가능성)
21. **`src/app/contexts/ClubContext.tsx`** - 클럽 컨텍스트
22. **`src/app/contexts/DataContext.tsx`** - 데이터 컨텍스트

### UI 컴포넌트 (탭 관련)
23. **`src/app/components/ui/tabs.tsx`** - 탭 UI 컴포넌트 (shadcn/ui)

---

## (G) Firebase 설정 요약

### `firebase.json`
```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  "hosting": {
    "public": "dist",
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  }
}
```

### `.firebaserc`
```json
{
  "projects": {
    "default": "wings-baseball-club"
  }
}
```

---

## (H) 파일 통계 (근거)

### TypeScript/TSX 파일 수
- **src/**: 약 88개 파일 (84 *.tsx, 3 *.ts, 1 *.tsx_append)
- **functions/src/**: 약 18개 파일 (8 callables, 1 scheduled, 8 shared, 1 index)

---

## Done 체크리스트

- [x] 루트 트리/핵심 파일 증거 확보
- [x] package.json scripts 확보
- [x] functions 존재 여부/구조 확보
- [x] μATOM-0002 대상 후보 파일 목록 확보

---

## 다음 단계 (μATOM-0002)

**대상 파일 (라우팅/탭/네비 증거 수집):**
1. `src/app/App.tsx` - 라우팅 로직 확인
2. `src/app/components/BottomNav.tsx` - 탭 구조 확인
3. `src/app/pages/*.tsx` - 페이지 라우팅 매핑 확인
4. `src/app/contexts/AuthContext.tsx` - Access Gate 로직 확인

---

**수집 완료일**: 2024년 (현재)  
**수집자**: AI Assistant (Cursor)  
**방식**: READ-ONLY (코드 변경 없음)

