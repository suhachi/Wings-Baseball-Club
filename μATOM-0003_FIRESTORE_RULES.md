# μATOM-0003 결과: Firestore Rules/Indexes 현황 캡처 (READ-ONLY)

**수집 일시**: 2024년 (현재)  
**작업 방식**: READ-ONLY (코드 변경 없음)  
**근거**: 파일 경로, 라인 번호, Rules 내용

---

## (A) Rules 파일 존재 여부

| 파일 | 존재 여부 | 경로 |
|------|----------|------|
| `firestore.rules` | ✅ | 루트 |
| `firestore.indexes.json` | ❌ | 없음 |

---

## (B) Rules 핵심 match 범위 (컬렉션별)

### 1. Global Collections

#### `/users/{userId}`
- **라인**: 47-52
- **Read**: `isAuthenticated()` (인증 사용자)
- **Create**: `isAuthenticated() && request.auth.uid == userId` (본인만)
- **Update**: `isAuthenticated() && request.auth.uid == userId` (본인만)
- **Write 차단**: 없음 (본인만 허용)

#### `/inviteCodes/{code}`
- **라인**: 54-57
- **Read**: `false` (전면 차단)
- **Write**: `false` (전면 차단)
- **상태**: ATOM-11에서 제거 반영됨 (주석 참조)

#### `/notifications/{notificationId}`
- **라인**: 59-63
- **Read**: `isAuthenticated() && resource.data.userId == request.auth.uid` (본인만)
- **Write**: `isAuthenticated()` (인증 사용자)

---

### 2. Club Collections (`/clubs/{clubId}`)

#### `/clubs/{clubId}/members/{memberId}`
- **라인**: 76-82
- **Read**: `isAuthenticated()` (인증 사용자)
- **Create**: `isAuthenticated() && request.auth.uid == memberId` (본인 문서만)
- **Update**: `isAuthenticated() && (request.auth.uid == memberId || isAdminLike(clubId))` (본인 또는 adminLike)
- **Write 차단**: 없음 (제한적 허용)

#### `/clubs/{clubId}/posts/{postId}`
- **라인**: 87-123

**Read**: `isAuthenticated()` (인증 사용자)

**Create 정책**:
- **라인**: 93-99
- **함수**: `isPostTypeAllowedForCreate()`
- **허용**: `type in ['free', 'meetup']` (멤버만)
- **차단**: `type in ['notice', 'event', 'poll', 'game']` (Functions-only)
- **조건**: `isActiveMember(clubId) && isPostTypeAllowedForCreate()`

**Update/Delete 정책**:
- **라인**: 115-123
- **함수**: `isPostAuthor()`, `updatingProtectedPostFields()`
- **Update**: `isActiveMember(clubId) && (isAdminLike(clubId) || (isPostAuthor() && !updatingProtectedPostFields()))`
- **Delete**: `isActiveMember(clubId) && (isAdminLike(clubId) || isPostAuthor())`
- **보호 필드**: `authorId`, `authorName`, `authorPhotoURL`, `type`, `recorders`, `recordingLocked` 등

**v1.1 준수 여부**:
- ✅ `notice` 클라 write 차단 (Functions-only)
- ✅ `event` 클라 write 차단 (Functions-only)
- ⚠️ `poll`, `game` 클라 write 차단 (v1.1 제외 대상이지만 Rules에 남아있음)

#### `/clubs/{clubId}/posts/{postId}/comments/{commentId}`
- **라인**: 128-136
- **Read**: `isAuthenticated()` (인증 사용자)
- **Create**: `isActiveMember(clubId)` (활성 멤버)
- **Update/Delete**: `isActiveMember(clubId) && (resource.data.authorId == request.auth.uid || isAdminLike(clubId))` (작성자 또는 adminLike)
- **v1.1 준수**: ✅

#### `/clubs/{clubId}/posts/{postId}/attendance/{userId}`
- **라인**: 141-152
- **Read**: `isAuthenticated()` (인증 사용자)
- **Write**: `isActiveMember(clubId) && request.auth.uid == userId && isVoteOpen()`
- **조건**: `isVoteOpen()` - 상위 post의 `voteClosed != true` 체크
- **v1.1 준수**: ✅ (마감 후 write 차단)

#### `/clubs/{clubId}/posts/{postId}/votes/{userId}`
- **라인**: 157-168
- **Read**: `isAuthenticated()` (인증 사용자)
- **Write**: `isActiveMember(clubId) && request.auth.uid == userId && isPollOpen()`
- **조건**: `isPollOpen()` - 상위 post의 `closed != true` 체크
- **v1.1 준수**: ⚠️ (poll은 v1.1 제외 대상이지만 Rules에 남아있음)

#### `/clubs/{clubId}/posts/{postId}/record_*` (Game Records)
- **라인**: 171-196
- **컬렉션**: `record_lineup`, `record_batting`, `record_pitching`
- **Read**: `isAuthenticated()` (인증 사용자)
- **Write**: `isActiveMember(clubId) && canRecordAdminOverride()`
- **조건**: `canRecordAdminOverride()` - `isAdminLike(clubId) || (isRecorder && !isLocked)`
- **v1.1 준수**: ❌ (v1.1 제외 대상이지만 Rules에 남아있음)

