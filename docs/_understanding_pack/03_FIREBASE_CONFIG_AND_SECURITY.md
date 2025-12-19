# Firebase Config & Security Model (Wings PWA v1.1)

[공통 헤더]
- 생성일시(KST): 2025-12-19
- 브랜치: feat/atom-14-17-board-comments-notice
- 생성자: GitHub Copilot (READ-ONLY 모드)
- 민감정보 마스킹: 프로젝트ID/도메인/토큰 등은 **** 처리
- git status -sb:
```
## feat/atom-14-17-board-comments-notice
 M .firebase/hosting.ZGlzdA.cache
 D jest.config.js
 M package-lock.json
 M package.json
 M src/app/components/CreatePostModal.tsx
 M tests/rules/firestore.rules.test.ts
?? docs/ADMIN_MANUAL_v1.1.md
?? jest.config.cjs
?? scripts/post_v1.1_announcement.cjs
?? scripts/post_v1.1_announcement.js
```

## firebase.json (전문)
```json
{
    "firestore": {"rules": "firestore.rules"},
    "functions": {"source": "functions", "runtime": "nodejs20"},
    "hosting": {"public": "dist", "ignore": ["firebase.json","**/.*","**/node_modules/**"], "rewrites": [{"source": "**", "destination": "/index.html"}]},
    "emulators": {"auth": {"port": 9099}, "firestore": {"port": 8080}, "functions": {"port": 5001}, "ui": {"enabled": true, "port": 4000}, "singleProjectMode": true}
}
```

## .firebaserc (전문)
```
(파일 없음)
```

