# μATOM-0005 결과: "제외 범위 키워드" 증거 수집 (READ-ONLY)

**수집 일시**: 2024년 (현재)  
**작업 방식**: READ-ONLY (코드 변경 없음)  
**근거**: 파일 경로, 라인 번호, 키워드 매칭

---

## (A) 검색 키워드 목록

### v1.1 제외 대상 키워드
- `invite` / `invites` / `inviteCode` / `inviteCodes`
- `approval` / `approve` / `pending`
- `signup` / `sign-up` / `register`
- `record` / `recorder` / `recorders` / `recording`
- `lock` / `locked` / `recordingLocked`
- `dues` / `due`
- `ledger` / `accounting`
- `poll` / `polls` / `vote` (일부)
- `album` / `albums` / `photo` / `video`

### 추가 검색 키워드
- `meetup` (v1.1에서 `event`로 변경 예정)
- `finance` / `financial`
- `game` / `games` (경기 기록 관련)

---

## (B) 키워드별 증거 수집 결과

### 1. `invite` / `invites` / `inviteCode`

#### src/ 디렉토리
- **파일 수**: 0개 (직접 매칭 없음)
- **상태**: ✅ 제거 완료 (또는 사용 안 함)

#### functions/src/ 디렉토리
- **파일 수**: 0개 (직접 매칭 없음)
- **상태**: ✅ 제거 완료

#### firestore.rules
- **라인**: 54-57
- **내용**: `match /inviteCodes/{code}` - 전면 차단 (`allow read, write: if false;`)
- **주석**: "ATOM-11: Invite 제거 반영"
- **상태**: ✅ Rules에서 차단됨 (물리 제거 가능)

---

### 2. `approval` / `approve` / `pending`

#### src/ 디렉토리
- **파일**: `src/app/pages/ApprovalPendingPage.tsx` (1개)
- **상태**: ⚠️ 파일 존재 (죽은 코드 가능성)
- **App.tsx 라우팅**: 없음 (직접 라우팅 없음)

#### functions/src/ 디렉토리
- **파일 수**: 0개
- **상태**: ✅ 제거 완료

#### firestore.rules
- **매칭**: 없음
- **상태**: ✅ Rules에 없음

---

### 3. `signup` / `sign-up` / `register`

#### src/ 디렉토리
- **파일 수**: 0개 (직접 매칭 없음)
- **상태**: ✅ 제거 완료 (또는 사용 안 함)

#### functions/src/ 디렉토리
- **파일 수**: 0개
- **상태**: ✅ 제거 완료

#### firestore.rules
- **매칭**: 없음
- **상태**: ✅ Rules에 없음

---

### 4. `record` / `recorder` / `recorders` / `recording`

#### src/ 디렉토리
- **파일**: 3개
  - `src/app/components/game-record/BatterTable.tsx`
  - `src/app/components/game-record/PitcherTable.tsx`
  - `src/app/components/game-record/LineupEditor.tsx`
- **상태**: ❌ v1.1 제외 대상 (경기 기록)

#### functions/src/ 디렉토리
- **파일**: `functions/src/callables/games.ts` (빈 파일)
- **상태**: ❌ v1.1 제외 대상

#### firestore.rules
- **라인**: 171-196
- **내용**: `match /record_lineup/{docId}`, `match /record_batting/{docId}`, `match /record_pitching/{docId}`
- **함수**: `canRecordAdminOverride()` (라인 174-181)
- **필드**: `recorders`, `recordingLocked`, `recordingLockedAt`, `recordingLockedBy` (라인 110-111)
- **상태**: ❌ v1.1 제외 대상 (Rules 제거 필요)

---

### 5. `lock` / `locked` / `recordingLocked`

#### src/ 디렉토리
- **파일**: `src/app/components/game-record/*.tsx` (경기 기록 관련)
- **상태**: ❌ v1.1 제외 대상

#### functions/src/ 디렉토리
- **파일**: `functions/src/callables/games.ts` (빈 파일)
- **상태**: ❌ v1.1 제외 대상

#### firestore.rules
- **라인**: 110-111, 178
- **내용**: `recordingLocked`, `recordingLockedAt`, `recordingLockedBy` 필드 참조
- **상태**: ❌ v1.1 제외 대상

---

### 6. `dues` / `due`

#### src/ 디렉토리
- **파일**: `src/app/pages/FinancePage.tsx` (회계 페이지)
- **상태**: ❌ v1.1 제외 대상

#### functions/src/ 디렉토리
- **파일**: `functions/src/callables/dues.ts` (빈 파일)
- **상태**: ❌ v1.1 제외 대상

#### firestore.rules
- **라인**: 203-205
- **내용**: `match /dues/{docId}` - 전면 차단 (`allow read, write: if false;`)
- **상태**: ✅ Rules에서 차단됨 (물리 제거 가능)

---

### 7. `ledger` / `accounting`

#### src/ 디렉토리
- **파일**: `src/app/pages/FinancePage.tsx` (회계 페이지)
- **상태**: ❌ v1.1 제외 대상

