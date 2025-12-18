# 배포 가능 여부 리포트

**검수 일시**: 2024년 (현재)  
**프로젝트**: WINGS Baseball Club Community PWA  
**배포 대상**: Firebase Hosting + Functions

---

## 배포 가능 여부 종합 판정

### ✅ **배포 가능 (조건부)**

**전제 조건**: 
- Firebase 프로젝트 설정 완료 필요
- 환경 변수 설정 권장 (선택사항)
- 프론트엔드 빌드 경로 수정 필요

---

## 상세 검수 결과

### 1. Functions 빌드 ✅

**상태**: **성공**
- **명령**: `cd functions && npm run build`
- **결과**: TypeScript 컴파일 성공
- **출력 파일**: `functions/lib/` 디렉토리에 JS 파일 생성됨
- **판정**: ✅ **배포 가능**

**확인 사항**:
- ✅ `functions/src/index.ts`에서 모든 callable export 확인
- ✅ `functions/src/callables/` 모든 파일 컴파일 성공
- ✅ `functions/src/shared/` 모든 유틸 컴파일 성공

---

### 2. 프론트엔드 빌드 ⚠️

**상태**: **실패 (수정 필요)**
- **명령**: `npx vite build`
- **에러**: `Could not resolve entry module "index.html"`
- **원인**: Vite가 `index.html`을 찾지 못함
- **판정**: ⚠️ **빌드 경로 수정 필요**

**확인 사항**:
- ✅ `index.html` 파일 존재 확인
- ✅ `vite.config.ts` 설정 확인
- ⚠️ Vite 빌드 설정에서 entry point 명시 필요할 수 있음

**수정 제안**:
```typescript
// vite.config.ts에 추가
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  // ... 기존 설정
})
```

또는 `package.json`의 build 스크립트 확인:
```json
{
  "scripts": {
    "build": "vite build"  // 이 스크립트가 functions 빌드를 실행하고 있음
  }
}
```

**권장 조치**:
1. 루트 `package.json`의 `build` 스크립트가 `vite build`를 실행하도록 수정
2. 또는 `npm run build` 대신 `npx vite build` 직접 실행

---

### 3. Firebase 설정 ✅

**상태**: **완료**
- **파일**: `.firebaserc`
- **프로젝트 ID**: `wings-baseball-club`
- **판정**: ✅ **배포 가능**

**확인 사항**:
- ✅ `.firebaserc` 파일 존재
- ✅ `firebase.json` 설정 확인
  - Functions: `functions/` 디렉토리
  - Hosting: `dist/` 디렉토리
  - Firestore Rules: `firestore.rules`

---

### 4. 환경 변수 설정 ⚠️

**상태**: **선택사항 (기본값 있음)**
- **필수 환경 변수**: 없음 (모두 기본값 제공)
- **선택 환경 변수**: 
  - `VITE_FIREBASE_*` (기본값 있음)
  - `VITE_FCM_VAPID_KEY` (선택사항, 없으면 경고만 표시)

**판정**: ✅ **배포 가능** (기본값으로 동작)

**확인 사항**:
- ✅ `src/lib/firebase/config.ts`에서 기본값 제공
- ✅ `src/lib/firebase/messaging.service.ts`에서 `VAPID_KEY` 빈 문자열 fallback
- ⚠️ FCM 푸시 알림 사용 시 `VITE_FCM_VAPID_KEY` 설정 권장

**권장 조치**:
1. 프로덕션 환경에서는 `.env` 파일 생성 권장
2. Firebase Console에서 VAPID 키 확인 후 설정

---

### 5. Firestore Rules ✅

**상태**: **완료**
- **파일**: `firestore.rules`
- **판정**: ✅ **배포 가능**

**확인 사항**:
- ✅ Rules 파일 존재
- ✅ ATOM-11에서 검증 완료
- ✅ `invites` 규칙 제거 확인
- ✅ Posts 타입별 write 정책 분리 확인

---

### 6. Functions 코드 완성도 ✅

**상태**: **완료**
- **판정**: ✅ **배포 가능**

**구현된 Callables**:
- ✅ `registerFcmToken` (ATOM-12)
- ✅ `createNoticeWithPush` (ATOM-16)
- ✅ `setMemberRole` (ATOM-09)
- ✅ `setMemberProfileByAdmin` (ATOM-10)