#### `/clubs/{clubId}/dues/{docId}`
- **라인**: 203-205
- **Read**: `false` (전면 차단)
- **Write**: `false` (전면 차단)
- **v1.1 준수**: ✅ (Functions-only)

#### `/clubs/{clubId}/ledger/{docId}`
- **라인**: 207-209
- **Read**: `false` (전면 차단)
- **Write**: `false` (전면 차단)
- **v1.1 준수**: ✅ (Functions-only)

#### `/clubs/{clubId}/audit/{docId}`
- **라인**: 211-213
- **Read**: `false` (전면 차단)
- **Write**: `false` (전면 차단)
- **v1.1 준수**: ✅ (Functions-only)

#### `/clubs/{clubId}/idempotency/{docId}`
- **라인**: 215-217
- **Read**: `false` (전면 차단)
- **Write**: `false` (전면 차단)
- **v1.1 준수**: ✅ (Functions-only)

---

## (C) Helper Functions

### `isAuthenticated()`
- **라인**: 9-11
- **정의**: `request.auth != null`

### `isClubMember(clubId)`
- **라인**: 18-20
- **정의**: `isAuthenticated() && exists(memberPath(clubId, request.auth.uid))`
- **용도**: 멤버 문서 존재 확인

### `isActiveMember(clubId)`
- **라인**: 26-28
- **정의**: `isClubMember(clubId) && member(clubId).status == 'active'`
- **용도**: 활성 멤버 확인

### `isAdminLike(clubId)`
- **라인**: 30-33
- **정의**: `isClubMember(clubId) && member(clubId).role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER']`
- **용도**: 관리자 권한 확인

---

## (D) 클라이언트 Direct Write 허용 여부 요약표

| 컬렉션/경로 | Create | Update | Delete | Functions-only 여부 |
|------------|--------|--------|--------|---------------------|
| `posts` (notice) | ❌ | ❌ | ❌ | ✅ Functions-only |
| `posts` (event) | ❌ | ❌ | ❌ | ✅ Functions-only |
| `posts` (poll) | ❌ | ❌ | ❌ | ✅ Functions-only (v1.1 제외) |
| `posts` (game) | ❌ | ❌ | ❌ | ✅ Functions-only (v1.1 제외) |
| `posts` (free) | ✅ | ✅ | ✅ | ❌ (멤버 허용) |
| `posts` (meetup) | ✅ | ✅ | ✅ | ❌ (멤버 허용) |
| `comments` | ✅ | ✅ | ✅ | ❌ (멤버 허용, 작성자/adminLike만 수정/삭제) |
| `attendance` | ✅ | ✅ | ✅ | ❌ (본인만, voteClosed==false일 때만) |
| `votes` | ✅ | ✅ | ✅ | ❌ (본인만, closed==false일 때만, v1.1 제외) |
| `record_*` | ✅ | ✅ | ✅ | ❌ (adminLike/recorder만, v1.1 제외) |
| `dues` | ❌ | ❌ | ❌ | ✅ Functions-only |
| `ledger` | ❌ | ❌ | ❌ | ✅ Functions-only |
| `audit` | ❌ | ❌ | ❌ | ✅ Functions-only |
| `idempotency` | ❌ | ❌ | ❌ | ✅ Functions-only |
| `members/{uid}/tokens` | ❓ | ❓ | ❓ | Rules에 명시 없음 (Functions에서 처리) |

---

## (E) v1.1 제외 대상 Rules (제거/무효화 필요)

### 1. `/clubs/{clubId}/posts/{postId}/votes/{userId}`
- **라인**: 157-168
- **이유**: poll 게시판 제외
- **조치**: match 블록 제거 또는 무효화

### 2. `/clubs/{clubId}/posts/{postId}/record_*`
- **라인**: 171-196
- **이유**: 경기 기록 제외
- **조치**: match 블록 제거 또는 무효화

### 3. `isPostTypeAllowedForCreate()` 함수
- **라인**: 93-99
- **현재**: `type in ['free', 'meetup']` 허용
- **v1.1**: `type in ['free', 'event']` 허용 (meetup → event 변경)
- **조치**: 함수 수정 필요

### 4. `inviteCodes` match
- **라인**: 54-57
- **상태**: 이미 차단됨 (주석: "ATOM-11: Invite 제거 반영")
- **조치**: 선택사항 (유지 가능)

---

## (F) Indexes 존재 여부

| 파일 | 존재 여부 | 경로 |
|------|----------|------|
| `firestore.indexes.json` | ❌ | 없음 |

**리스크**: 복합 쿼리 사용 시 인덱스 필요할 수 있음 (현재는 단순 쿼리만 사용 중)

---

## Done 체크리스트

- [x] Rules 핵심 match/allow 근거 확보
- [x] indexes 존재 여부/부재 리스크 기록
- [x] 클라이언트 direct write 허용 여부 표 작성
- [x] v1.1 제외 대상 Rules 목록 확정

---

**수집 완료일**: 2024년 (현재)  
**수집자**: AI Assistant (Cursor)  
**방식**: READ-ONLY (코드 변경 없음)

