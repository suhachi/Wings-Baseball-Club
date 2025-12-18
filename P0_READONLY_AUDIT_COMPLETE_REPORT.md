# P0 READ-ONLY 감사 완료 보고서

**작업 일시**: 2024년 (현재)  
**작업 범위**: μATOM-0001 ~ μATOM-0005  
**작업 방식**: READ-ONLY (코드 변경 없음)  
**목적**: v1.1 리셋 전 현재 레포 상태 확정

---

## 작업 완료 요약

### 완료된 μATOM

| μATOM | 제목 | 상태 | 리포트 파일 |
|-------|------|------|------------|
| μATOM-0001 | 레포 트리 스냅샷 | ✅ 완료 | `μATOM-0001_REPO_SNAPSHOT.md` |
| μATOM-0002 | 라우팅/탭/네비 증거 수집 | ✅ 완료 | `μATOM-0002_ROUTING_TABS_NAV.md` |
| μATOM-0003 | Firestore Rules/Indexes 현황 캡처 | ✅ 완료 | `μATOM-0003_FIRESTORE_RULES.md` |
| μATOM-0004 | Functions 엔드포인트/스케줄러 목록화 | ✅ 완료 | `μATOM-0004_FUNCTIONS_ENDPOINTS.md` |
| μATOM-0005 | 제외 범위 키워드 증거 수집 | ✅ 완료 | `μATOM-0005_EXCLUDED_KEYWORDS.md` |

---

## 핵심 발견 사항

### 1. 레포 구조 (μATOM-0001)

**프로젝트 타입**: Vite + React + TypeScript  
**Functions**: Node.js 20, Firebase Functions v2  
**빌드 도구**: Vite 6.3.5, TypeScript 5.2.2

**주요 디렉토리**:
- `src/app/` - 프론트엔드 소스 (88개 파일)
- `functions/src/` - Cloud Functions 소스 (18개 파일)
- `public/` - 정적 파일 (Service Worker 포함)

---

### 2. 라우팅/탭 구조 (μATOM-0002)

**BottomNav 탭 (5개)**:
- `home` ✅ v1.1 유지
- `schedule` ✅ v1.1 유지
- `boards` ✅ v1.1 유지
- `album` ❌ v1.1 제외
- `my` ✅ v1.1 유지

**BoardsPage 내부 탭 (5개)**:
- `notice` ✅ v1.1 유지
- `free` ✅ v1.1 유지
- `meetup` ⚠️ v1.1에서 `event`로 변경 필요
- `poll` ❌ v1.1 제외
- `game` ❌ v1.1 제외

**제외 대상 페이지**:
- `AlbumPage.tsx` - 앨범
- `FinancePage.tsx` - 회계
- `GameRecordPage.tsx` - 경기 기록
- `ApprovalPendingPage.tsx` - 승인 대기 (죽은 코드)

---

### 3. Firestore Rules 현황 (μATOM-0003)

**v1.1 준수 항목**:
- ✅ `notice` 클라 write 차단 (Functions-only)
- ✅ `event` 클라 write 차단 (Functions-only)
- ✅ `free` 멤버 create 허용
- ✅ `comments` 작성자/adminLike만 수정/삭제
- ✅ `attendance` 본인만, voteClosed==false일 때만
- ✅ `dues/ledger/audit/idempotency` 전면 차단

**v1.1 제외 대상 (Rules 제거 필요)**:
- ❌ `/votes/{userId}` match 블록 (poll)
- ❌ `/record_*` match 블록 (game records)
- ❌ `poll`, `game` 타입 참조
- ❌ `recordingLocked` 필드 참조

**Indexes**: 없음 (현재는 단순 쿼리만 사용)

---

### 4. Functions 엔드포인트 (μATOM-0004)

**활성 함수 (4개)**:
- ✅ `setMemberRole` (callable)
- ✅ `setMemberProfileByAdmin` (callable)
- ✅ `createNoticeWithPush` (callable)
- ✅ `registerFcmToken` (callable)

**미구현 함수 (v1.1 필요)**:
- ⚠️ `createEventPost` (callable) - 빈 파일
- ⚠️ `closeEventVotes` (scheduled) - 빈 파일

**제외 대상 함수 (제거 필요)**:
- ❌ `polls.ts` - 빈 파일
- ❌ `dues.ts` - 빈 파일
- ❌ `ledger.ts` - 빈 파일
- ❌ `games.ts` - 빈 파일

---

### 5. 제외 범위 키워드 (μATOM-0005)

**제거 완료**:
- ✅ `invite` - Rules에서 차단됨
- ✅ `signup` - 사용 안 함

**제거 필요 (사용중)**:
- ❌ `record` - 3개 파일 (game-record/)
- ❌ `lock` - 3개 파일 (game-record/)
- ❌ `poll` - 2개 파일 (PollVoteModal, BoardsPage)
- ❌ `album` - 2개 파일 (AlbumPage, FileUploadModal)
- ❌ `finance` - 1개 파일 (FinancePage)
- ❌ `game` - 4개 파일 (GameRecordPage, game-record/)

