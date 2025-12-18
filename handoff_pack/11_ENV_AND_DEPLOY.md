# handoff_pack/11_ENV_AND_DEPLOY.md

## 목적/범위
환경 변수 설정, Firebase 프로젝트 설정, 배포 설정을 정리합니다.

---

## .env 변수 (키 이름만)

### 필수 변수
위치: `.env` 파일 (Git에 커밋하지 않음)

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

### 기본값 (Fallback)
위치: `src/lib/firebase/config.ts` Line 15-21

**참고**: 코드에 하드코딩된 기본값이 있음 (보안 위험). 실제 배포 시 `.env` 사용 권장.

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyACk1-QVyol4r6TKmNcDXHbuv3NwWbjmJU',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'wings-baseball-club.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'wings-baseball-club',
  // ...
};
```

---

## Firebase 프로젝트 설정

### 프로젝트 ID
- **개발/프로덕션**: `wings-baseball-club` (동일)
- 설정 파일: `.firebaserc` Line 3

```json
{
  "projects": {
    "default": "wings-baseball-club"
  }
}
```

### 리전 (Region)
- **Functions 리전**: `asia-northeast3` (서울)
- 설정 위치: `src/lib/firebase/config.ts` Line 39

```typescript
export const functions = getFunctions(app, 'asia-northeast3');
```

---

## Hosting 설정

### 설정 파일
위치: `firebase.json` Line 5-18

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### 배포 명령
```bash
npm run build
firebase deploy --only hosting
```

### 배포 URL
- 현재 미확인 (Firebase Console에서 확인 필요)
- 예상: `https://wings-baseball-club.web.app` 또는 커스텀 도메인

---

## Firestore Rules 배포

### 배포 명령
```bash
firebase deploy --only firestore:rules
```

### 파일 위치
- `firestore.rules`

---

## Storage Rules

### 현재 상태
- `storage.rules` 파일 없음
- Firebase Console에서 수동 설정 필요

### 권장 규칙 (예시)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 프로필 사진
    match /profiles/{userId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024; // 5MB
    }
    
    // 앨범
    match /albums/{year}/{month}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && (request.resource.contentType.matches('image/.*') && request.resource.size < 10 * 1024 * 1024
         || request.resource.contentType.matches('video/.*') && request.resource.size < 100 * 1024 * 1024);
    }
    
    // 게시글 첨부파일
    match /posts/{postId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Emulator 사용 여부

### 현재 상태
- ❌ Emulator 미사용
- 실제 Firebase 프로젝트에 직접 연결

### 설정 방법 (선택 사항)

```bash
# Emulator 설치
firebase init emulators

# Emulator 실행
firebase emulators:start
```

### 재현 가능 여부
- 현재: 실제 Firebase 프로젝트 필요
- Emulator 사용 시: 로컬에서 재현 가능

---

## 환경 변수 마스킹

**주의**: 실제 `.env` 파일에는 민감한 값들이 포함되므로 Git에 커밋하지 않음.

**.gitignore 확인 필요**:
```
.env
.env.local
.env.*.local
```

---

## TODO/누락

1. **`.env.example` 파일 생성**: 환경 변수 템플릿 제공
2. **Storage Rules 파일 추가**: `storage.rules` 생성 및 배포
3. **배포 URL 확인**: Firebase Console에서 실제 배포 URL 확인
4. **환경 분리**: dev/prod 환경 분리 고려 (`.firebaserc`에 여러 프로젝트 추가)

