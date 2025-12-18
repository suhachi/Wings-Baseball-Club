# 06. FIRESTORE RULES REVIEW
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA  
**목적**: Rules가 요구 정책을 만족하는지 점검 (특히 pending, recorders/LOCK)

---

## 📜 Firestore Rules 현재 상태

**파일**: `d:\projectsing\Wings Baseball Club Community PWA\firestore.rules` (144 라인)  
**최근 수정**: Git status에 "modified" 표시  
**배포 상태**: 미배포 (local 변경사항)

---

## 🔍 현재 Rules 전체 구조 요약

### 1. 기본 구조 (라인 1~3)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
```
✅ 최신 V2 규칙 사용

### 2. 핵심 헬퍼 함수들 (라인 5~28)

```typescript
function isAuthenticated() {
  return request.auth != null;  // 라인 6
}

function memberPath(clubId, uid) {
  return /databases/$(database)/documents/clubs/$(clubId)/members/$(uid);  // 라인 10
}

function isClubMember(clubId) {
  return isAuthenticated() && exists(memberPath(clubId, request.auth.uid));  // 라인 14
}

function member(clubId) {
  return get(memberPath(clubId, request.auth.uid)).data;  // 라인 18
}

function isActiveMember(clubId) {
  return isClubMember(clubId) && member(clubId).status == 'active';  // 라인 22
}

function isAdminLike(clubId) {
  return isClubMember(clubId)
    && member(clubId).role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER'];  // 라인 26-27
}
```

### 3. 컬렉션별 규칙 (라인 31~144)

---

## ✅ 정책 검증 체크리스트

### [검사 1] 게시글/댓글 수정삭제 권한이 authorId 기준인가?

#### 게시글 수정 (라인 72~92)
```typescript
function isPostAuthor() {
  return resource.data.authorId == request.auth.uid;  // ✅ authorId 기준
}

function updatingProtectedPostFields() {
  return request.resource.data.keys().hasAny([
    'authorId','authorName','authorPhotoURL','type',
    'recorders','recordersSnapshot',
    'recordingLocked','recordingLockedAt','recordingLockedBy'
  ]);
}

allow update: if isActiveMember(clubId) && (
  isAdminLike(clubId)
  || (isPostAuthor() && !updatingProtectedPostFields())
);
```

**평가**: ✅ **OK**  
**근거**: 
- authorId 기준 검증 (라인 73)
- 작성자는 protected fields 제외 수정 가능 (라인 84~92)
- admin은 모든 필드 수정 가능

#### 게시글 삭제 (라인 94~97)
```typescript
allow delete: if isActiveMember(clubId) && (
  isAdminLike(clubId) || isPostAuthor()
);
```

**평가**: ✅ **OK**  
**근거**: isPostAuthor() 기반 검증

#### 댓글 수정/삭제 (라인 107~111)
```typescript
allow update, delete: if isActiveMember(clubId) && (
  resource.data.authorId == request.auth.uid || isAdminLike(clubId)  // ✅ authorId
);
```

**평가**: ✅ **OK**  
**근거**: authorId 기준 검증

---

### [검사 2] isAdminLike가 clubId 기준이며 default-club 하드코딩이 없는가?

#### isAdminLike 정의 (라인 25~27)
```typescript
function isAdminLike(clubId) {
  return isClubMember(clubId)
    && member(clubId).role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER'];
}
```

**평가**: ✅ **OK**  
**근거**:
- `clubId` 파라미터 사용 (동적)
- clubs/{clubId}/members/{uid} 경로 기반 조회
- 기본값/하드코딩 없음

#### 사용 예시 확인
```typescript
// 라인 56 (members 수정)
allow update: if isAuthenticated() && (request.auth.uid == memberId || isAdminLike(clubId));

// 라인 60 (posts 생성)
allow create: if isActiveMember(clubId);