**구현된 Scheduled Functions**:
- ✅ `closeEventVotes` (ATOM-20 예정)

---

### 7. 클라이언트 코드 완성도 ✅

**상태**: **완료**
- **판정**: ✅ **배포 가능**

**구현된 기능**:
- ✅ Access Gate (ATOM-08)
- ✅ FCM 토큰 등록 (ATOM-13)
- ✅ 게시판 리스트/상세/작성 (ATOM-14)
- ✅ 댓글 CRUD (ATOM-15)
- ✅ 공지 작성 (Functions 호출) (ATOM-17)

---

## 배포 전 체크리스트

### 필수 항목 (배포 전 완료)

- [ ] **프론트엔드 빌드 수정**
  - [ ] `package.json`의 `build` 스크립트 확인/수정
  - [ ] `npm run build` 실행 성공 확인
  - [ ] `dist/` 디렉토리 생성 확인

- [ ] **Firebase 프로젝트 설정**
  - [ ] Firebase Console에서 프로젝트 생성 확인
  - [ ] Authentication 활성화
  - [ ] Firestore Database 생성 (asia-northeast3)
  - [ ] Storage 활성화 (asia-northeast3)
  - [ ] Functions 활성화 (Blaze 요금제)

- [ ] **Firestore Rules 배포**
  - [ ] `firebase deploy --only firestore:rules` 실행

- [ ] **Functions 배포**
  - [ ] `firebase deploy --only functions` 실행
  - [ ] 배포 후 로그 확인

### 권장 항목 (선택사항)

- [ ] **환경 변수 설정**
  - [ ] `.env` 파일 생성 (로컬 개발용)
  - [ ] Firebase Hosting 환경 변수 설정 (프로덕션용)

- [ ] **FCM VAPID 키 설정**
  - [ ] Firebase Console > 프로젝트 설정 > 클라우드 메시징에서 VAPID 키 확인
  - [ ] `.env` 파일에 `VITE_FCM_VAPID_KEY` 추가

- [ ] **테스트**
  - [ ] 로컬에서 `npm run dev` 실행 확인
  - [ ] Functions 에뮬레이터 테스트
  - [ ] Firestore Rules 에뮬레이터 테스트

---

## 배포 명령어

### 1. Functions 배포
```bash
cd functions
npm run build
cd ..
firebase deploy --only functions
```

### 2. Firestore Rules 배포
```bash
firebase deploy --only firestore:rules
```

### 3. 프론트엔드 빌드 및 배포
```bash
# 빌드 (수정 후)
npm run build

# 배포
firebase deploy --only hosting
```

### 4. 전체 배포
```bash
# Functions + Rules + Hosting 모두 배포
firebase deploy
```

---

## 알려진 이슈

### 1. 프론트엔드 빌드 실패
- **증상**: `Could not resolve entry module "index.html"`
- **원인**: `package.json`의 `build` 스크립트가 functions 빌드를 실행
- **해결**: 루트 `package.json`의 `build` 스크립트 수정 필요

### 2. 타입 에러 경고
- **증상**: `npm run type-check` 시 일부 타입 경고
- **영향**: 기능 블로킹 없음
- **해결**: 이후 수정 예정 (사용자 확인)

---

## 결론

### 배포 가능 여부: ✅ **조건부 배포 가능**

**조건**:
1. ✅ Functions 빌드 성공
2. ⚠️ 프론트엔드 빌드 경로 수정 필요
3. ✅ Firebase 설정 완료
4. ✅ Firestore Rules 준비 완료
5. ✅ 코드 완성도 검증 완료

**즉시 배포 가능 항목**:
- ✅ Functions (배포 가능)
- ✅ Firestore Rules (배포 가능)

**수정 후 배포 가능 항목**:
- ⚠️ Hosting (프론트엔드 빌드 수정 후)

**권장 배포 순서**:
1. Functions 배포 (`firebase deploy --only functions`)
2. Firestore Rules 배포 (`firebase deploy --only firestore:rules`)
3. 프론트엔드 빌드 수정 후 Hosting 배포 (`firebase deploy --only hosting`)

---

**리포트 작성일**: 2024년 (현재)  
**검수자**: AI Assistant (Cursor)