**제거 필요 (죽은 코드)**:
- ⚠️ `approval` - 1개 파일 (ApprovalPendingPage, 라우팅 없음)
- ⚠️ `dues` - 1개 파일 (dues.ts 빈 파일)
- ⚠️ `ledger` - 1개 파일 (ledger.ts 빈 파일)

**변경 필요**:
- ⚠️ `meetup` → `event` (BoardsPage, Rules)

---

## P1 제거 대상 정확 목록

### 파일 제거 대상

#### 프론트엔드
1. `src/app/pages/AlbumPage.tsx`
2. `src/app/pages/FinancePage.tsx`
3. `src/app/pages/GameRecordPage.tsx`
4. `src/app/pages/ApprovalPendingPage.tsx`
5. `src/app/components/PollVoteModal.tsx`
6. `src/app/components/game-record/BatterTable.tsx`
7. `src/app/components/game-record/PitcherTable.tsx`
8. `src/app/components/game-record/LineupEditor.tsx`

#### Functions
9. `functions/src/callables/polls.ts`
10. `functions/src/callables/dues.ts`
11. `functions/src/callables/ledger.ts`
12. `functions/src/callables/games.ts`

### 코드 수정 대상 (참조 제거)

#### `src/app/App.tsx`
- 라인 14: `AlbumPage` import 제거
- 라인 20: `FinancePage` import 제거
- 라인 21: `GameRecordPage` import 제거
- 라인 27: `PageType`에서 `'album'`, `'finance'`, `'game-record'` 제거
- 라인 36: `activeTab` 타입에서 `'album'` 제거
- 라인 184: `AlbumPage` 렌더링 제거
- 라인 200: `FinancePage` 렌더링 제거
- 라인 201: `GameRecordPage` 렌더링 제거

#### `src/app/components/BottomNav.tsx`
- 라인 15: `album` 탭 제거
- 라인 6-7: 타입에서 `'album'` 제거

#### `src/app/pages/BoardsPage.tsx`
- 라인 13: `PollVoteModal` import 제거
- 라인 39: `polls` 필터 제거
- 라인 40: `games` 필터 제거
- 라인 64-67: `poll`, `game` 탭 제거
- 관련 TabsContent 제거

#### `src/app/pages/MyPage.tsx`
- `onNavigateToFinance` prop 제거
- `onNavigateToGameRecord` prop 제거
- 관련 버튼/링크 제거

#### `src/app/pages/HomePage.tsx`
- 라인 197: `album` 네비게이션 제거

#### `firestore.rules`
- 라인 157-168: `/votes/{userId}` match 블록 제거
- 라인 171-196: `/record_*` match 블록 제거
- 라인 91, 95: `poll`, `game` 타입 참조 제거
- 라인 110-111: `recordingLocked` 필드 참조 제거
- 라인 92, 96: `meetup` → `event`로 변경

#### `functions/src/index.ts`
- 이미 주석 처리됨 (확인만 필요)

---

## 다음 단계 (P1: 제외 범위 물리 제거)

### μATOM-0101~0110 작업 순서

1. **μATOM-0101**: Invite/초대 도메인 제거 (이미 대부분 제거됨, Rules만 정리)
2. **μATOM-0102**: 회원가입/가입승인 UI/Flow 제거 (ApprovalPendingPage)
3. **μATOM-0103**: 경기 기록 제거 (GameRecordPage, game-record/, Rules)
4. **μATOM-0104**: 회비/회계 제거 (FinancePage, dues.ts, ledger.ts, Rules)
5. **μATOM-0105**: 앨범 제거 (AlbumPage, BottomNav, App.tsx)
6. **μATOM-0106**: 의제 투표 게시판 제거 (PollVoteModal, BoardsPage, Rules)
7. **μATOM-0107**: Rules에서 제외 도메인 match 제거
8. **μATOM-0108**: Functions export에서 제외 도메인 제거
9. **μATOM-0109**: UI 진입 경로에서 제외 도메인 링크 제거
10. **μATOM-0110**: "dead code" 잔존 여부 최종 확인

---

## 검증 커맨드 (P1 완료 후)

```bash
# 빌드 검증
npm run build
npm run type-check
cd functions && npm run build

# 제외 키워드 재검색 (0건 확인)
rg -n "(invite|approval|signup|record|recorder|lock|dues|ledger|poll|album)" -S src functions firestore.rules || echo "0 matches"
```

---

## Done 체크리스트

- [x] μATOM-0001~0005 완료
- [x] 각 μATOM별 리포트 작성
- [x] P1 제거 대상 정확 목록 확정
- [x] μATOM-0101~0110 매핑 완료
- [x] 다음 단계 작업 순서 확정

---

**작업 완료일**: 2024년 (현재)  
**작업자**: AI Assistant (Cursor)  
**방식**: READ-ONLY (코드 변경 없음)

**다음 단계**: P1 (μATOM-0101~0110) - 제외 범위 물리 제거 시작