// 라인 71 (posts 업데이트)
allow update: if isActiveMember(clubId) && (
  isAdminLike(clubId)  // ← clubId 동적 참조
  || (isPostAuthor() && !updatingProtectedPostFields())
);
```

**평가**: ✅ **OK** (모두 clubId 동적 사용)

---

### [검사 3] pending 사용자의 write 차단이 실제로 적용되는가?

#### Posts 생성 (라인 60)
```typescript
match /posts/{postId} {
  allow read: if isAuthenticated();
  // 승인(active)만 작성 허용
  allow create: if isActiveMember(clubId);  // ← pending 차단
}
```

**isActiveMember** 정의:
```typescript
function isActiveMember(clubId) {
  return isClubMember(clubId) && member(clubId).status == 'active';  // ← status must be 'active'
}
```

**평가**: ✅ **OK**  
**근거**: `status == 'active'` 체크로 pending 명시적 차단

#### 댓글 생성 (라인 105)
```typescript
match /comments/{commentId} {
  allow read: if isAuthenticated();
  allow create: if isActiveMember(clubId);  // ← pending 차단
}
```

**평가**: ✅ **OK**  
**근거**: 동일한 isActiveMember 체크

#### 출석 투표 (라인 102)
```typescript
match /attendance/{docId} {
  allow read: if isAuthenticated();
  allow write: if isActiveMember(clubId);  // ← pending 차단
}
```

**평가**: ✅ **OK**  
**근거**: 동일한 isActiveMember 체크

#### 기록 입력 (라인 125~135)
```typescript
match /record_batting/{docId} {
  allow read: if isAuthenticated();
  allow write: if isActiveMember(clubId) && canRecordAdminOverride();  // ← pending 차단 (1차)
}
```

**평가**: ✅ **OK**  
**근거**: pending은 isActiveMember 체크에서 이미 차단됨

---

### [검사 4] posts의 protected 필드(recorders/recordingLocked*)를 관리자만 변경 가능하게 막았는가?

#### Protected Fields 정의 (라인 81~87)
```typescript
function updatingProtectedPostFields() {
  return request.resource.data.keys().hasAny([
    'authorId','authorName','authorPhotoURL','type',
    'recorders','recordersSnapshot',                    // ✅ recorders
    'recordingLocked','recordingLockedAt','recordingLockedBy'  // ✅ recording*
  ]);
}
```

**평가**: ✅ **OK**  
**근거**: 모든 recording 필드 명시적으로 protected 지정

#### 업데이트 정책 (라인 88~92)
```typescript
allow update: if isActiveMember(clubId) && (
  isAdminLike(clubId)  // ← admin: protected fields 포함 모든 필드 수정 가능
  || (isPostAuthor() && !updatingProtectedPostFields())  // ← author: protected 제외 수정 가능
);
```

**시나리오 테스트**:

| 사용자 | recorders 변경 | recordingLocked 변경 | title 변경 | 결과 |
|--------|-------------|---------------|---------|------|
| Admin | ✅ 가능 | ✅ 가능 | ✅ 가능 | OK (isAdminLike 체크만) |
| Author | ❌ 불가 | ❌ 불가 | ✅ 가능 | OK (protected fields 체크) |
| Member | ❌ 불가 | ❌ 불가 | ❌ 불가 | OK (!isPostAuthor) |

**평가**: ✅ **OK** (3중 검증)

---

### [검사 5] record_* write 조건이 (adminLike OR recorder) AND not locked 를 정확히 반영하는가?

#### record_batting 규칙 (라인 127~129)
```typescript
match /record_batting/{docId} {
  allow read: if isAuthenticated();
  allow write: if isActiveMember(clubId) && canRecordAdminOverride();  // ← 조건
}
```

#### canRecordAdminOverride 함수 (라인 119~124)
```typescript
function canRecordAdminOverride() {
  let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
  let recorders = post.recorders != null ? post.recorders : [];
  let isRecorder = request.auth.uid in recorders;  // ← Recorder 체크
  let isLocked = post.recordingLocked == true;      // ← Locked 체크
  return isAdminLike(clubId) || (isRecorder && !isLocked);  // ← 정확한 로직
}
```

**로직 분석**:
```
return isAdminLike(clubId) || (isRecorder && !isLocked)
     = Admin? true
     : (isRecorder AND NOT locked) ? true
     : false
```

**시나리오 테스트**:

| 사용자 | recordingLocked | recorders | 결과 | 근거 |
|--------|-----------------|-----------|------|------|
| Admin | false | [] | ✅ 가능 | isAdminLike() = true |
| Admin | true | [] | ✅ 가능 | isAdminLike() = true (override) |
| Recorder | false | [user] | ✅ 가능 | (isRecorder=true && !isLocked=true) = true |
| Recorder | true | [user] | ❌ 불가 | (isRecorder=true && !isLocked=false) = false |
| Member | false | [] | ❌ 불가 | (false && true) = false |
| pending | false | [user] | ❌ 불가 | isActiveMember 체크 실패 (라인 127) |

**평가**: ✅ **OK** (4중 검증: active + (admin or recorder) + not locked)

#### record_pitching 규칙 (라인 131~133)
```typescript
match /record_pitching/{docId} {
  allow read: if isAuthenticated();
  allow write: if isActiveMember(clubId) && canRecordAdminOverride();  // ← 동일
}
```

**평가**: ✅ **OK** (동일한 논리)

#### record_lineup 규칙 (라인 125~126)
```typescript
match /record_lineup/{docId} {
  allow read: if isAuthenticated();
  allow write: if isActiveMember(clubId) && canRecordAdminOverride();  // ← 동일
}
```

**평가**: ✅ **OK** (동일한 논리)

---

## 🧪 에뮬레이터 권한 테스트 케이스

### 테스트 환경 설정
```bash
# Firebase Emulator Suite 실행
firebase emulators:start --only firestore

# Firestore Rules 테스트 라이브러리
npm install --save-dev @firebase/testing
```

### 테스트 케이스 (6개 이상)

#### TC-001: pending 사용자가 댓글 작성 불가
```javascript
const auth = { uid: 'user-pending', email: 'pending@test.com' };
const data = { 'clubs/default-club/members/user-pending': { status: 'pending', role: 'MEMBER' } };
const request = { auth, resource: { data: { content: '테스트' } } };

