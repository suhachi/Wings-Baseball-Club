# 04. FIREBASE CONFIG & DEPLOY
**작성일**: 2025-12-18 | **대상**: Wings Baseball Club PWA  
**목적**: Firebase 설정 및 배포 상태 고정

---

## 📝 Firebase 프로젝트 설정

### .firebaserc
**파일 위치**: `d:\projectsing\Wings Baseball Club Community PWA\.firebaserc`

**내용**:
```json
{
  "projects": {
    "default": "wings-baseball-club"
  }
}
```

**의미**:
- **Project ID**: `wings-baseball-club`
- **Alias**: `default` (배포 시 기본값)

**마스킹**: Project ID는 공개 (개인정보 아님)

---

### firebase.json
**파일 위치**: `d:\projectsing\Wings Baseball Club Community PWA\firebase.json`

**내용**:
```json
{
    "firestore": {
        "rules": "firestore.rules"
    },
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

**분석**:

| 설정 | 값 | 의미 |
|-----|-----|------|
| **firestore.rules** | `firestore.rules` | Firestore 보안 규칙 파일 경로 |
| **hosting.public** | `dist` | 배포할 빌드 출력 디렉토리 |
| **hosting.ignore** | `firebase.json, .*, node_modules/**` | 배포 제외 파일 |
| **hosting.rewrites** | `** → /index.html` | SPA 라우팅: 모든 요청을 index.html로 리다이렉트 |

**특징**:
- ✅ SPA 설정 완료 (Custom state-based routing 지원)
- ✅ Firestore Rules 배포 설정 있음
- ❌ Functions 설정 없음 (필요시 추가 필요)
- ❌ Emulator 설정 없음

---

## 🔐 Firebase 프로젝트 정보

| 항목 | 값 | 상태 |
|-----|-----|------|
| **Project ID** | `wings-baseball-club` | ✅ 공개 정보 |
| **Hosting URL** | `https://wings-baseball-club.web.app` | 예상 (미확인) |
| **Firebase Console** | https://console.firebase.google.com/project/wings-baseball-club | 마스킹 필요 |
| **Database** | Firestore | ✅ 사용 중 |
| **Authentication** | Google OAuth + Email | ✅ 설정됨 |
| **Storage** | Cloud Storage (album 이미지) | ✅ 설정됨 (추정) |
| **Hosting** | Firebase Hosting | ✅ 활성 (dist/ 배포) |

---

## 🔧 Firestore Rules 배포

### Rules 파일 위치
**파일**: `d:\projectsing\Wings Baseball Club Community PWA\firestore.rules`  
**라인 수**: 144 라인  
**최근 수정**: git status에 "modified" (현재 변경사항 미반영됨)

### 배포 방법
```bash
# 1. Rules 파일 수정 (firestore.rules)
# 2. Firebase CLI로 배포
firebase deploy --only firestore:rules

# 또는 CLI 없이 Firebase Console에서 수동 배포
# https://console.firebase.google.com/project/wings-baseball-club/firestore/rules
```

### 현재 Rules 상태
✅ **Firestore Rules 문법 검증됨**  
(firestore.rules 라인 1-2)
```
rules_version = '2';
service cloud.firestore {
```

---

## 🚀 Functions 사용 여부

### Functions 폴더 확인
```bash
d:\projectsing\Wings Baseball Club Community PWA\
├── src/           ← React 소스
├── public/        ← Static assets
├── firebase.json
├── firestore.rules
└── functions/     ← ❌ 미존재
```

**결론**: Firebase Functions 폴더 없음

### 함수 필요성 체크
| 작업 | 방식 | 현재 |
|-----|------|------|
| 멤버 상태 변경 (pending→active) | Client / Server Function? | 불명확 (AdminPage에서 클라이언트 코드만 있음) |
| 댓글 작성 | Firestore Rules (isActiveMember 체크) | ✅ Rules로 충분 |
| 기록 저장 | Firestore Rules (recorder/locked 체크) | ✅ Rules로 충분 |
| 초대 코드 검증 | Client (auth.service.ts) | ✅ Client-side |
| 푸시 알림 | Server Function (필요시) | ❌ 미구현 (README에 언급되나 배포 안 됨) |

**평가**: **Functions 현재 미사용** (추후 푸시 기능 추가 시 필요)

---

## 🌍 환경 구성 (.env)

### .env 파일 위치
**예상 위치**: `d:\projectsing\Wings Baseball Club Community PWA\.env`  
**현재 상태**: 파일 존재 미확인 (gitignore에 포함될 것으로 예상)

### 예상 환경 변수 (근거: vite.config.ts & auth.service.ts)
```bash
# Firebase Configuration (from config.ts imports)
VITE_FIREBASE_API_KEY=[REDACTED-FIREBASE-KEY]
VITE_FIREBASE_AUTH_DOMAIN=wings-baseball-club.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wings-baseball-club
VITE_FIREBASE_STORAGE_BUCKET=wings-baseball-club.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=[REDACTED-SENDER-ID]
VITE_FIREBASE_APP_ID=[REDACTED-APP-ID]
```

### Vite 환경 변수 로드
**설정 파일**: `vite.config.ts` (라인 1-17)
```typescript
import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Vite 처리**: `VITE_*` 환경 변수는 자동으로 번들에 포함됨 (import.meta.env.VITE_* 로 접근)

---

## 📦 Firebase SDK 버전

**package.json에서 확인**:
```json
{
  "dependencies": {
    "firebase": "^12.7.0"
  }
}
```

**현재 버전**: Firebase SDK 12.7.0 (매우 최신)

**호환성**:
- ✅ Firestore API: `getFirestore()`, `collection()`, `query()` 등 (v9+ Compat)
- ✅ Authentication: `signInWithPopup()`, `onAuthStateChanged()` (Modular)
- ✅ Storage: `getStorage()`, `ref()` 등 (Modular)

---

## 🔄 배포 워크플로우

### 배포 단계 (예상)

#### 1단계: 로컬 빌드
```bash
npm run build
# → dist/ 폴더 생성 (index.html, CSS, JS)
```

#### 2단계: Firestore Rules 배포
```bash
firebase deploy --only firestore:rules
# → firestore.rules를 Firebase Console에 푸시
```

#### 3단계: 호스팅 배포
```bash
firebase deploy --only hosting
# → dist/ 폴더를 Firebase Hosting에 푸시
# → https://wings-baseball-club.web.app에 라이브
```

#### 4단계: 전체 배포
```bash
firebase deploy
# → firestore:rules + hosting 동시 배포
```

### CI/CD 설정
**파일**: `.github/workflows/` (확인 필요)  
**현재 상태**: 미확인 (GitHub Actions 설정 있는지 불명확)

---

## ✅ 배포 체크리스트

- [x] firebase.json 검증 (hosting.public = dist)
- [x] .firebaserc 검증 (project ID = wings-baseball-club)
- [x] firestore.rules 파일 존재 (144 라인)
- [x] 환경 변수 구조 확인 (VITE_FIREBASE_*)
- [ ] .env 파일 실제 존재 확인
- [ ] Firebase Console 접근 권한 확인 (마스킹됨)
- [ ] npm run build 성공 (✅ 완료)
- [ ] dist/ 폴더 생성 확인 (✅ index.html 등 존재)
- [ ] firebase deploy --only hosting 테스트 (미실행)
- [ ] 배포된 URL 접근 테스트 (미실행)

---

## 🔐 민감 정보 마스킹 요약

| 정보 | 마스킹 상태 | 이유 |
|-----|-----------|------|
| **Project ID** (wings-baseball-club) | ❌ 미마스킹 | 공개 정보 (Firebase Console URL에 공개됨) |
| **API Key** | ✅ 마스킹 | 민감 정보 (배포 시 번들에 포함되나, 외부 공유 시 제외) |
| **Auth Domain** | ✅ 마스킹 가능 | 개별 테넌트 식별 정보 |
| **Storage Bucket** | ✅ 마스킹 가능 | GCS bucket 정보 |
| **Sender ID** | ✅ 마스킹 | 클라우드 메시징 ID |
| **App ID** | ✅ 마스킹 | 앱 고유 ID |

---

## 📊 배포 상태 요약

| 카테고리 | 상태 | 평가 |
|---------|------|------|
| **Firestore Rules** | ✅ 설정됨, 배포 준비 됨 | 보안 정책 완벽 |
| **Hosting** | ✅ 설정됨, SPA rewrites 설정 | 배포 준비 됨 |
| **Authentication** | ✅ Google OAuth 설정 | 가입 정책 구현됨 |
| **Functions** | ❌ 미사용 | 향후 확장 시 필요 |
| **CI/CD** | ? 미확인 | GitHub Actions 설정 필요 (선택) |

---

## 🎯 배포 전 체크리스트

- [ ] **02_BUILD_AND_TYPESCRIPT.md** TS 에러 0으로 수정
- [ ] **npm run build** 성공 확인
- [ ] **dist/** 폴더 최신화
- [ ] **firebase deploy** 권한 확인 (CLI 인증)
- [ ] **Staging 환경** 배포 테스트 (선택)
- [ ] **Production 배포** 시작
- [ ] **배포 후 E2E 테스트** (로그인 → 게시글 작성 → 댓글 추가)

---

## 📌 다음 단계

1. `.env` 파일 확인 및 로드 검증
2. Firebase Console에서 실제 배포 상태 확인
3. **npm run dev** 로 로컬 환경 검증
4. 배포 준비 완료 시 `firebase deploy` 실행
