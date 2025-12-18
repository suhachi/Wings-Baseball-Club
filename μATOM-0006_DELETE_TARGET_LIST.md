# μATOM-0006 결과: R01 삭제 타겟 "정확 지정 리스트" 확정 (READ-ONLY)

**수집 일시**: 2024년 (현재)  
**작업 방식**: READ-ONLY (코드 변경 없음)  
**근거**: μATOM-0002~0005 리포트 기반, 파일 경로, 라인 번호

---

## (A) 프론트 페이지/컴포넌트/라우팅 분기

### 파일 제거 대상 (8개)

| # | 파일 경로 | 제거 이유 | μATOM 매핑 |
|---|----------|----------|-----------|
| 1 | `src/app/pages/AlbumPage.tsx` | 앨범 기능 제외 | μATOM-0105 |
| 2 | `src/app/pages/FinancePage.tsx` | 회계 기능 제외 | μATOM-0104 |
| 3 | `src/app/pages/GameRecordPage.tsx` | 경기 기록 제외 | μATOM-0103 |
| 4 | `src/app/pages/ApprovalPendingPage.tsx` | 가입승인 제외 (죽은 코드) | μATOM-0102 |
| 5 | `src/app/components/PollVoteModal.tsx` | 투표 게시판 제외 | μATOM-0106 |
| 6 | `src/app/components/game-record/BatterTable.tsx` | 경기 기록 제외 | μATOM-0103 |
| 7 | `src/app/components/game-record/PitcherTable.tsx` | 경기 기록 제외 | μATOM-0103 |
| 8 | `src/app/components/game-record/LineupEditor.tsx` | 경기 기록 제외 | μATOM-0103 |

### 코드 수정 대상 (참조 제거)

#### 1. `src/app/App.tsx` (8곳)

| 라인 | 내용 | 제거/수정 | μATOM 매핑 |
|------|------|----------|-----------|
| 14 | `import { AlbumPage } from './pages/AlbumPage';` | 제거 | μATOM-0109 |
| 20 | `import { FinancePage } from './pages/FinancePage';` | 제거 | μATOM-0109 |
| 21 | `import { GameRecordPage } from './pages/GameRecordPage';` | 제거 | μATOM-0109 |
| 27 | `type PageType = 'home' | 'schedule' | 'boards' | 'album' | 'my' | 'settings' | 'notifications' | 'admin' | 'finance' | 'game-record' | 'my-activity' | 'install';` | `'album'`, `'finance'`, `'game-record'` 제거 | μATOM-0109 |
| 36 | `const [activeTab, setActiveTab] = useState<'home' | 'schedule' | 'boards' | 'album' | 'my'>('home');` | `'album'` 제거 | μATOM-0109 |
| 109 | `if (page !== 'settings' && page !== 'notifications' && page !== 'admin' && page !== 'finance' && page !== 'game-record')` | `'finance'`, `'game-record'` 제거 | μATOM-0109 |
| 184 | `{currentPage === 'album' && <AlbumPage />}` | 제거 | μATOM-0109 |
| 200 | `{currentPage === 'finance' && <FinancePage onBack={() => handlePageChange('home')} />}` | 제거 | μATOM-0109 |
| 201 | `{currentPage === 'game-record' && <GameRecordPage onBack={() => handlePageChange('home')} />}` | 제거 | μATOM-0109 |

#### 2. `src/app/components/BottomNav.tsx` (3곳)

| 라인 | 내용 | 제거/수정 | μATOM 매핑 |
|------|------|----------|-----------|
| 6 | `activeTab: 'home' | 'schedule' | 'boards' | 'album' | 'my';` | `'album'` 제거 | μATOM-0109 |
| 7 | `onTabChange: (tab: 'home' | 'schedule' | 'boards' | 'album' | 'my') => void;` | `'album'` 제거 | μATOM-0109 |
| 15 | `{ id: 'album', label: '앨범', icon: Image },` | 제거 | μATOM-0109 |

#### 3. `src/app/pages/BoardsPage.tsx` (10곳)