#### functions/src/ 디렉토리
- **파일**: `functions/src/callables/ledger.ts` (빈 파일)
- **상태**: ❌ v1.1 제외 대상

#### firestore.rules
- **라인**: 207-209
- **내용**: `match /ledger/{docId}` - 전면 차단 (`allow read, write: if false;`)
- **상태**: ✅ Rules에서 차단됨 (물리 제거 가능)

---

### 8. `poll` / `polls`

#### src/ 디렉토리
- **파일**: 2개
  - `src/app/components/PollVoteModal.tsx`
  - `src/app/pages/BoardsPage.tsx` (라인 13, 39, 64-67)
- **상태**: ❌ v1.1 제외 대상

#### functions/src/ 디렉토리
- **파일**: `functions/src/callables/polls.ts` (빈 파일)
- **상태**: ❌ v1.1 제외 대상

#### firestore.rules
- **라인**: 91, 95, 157-168
- **내용**: 
  - `poll` 타입 클라 write 차단 (라인 91, 95)
  - `match /votes/{userId}` - poll 투표 규칙 (라인 157-168)
- **상태**: ❌ v1.1 제외 대상 (Rules 제거 필요)

---

### 9. `album` / `albums` / `photo` / `video`

#### src/ 디렉토리
- **파일**: 2개
  - `src/app/pages/AlbumPage.tsx`
  - `src/app/components/FileUploadModal.tsx` (일부 사용 가능)
- **상태**: ❌ v1.1 제외 대상 (앨범 페이지)

#### functions/src/ 디렉토리
- **파일 수**: 0개
- **상태**: ✅ Functions에 없음

#### firestore.rules
- **매칭**: 없음
- **상태**: ✅ Rules에 없음

---

### 10. `meetup` (v1.1에서 `event`로 변경 예정)

#### src/ 디렉토리
- **파일**: `src/app/pages/BoardsPage.tsx` (라인 38, 60-63, 92-99)
- **상태**: ⚠️ v1.1에서 `event`로 변경 필요

#### functions/src/ 디렉토리
- **파일**: 없음
- **상태**: ✅ Functions에 없음

#### firestore.rules
- **라인**: 92, 96
- **내용**: `meetup` 타입 허용 (`type in ['free', 'meetup']`)
- **상태**: ⚠️ v1.1에서 `event`로 변경 필요

---

### 11. `finance` / `financial`

#### src/ 디렉토리
- **파일**: `src/app/pages/FinancePage.tsx`
- **상태**: ❌ v1.1 제외 대상

#### functions/src/ 디렉토리
- **파일 수**: 0개
- **상태**: ✅ Functions에 없음

#### firestore.rules
- **매칭**: 없음
- **상태**: ✅ Rules에 없음

---

### 12. `game` / `games` (경기 기록 관련)

#### src/ 디렉토리
- **파일**: 4개
  - `src/app/pages/GameRecordPage.tsx`
  - `src/app/components/game-record/BatterTable.tsx`
  - `src/app/components/game-record/PitcherTable.tsx`
  - `src/app/components/game-record/LineupEditor.tsx`
- **상태**: ❌ v1.1 제외 대상

#### functions/src/ 디렉토리
- **파일**: `functions/src/callables/games.ts` (빈 파일)
- **상태**: ❌ v1.1 제외 대상

#### firestore.rules
- **라인**: 91, 95
- **내용**: `game` 타입 클라 write 차단
- **상태**: ❌ v1.1 제외 대상 (Rules 제거 필요)

---

## (C) 키워드별 분류표 (사용중/죽은코드/문서만)

| 키워드 | 파일 수 (src) | 파일 수 (functions) | Rules | 상태 | 분류 |
|--------|--------------|---------------------|-------|------|------|
| `invite` | 0 | 0 | ✅ 차단됨 | 제거 완료 | 문서만 (Rules 주석) |
| `approval` | 1 (ApprovalPendingPage) | 0 | 없음 | 죽은 코드 | ⚠️ 제거 필요 |
| `signup` | 0 | 0 | 없음 | 제거 완료 | - |
| `record` | 3 (game-record/) | 1 (games.ts 빈) | ✅ 있음 | 사용중 | ❌ 제거 필요 |
| `lock` | 3 (game-record/) | 1 (games.ts 빈) | ✅ 있음 | 사용중 | ❌ 제거 필요 |
| `dues` | 1 (FinancePage) | 1 (dues.ts 빈) | ✅ 차단됨 | 죽은 코드 | ⚠️ 제거 필요 |
| `ledger` | 1 (FinancePage) | 1 (ledger.ts 빈) | ✅ 차단됨 | 죽은 코드 | ⚠️ 제거 필요 |
| `poll` | 2 (PollVoteModal, BoardsPage) | 1 (polls.ts 빈) | ✅ 있음 | 사용중 | ❌ 제거 필요 |
| `album` | 2 (AlbumPage, FileUploadModal) | 0 | 없음 | 사용중 | ❌ 제거 필요 |
| `meetup` | 1 (BoardsPage) | 0 | ✅ 있음 | 사용중 | ⚠️ 변경 필요 (→ event) |
| `finance` | 1 (FinancePage) | 0 | 없음 | 사용중 | ❌ 제거 필요 |
| `game` | 4 (GameRecordPage, game-record/) | 1 (games.ts 빈) | ✅ 있음 | 사용중 | ❌ 제거 필요 |

