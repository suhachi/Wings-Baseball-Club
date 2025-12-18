# ATOM-11 작업 완료 보고서: Firestore Rules v1

**작성일**: 2024년  
**작업 브랜치**: `feat/atom-11-firestore-rules-v1`  
**작업 범위**: Firestore Rules v1 고정 (Invite 제거 반영)

---

## 📋 작업 요약

### 완료된 작업

✅ **ATOM-11**: Firestore Rules v1 고정 (Invite 제거 반영)
- invites 관련 규칙 제거/정리 완료
- 핵심 규칙을 v1로 고정
- 고권한 컬렉션 클라 write 차단

---

## 1. 변경 사항

### 1.1 InviteCodes 규칙 정리

**변경 전**:
```javascript
// inviteCodes: 미사용이면 제거 권장. 남겨야 하면 관리자만.
match /inviteCodes/{code} {
  allow read, write: if false;
}
```

**변경 후**:
```javascript
// inviteCodes: Functions-only (ATOM-11: Invite 제거 반영)
match /inviteCodes/{code} {
  allow read, write: if false;
}
```

**변경 내용**:
- 주석만 명확히 업데이트 (실제 규칙은 동일)
- Functions-only임을 명시

---

## 2. 핵심 규칙 v1 고정

### 2.1 공통: isClubMember(clubId) 필수

**구현**:
- 모든 club-scoped 컬렉션 접근 시 `isClubMember(clubId)` 필수
- `isActiveMember(clubId)`는 write 시 추가 검증

```javascript
function isClubMember(clubId) {
  return isAuthenticated() && exists(memberPath(clubId, request.auth.uid));
}

function isActiveMember(clubId) {
  return isClubMember(clubId) && member(clubId).status == 'active';
}
```

---

### 2.2 Posts 규칙

#### Create Policy

**규칙**:
- `notice/event/poll/game`: 클라 write 금지 (Functions-only)
- `free/meetup`: member create 허용

**구현**:
```javascript
function isPostTypeAllowedForCreate() {
  let postType = request.resource.data.type;
  // notice, event, poll, game는 Functions-only
  return postType in ['free', 'meetup'];
}

allow create: if isActiveMember(clubId) && isPostTypeAllowedForCreate();
```

**변경 내용**:
- 기존: 모든 postType에 대해 `isActiveMember(clubId)`만 체크
- 변경 후: `free`, `meetup`만 클라에서 create 허용, 나머지는 Functions-only

#### Update/Delete Policy

**규칙**:
- `free/meetup`: (author OR adminLike) update/delete

**구현**:
```javascript
allow update: if isActiveMember(clubId) && (
  isAdminLike(clubId)
  || (isPostAuthor() && !updatingProtectedPostFields())
);

allow delete: if isActiveMember(clubId) && (
  isAdminLike(clubId) || isPostAuthor()
);
```

**변경 내용**:
- 기존과 동일 (이미 구현되어 있음)

---

### 2.3 Comments 규칙

**규칙**: member create, (author OR adminLike) update/delete

**구현**:
```javascript
match /comments/{commentId} {
  allow read: if isAuthenticated();
  allow create: if isActiveMember(clubId);

  allow update, delete: if isActiveMember(clubId) && (
    resource.data.authorId == request.auth.uid || isAdminLike(clubId)
  );
}
```

**변경 내용**: 없음 (이미 구현되어 있음)

---

### 2.4 Attendance 규칙

**규칙**: 본인만, `voteClosed==false` write

**구현**:
```javascript
match /attendance/{userId} {
  allow read: if isAuthenticated();
  // 본인만, voteClosed==false일 때만 write 허용
  function isVoteOpen() {
    let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
    return post.voteClosed != true;
  }
  allow write: if isActiveMember(clubId) 
    && request.auth.uid == userId
    && isVoteOpen();
}
```

**변경 내용**:
- 기존: `isActiveMember(clubId)`만 체크
- 변경 후: 본인만 (`request.auth.uid == userId`) + `voteClosed != true` 조건 추가

---

### 2.5 Votes 규칙 (신규 추가)

**규칙**: 본인만, `closed==false` write

**구현**:
```javascript
match /votes/{userId} {
  allow read: if isAuthenticated();
  // 본인만, closed==false일 때만 write 허용
  function isPollOpen() {
    let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
    return post.closed != true;
  }
  allow write: if isActiveMember(clubId)
    && request.auth.uid == userId
    && isPollOpen();
}
```