| 라인 | 내용 | 제거/수정 | μATOM 매핑 |
|------|------|----------|-----------|
| 13 | `import { PollVoteModal } from '../components/PollVoteModal';` | 제거 | μATOM-0106 |
| 28 | `const [selectedPoll, setSelectedPoll] = useState<Post | null>(null);` | 제거 | μATOM-0106 |
| 39 | `const polls = posts.filter(p => p.type === 'poll');` | 제거 | μATOM-0106 |
| 40 | `const games = posts.filter(p => p.type === 'game');` | 제거 | μATOM-0106 |
| 64-67 | `<TabsTrigger value="poll">`, `<TabsTrigger value="game">` | 제거 | μATOM-0106 |
| 79, 88, 97, 106, 115 | `onPollClick={(post) => setSelectedPoll(post)}` | 제거 (5곳) | μATOM-0106 |
| 101-108 | `<TabsContent value="poll">` 블록 | 제거 | μATOM-0106 |
| 110-117 | `<TabsContent value="game">` 블록 | 제거 | μATOM-0106 |
| 174-192 | `<PollVoteModal>` 렌더링 블록 | 제거 | μATOM-0106 |
| 199, 218, 227, 229, 244, 245, 271, 274, 307, 308, 332, 333 | `poll`, `game` 타입 관련 코드 | 제거/수정 (12곳) | μATOM-0106 |

**추가 확인 필요**:
- `PostCard` 컴포넌트 내부의 `poll`, `game` 타입 분기 로직 (라인 227-333)
- `getTypeInfo()` 함수의 `poll`, `game` 케이스

#### 4. `src/app/pages/MyPage.tsx` (4곳)

| 라인 | 내용 | 제거/수정 | μATOM 매핑 |
|------|------|----------|-----------|
| 17 | `onNavigateToFinance?: () => void;` | prop 제거 | μATOM-0109 |
| 18 | `onNavigateToGameRecord?: () => void;` | prop 제거 | μATOM-0109 |
| 27 | `onNavigateToFinance,` | destructuring 제거 | μATOM-0109 |
| 28 | `onNavigateToGameRecord,` | destructuring 제거 | μATOM-0109 |
| 233 | `<MenuItem icon={Trophy} label="경기 기록 관리" onClick={() => onNavigateToGameRecord?.()} />` | 제거 | μATOM-0109 |
| 250 | `<MenuItem icon={Trophy} label="회비/회계" onClick={() => onNavigateToFinance?.()} />` | 제거 | μATOM-0109 |

**추가 확인 필요**:
- 라인 216: `posts.some((p: Post) => p.recorders?.includes(user.id))` - recorders 체크 제거 필요

#### 5. `src/app/pages/HomePage.tsx` (2곳)

| 라인 | 내용 | 제거/수정 | μATOM 매핑 |
|------|------|----------|-----------|
| 13 | `onNavigate: (tab: 'schedule' | 'boards' | 'album', postId?: string) => void;` | `'album'` 제거 | μATOM-0109 |
| 197 | `onClick={() => onNavigate('album')}` | 제거 | μATOM-0109 |

---

## (B) services/lib 타입/쿼리

### 타입 정의 수정 대상

#### 1. `src/lib/firebase/types.ts` (5곳)

| 라인 | 내용 | 제거/수정 | μATOM 매핑 |
|------|------|----------|-----------|
| 4 | `export type PostType = 'notice' | 'free' | 'event' | 'meetup' | 'poll' | 'game' | 'album';` | `'poll'`, `'game'`, `'album'` 제거, `'meetup'` → `'event'`로 변경 | μATOM-0103/0105/0106 |
| 6 | `export type GameType = 'LEAGUE' | 'PRACTICE';` | 제거 (v1.1 제외) | μATOM-0103 |
| 8 | `export type MediaType = 'photo' | 'video';` | 제거 (v1.1 제외) | μATOM-0105 |
| 50-55 | `// Poll specific` 필드 (`choices`, `multi`, `anonymous`, `closeAt`, `closed`) | 제거 | μATOM-0106 |
| 57-71 | `// Game specific` 필드 (`gameType`, `score`, `recorders`, `recordingLocked` 등) | 제거 | μATOM-0103 |
| 73-76 | `// Album specific` 필드 (`mediaUrls`, `mediaType`, `likes`) | 제거 | μATOM-0105 |
| 106-121 | `export interface FinanceDoc` | 제거 | μATOM-0104 |
| 123-134 | `export interface LineupDoc` | 제거 | μATOM-0103 |
| 136-157 | `export interface BatterRecordDoc` | 제거 | μATOM-0103 |
| 159-181 | `export interface PitcherRecordDoc` | 제거 | μATOM-0103 |