// firestore:rule:allow create for comments
// Expected: DENY (isActiveMember fails on status check)
```

#### TC-002: active 사용자가 댓글 작성 가능
```javascript
const auth = { uid: 'user-active', email: 'active@test.com' };
const data = { 'clubs/default-club/members/user-active': { status: 'active', role: 'MEMBER' } };
const request = { auth, resource: { data: { content: '테스트' } } };

// firestore:rule:allow create for comments
// Expected: ALLOW (isActiveMember passes)
```

#### TC-003: Member가 recorders 필드 수정 불가
```javascript
const auth = { uid: 'user-member', email: 'member@test.com' };
const data = { 
  'clubs/default-club/members/user-member': { status: 'active', role: 'MEMBER' },
  'clubs/default-club/posts/post-1': { 
    authorId: 'user-other',
    recorders: []
  }
};
const request = { 
  auth, 
  resource: { data: { recorders: ['user-member'] } }
};

// firestore:rule:allow update for posts
// Expected: DENY (Member not admin, not author, recorders는 protected field)
```

#### TC-004: Admin이 recorders 필드 수정 가능
```javascript
const auth = { uid: 'user-admin', email: 'admin@test.com' };
const data = { 
  'clubs/default-club/members/user-admin': { status: 'active', role: 'ADMIN' },
  'clubs/default-club/posts/post-1': { 
    authorId: 'user-other',
    recorders: []
  }
};
const request = { 
  auth, 
  resource: { data: { recorders: ['user-admin'] } }
};

// firestore:rule:allow update for posts
// Expected: ALLOW (isAdminLike passes)
```

#### TC-005: Recorder가 locked 경기 기록 수정 불가
```javascript
const auth = { uid: 'user-recorder', email: 'recorder@test.com' };
const data = { 
  'clubs/default-club/members/user-recorder': { status: 'active', role: 'MEMBER' },
  'clubs/default-club/posts/game-1': { 
    recordingLocked: true,
    recorders: ['user-recorder']
  }
};
const request = { auth, resource: { data: { ab: 3 } } };

// firestore:rule:allow write for record_batting
// Expected: DENY (isLocked=true, so (isRecorder && !isLocked) = false)
```

#### TC-006: Recorder가 unlocked 경기 기록 수정 가능
```javascript
const auth = { uid: 'user-recorder', email: 'recorder@test.com' };
const data = { 
  'clubs/default-club/members/user-recorder': { status: 'active', role: 'MEMBER' },
  'clubs/default-club/posts/game-1': { 
    recordingLocked: false,
    recorders: ['user-recorder']
  }
};
const request = { auth, resource: { data: { ab: 3 } } };

// firestore:rule:allow write for record_batting
// Expected: ALLOW (isRecorder=true && !isLocked=true = true)
```

---

## 📊 Rules 검증 요약

| 검사 항목 | 상태 | 평가 | 근거 라인 |
|----------|------|------|---------|
| **게시글/댓글 authorId 기준** | ✅ OK | 완벽 | 73, 108 |
| **isAdminLike clubId 동적** | ✅ OK | 완벽 | 26, 71 |
| **pending 차단** | ✅ OK | 4중 체크 | 22, 60, 105, 127 |
| **Protected fields** | ✅ OK | 3중 체크 | 81-92 |
| **Record lock logic** | ✅ OK | 정확함 | 119-124 |

**최종 평가**: ✅ **Rules는 보안 정책을 완벽하게 구현함**

---

## ⚠️ 주의사항

### 1. Default Club 문제 (미발견)
현재 코드에서 `clubId`가 항상 동적으로 전달되는지 확인 필요:
- GameRecordPage.tsx에서 clubId 사용 확인
- ClubContext에서 currentClubId 제공 확인

### 2. Post 조회 성능 (canRecordAdminOverride)
```typescript
let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
```
매 write 시 post 문서 조회 → Firestore 읽기 비용 증가 (미최적화)

### 3. 역할 문자열 관리
```typescript
member(clubId).role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER']
```
- 배열 하드코딩 → types.ts와 동기화 필요
- 신규 역할 추가 시 Rules도 수정 필요

---

## ✅ Rules 배포 체크리스트

- [x] Rules 문법 검증 (rules_version='2')
- [x] 보안 정책 검증 (5개 항목 모두 OK)
- [x] 테스트 케이스 설계 (6개)
- [ ] 로컬 Emulator에서 테스트 실행
- [ ] 스테이징 배포 후 E2E 테스트
- [ ] 프로덕션 배포 전 최종 검토

---

## 📌 다음 단계

1. Firebase Emulator Suite로 테스트 케이스 실행
2. 실제 Firestore Console에서 sample 문서 검증
3. `firebase deploy --only firestore:rules` 실행
4. 배포 후 런타임 테스트
