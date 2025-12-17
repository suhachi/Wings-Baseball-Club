# 🔥 Firebase 설정 가이드

## 📋 설정 체크리스트

### 1단계: Firebase 프로젝트 생성
- [ ] [Firebase Console](https://console.firebase.google.com) 접속
- [ ] 새 프로젝트 생성: "wings-baseball-club"
- [ ] Google Analytics 설정 (선택사항)

### 2단계: 웹 앱 추가
- [ ] 프로젝트 설정 > 일반 > 앱 추가 > 웹 선택
- [ ] 앱 닉네임 입력: "WINGS PWA"
- [ ] Firebase Hosting 설정 (선택사항)
- [ ] SDK 설정 코드 복사

### 3단계: 인증 설정 (Authentication)
- [ ] Authentication > Sign-in method
- [ ] 이메일/비밀번호 사용 설정
- [ ] 익명 인증 사용 설정 (선택사항)

### 4단계: Firestore Database 설정
- [ ] Firestore Database 생성
- [ ] 프로덕션 모드로 시작
- [ ] 위치: asia-northeast3 (서울)
- [ ] 보안 규칙 설정 (아래 참조)

### 5단계: Storage 설정
- [ ] Storage 생성
- [ ] 위치: asia-northeast3 (서울)
- [ ] 보안 규칙 설정 (아래 참조)

### 6단계: Cloud Functions 설정
- [ ] Functions 활성화
- [ ] Blaze 요금제로 업그레이드 (필수)
- [ ] 위치: asia-northeast3 (서울)

### 7단계: 환경 변수 설정
- [ ] `.env.example` 파일을 `.env`로 복사
- [ ] Firebase SDK 설정 값 입력
- [ ] Git에 커밋하지 않도록 주의 (.gitignore 확인)

---

## 🔒 Firestore 보안 규칙

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isSignedIn() && getUserData().role in ['PRESIDENT', 'DIRECTOR', 'ADMIN'];
    }
    
    function isTreasury() {
      return isSignedIn() && getUserData().role in ['PRESIDENT', 'TREASURER'];
    }
    
    // Users Collection
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && isOwner(userId);
      allow update: if isOwner(userId) || isAdmin();
      allow delete: if isAdmin();
    }
    
    // Invite Codes Collection
    match /inviteCodes/{codeId} {
      allow read: if isSignedIn();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Posts Collection
    match /posts/{postId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && (isOwner(resource.data.authorId) || isAdmin());
      allow delete: if isSignedIn() && (isOwner(resource.data.authorId) || isAdmin());
    }
    
    // Comments Collection
    match /comments/{commentId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && isOwner(resource.data.authorId);
      allow delete: if isSignedIn() && (isOwner(resource.data.authorId) || isAdmin());
    }
    
    // Attendance Collection
    match /attendance/{attendanceId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update: if isSignedIn() && isOwner(resource.data.userId);
      allow delete: if isAdmin();
    }
    
    // Finance Collection
    match /finance/{financeId} {
      allow read: if isSignedIn();
      allow create: if isTreasury();
      allow update: if isTreasury();
      allow delete: if isTreasury();
    }
    
    // Game Records Collection
    match /gameRecords/{recordId} {
      allow read: if isSignedIn();
      allow create: if isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
    
    // Notifications Collection
    match /notifications/{notificationId} {
      allow read: if isSignedIn() && isOwner(resource.data.userId);
      allow create: if isSignedIn();
      allow update: if isSignedIn() && isOwner(resource.data.userId);
      allow delete: if isSignedIn() && isOwner(resource.data.userId);
    }
  }
}
```

---

## 📦 Firebase Storage 보안 규칙

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isImageFile() {
      return request.resource.contentType.matches('image/.*');
    }
    
    function isVideoFile() {
      return request.resource.contentType.matches('video/.*');
    }
    
    function isValidMediaFile() {
      return isImageFile() || isVideoFile();
    }
    
    function isFileSizeOK() {
      // 사진: 10MB, 동영상: 100MB
      return (isImageFile() && request.resource.size < 10 * 1024 * 1024) ||
             (isVideoFile() && request.resource.size < 100 * 1024 * 1024);
    }
    
    // Profile Photos
    match /profiles/{userId}/{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && 
                     request.auth.uid == userId && 
                     isImageFile() && 
                     request.resource.size < 5 * 1024 * 1024;
    }
    
    // Album Media
    match /albums/{year}/{month}/{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && 
                     isValidMediaFile() && 
                     isFileSizeOK();
    }
    
    // Post Attachments
    match /posts/{postId}/{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && 
                     isValidMediaFile() && 
                     isFileSizeOK();
    }
  }
}
```