### Firestore Service 함수 제거 대상

#### 2. `src/lib/firebase/firestore.service.ts` (9개 함수)

| 라인 | 함수명 | 제거 이유 | μATOM 매핑 |
|------|--------|----------|-----------|
| 23-26 | `FinanceDoc`, `BatterRecordDoc`, `PitcherRecordDoc` import | 타입 제거 | μATOM-0103/0104 |
| 364-418 | `addFinance`, `getFinances`, `deleteFinance` | 회계 기능 제외 | μATOM-0104 |
| 419-533 | `getGameLineup`, `setGameLineupSlot`, `getGameBatterRecords`, `setGameBatterRecord`, `getGamePitcherRecords`, `setGamePitcherRecord` | 경기 기록 제외 | μATOM-0103 |

### DataContext 수정 대상

#### 3. `src/app/contexts/DataContext.tsx` (다수)

| 라인 | 내용 | 제거/수정 | μATOM 매핑 |
|------|------|----------|-----------|
| 60-66 | `// Poll specific` 필드 | 제거 | μATOM-0106 |
| 67-81 | `// Game specific` 필드 (`gameType`, `recorders`, `recordingLocked` 등) | 제거 | μATOM-0103 |
| 83 | `// Album specific` 필드 | 제거 | μATOM-0105 |
| 161 | `votePoll: (postId: string, userId: string, choices: string[]) => Promise<void>;` | 함수 시그니처 제거 | μATOM-0106 |
| 217-244 | Poll/Game/Album 필드 변환 로직 | 제거 | μATOM-0103/0105/0106 |
| 352-374 | Poll/Game/Album 필드 생성 로직 | 제거 | μATOM-0103/0105/0106 |
| 489-517 | `votePoll` 함수 구현 | 제거 | μATOM-0106 |
| 656 | `votePoll,` export | 제거 | μATOM-0106 |

---

## (C) functions callables/scheduled/export

### 파일 제거 대상 (4개)

| # | 파일 경로 | 제거 이유 | μATOM 매핑 |
|---|----------|----------|-----------|
| 1 | `functions/src/callables/polls.ts` | 빈 파일, v1.1 제외 | μATOM-0106 |
| 2 | `functions/src/callables/dues.ts` | 빈 파일, v1.1 제외 | μATOM-0104 |
| 3 | `functions/src/callables/ledger.ts` | 빈 파일, v1.1 제외 | μATOM-0104 |
| 4 | `functions/src/callables/games.ts` | 빈 파일, v1.1 제외 | μATOM-0103 |

### Export 수정 대상

#### `functions/src/index.ts` (확인만)

| 라인 | 내용 | 상태 | μATOM 매핑 |
|------|------|------|-----------|
| 11-15 | 주석 처리된 export | 이미 주석 처리됨 (확인만) | μATOM-0108 |

**확인 사항**: 주석 처리된 export가 실제로 사용되지 않는지 확인

---

## (D) rules match/allow

### Rules 제거/수정 대상 (`firestore.rules`)

| 라인 | 내용 | 제거/수정 | μATOM 매핑 |
|------|------|----------|-----------|
| 54-57 | `match /inviteCodes/{code}` 블록 | 선택사항 (이미 차단됨) | μATOM-0101 |
| 91 | `// - notice/event/poll/game: 클라 write 금지` 주석 | `poll`, `game` 제거 | μATOM-0107 |
| 95 | `return postType in ['free', 'meetup'];` | `'meetup'` → `'event'`로 변경 | μATOM-0107 |
| 96 | `// notice, event, poll, game는 Functions-only` 주석 | `poll`, `game` 제거 | μATOM-0107 |
| 110-111 | `'recorders','recordersSnapshot','recordingLocked','recordingLockedAt','recordingLockedBy'` | 제거 | μATOM-0107 |
| 157-168 | `match /votes/{userId}` 블록 (poll 투표) | 제거 | μATOM-0107 |
| 171-196 | `match /record_*` 블록 (game records) | 제거 | μATOM-0107 |
| 174-181 | `canRecordAdminOverride()` 함수 | 제거 | μATOM-0107 |
| 203-209 | `match /dues/{docId}`, `match /ledger/{docId}` 블록 | 선택사항 (이미 차단됨) | μATOM-0104 |

---

## (E) 문서/가이드(남길지/이관/삭제)