## firestore.rules (전문)
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // ============================================
    // Helper Functions
    // ============================================

    function isAuthenticated() {
      return request.auth != null;
    }

    function memberPath(clubId, uid) {
      return /databases/$(database)/documents/clubs/$(clubId)/members/$(uid);
    }

    // 공통: isClubMember(clubId) 필수
    function isClubMember(clubId) {
      return isAuthenticated() && exists(memberPath(clubId, request.auth.uid));
    }

    function member(clubId) {
      return get(memberPath(clubId, request.auth.uid)).data;
    }

    function isActiveMember(clubId) {
      return isClubMember(clubId) && member(clubId).status == 'active';
    }

    function isAdminLike(clubId) {
      return isClubMember(clubId)
        && member(clubId).role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER'];
    }

    // ============================================
    // Default Deny
    // ============================================
    match /{document=**} {
      allow read, write: if false;
    }

    // ============================================
    // Global Collections
    // ============================================

    // Users (Global)
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && request.auth.uid == userId;
      // 운영 안전상: 유저 본인만 업데이트(역할/승인은 Functions/관리자화면에서 members 문서로)
      allow update: if isAuthenticated() && request.auth.uid == userId;
    }


    // Notifications
    match /notifications/{notificationId} {
      allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
      allow write: if isAuthenticated();
    }

    // ============================================
    // Club Collections
    // ============================================

    match /clubs/{clubId} {
      // 클럽 문서 read는 active member만 - μATOM-0551
      allow read: if isActiveMember(clubId);

      // ============================================
      // Members
      // ============================================
      match /members/{memberId} {
        allow read: if isAuthenticated();
        // 가입 직후 멤버 문서 생성 허용(단, role/status는 서버/관리자만 바꾸는 것을 권장)
        allow create: if isAuthenticated() && request.auth.uid == memberId;
        // 본인 프로필 일부 수정만 허용하고 싶으면 keys 제한을 추가해야 함(여기선 보수적으로 adminLike만 허용)
        allow update: if isAuthenticated() && (request.auth.uid == memberId || isAdminLike(clubId));
      }

      // ============================================
      // Posts
      // ============================================
      match /posts/{postId} {
        // μATOM-0551: 읽기 isClubMember만
        allow read: if isActiveMember(clubId);

        // Posts Create Policy:
        // - notice/event: 클라 write 금지 (Functions-only) - μATOM-0552
        // - free: member create 허용 - μATOM-0553
        function isPostTypeAllowedForCreate() {
          let postType = request.resource.data.type;
          // notice, event는 Functions-only
          return postType == 'free';
        }

        allow create: if isActiveMember(clubId) && isPostTypeAllowedForCreate();

        // Posts Update/Delete Policy:
        // - author OR adminLike
        function isPostAuthor() {
          return resource.data.authorId == request.auth.uid;
        }

        function updatingProtectedPostFields() {
          return request.resource.data.keys().hasAny([
            'authorId','authorName','authorPhotoURL','type'
          ]);
        }

        // free: (author OR adminLike) update/delete - μATOM-0553
        allow update: if isActiveMember(clubId) && (
          isAdminLike(clubId)
          || (isPostAuthor() && !updatingProtectedPostFields())
        );

        allow delete: if isActiveMember(clubId) && (
          isAdminLike(clubId) || isPostAuthor()
        );

        // ============================================
        // Comments
        // ============================================
        // μATOM-0554: comments 정책
        // Comments Policy: create는 멤버, update/delete 작성자 또는 adminLike
        match /comments/{commentId} {
          allow read: if isActiveMember(clubId);
          allow create: if isActiveMember(clubId);

          allow update, delete: if isActiveMember(clubId) && (
            resource.data.authorId == request.auth.uid || isAdminLike(clubId)
          );
        }

        // ============================================
        // Attendance
        // ============================================
        // μATOM-0555: attendance 정책
        // Attendance Policy: 본인만 write + voteClosed==false 조건
        match /attendance/{userId} {
          allow read: if isActiveMember(clubId);
          // 본인만, voteClosed==false일 때만 write 허용
          function isVoteOpen() {
            let post = get(/databases/$(database)/documents/clubs/$(clubId)/posts/$(postId)).data;
            return post.voteClosed != true;
          }
          allow write: if isActiveMember(clubId) 
            && request.auth.uid == userId
            && isVoteOpen();
        }

      }

      // ============================================
      // FCM Tokens
      // ============================================
      // μATOM-0556: tokens/audit/idempotency 클라 write 금지
      match /members/{memberId}/tokens/{tokenId} {
        allow read: if false; // 클라 read 금지
        allow write: if false; // 클라 write 금지 (토큰 등록은 callable만)
      }

      // ============================================
      // Audit / Idempotency
      // ============================================
      // μATOM-0556: 일반회원 접근 차단 (Functions-only)
      match /audit/{docId} {
        allow read, write: if false;
      }

      match /idempotency/{docId} {
        allow read, write: if false;
      }
    }
  }
}
```

## firestore.indexes.json (전문)
```
(파일 없음)
```

## Rules 핵심 정책 (라인 근거 10줄 내 요약)
- isClubMember/isActiveMember: 정의(상단 Helper, `isClubMember`, `isActiveMember`) 및 사용 위치(예: clubs read, posts/comments/attendance read)
- posts 생성: `isPostTypeAllowedForCreate()`에서 `free`만 true → `allow create` 조건에 결합 (Functions-only for notice/event)
- posts 수정/삭제: `allow update/delete`에서 `isAdminLike(clubId)` 또는 `isPostAuthor()` && `!updatingProtectedPostFields()`
- comments: `match /comments` 블록에서 read active member, create active member, update/delete 작성자 or adminLike
- attendance: `match /attendance/{userId}`에서 write는 active member && 본인 && `isVoteOpen()` (post.voteClosed != true)
- tokens/audit/idempotency: 각 매치에서 `allow read, write: if false`로 완전 차단 (Functions-only)

[이 파일이 커버하는 범위]
- Firebase 구성 파일 전문과 보안 규칙 전문
- 인덱스/rc 파일 존재 여부 및 근거
- 정책 핵심 요약과 정확한 라인 근거