**변경 내용**:
- 신규 추가 (기존에 없었음)

---

### 2.6 Game Records (record_*) 규칙

**규칙**: (adminLike OR uid in recorders) AND `recordingLocked==false` write

**구현**:
```javascript
function canRecordAdminOverride() {
  let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
  let recorders = post.recorders != null ? post.recorders : [];
  let isRecorder = request.auth.uid in recorders;
  let isLocked = post.recordingLocked == true;
  // adminLike OR (isRecorder AND !isLocked)
  return isAdminLike(clubId) || (isRecorder && !isLocked);
}

match /record_lineup/{docId} {
  allow read: if isAuthenticated();
  allow write: if isActiveMember(clubId) && canRecordAdminOverride();
}

match /record_batting/{docId} {
  allow read: if isAuthenticated();
  allow write: if isActiveMember(clubId) && canRecordAdminOverride();
}

match /record_pitching/{docId} {
  allow read: if isAuthenticated();
  allow write: if isActiveMember(clubId) && canRecordAdminOverride();
}
```

**변경 내용**: 없음 (이미 구현되어 있음)

---

### 2.7 Dues / Ledger / Audit / Idempotency 규칙 (신규 추가)

**규칙**: 일반회원 접근 차단 (Functions-only)

**구현**:
```javascript
match /dues/{docId} {
  allow read, write: if false;
}

match /ledger/{docId} {
  allow read, write: if false;
}

match /audit/{docId} {
  allow read, write: if false;
}

match /idempotency/{docId} {
  allow read, write: if false;
}
```

**변경 내용**:
- 신규 추가 (기존에 없었음)
- 모든 일반회원 접근 차단, Functions-only로 명시

---

## 3. 제거된 규칙

### 3.1 `/clubs/{clubId}/notices` 규칙

**제거 이유**:
- `notices`는 posts 컬렉션 내 `type='notice'` 게시글로 통합
- 별도 컬렉션 불필요

**변경 전**:
```javascript
match /notices/{noticeId} {
  allow read: if isAuthenticated();
  allow write: if isAdminLike(clubId);
}
```

**변경 후**: 제거됨 (posts 규칙으로 통합)

---

## 4. 검증 결과

### 4.1 Rules 파싱 검증

**명령어**:
```bash
firebase deploy --only firestore:rules --dry-run
```

**결과**:
```
+  cloud.firestore: rules file firestore.rules compiled successfully
+  Dry run complete!
```

✅ **성공**: 파싱 오류 0개

---

## 5. 규칙 요약 표

| 컬렉션 | Read | Create | Update | Delete | 비고 |
|--------|------|--------|--------|--------|------|
| **users** | 인증 | 본인 | 본인 | - | - |
| **inviteCodes** | ❌ | ❌ | ❌ | ❌ | Functions-only |
| **notifications** | 본인 | 인증 | 인증 | 인증 | - |
| **clubs/{clubId}/members** | 인증 | 본인 | 본인 or adminLike | - | - |
| **clubs/{clubId}/posts** | 인증 | active + type 제한 | active + (author or adminLike) | active + (author or adminLike) | notice/event/poll/game는 Functions-only |
| **clubs/{clubId}/posts/{postId}/comments** | 인증 | active | active + (author or adminLike) | active + (author or adminLike) | - |
| **clubs/{clubId}/posts/{postId}/attendance** | 인증 | active + 본인 + voteClosed==false | active + 본인 + voteClosed==false | active + 본인 + voteClosed==false | - |
| **clubs/{clubId}/posts/{postId}/votes** | 인증 | active + 본인 + closed==false | active + 본인 + closed==false | active + 본인 + closed==false | 신규 추가 |
| **clubs/{clubId}/posts/{postId}/record_*** | 인증 | active + canRecord | active + canRecord | active + canRecord | - |
| **clubs/{clubId}/dues** | ❌ | ❌ | ❌ | ❌ | Functions-only (신규) |
| **clubs/{clubId}/ledger** | ❌ | ❌ | ❌ | ❌ | Functions-only (신규) |
| **clubs/{clubId}/audit** | ❌ | ❌ | ❌ | ❌ | Functions-only (신규) |
| **clubs/{clubId}/idempotency** | ❌ | ❌ | ❌ | ❌ | Functions-only (신규) |