### 문서 파일 (제외 키워드 포함)

| 파일 경로 | 제외 키워드 | 권장 조치 | μATOM 매핑 |
|----------|-----------|----------|-----------|
| `docs/TS_ERROR_FINAL_AUDIT_REPORT.md` | poll, album, finance, game, record | 유지 (과거 기록) | - |
| `docs/TS_ERROR_FIX_REPORT.md` | poll, album, finance, game, record | 유지 (과거 기록) | - |
| `docs/code/code-src-lib-firebase.md` | poll, album, finance, game, record | 유지 (코드 스냅샷) | - |
| `docs/code/code-src-app.md` | poll, album, finance, game, record | 유지 (코드 스냅샷) | - |
| `docs/WIREFRAME_AND_FLOWS.md` | poll, album, finance, game, record | 유지 (과거 설계) | - |
| `docs/PROJECT_STRUCTURE.md` | poll, album, finance, game, record | 유지 (과거 구조) | - |

**권장 조치**: 문서는 유지 (과거 기록/스냅샷으로 보존)

---

## P1 각 μATOM에 1:1로 작업 항목 분배

### μATOM-0101: Invite/초대 도메인 제거

**파일 제거**: 없음 (이미 제거됨)

**Rules 수정**:
- `firestore.rules` 라인 54-57: `match /inviteCodes/{code}` 블록 제거 (선택사항, 이미 차단됨)

**검증**: `rg -n "invite" src functions firestore.rules` → 0건 (또는 Rules 주석만)

---

### μATOM-0102: 회원가입/가입승인 UI/Flow 제거

**파일 제거**:
- `src/app/pages/ApprovalPendingPage.tsx`

**코드 수정**: 없음 (라우팅 없음, 죽은 코드)

**검증**: `rg -n "ApprovalPending|approval.*pending" src` → 0건

---

### μATOM-0103: 경기 기록(record/LOCK/기록원) 제거

**파일 제거**:
- `src/app/pages/GameRecordPage.tsx`
- `src/app/components/game-record/BatterTable.tsx`
- `src/app/components/game-record/PitcherTable.tsx`
- `src/app/components/game-record/LineupEditor.tsx`
- `functions/src/callables/games.ts`

**코드 수정**:

**App.tsx**:
- 라인 21: `GameRecordPage` import 제거
- 라인 201: `GameRecordPage` 렌더링 제거
- 라인 27: `PageType`에서 `'game-record'` 제거
- 라인 109: `'game-record'` 조건 제거

**MyPage.tsx**:
- 라인 18: `onNavigateToGameRecord` prop 제거
- 라인 28: destructuring 제거
- 라인 233: "경기 기록 관리" MenuItem 제거
- 라인 216: `p.recorders?.includes(user.id)` 체크 제거

**types.ts**:
- 라인 6: `GameType` 제거
- 라인 57-71: `// Game specific` 필드 제거
- 라인 123-181: `LineupDoc`, `BatterRecordDoc`, `PitcherRecordDoc` 제거

**firestore.service.ts**:
- 라인 24-25: `BatterRecordDoc`, `PitcherRecordDoc` import 제거
- 라인 419-533: 게임 기록 관련 함수 6개 제거

**DataContext.tsx**:
- 라인 67-81: `// Game specific` 필드 제거
- 라인 231-243: Game 필드 변환 로직 제거
- 라인 365-373: Game 필드 생성 로직 제거

**BoardsPage.tsx**:
- 라인 40: `games` 필터 제거
- 라인 68: `game` 탭 제거
- 라인 110-117: `game` TabsContent 제거
- 라인 229, 274, 333: `game` 타입 분기 제거

**Rules**:
- `firestore.rules` 라인 91, 95: `game` 타입 참조 제거
- `firestore.rules` 라인 110-111: `recordingLocked` 필드 참조 제거
- `firestore.rules` 라인 171-196: `record_*` match 블록 제거
- `firestore.rules` 라인 174-181: `canRecordAdminOverride()` 함수 제거

**검증**: `rg -n "record|recorder|recordingLocked|game.*record|GameRecord" src functions firestore.rules` → 0건

---

### μATOM-0104: 회비/회계(dues/ledger) 제거

**파일 제거**:
- `src/app/pages/FinancePage.tsx`
- `functions/src/callables/dues.ts`
- `functions/src/callables/ledger.ts`

