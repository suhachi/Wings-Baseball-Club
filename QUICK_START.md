# 🚀 WINGS BASEBALL CLUB 빠른 시작 가이드

## 📋 5분 안에 시작하기

### 1단계: Firebase 프로젝트 생성 (2분)

1. [Firebase Console](https://console.firebase.google.com) 접속
2. **프로젝트 추가** 클릭
3. 프로젝트 이름: `wings-baseball-club`
4. Google Analytics: 선택사항 (추천: 사용 설정)
5. 프로젝트 생성 완료!

### 2단계: 웹 앱 등록 (1분)

1. 프로젝트 대시보드에서 **웹 앱 추가** (</> 아이콘) 클릭
2. 앱 닉네임: `WINGS PWA`
3. Firebase Hosting: 체크 (선택사항)
4. **앱 등록** 클릭
5. SDK 설정 코드 복사 (firebaseConfig 객체)

### 3단계: 환경 변수 설정 (1분)

1. 프로젝트 루트에 `.env` 파일 생성
2. `.env.example` 내용을 복사하여 붙여넣기
3. Firebase SDK 설정 값으로 교체:

```env
VITE_FIREBASE_API_KEY=복사한_apiKey
VITE_FIREBASE_AUTH_DOMAIN=복사한_authDomain
VITE_FIREBASE_PROJECT_ID=복사한_projectId
VITE_FIREBASE_STORAGE_BUCKET=복사한_storageBucket
VITE_FIREBASE_MESSAGING_SENDER_ID=복사한_messagingSenderId
VITE_FIREBASE_APP_ID=복사한_appId
VITE_FIREBASE_MEASUREMENT_ID=복사한_measurementId (선택)
```

### 4단계: Firebase 서비스 활성화 (2분)

#### Authentication
1. 왼쪽 메뉴 → **Authentication** → **시작하기**
2. **Sign-in method** 탭
3. **익명** 제공업체 사용 설정

#### Firestore Database
1. 왼쪽 메뉴 → **Firestore Database** → **데이터베이스 만들기**
2. **프로덕션 모드로 시작**
3. 위치: **asia-northeast3 (Seoul)**
4. **사용 설정**

#### Storage
1. 왼쪽 메뉴 → **Storage** → **시작하기**
2. **프로덕션 모드로 시작**
3. 위치: **asia-northeast3 (Seoul)**
4. **완료**

### 5단계: 보안 규칙 설정 (3분)

#### Firestore 규칙
1. Firestore Database → **규칙** 탭
2. 아래 규칙을 복사하여 붙여넣기:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isAdmin() {
      return isSignedIn() && getUserData().role in ['PRESIDENT', 'DIRECTOR', 'ADMIN'];
    }
    
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow update: if isSignedIn() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }
    
    match /inviteCodes/{codeId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    
    match /posts/{postId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && (resource.data.authorId == request.auth.uid || isAdmin());
    }
    
    match /comments/{commentId} {
      allow read: if isSignedIn();
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && resource.data.authorId == request.auth.uid;
    }
    
    match /attendance/{attendanceId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn();
      allow delete: if isAdmin();
    }
    
    match /finance/{financeId} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && getUserData().role in ['PRESIDENT', 'TREASURER'];
    }
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

3. **게시** 클릭

#### Storage 규칙
1. Storage → **규칙** 탭
2. 아래 규칙을 복사하여 붙여넣기:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    function isSignedIn() {
      return request.auth != null;
    }
    
    match /profiles/{userId}/{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.auth.uid == userId && 
                     request.resource.size < 5 * 1024 * 1024;
    }
    
    match /albums/{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && request.resource.size < 100 * 1024 * 1024;
    }
    
    match /posts/{allPaths=**} {
      allow read: if isSignedIn();
      allow write: if isSignedIn();
    }
  }
}
```

3. **게시** 클릭

### 6단계: 첫 번째 초대 코드 생성 (2분)

1. Firestore Database → **데이터** 탭
2. **컬렉션 시작** 클릭
3. 컬렉션 ID: `inviteCodes`
4. 첫 번째 문서:
   - 문서 ID: `WINGS2024`
   - 필드 추가:
     ```
     code: string = "WINGS2024"
     role: string = "PRESIDENT"
     createdBy: string = "system"
     createdByName: string = "System"
     createdAt: timestamp = [현재 시간]
     isUsed: boolean = false
     maxUses: number = 1
     currentUses: number = 0
     ```
5. **저장**

### 7단계: 앱 실행 및 테스트 (2분)

1. 터미널에서 실행:
```bash
npm run dev
```

2. 브라우저에서 `http://localhost:5173` 접속