---

## ⚡ Cloud Functions 주요 기능

### 1. 출석 자동 마감 (scheduledVoteClose)
- **실행 시간**: 매일 23:00 (KST)
- **기능**: 다음날 있는 이벤트의 출석 투표를 자동으로 마감
- **구현 필요**

### 2. 공지 푸시 알림 (sendNotice Push)
- **트리거**: 공지사항 생성 시
- **기능**: 모든 활성 회원에게 푸시 알림 발송
- **구현 필요**

### 3. 일정 리마인더 (scheduleReminder)
- **실행 시간**: 이벤트 1일 전 20:00
- **기능**: 출석 미응답 회원에게 리마인더 발송
- **구현 필요**

---

## 📊 Firestore 컬렉션 구조

```
wings-baseball-club/
├── users/
│   └── {userId}
│       ├── uid: string
│       ├── realName: string
│       ├── nickname: string
│       ├── role: UserRole
│       ├── position: string
│       ├── backNumber: string
│       └── ...
│
├── inviteCodes/
│   └── {codeId}
│       ├── code: string
│       ├── role: UserRole
│       ├── createdBy: string
│       └── ...
│
├── posts/
│   └── {postId}
│       ├── type: PostType
│       ├── title: string
│       ├── content: string
│       └── ...
│
├── comments/
│   └── {commentId}
│       ├── postId: string
│       ├── content: string
│       └── ...
│
├── attendance/
│   └── {attendanceId}
│       ├── postId: string
│       ├── userId: string
│       ├── status: AttendanceStatus
│       └── ...
│
├── finance/
│   └── {financeId}
│       ├── type: 'income' | 'expense'
│       ├── amount: number
│       └── ...
│
├── gameRecords/
│   ├── batters/
│   │   └── {batterId}
│   └── pitchers/
│       └── {pitcherId}
│
└── notifications/
    └── {notificationId}
        ├── userId: string
        ├── type: string
        └── ...
```

---

## 🚀 Firebase 초기 데이터 설정

### 1. 첫 번째 초대 코드 생성
Firestore Console에서 수동으로 생성:

```javascript
Collection: inviteCodes
Document ID: auto-generated
Fields:
{
  code: "WINGS2024",
  role: "PRESIDENT",
  createdBy: "system",
  createdByName: "System",
  createdAt: [현재 시간],
  isUsed: false,
  maxUses: 1,
  currentUses: 0
}
```

### 2. 첫 회원 가입 후
- 로그인 페이지에서 초대코드 "WINGS2024" 사용
- 자동으로 회장 권한 부여
- 이후 관리자 페이지에서 다른 초대코드 생성 가능

---

## ✅ 설치 완료 체크리스트

- [ ] Firebase 프로젝트 생성됨
- [ ] 웹 앱 등록됨
- [ ] Authentication 활성화됨
- [ ] Firestore Database 생성됨
- [ ] Storage 생성됨
- [ ] 보안 규칙 설정됨
- [ ] `.env` 파일 설정됨
- [ ] 첫 번째 초대 코드 생성됨
- [ ] 테스트 회원 가입 성공
- [ ] Firebase 요금제 확인 (Blaze 권장)

---

## 📞 문제 해결

### Firebase 연결 오류
1. `.env` 파일 설정 확인
2. Firebase 프로젝트 활성화 여부 확인
3. 브라우저 콘솔에서 오류 메시지 확인

### 보안 규칙 오류
1. Firestore 규칙이 올바르게 배포되었는지 확인
2. 사용자 인증 상태 확인
3. 규칙 시뮬레이터로 테스트

### Cloud Functions 오류
1. Blaze 요금제 활성화 확인
2. Functions 로그 확인
3. 환경 변수 설정 확인

---

## 📚 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 보안 규칙](https://firebase.google.com/docs/firestore/security/get-started)
- [Cloud Functions](https://firebase.google.com/docs/functions)
- [Firebase Storage](https://firebase.google.com/docs/storage)