**코드 수정**:

**App.tsx**:
- 라인 20: `FinancePage` import 제거
- 라인 200: `FinancePage` 렌더링 제거
- 라인 27: `PageType`에서 `'finance'` 제거
- 라인 109: `'finance'` 조건 제거

**MyPage.tsx**:
- 라인 17: `onNavigateToFinance` prop 제거
- 라인 27: destructuring 제거
- 라인 250: "회비/회계" MenuItem 제거

**types.ts**:
- 라인 106-121: `FinanceDoc` 인터페이스 제거

**firestore.service.ts**:
- 라인 23: `FinanceDoc` import 제거
- 라인 364-418: `addFinance`, `getFinances`, `deleteFinance` 함수 제거

**Rules**:
- `firestore.rules` 라인 203-209: `dues`, `ledger` match 블록 제거 (선택사항, 이미 차단됨)

**검증**: `rg -n "dues|ledger|Finance|finance.*page" src functions firestore.rules` → 0건

---

### μATOM-0105: 앨범(album/photo/video) 제거

**파일 제거**:
- `src/app/pages/AlbumPage.tsx`
- `src/app/components/FileUploadModal.tsx` (재검토 필요 - 다른 용도로 사용 가능)

**코드 수정**:

**App.tsx**:
- 라인 14: `AlbumPage` import 제거
- 라인 184: `AlbumPage` 렌더링 제거
- 라인 27: `PageType`에서 `'album'` 제거
- 라인 36: `activeTab` 타입에서 `'album'` 제거
- 라인 98: `handleNavigate` 타입에서 `'album'` 제거

**BottomNav.tsx**:
- 라인 6-7: 타입에서 `'album'` 제거
- 라인 15: `album` 탭 제거

**HomePage.tsx**:
- 라인 13: `onNavigate` 타입에서 `'album'` 제거
- 라인 197: `album` 네비게이션 제거

**types.ts**:
- 라인 4: `PostType`에서 `'album'` 제거
- 라인 8: `MediaType` 제거
- 라인 73-76: `// Album specific` 필드 제거

**DataContext.tsx**:
- 라인 83: `// Album specific` 필드 제거
- 라인 244: Album 필드 변환 로직 제거
- 라인 374: Album 필드 생성 로직 제거

**검증**: `rg -n "album|Album|photo|video|mediaUrls" src` → 0건 (또는 FileUploadModal만 남음)

---

### μATOM-0106: 의제 투표 게시판(poll) 제거

**파일 제거**:
- `src/app/components/PollVoteModal.tsx`

**코드 수정**:

**BoardsPage.tsx**:
- 라인 13: `PollVoteModal` import 제거
- 라인 28: `selectedPoll` state 제거
- 라인 39: `polls` 필터 제거
- 라인 64: `poll` 탭 제거
- 라인 79, 88, 97, 106: `onPollClick` prop 제거 (4곳)
- 라인 101-108: `poll` TabsContent 제거
- 라인 174-192: `PollVoteModal` 렌더링 제거
- 라인 199, 218: `onPollClick` prop 타입 제거
- 라인 227, 244, 245, 271, 307, 308: `poll` 타입 분기 제거

**types.ts**:
- 라인 4: `PostType`에서 `'poll'` 제거
- 라인 50-55: `// Poll specific` 필드 제거

**DataContext.tsx**:
- 라인 60-66: `// Poll specific` 필드 제거
- 라인 161: `votePoll` 함수 시그니처 제거
- 라인 217-230: Poll 필드 변환 로직 제거
- 라인 352-364: Poll 필드 생성 로직 제거
- 라인 489-517: `votePoll` 함수 구현 제거
- 라인 656: `votePoll` export 제거

**Rules**:
- `firestore.rules` 라인 91, 95: `poll` 타입 참조 제거
- `firestore.rules` 라인 157-168: `match /votes/{userId}` 블록 제거

**functions**:
- `functions/src/callables/polls.ts` 파일 제거
- `functions/src/index.ts` 라인 12 주석 확인

**검증**: `rg -n "poll|Poll|votePoll|votes.*userId" src functions firestore.rules` → 0건

---

### μATOM-0107: Rules에서 제외 도메인 match/허용 제거 또는 무효화

**Rules 수정** (`firestore.rules`):