3. 로그인 페이지에서:
   - 초대코드: `WINGS2024`
   - 실명: 본인 이름
   - 닉네임: 선택사항
   - 연락처: 선택사항

4. **가입하기** 클릭

5. 성공! 🎉

---

## ✅ 설정 확인 체크리스트

- [ ] Firebase 프로젝트 생성됨
- [ ] 웹 앱 등록됨
- [ ] `.env` 파일 설정됨
- [ ] Authentication 활성화됨 (익명 로그인)
- [ ] Firestore Database 생성됨 (asia-northeast3)
- [ ] Storage 생성됨 (asia-northeast3)
- [ ] Firestore 보안 규칙 배포됨
- [ ] Storage 보안 규칙 배포됨
- [ ] 초대 코드 `WINGS2024` 생성됨
- [ ] 앱이 정상적으로 실행됨
- [ ] 첫 번째 회원 가입 성공

---

## 🎯 다음 단계

### 즉시 할 수 있는 것
- ✅ 홈 화면에서 통계 확인
- ✅ 일정 페이지에서 출석 투표 (목 데이터)
- ✅ 게시판 페이지에서 게시글 보기 (목 데이터)
- ✅ 앨범 페이지에서 사진 보기 (목 데이터)
- ✅ 마이페이지에서 프로필 확인

### 추가 구현 필요
- ❌ 게시글 작성 기능
- ❌ 댓글 기능
- ❌ 실제 출석 투표
- ❌ 사진/동영상 업로드
- ❌ 경기 기록
- ❌ 회비/회계 관리
- ❌ 관리자 기능

자세한 내용은 `/IMPLEMENTATION_CHECKLIST.md` 참조

---

## 🔧 추가 초대 코드 생성하기

회장으로 로그인한 후, Firestore Console에서 수동으로 생성:

```javascript
// 관리자 초대 코드
{
  code: "ADMIN2024",
  role: "ADMIN",
  createdBy: "your-user-id",
  createdByName: "Your Name",
  createdAt: [현재 시간],
  isUsed: false,
  maxUses: 5,
  currentUses: 0,
  expiresAt: [30일 후] // 선택사항
}

// 일반 회원 초대 코드
{
  code: "MEMBER2024",
  role: "MEMBER",
  createdBy: "your-user-id",
  createdByName: "Your Name",
  createdAt: [현재 시간],
  isUsed: false,
  maxUses: 100,
  currentUses: 0
}
```

---

## 📞 문제 해결

### 앱이 로딩 화면에서 멈춤
- `.env` 파일 설정 확인
- Firebase 프로젝트 ID 확인
- 브라우저 콘솔에서 오류 확인

### "Permission denied" 오류
- Firestore 보안 규칙 확인
- Storage 보안 규칙 확인
- 사용자가 로그인되어 있는지 확인

### 초대 코드가 작동하지 않음
- Firestore Console에서 초대 코드 문서 확인
- `isUsed: false` 인지 확인
- `currentUses < maxUses` 인지 확인

### 개발 서버 오류
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install

# 캐시 클리어 후 재실행
rm -rf .vite
npm run dev
```

---

## 🎨 다음 개발 우선순위

1. **게시글 작성 페이지** - 공지/이벤트/투표 등 게시글 작성
2. **게시글 상세 페이지** - 댓글, 출석투표, 투표 기능
3. **경기 기록 페이지** - 라인업, 타자/투수 기록
4. **회비 관리 페이지** - 회비 납부 현황, 회계 내역
5. **관리자 페이지** - 멤버 관리, 초대 코드 관리

자세한 로드맵은 `/IMPLEMENTATION_CHECKLIST.md` 참조

---

**준비 완료! 개발을 시작하세요! 🚀**