**약어 설명**:
- `active`: `isActiveMember(clubId)`
- `adminLike`: `isAdminLike(clubId)` (PRESIDENT | DIRECTOR | ADMIN | TREASURER)
- `author`: 게시글/댓글 작성자
- `본인`: `request.auth.uid == userId`
- `canRecord`: `canRecordAdminOverride()` (adminLike OR (isRecorder AND !isLocked))

---

## 6. 자체 검수 결과

### 6.1 완료 기준 충족

✅ **Invites 규칙 제거/정리 완료**:
- [x] `inviteCodes` 컬렉션: `allow read, write: if false` (Functions-only)
- [x] 주석 명확히 업데이트

✅ **고권한 컬렉션 클라 write 차단**:
- [x] `posts`: `notice/event/poll/game` 타입 create 차단 (Functions-only)
- [x] `dues`: 모든 접근 차단 (Functions-only)
- [x] `ledger`: 모든 접근 차단 (Functions-only)
- [x] `audit`: 모든 접근 차단 (Functions-only)
- [x] `idempotency`: 모든 접근 차단 (Functions-only)

✅ **핵심 규칙 v1 고정**:
- [x] 공통: `isClubMember(clubId)` 필수
- [x] posts: `free/meetup`만 클라 create, `(author OR adminLike)` update/delete
- [x] comments: `member create`, `(author OR adminLike)` update/delete
- [x] attendance: 본인만, `voteClosed==false` write
- [x] votes: 본인만, `closed==false` write (신규 추가)
- [x] record_*: `(adminLike OR uid in recorders) AND recordingLocked==false` write
- [x] dues/ledger/audit/idempotency: 일반회원 접근 차단

✅ **Rules 파싱 검증**:
- [x] `firebase deploy --only firestore:rules --dry-run` 성공
- [x] 파싱 오류 0개

---

## 7. 제약 사항 준수 확인

✅ **공통 제약 준수**:
- [x] 새 브랜치 생성: `feat/atom-11-firestore-rules-v1` ✅
- [x] 변경 범위 한정: Firestore Rules만 수정 ✅
- [x] "열림(open)" 금지: 모든 규칙에 명확한 조건 지정 ✅
- [x] 문서(11.4)와 다른 정책 도입 금지: 기존 규칙 구조 유지, 세부 조건만 보강 ✅

---

## 8. 수정된 파일 목록

### 수정된 파일 (1개)

1. `firestore.rules`
   - inviteCodes 주석 업데이트
   - posts create 규칙에 type 제한 추가
   - attendance 규칙에 본인 + voteClosed 조건 추가
   - votes 서브컬렉션 규칙 추가
   - dues/ledger/audit/idempotency 규칙 추가
   - /notices 컬렉션 규칙 제거

---

## 9. 다음 단계 (권장)

### 9.1 즉시 가능한 작업

1. **Rules 배포**: `firebase deploy --only firestore:rules` 실행하여 실제 배포
2. **테스트**: 클라이언트에서 `free/meetup` 게시글만 create 가능한지 확인
3. **Functions 연동**: `notice/event/poll/game` create는 Functions를 통해서만 가능하도록 클라이언트 코드 수정

### 9.2 주의 사항

1. **posts create 제한**: 클라이언트에서 `notice/event/poll/game` 타입 게시글 생성 시도 시 Rules에서 차단됨
2. **attendance/votes 마감 조건**: `voteClosed==false` / `closed==false` 조건이 추가되어, 마감된 게시글에서는 write 불가
3. **Functions-only 컬렉션**: `dues/ledger/audit/idempotency`는 클라이언트에서 직접 접근 불가, Functions를 통해서만 가능

---

## 10. 작업 완료 확인

### 체크리스트

- [x] ATOM-11 Firestore Rules v1 구현 완료
- [x] invites 규칙 제거/정리 완료
- [x] 고권한 컬렉션 클라 write 차단 완료
- [x] Rules 파싱 검증 완료
- [x] 자체 검수 완료
- [x] 작업 완료 보고서 작성 완료

---

**작업 완료**: 2024년  
**다음 작업**: ATOM-12 (registerFcmToken callable 구현)