| 라인 | 내용 | 조치 |
|------|------|------|
| 54-57 | `match /inviteCodes/{code}` | 제거 (선택사항) |
| 91 | `// - notice/event/poll/game: 클라 write 금지` | `poll`, `game` 제거 |
| 95 | `return postType in ['free', 'meetup'];` | `'meetup'` → `'event'`로 변경 |
| 96 | `// notice, event, poll, game는 Functions-only` | `poll`, `game` 제거 |
| 110-111 | `'recorders','recordersSnapshot','recordingLocked','recordingLockedAt','recordingLockedBy'` | 제거 |
| 157-168 | `match /votes/{userId}` 블록 | 제거 |
| 171-196 | `match /record_*` 블록 (3개) | 제거 |
| 174-181 | `canRecordAdminOverride()` 함수 | 제거 |
| 203-209 | `match /dues/{docId}`, `match /ledger/{docId}` | 제거 (선택사항) |

**검증**: `firebase emulators:start --only firestore` → Rules 파싱 성공

---

### μATOM-0108: Functions export에서 제외 도메인 엔드포인트 제거

**파일 제거**:
- `functions/src/callables/polls.ts`
- `functions/src/callables/dues.ts`
- `functions/src/callables/ledger.ts`
- `functions/src/callables/games.ts`

**코드 수정**:
- `functions/src/index.ts` 라인 11-15: 주석 확인 (이미 주석 처리됨)

**검증**: `cd functions && npm run build` → 성공

---

### μATOM-0109: UI 진입 경로/메뉴/탭에서 제외 도메인 링크 제거

**수정 대상 파일** (위 (A) 섹션 참조):

1. `src/app/App.tsx` (8곳)
2. `src/app/components/BottomNav.tsx` (3곳)
3. `src/app/pages/BoardsPage.tsx` (10곳)
4. `src/app/pages/MyPage.tsx` (4곳)
5. `src/app/pages/HomePage.tsx` (2곳)

**검증**: `rg -n "AlbumPage|FinancePage|GameRecordPage|PollVoteModal|album.*tab|finance.*page|game.*record" src` → 0건

---

### μATOM-0110: "dead code" 잔존 여부 최종 grep 0건 확인

**검증 커맨드**:
```bash
# 제외 키워드 재검색
rg -n "(invite|approval|signup|record|recorder|lock|dues|ledger|poll|album)" -S src functions firestore.rules || echo "0 matches"

# 특정 파일 존재 확인
test -f src/app/pages/AlbumPage.tsx && echo "EXISTS" || echo "NOT FOUND"
test -f src/app/pages/FinancePage.tsx && echo "EXISTS" || echo "NOT FOUND"
test -f src/app/pages/GameRecordPage.tsx && echo "EXISTS" || echo "NOT FOUND"
test -f src/app/components/PollVoteModal.tsx && echo "EXISTS" || echo "NOT FOUND"
test -f functions/src/callables/polls.ts && echo "EXISTS" || echo "NOT FOUND"
test -f functions/src/callables/dues.ts && echo "EXISTS" || echo "NOT FOUND"
test -f functions/src/callables/ledger.ts && echo "EXISTS" || echo "NOT FOUND"
test -f functions/src/callables/games.ts && echo "EXISTS" || echo "NOT FOUND"
```

**기대 결과**: 모든 파일이 "NOT FOUND", grep 결과 0건

---

## "삭제 후 빌드 통과" 리스크 포인트 사전 표기

### 🔴 HIGH 리스크

#### 1. 타입 불일치 (PostType)
- **위치**: `src/lib/firebase/types.ts` 라인 4
- **리스크**: `PostType`에서 `'poll'`, `'game'`, `'album'` 제거 시, 기존 데이터/코드에서 해당 타입 참조 시 타입 에러
- **대응**: 
  - `DataContext.tsx`에서 해당 타입 필터링 로직 제거
  - `BoardsPage.tsx`에서 해당 타입 분기 제거
  - 모든 파일에서 해당 타입 참조 제거 확인

#### 2. 함수 시그니처 불일치 (votePoll)
- **위치**: `src/app/contexts/DataContext.tsx` 라인 161, 489-517, 656
- **리스크**: `votePoll` 함수 제거 시, 호출하는 코드가 있으면 런타임 에러
- **대응**: 
  - `rg -n "votePoll\(" src` → 0건 확인
  - `DataContext` export에서 제거

