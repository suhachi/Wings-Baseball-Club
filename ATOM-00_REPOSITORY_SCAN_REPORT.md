# ATOM-00: 리포지토리 현황 스캔 보고서

**작성일**: 2024년  
**작업 유형**: 읽기 전용 스캔  
**목적**: 현재 Functions/Firebase 설정/FCM 구현 상태 확인

---

## 1. 발견한 파일 경로 목록

### 1.1 Firebase 설정 파일

| 파일 경로 | 존재 여부 | 내용 요약 |
|----------|----------|----------|
| `firebase.json` | ✅ 있음 | `firestore.rules`, `hosting` 설정만 있음 (functions 없음) |
| `.firebaserc` | ✅ 있음 | 프로젝트: `wings-baseball-club` |
| `firestore.rules` | ✅ 있음 | 보안 규칙 정의됨 (144줄) |
| `storage.rules` | ❌ 없음 | Storage 보안 규칙 파일 없음 |

### 1.2 Functions 디렉토리

| 항목 | 상태 |
|------|------|
| `functions/` 디렉토리 | ❌ **없음** |
| `functions/src/` | ❌ 없음 |
| `functions/package.json` | ❌ 없음 |
| `functions/tsconfig.json` | ❌ 없음 |

### 1.3 프론트엔드 Firebase 설정

**파일**: `src/lib/firebase/config.ts`

- ✅ `getFunctions` import됨 (11번 줄)
- ⚠️ `functions` export됨 (39번 줄): `export const functions = getFunctions(app, 'asia-northeast3');`
- ❌ **실제 사용 안 됨**: 클라이언트 코드에서 Functions 호출 없음
- ❌ **getMessaging 없음**: FCM messaging import 안 됨

### 1.4 FCM 토큰 처리

**검색 결과**:
- `src/app/pages/SettingsPage.tsx:74-75`: TODO 주석만 있음
  ```typescript
  // TODO: Get FCM Token and save to user profile
  // This requires 'messaging' from firebase config to be fully set up
  ```
- `src/lib/firebase/config.ts:19`: `messagingSenderId` 설정만 있음
- ❌ **FCM 토큰 등록 코드 없음**
- ❌ **messaging 서비스 초기화 없음**

### 1.5 패키지 매니저

- **사용 중**: `npm` (package-lock.json 존재)
- **Functions 관련 의존성**: 없음

---

## 2. 이미 구현된 것 / 없는 것

### 2.1 ✅ 이미 구현된 것

1. **Firebase 기본 설정**
   - `firebase.json` 존재 (firestore, hosting)
   - `.firebaserc` 존재 (프로젝트 설정)
   - `firestore.rules` 존재 (보안 규칙)

2. **클라이언트 Firebase 초기화**
   - `src/lib/firebase/config.ts` 존재
   - Auth, Firestore, Storage 초기화됨
   - Functions 초기화 코드 있으나 사용 안 됨

3. **Firestore 서비스 레이어**
   - `src/lib/firebase/firestore.service.ts` 존재
   - CRUD 함수들 구현됨 (모두 클라이언트 직접 쓰기)

4. **Auth 서비스 레이어**
   - `src/lib/firebase/auth.service.ts` 존재
   - 로그인/회원가입 구현됨

5. **Storage 서비스 레이어**
   - `src/lib/firebase/storage.service.ts` 존재

### 2.2 ❌ 없는 것

1. **Cloud Functions 프로젝트**
   - `functions/` 디렉토리 없음
   - Functions 빌드 설정 없음
   - Functions 의존성 없음

2. **FCM (Firebase Cloud Messaging)**
   - `getMessaging` import 없음
   - FCM 토큰 등록 코드 없음
   - 푸시 알림 처리 코드 없음

3. **Storage 보안 규칙**
   - `storage.rules` 파일 없음

4. **Functions 호출 코드**
   - 클라이언트에서 `httpsCallable` 사용 없음
   - 모든 작업이 클라이언트에서 직접 Firestore 쓰기

---

## 3. 다음 ATOM의 정확한 생성 위치 제안

### 3.1 ATOM-01: Functions 스캐폴딩 생성

**생성 위치**: 프로젝트 루트 디렉토리

```
D:\projectsing\Wings Baseball Club Community PWA\
└── functions/                          [신규 생성]
    ├── package.json                    [신규 생성]
    ├── tsconfig.json                   [신규 생성]
    └── src/
        ├── index.ts                    [신규 생성]
        ├── shared/
        │   ├── auth.ts                 [신규 생성]
        │   ├── errors.ts               [신규 생성]
        │   ├── validate.ts             [신규 생성]
        │   ├── paths.ts                [신규 생성]
        │   ├── audit.ts                [신규 생성]
        │   ├── fcm.ts                  [신규 생성]
        │   ├── idempotency.ts          [신규 생성]
        │   └── time.ts                 [신규 생성]
        ├── callables/
        │   ├── invites.ts              [신규 생성]
        │   ├── members.ts              [신규 생성]
        │   ├── notices.ts              [신규 생성]
        │   ├── events.ts               [신규 생성]
        │   ├── polls.ts                [신규 생성]
        │   ├── tokens.ts               [신규 생성]
        │   ├── dues.ts                 [신규 생성]
        │   ├── ledger.ts               [신규 생성]
        │   └── games.ts                [신규 생성]
        └── scheduled/
            └── closeEventVotes.ts      [신규 생성]
```

### 3.2 firebase.json 수정 필요

**현재 `firebase.json`**:
```json
{
  "firestore": {
    "rules": "firestore.rules"
  },
  "hosting": {
    "public": "dist",
    ...
  }
}
```

**추가 필요**:
```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  },
  ...
}
```

### 3.3 .firebaserc 확인

✅ 이미 올바르게 설정됨:
```json
{
  "projects": {
    "default": "wings-baseball-club"
  }
}
```

---

## 4. 확인된 제약 사항

1. **패키지 매니저**: npm 사용 중 (pnpm 아님)
2. **프로젝트 ID**: `wings-baseball-club` (고정)
3. **Functions 리전**: 클라이언트 코드에서 `asia-northeast3` 사용 중 (일치 유지 필요)
4. **기존 코드와의 호환성**: 
   - 현재 클라이언트는 모두 직접 Firestore 쓰기 사용
   - Functions 추가 후 점진적 마이그레이션 필요

---

## 5. 다음 단계 권장 사항

### 5.1 ATOM-01 작업 순서

1. `functions/` 디렉토리 생성
2. `functions/package.json` 생성 (의존성: firebase-admin, firebase-functions)
3. `functions/tsconfig.json` 생성
4. `functions/src/index.ts` 생성 (기본 export 구조)
5. `functions/src/shared/` 디렉토리 및 파일들 생성
6. `functions/src/callables/` 디렉토리 및 파일들 생성
7. `functions/src/scheduled/` 디렉토리 및 파일 생성
8. `firebase.json`에 functions 설정 추가

### 5.2 빌드 검증 커맨드

```bash
cd functions
npm install
npm run build
firebase emulators:start --only functions
```

---

**스캔 완료**: 2024년  
**담당자**: ATOM-00 실행  
**다음 작업**: ATOM-01 (Functions 스캐폴딩 생성)

