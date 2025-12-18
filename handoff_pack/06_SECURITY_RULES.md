# handoff_pack/06_SECURITY_RULES.md

## 목적/범위
Firestore 보안 규칙의 핵심 요약 및 WF-07 기록 권한, 승인제 게이트, 회계 접근 제한을 정리합니다.

---

## Firestore Rules 파일 위치

- **원문**: `firestore.rules`
- **원문 전체**: `handoff_pack/_raw/firestore.rules.md` 참조

---

## 핵심 규칙 요약

### Helper Functions

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function isAdmin() {
  return isAuthenticated() && 
    exists(/databases/$(database)/documents/clubs/default-club/members/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/clubs/default-club/members/$(request.auth.uid)).data.role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER'];
}
```

**참고**: `isAdmin()` 함수는 `'TREASURER'`를 포함하지만, 클라이언트의 `isAdmin()` 함수와 불일치 가능성 확인 필요.

---

## 컬렉션별 규칙

### 1. users/{userId} (전역 프로필)

```javascript
allow read: if isAuthenticated();
allow create: if isAuthenticated() && request.auth.uid == userId;
allow update: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
```

**요약**:
- 읽기: 로그인 필요
- 생성: 본인만
- 수정: 본인 또는 관리자

---

### 2. inviteCodes/{code} (초대 코드, DEPRECATED)

```javascript
allow read: if true;  // 인증 없이 읽기 가능 (검증용)
allow create: if code == 'WINGS2024' || isAdmin();
allow update: if isAuthenticated(); // 사용 처리
allow delete: if isAdmin();
```

**요약**: 초대 코드는 현재 정책에서 선택 사항이지만 규칙은 유지됨.

---

### 3. clubs/{clubId}/members/{memberId} (멤버십)

```javascript
allow read: if isAuthenticated();
allow create: if isAuthenticated() && request.auth.uid == memberId; // 가입 시 본인만 생성
allow update: if isAuthenticated() && (request.auth.uid == memberId || isAdmin());
```

**요약**:
- 읽기: 로그인 필요
- 생성: 본인만 (회원가입 시)
- 수정: 본인 또는 관리자 (승인 처리 포함)

**승인제 게이트**: 규칙에서는 `status` 필드 변경에 대한 명시적 제한 없음. 클라이언트에서 권한 체크 필요.

---

### 4. clubs/{clubId}/posts/{postId} (게시글)

```javascript
allow read: if isAuthenticated();
allow create: if isAuthenticated();
allow update: if isAuthenticated() && (resource.data.author.id == request.auth.uid || isAdmin());
allow delete: if isAuthenticated() && (resource.data.author.id == request.auth.uid || isAdmin());
```

**⚠️ 문제**: `resource.data.author.id` 사용하는데, `PostDoc`에는 `authorId` 필드만 있음. `author.id`는 클라이언트 변환 후의 구조. 실제 Firestore 문서에는 `authorId`가 저장됨.

**요약**:
- 읽기: 로그인 필요
- 생성: 로그인 필요 (모든 회원)
- 수정/삭제: 작성자 본인 또는 관리자

---

### 5. clubs/{clubId}/posts/{postId}/comments/{commentId} (댓글)

```javascript
allow read: if isAuthenticated();
allow create: if isAuthenticated();
allow update: if isAuthenticated() && (resource.data.author.id == request.auth.uid || isAdmin());
allow delete: if isAuthenticated() && (resource.data.author.id == request.auth.uid || isAdmin());
```

**⚠️ 동일한 문제**: `resource.data.author.id` 사용.

---

### 6. clubs/{clubId}/posts/{postId}/attendance/{docId} (출석 기록)

```javascript
allow read: if isAuthenticated();
allow write: if isAuthenticated(); // 모든 회원 출석 투표 가능
```

**요약**: 로그인 회원 누구나 읽기/쓰기 가능.

---

### 7. WF-07: Game Records (라인업/타자/투수 기록)

**핵심 Helper 함수**:

```javascript
function canRecordAdminOverride() {
   let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
   let isRecorder = request.auth.uid in (post.recorders != null ? post.recorders : []);
   let isLocked = post.recordingLocked == true;
   
   // Recorders blocked if locked. Admin always allowed.
   return isAdmin() || (isRecorder && !isLocked); 
}
```

**규칙**:

```javascript
// record_lineup, record_batting, record_pitching 모두 동일
allow read: if isAuthenticated(); // 모든 회원 조회 가능
allow write: if isAuthenticated() && canRecordAdminOverride();
```

**요약 (Policy A)**:
- 읽기: 로그인 회원 누구나
- 쓰기: 
  - 관리자는 LOCK 후에도 수정 가능
  - 기록원(`recorders` 배열 포함)은 `!recordingLocked`일 때만 수정 가능

---

### 8. clubs/{clubId}/ledger/{financeId} (회계 내역)

**⚠️ 규칙 누락**: `firestore.rules`에 `ledger` 컬렉션 규칙 없음.

**현재 상태**: 클라이언트에서만 권한 체크 (`isTreasury()`), 서버 규칙 없음.

**필요**: 총무만 읽기/쓰기 가능 규칙 추가 필요.

**제안 규칙**:

```javascript
function isTreasury() {
  return isAuthenticated() && 
    exists(/databases/$(database)/documents/clubs/default-club/members/$(request.auth.uid)) &&
    get(/databases/$(database)/documents/clubs/default-club/members/$(request.auth.uid)).data.role in ['PRESIDENT', 'TREASURER'];
}

// clubs/{clubId}/ledger/{financeId}
match /ledger/{financeId} {
  allow read: if isTreasury();
  allow write: if isTreasury();
}
```

---

## 승인제 게이트 (Approval Gate)

### 현재 구현 상태

**클라이언트 측**:
- `App.tsx` Line 64-68: `pending` 사용자 전체 차단 로직 **주석 처리됨**
- `pending` 상태도 앱 접근 가능 (읽기 전용 권한 적용)

**Firestore Rules**:
- `status` 필드 변경에 대한 명시적 제한 없음
- 클라이언트에서 권한 체크 필요

**권장 사항**:
- Firestore Rules에 승인 상태 체크 규칙 추가 고려 (예: `status === 'active'`일 때만 쓰기 허용)

---

## TODO/누락

1. **게시글/댓글 규칙 수정**: `resource.data.author.id` → `resource.data.authorId`로 변경 필요
2. **회계 규칙 추가**: `ledger` 컬렉션 규칙 추가 필요
3. **승인 상태 게이트**: `status === 'active'` 체크 규칙 추가 고려
4. **Storage Rules**: `storage.rules` 파일 없음, Firebase Console에서 설정 필요

---

## 원문 파일

전체 `firestore.rules` 원문은 `handoff_pack/_raw/firestore.rules.md` 참조.