---

## (D) 삭제 범위 "참조 지점" 확보

### μATOM-0101: Invite/초대 도메인 제거
- **파일**: 없음 (이미 제거됨)
- **Rules**: `firestore.rules` 라인 54-57 (물리 제거 가능)

### μATOM-0102: 회원가입/가입승인 UI/Flow 제거
- **파일**: `src/app/pages/ApprovalPendingPage.tsx`
- **App.tsx 라우팅**: 없음 (죽은 코드)

### μATOM-0103: 경기 기록(record/LOCK/기록원) 제거
- **파일**:
  - `src/app/pages/GameRecordPage.tsx`
  - `src/app/components/game-record/BatterTable.tsx`
  - `src/app/components/game-record/PitcherTable.tsx`
  - `src/app/components/game-record/LineupEditor.tsx`
  - `functions/src/callables/games.ts`
- **Rules**: `firestore.rules` 라인 171-196 (record_* match 블록)
- **Rules**: `firestore.rules` 라인 110-111 (recordingLocked 필드)
- **App.tsx**: 라인 21, 201 (GameRecordPage import/렌더링)

### μATOM-0104: 회비/회계(dues/ledger) 제거
- **파일**:
  - `src/app/pages/FinancePage.tsx`
  - `functions/src/callables/dues.ts`
  - `functions/src/callables/ledger.ts`
- **Rules**: `firestore.rules` 라인 203-209 (dues/ledger match 블록)
- **App.tsx**: 라인 20, 200 (FinancePage import/렌더링)
- **MyPage**: `onNavigateToFinance` prop

### μATOM-0105: 앨범(album/photo/video) 제거
- **파일**:
  - `src/app/pages/AlbumPage.tsx`
  - `src/app/components/FileUploadModal.tsx` (일부 사용 가능, 재검토 필요)
- **App.tsx**: 라인 14, 184 (AlbumPage import/렌더링)
- **BottomNav**: 라인 15 (album 탭)
- **HomePage**: 라인 197 (album 네비게이션)

### μATOM-0106: 의제 투표 게시판(poll) 제거
- **파일**:
  - `src/app/components/PollVoteModal.tsx`
  - `src/app/pages/BoardsPage.tsx` (라인 13, 39, 64-67)
- **Rules**: `firestore.rules` 라인 91, 95, 157-168 (poll 타입/votes match)
- **functions**: `functions/src/callables/polls.ts` (빈 파일)

### μATOM-0107: Rules에서 제외 도메인 match/허용 제거 또는 무효화
- **Rules 파일**: `firestore.rules`
- **제거 대상**:
  - 라인 157-168: `/votes/{userId}` match 블록 (poll)
  - 라인 171-196: `/record_*` match 블록 (game records)
  - 라인 91, 95: `poll`, `game` 타입 참조
  - 라인 110-111: `recordingLocked` 필드 참조
  - 라인 92, 96: `meetup` → `event`로 변경

### μATOM-0108: Functions export에서 제외 도메인 엔드포인트 제거
- **파일**: `functions/src/index.ts`
- **제거 대상**: 없음 (이미 주석 처리됨)
- **제거 파일**:
  - `functions/src/callables/polls.ts`
  - `functions/src/callables/dues.ts`
  - `functions/src/callables/ledger.ts`
  - `functions/src/callables/games.ts`

### μATOM-0109: UI 진입 경로/메뉴/탭에서 제외 도메인 링크 제거
- **파일**: `src/app/App.tsx`
  - 라인 14: `AlbumPage` import
  - 라인 20: `FinancePage` import
  - 라인 21: `GameRecordPage` import
  - 라인 184: `AlbumPage` 렌더링
  - 라인 200: `FinancePage` 렌더링
  - 라인 201: `GameRecordPage` 렌더링
- **파일**: `src/app/components/BottomNav.tsx`
  - 라인 15: `album` 탭
- **파일**: `src/app/pages/BoardsPage.tsx`
  - 라인 13: `PollVoteModal` import
  - 라인 39: `polls` 필터
  - 라인 64-67: `poll`, `game` 탭
- **파일**: `src/app/pages/MyPage.tsx`
  - `onNavigateToFinance` prop
  - `onNavigateToGameRecord` prop
- **파일**: `src/app/pages/HomePage.tsx`
  - 라인 197: `album` 네비게이션

### μATOM-0110: "dead code" 잔존 여부 최종 grep 0건 확인
- **검증 필요**: 제거 후 grep 재실행

---

## Done 체크리스트

- [x] 삭제 범위 "참조 지점"까지 확보
- [x] μATOM-0101~0110에 매핑 완료
- [x] 키워드별 파일/라인/사용 여부 분류표 작성

---

**수집 완료일**: 2024년 (현재)  
**수집자**: AI Assistant (Cursor)  
**방식**: READ-ONLY (코드 변경 없음)

