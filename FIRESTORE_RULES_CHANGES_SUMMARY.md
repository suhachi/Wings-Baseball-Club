# 🔒 Firestore Security Rules 수정 요약

**수정일**: 2024년  
**수정 기준**: 사용자 제공 프롬프트 요구사항

---

## 📋 변경 요약 (10줄)

1. **`author.id` → `authorId`**: 게시글/댓글 권한 체크를 `resource.data.authorId`로 변경
2. **`isAdmin()` → `isAdminLike(clubId)`**: `default-club` 하드코딩 제거, `clubId` 파라미터 기반으로 변경
3. **`isActiveMember(clubId)` 추가**: `status == 'active'`만 쓰기 허용, pending 사용자 차단
4. **게시글 생성/수정/삭제**: `isActiveMember(clubId)` 체크 추가 (pending 차단)
5. **게시글 protected 필드 보호**: `recorders`, `recordingLocked*` 필드는 `isAdminLike(clubId)`만 변경 가능
6. **댓글 생성/수정/삭제**: `isActiveMember(clubId)` 체크 추가, `author.id` → `authorId`
7. **출석 투표**: `isActiveMember(clubId)` 체크 추가
8. **경기 기록 (`record_*`)**: `canRecordAdminOverride()` 함수에 `isActiveMember(clubId)` 체크 추가
9. **`inviteCodes`**: 미사용이므로 `allow read, write: if false`로 잠금
10. **공지사항 (`notices`)**: `isAdminLike(clubId)`로 변경

---

## 🔧 주요 변경 사항 상세

### 1. author.id → authorId (권한 실패 원인 수정)

**변경 위치**:
- `/clubs/{clubId}/posts/{postId}` - `allow update`, `allow delete`
- `/clubs/{clubId}/posts/{postId}/comments/{commentId}` - `allow update`, `allow delete`

**변경 내용**:
```javascript
// 변경 전
resource.data.author.id == request.auth.uid

// 변경 후
resource.data.authorId == request.auth.uid
```

**영향**: 게시글/댓글 작성자가 수정/삭제 시 권한 체크 실패 문제 해결

---

### 2. isAdmin() → isAdminLike(clubId) (default-club 하드코딩 제거)

**변경 위치**: 모든 `isAdmin()` 호출 → `isAdminLike(clubId)`

**변경 내용**:
```javascript
// 변경 전
function isAdmin() {
  return isAuthenticated() && 
    exists(/databases/$(database)/documents/clubs/default-club/members/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/clubs/default-club/members/$(request.auth.uid)).data.role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER'];
}

// 변경 후
function isAdminLike(clubId) {
  return isClubMember(clubId)
    && member(clubId).role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER'];
}
```

**영향**: 다른 `clubId` 사용 시에도 관리자 판정 정상 작동

---

### 3. isActiveMember(clubId) 추가 (pending 사용자 쓰기 차단)

**추가된 함수**:
```javascript
function isActiveMember(clubId) {
  return isClubMember(clubId) && member(clubId).status == 'active';
}
```

**적용 위치**:
- 게시글 생성: `allow create: if isActiveMember(clubId)`
- 게시글 수정: `allow update: if isActiveMember(clubId) && ...`
- 게시글 삭제: `allow delete: if isActiveMember(clubId) && ...`
- 댓글 생성: `allow create: if isActiveMember(clubId)`
- 댓글 수정/삭제: `allow update, delete: if isActiveMember(clubId) && ...`
- 출석 투표: `allow write: if isActiveMember(clubId)`
- 경기 기록: `allow write: if isActiveMember(clubId) && canRecordAdminOverride()`

**영향**: pending 사용자는 읽기만 가능, 모든 쓰기 작업 차단

---

### 4. 게시글 protected 필드 보호

**추가된 함수**:
```javascript
function updatingProtectedPostFields() {
  return request.resource.data.diff(resource.data).affectedKeys().hasAny([
    'authorId', 'authorName', 'authorPhotoURL', 'type',
    'recorders', 'recordersSnapshot',
    'recordingLocked', 'recordingLockedAt', 'recordingLockedBy'
  ]);
}
```

**적용 규칙**:
```javascript
allow update: if isActiveMember(clubId) && (
  isAdminLike(clubId)
  || (isPostAuthor() && !updatingProtectedPostFields())
);
```

**영향**: `recorders`, `recordingLocked*` 등 민감 필드는 관리자만 변경 가능

---

### 5. 경기 기록 (record_*) 권한 강화

**변경된 함수**:
```javascript
function canRecordAdminOverride() {
  let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
  let recorders = post.recorders != null ? post.recorders : [];
  let isRecorder = request.auth.uid in recorders;
  let isLocked = post.recordingLocked == true;
  // adminLike OR (recorder && !locked && active)
  return isAdminLike(clubId) || (isRecorder && !isLocked && isActiveMember(clubId));
}
```

**변경 내용**: `isActiveMember(clubId)` 체크 추가

**영향**: pending 사용자는 경기 기록 작성 불가

---

### 6. inviteCodes 잠금

**변경 내용**:
```javascript
// 변경 전
match /inviteCodes/{code} {
  allow read: if true;
  allow create: if code == 'WINGS2024' || isAdmin();
  allow update: if isAuthenticated();
  allow delete: if isAdmin();
}

// 변경 후
match /inviteCodes/{code} {
  allow read, write: if false;
}
```

**영향**: 미사용 컬렉션 최소권한으로 잠금

---

## ✅ 검증 체크리스트

### 권한 테스트
- [x] 게시글 작성자가 본인 게시글 수정 가능 (`authorId` 체크)
- [x] 댓글 작성자가 본인 댓글 수정 가능 (`authorId` 체크)
- [x] pending 사용자는 게시글/댓글 작성 불가
- [x] pending 사용자는 출석 투표 불가
- [x] pending 사용자는 경기 기록 작성 불가
- [x] 관리자는 다른 clubId에서도 정상 판정
- [x] 일반 사용자는 `recorders`, `recordingLocked` 필드 변경 불가
- [x] 경기 기록원은 LOCK 전에만 기록 작성 가능

---

## 🔍 주의사항

1. **`updatingProtectedPostFields()` 함수**: 
   - Firestore Rules의 `keys()` 메서드는 `request.resource.data`에 직접 사용 불가
   - `request.resource.data.diff(resource.data).affectedKeys()` 사용 필요
   - 또는 `request.resource.data.diff(resource.data).unchangedKeys()` 사용

2. **`member(clubId)` 함수**: 
   - `get()` 호출이 발생하므로 읽기 비용 발생
   - `isAdminLike`, `isActiveMember` 함수에서 중복 호출 시 비용 증가 가능

3. **마이그레이션 고려사항**:
   - 기존 `author.id` 구조를 사용하는 문서가 있다면 마이그레이션 필요
   - 현재 코드는 `authorId` 단일 필드를 사용하므로 문제 없음

---

**수정 완료**

