# handoff_pack/03_CURRENT_STATUS.md

## 목적/범위
현재 구현 진척도, 환경 구분, 로컬 실행 방법, 최근 변경 사항을 정리합니다.

---

## 구현 진척도

### 완료 (100%)
- ✅ Firebase 설정 및 연동
- ✅ 인증 시스템 (Google 로그인 + 승인제)
- ✅ 게시글 시스템 (CRUD, 5가지 타입)
- ✅ 댓글 시스템
- ✅ 출석 투표
- ✅ 투표 시스템
- ✅ 파일 업로드 (Storage)
- ✅ 회원 관리 (승인/역할 변경)
- ✅ 경기 기록 시스템 (WF-07)
- ✅ 회비/회계 관리
- ✅ PWA 기본 설정

### 부분 완료 (80-90%)
- ⚠️ 출석 시스템 (자동 마감 Cloud Functions 필요)
- ⚠️ 앨범 (업로드 완료, 삭제 기능 부분)
- ⚠️ 프로필 수정 (기본 기능 완료, 통계 실제 계산 필요)

### 미구현 (0%)
- ❌ Cloud Functions (자동 마감, 푸시 알림)
- ❌ PWA 푸시 알림
- ❌ 게시글 검색
- ❌ 무한 스크롤

---

## 환경 구분

### 개발 환경
- **로컬 개발**: `npm run dev` (Vite dev server)
- **Firebase 프로젝트**: `wings-baseball-club` (`.firebaserc` 확인)
- **리전**: `asia-northeast3` (서울)

### 프로덕션 환경
- **배포**: Firebase Hosting (`dist` 폴더)
- **URL**: 미확인 (Firebase Console에서 확인 필요)
- **빌드**: `npm run build` → `dist/` 생성

---

## 로컬 실행 방법

### 필수 요구사항
- Node.js 18+
- npm 또는 pnpm
- Firebase 프로젝트 설정 완료

### 설치 및 실행

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 (.env 파일 생성)
# .env 파일에 Firebase 설정 값 입력 (예시는 .env.example 참조)

# 3. 개발 서버 실행
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 빌드 및 타입 체크

```bash
# 프로덕션 빌드
npm run build

# TypeScript 타입 체크 (에러 71개 확인됨)
npm run type-check
# 또는
npx tsc --noEmit
```

### 테스트
- 현재 테스트 코드 없음
- 수동 테스트 필요

---

## 최근 변경 사항

### 초대 코드 정책 변경
**이전**: 초대 코드 필수 가입  
**현재**: Google 로그인 + 관리자 승인제 (초대 코드 선택 사항)

**관련 파일**:
- `src/app/pages/LoginPage.tsx`: Google 로그인 플로우 추가
- `src/lib/firebase/auth.service.ts`: `createAccount()`에서 `inviteCode` 선택적 처리

### 승인제 전환
**변경**: 모든 신규 가입자는 `status: 'pending'`으로 시작, 관리자 승인 필요

**관련 파일**:
- `src/lib/firebase/auth.service.ts` Line 194: `status: 'pending'` 기본값
- `src/app/pages/AdminPage.tsx`: 승인 기능 구현

### 권한 변경
- `App.tsx` Line 64-68: `pending` 사용자 전체 차단 로직 주석 처리
- `pending` 상태도 앱 접근 가능 (읽기 전용 권한 적용)

---

## 배포 상태

### Firebase Hosting
- **설정 파일**: `firebase.json`
- **배포 명령**: `firebase deploy --only hosting` (미실행)
- **배포 폴더**: `dist`

### Firestore Rules
- **파일**: `firestore.rules`
- **배포 명령**: `firebase deploy --only firestore:rules` (미실행)

### Storage Rules
- 현재 `storage.rules` 파일 없음
- Firebase Console에서 수동 설정 필요

---

## TODO/누락

1. **Cloud Functions 구현**: 자동 마감, 푸시 알림
2. **배포 완료**: Firebase Hosting, Firestore Rules 배포
3. **타입 에러 수정**: 71개 TypeScript 에러 해결
4. **테스트 코드 작성**: 단위 테스트, 통합 테스트

