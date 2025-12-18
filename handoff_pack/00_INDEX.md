# handoff_pack/00_INDEX.md

## 목적/범위
이 패키지는 **WINGS BASEBALL CLUB PWA** 프로젝트를 외부 분석자가 완전히 이해하고, 현재 오류를 재현·해결할 수 있도록 제공하는 자료 모음입니다.

---

## 📚 문서 목록

### 필수 읽기 순서 (권장)

1. **01_PRODUCT_BRIEF.md** - 제품 목적, 역할, 승인 정책 이해
2. **02_WIREFRAMES_SPEC.md** - 화면 구조 및 워크플로우 파악
3. **03_CURRENT_STATUS.md** - 현재 구현 상태 및 실행 방법
4. **04_REPO_MAP.md** - 코드베이스 구조 파악
5. **05_FIRESTORE_SCHEMA.md** - 데이터 구조 이해
6. **06_SECURITY_RULES.md** - 보안 규칙 및 권한 체계
7. **08_CLIENT_GUARDS_AND_ROUTES.md** - 클라이언트 라우팅 및 가드
9. **09_WF07_GAME_RECORDING_IMPLEMENTATION.md** - 경기 기록 시스템 상세 (WF-07)
10. **10_ISSUES_AND_LOGS.md** - 현재 이슈 및 재현 방법
11. **11_ENV_AND_DEPLOY.md** - 환경 설정 및 배포

### 참고 문서

- **07_FUNCTIONS_SPEC.md** - Cloud Functions (현재 미구현, Functions 폴더 없음)
- **_raw/** - 원문 코드 및 설정 파일

---

## 현재 정책 요약

### 인증 및 가입 정책

**현재 정책**: **Google 로그인 + 관리자 승인제**

1. **회원가입 흐름**:
   - 사용자가 Google 로그인 또는 이메일/비밀번호로 회원가입
   - 회원가입 시 추가 정보 입력 (실명, 닉네임, 전화번호)
   - `createAccount()` 호출 시 `status: 'pending'`으로 UserDoc 생성
   - **초대 코드는 선택 사항** (코드에 남아있지만 필수가 아님)

2. **승인 시스템**:
   - 모든 신규 가입자는 `status: 'pending'` 상태
   - 관리자(PRESIDENT, DIRECTOR, ADMIN)가 `AdminPage`에서 승인/거절
   - 승인 후 `status: 'active'`로 변경되어야 정상 사용 가능
   - `status: 'pending'` 사용자도 앱 접근 가능 (읽기 전용 권한 적용)

3. **초대 코드 (DEPRECATED)**:
   - 코드베이스에 `validateInviteCode`, `createInviteCode` 함수가 남아있음
   - 현재 정책에서는 **필수가 아니며**, 선택적으로 사용 가능
   - `inviteCode`는 `createAccount()`에서 선택적 파라미터로 처리
   - **참고**: `firestore.rules`에서 `inviteCodes` 컬렉션 규칙이 여전히 존재하지만, 실제 가입 플로우는 승인제 중심

---

## 역할 및 권한 (RBAC)

### 역할 정의 (UserRole)
- `PRESIDENT`: 회장 - 모든 권한
- `DIRECTOR`: 감독 - 관리자 권한 + 경기 기록
- `TREASURER`: 총무 - 회비/회계 관리
- `ADMIN`: 관리자 - 게시글 관리, 회원 관리
- `MEMBER`: 일반회원 - 기본 권한

### 승인 상태 (Status)
- `pending`: 승인 대기 (신규 가입자)
- `active`: 활성 회원 (승인 완료)
- `rejected`: 승인 거절
- `withdrawn`: 탈퇴

**참고**: `App.tsx`에서 `pending` 사용자 전체 접근 차단 로직은 주석 처리되어 있음 (Line 64-68). 현재는 `pending` 상태도 앱 접근 가능하지만, 권한이 제한됨.

---

## 현재 가장 큰 장애/이슈 Top 3

### 1. TypeScript 타입 에러 71개
**상세**: `handoff_pack/10_ISSUES_AND_LOGS.md` 참조

**요약**:
- 미사용 import/변수: 38개
- 타입 불일치: 11개 (DataContext null 처리, CommentDoc/AttendanceDoc/FinanceDoc 타입 누락)
- 타입 비교/인덱싱 에러: 4개
- 누락된 타입 정의: 4개

**영향**: 빌드는 성공하지만 타입 안정성 문제

---

### 2. Firestore 타입 정의 누락
**상세**: `handoff_pack/05_FIRESTORE_SCHEMA.md`, `handoff_pack/10_ISSUES_AND_LOGS.md` 참조

**요약**:
- `src/lib/firebase/types.ts`에 `CommentDoc`, `AttendanceDoc`, `FinanceDoc` 타입이 정의되지 않음
- `firestore.service.ts`, `DataContext.tsx`에서 import 시도 → TS2305 에러
- `CommentDoc`, `AttendanceDoc`, `FinanceDoc` 인터페이스를 `types.ts`에 추가 필요

**영향**: 타입 체크 실패, 런타임에는 문제 없을 수 있음 (Firestore는 any로 처리)

---

### 3. Cloud Functions 미구현
**상세**: `handoff_pack/07_FUNCTIONS_SPEC.md` 참조

**요약**:
- `functions/` 폴더가 존재하지 않음
- 출석 투표 자동 마감 (전날 23:00), 푸시 알림 등의 백엔드 로직 없음
- 현재는 클라이언트에서만 처리

**영향**: 자동화 기능 부재, 푸시 알림 불가

---

## 핵심 성공 기준

### 제품 성공 기준

1. **공지 푸시 알림**: 공지사항 작성 시 모든 회원에게 푸시 (현재 미구현)
2. **출석 투표 마감**: 전날 23:00 자동 마감 (현재 미구현, Cloud Functions 필요)
3. **경기 기록 권한/LOCK**: 기록원 지정 + LOCK 기능 (✅ 구현됨 - WF-07)
4. **회계 승인 플로우**: 총무 승인 필요 (현재는 총무만 작성 가능)

---

## TODO/누락

### 즉시 수정 필요

1. `types.ts`에 `CommentDoc`, `AttendanceDoc`, `FinanceDoc` 추가
2. TypeScript 타입 에러 71개 수정 (우선순위: 타입 에러 > 미사용 코드)
3. `.env` 파일 설정 확인 (Firebase 프로젝트 연결)

### 향후 구현

1. Cloud Functions 구현 (자동 마감, 푸시 알림)
2. 초대 코드 관련 코드 정리 (DEPRECATED 표시 또는 제거)
3. 승인 대기 사용자 UI/UX 개선 (`ApprovalPendingPage`는 존재하지만 사용되지 않음)

---

## 관련 문서

- **프로젝트 전체 구조**: `docs/PROJECT_STRUCTURE.md`
- **와이어프레임**: `docs/WIREFRAME_AND_FLOWS.md`
- **구현 체크리스트**: `IMPLEMENTATION_CHECKLIST.md`
- **TypeScript 에러 상세**: `docs/TS_ERROR_FINAL_AUDIT_REPORT.md`

