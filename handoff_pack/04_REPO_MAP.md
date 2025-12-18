# handoff_pack/04_REPO_MAP.md

## 목적/범위
레포지토리 디렉토리 구조 및 핵심 파일의 위치, 담당 기능, 호출 관계를 정리합니다.

---

## 디렉토리 트리 (2-3뎁스)

```
wings-baseball-club/
├── public/                    # 정적 파일
│   ├── manifest.json
│   ├── sw.js
│   └── icon-*.png
├── src/
│   ├── app/
│   │   ├── App.tsx            # 메인 앱, 라우팅
│   │   ├── components/        # 재사용 컴포넌트
│   │   │   ├── ui/           # shadcn/ui 컴포넌트
│   │   │   ├── game-record/  # 경기 기록 컴포넌트
│   │   │   ├── BottomNav.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── CreatePostModal.tsx
│   │   │   ├── PostDetailModal.tsx
│   │   │   └── ...
│   │   ├── contexts/         # React Context
│   │   │   ├── AuthContext.tsx
│   │   │   ├── DataContext.tsx
│   │   │   ├── ClubContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   └── pages/            # 페이지 컴포넌트
│   │       ├── LoginPage.tsx
│   │       ├── HomePage.tsx
│   │       ├── SchedulePage.tsx
│   │       ├── BoardsPage.tsx
│   │       ├── AlbumPage.tsx
│   │       ├── MyPage.tsx
│   │       ├── AdminPage.tsx
│   │       ├── FinancePage.tsx
│   │       ├── GameRecordPage.tsx
│   │       └── ...
│   ├── lib/
│   │   ├── firebase/
│   │   │   ├── config.ts      # Firebase 초기화
│   │   │   ├── types.ts       # TypeScript 타입 정의
│   │   │   ├── auth.service.ts
│   │   │   ├── firestore.service.ts
│   │   │   └── storage.service.ts
│   │   ├── constants/
│   │   │   └── app-info.ts
│   │   └── utils/
│   │       └── userAgent.ts
│   ├── styles/               # CSS 파일
│   └── main.tsx              # 엔트리 포인트
├── firebase.json
├── firestore.rules
├── .firebaserc
├── package.json
└── tsconfig.json
```

---

## 주요 폴더 설명

### `src/app/components/`
재사용 가능한 UI 컴포넌트
- `ui/`: shadcn/ui 기반 컴포넌트 (Button, Card, Badge 등)
- `game-record/`: 경기 기록 전용 컴포넌트 (LineupEditor, BatterTable, PitcherTable)

### `src/app/contexts/`
전역 상태 관리 (React Context API)
- `AuthContext`: 인증 상태, 사용자 정보
- `DataContext`: 게시글, 댓글, 출석, 멤버 등 데이터
- `ClubContext`: 현재 클럽 ID (현재 'default-club' 고정)
- `ThemeContext`: 다크모드 테마

### `src/app/pages/`
화면 단위 페이지 컴포넌트
- 각 페이지는 독립적인 컴포넌트로 구현

### `src/lib/firebase/`
Firebase 서비스 레이어
- Firebase SDK 래퍼 함수들

---

## 핵심 파일 20개 (승인/권한/기록/푸시/마감 관련)

| 경로 | 담당 기능 | 호출 관계 |
|------|----------|----------|
| `src/app/App.tsx` | 메인 라우팅, 전역 가드 | → AuthContext, DataContext, 모든 Page |
| `src/app/contexts/AuthContext.tsx` | 인증 상태, 권한 체크 | ← auth.service.ts, → 모든 Page |
| `src/app/contexts/DataContext.tsx` | 데이터 관리 (게시글/댓글/출석) | ← firestore.service.ts, → 모든 Page |
| `src/app/pages/LoginPage.tsx` | 로그인/회원가입 | → AuthContext.createMsgAccount |
| `src/app/pages/AdminPage.tsx` | 회원 승인, 역할 변경 | → firestore.service.updateMember |
| `src/app/pages/SchedulePage.tsx` | 일정 관리, 출석 투표 | → DataContext.updateAttendance |
| `src/app/pages/GameRecordPage.tsx` | 경기 기록 관리 | → game-record/*, firestore.service |
| `src/app/components/game-record/LineupEditor.tsx` | 라인업 설정 | → firestore.service.setGameLineupSlot |
| `src/app/components/game-record/BatterTable.tsx` | 타자 기록 | → firestore.service.setGameBatterRecord |
| `src/app/components/game-record/PitcherTable.tsx` | 투수 기록 | → firestore.service.setGamePitcherRecord |
| `src/app/components/CreatePostModal.tsx` | 게시글 작성 | → DataContext.addPost |
| `src/app/components/PostDetailModal.tsx` | 게시글 상세 | → DataContext (read only) |
| `src/lib/firebase/auth.service.ts` | 인증 서비스 | → Firebase Auth, Firestore |
| `src/lib/firebase/firestore.service.ts` | Firestore 서비스 | → Firebase Firestore |
| `src/lib/firebase/storage.service.ts` | Storage 서비스 | → Firebase Storage |
| `src/lib/firebase/config.ts` | Firebase 초기화 | ← .env, → 모든 service |
| `src/lib/firebase/types.ts` | 타입 정의 | → 모든 service, context |
| `firestore.rules` | Firestore 보안 규칙 | → Firebase (배포 시) |
| `src/app/components/PollVoteModal.tsx` | 투표 참여 | → DataContext.votePoll |
| `src/app/pages/FinancePage.tsx` | 회계 관리 | → firestore.service.addFinance |

---

## 호출 관계 (간단 화살표)

### 인증 흐름
```
LoginPage → AuthContext → auth.service → Firebase Auth
                            ↓
                         Firestore (UserDoc 생성)
```

### 데이터 흐름
```
Page → DataContext → firestore.service → Firestore
                      ↓
                  실시간 동기화 (onSnapshot)
```

### 경기 기록 흐름 (WF-07)
```
GameRecordPage → LineupEditor/BatterTable/PitcherTable
                      ↓
              firestore.service (setGameLineupSlot 등)
                      ↓
                  Firestore (record_lineup 등)
```

### 승인 흐름
```
AdminPage → firestore.service.updateMember
                ↓
            Firestore (clubs/{clubId}/members/{userId})
                ↓
          AuthContext 상태 업데이트 (자동)
```

---

## TODO/누락

1. **Cloud Functions**: `functions/` 폴더 없음 (미구현)
2. **테스트 코드**: `__tests__/` 또는 `*.test.ts` 파일 없음
3. **환경 변수 예제**: `.env.example` 파일 없음 (README에 언급만 존재)