#### 3. Rules 파싱 실패
- **위치**: `firestore.rules`
- **리스크**: match 블록 제거 시 문법 오류 가능성
- **대응**: 
  - `firebase emulators:start --only firestore` 실행
  - Rules 파싱 성공 확인

#### 4. Import 에러
- **위치**: `src/app/App.tsx`, `src/app/pages/BoardsPage.tsx` 등
- **리스크**: 파일 제거 후 import 문이 남아있으면 컴파일 에러
- **대응**: 
  - 모든 import 문 제거 확인
  - `npm run type-check` 실행

### 🟡 MEDIUM 리스크

#### 5. 타입 변환 로직 누락
- **위치**: `src/app/contexts/DataContext.tsx` 라인 217-244, 352-374
- **리스크**: Poll/Game/Album 필드 변환 로직 제거 시, 기존 데이터 읽기 시 에러
- **대응**: 
  - 해당 필드 접근 코드 모두 제거 확인
  - 기존 데이터는 v1.1에서 사용하지 않으므로 안전

#### 6. 조건문 분기 누락
- **위치**: `src/app/App.tsx` 라인 109
- **리스크**: `handlePageChange`에서 `'finance'`, `'game-record'` 조건 제거 누락 시 런타임 에러
- **대응**: 
  - 모든 조건문에서 제외 타입 제거 확인

#### 7. FileUploadModal 재사용 가능성
- **위치**: `src/app/components/FileUploadModal.tsx`
- **리스크**: 앨범 외 다른 용도로 사용 가능 (예: 프로필 사진 업로드)
- **대응**: 
  - `rg -n "FileUploadModal" src` → 사용처 확인
  - 다른 용도로 사용 중이면 유지

### 🟢 LOW 리스크

#### 8. 주석/문서 참조
- **위치**: `docs/` 디렉토리
- **리스크**: 문서에 제외 키워드 남아있음 (기능 영향 없음)
- **대응**: 문서는 유지 (과거 기록)

#### 9. 빈 파일 제거
- **위치**: `functions/src/callables/polls.ts` 등
- **리스크**: 낮음 (빈 파일이므로 제거 안전)
- **대응**: `functions/src/index.ts`에서 export 확인

---

## 검증 커맨드 (P1 완료 후)

```bash
# 1. 빌드 검증
npm run build
npm run type-check
cd functions && npm run build

# 2. 제외 키워드 재검색 (0건 확인)
rg -n "(invite|approval|signup|record|recorder|lock|dues|ledger|poll|album)" -S src functions firestore.rules || echo "0 matches"

# 3. 제외 파일 존재 확인 (모두 NOT FOUND)
test -f src/app/pages/AlbumPage.tsx && echo "EXISTS" || echo "NOT FOUND"
test -f src/app/pages/FinancePage.tsx && echo "EXISTS" || echo "NOT FOUND"
test -f src/app/pages/GameRecordPage.tsx && echo "EXISTS" || echo "NOT FOUND"
test -f src/app/components/PollVoteModal.tsx && echo "EXISTS" || echo "NOT FOUND"
test -f functions/src/callables/polls.ts && echo "EXISTS" || echo "NOT FOUND"
test -f functions/src/callables/dues.ts && echo "EXISTS" || echo "NOT FOUND"
test -f functions/src/callables/ledger.ts && echo "EXISTS" || echo "NOT FOUND"
test -f functions/src/callables/games.ts && echo "EXISTS" || echo "NOT FOUND"

# 4. Rules 파싱 검증
firebase emulators:start --only firestore
# (Ctrl+C로 종료 후 Rules 파싱 성공 확인)
```

---

## Done 체크리스트

- [x] P1 각 μATOM에 1:1로 작업 항목 분배 완료
- [x] "삭제 후 빌드 통과" 리스크 포인트 사전 표기
- [x] 파일 제거 대상 정확 목록 (12개)
- [x] 코드 수정 대상 정확 목록 (파일별 라인 번호 포함)
- [x] Rules 수정 대상 정확 목록 (라인 번호 포함)
- [x] 검증 커맨드 정확 명시

---

**수집 완료일**: 2024년 (현재)  
**수집자**: AI Assistant (Cursor)  
**방식**: READ-ONLY (코드 변경 없음)

**다음 단계**: P1 (μATOM-0101~0110) - 제외 범위 물리 제거 시작

