# ATOM-00 & ATOM-01 작업 완료 보고서

**작성일**: 2024년  
**작업 브랜치**: `feat/atom-00-01-scaffolding`  
**작업 범위**: 리포지토리 스캔 + Functions 스캐폴딩 생성

---

## 📋 작업 요약

### 완료된 작업

1. ✅ **ATOM-00**: 리포지토리 현황 스캔 (읽기 전용)
2. ✅ **ATOM-01**: Functions 스캐폴딩 생성

---

## 1. ATOM-00: 리포지토리 현황 스캔 결과

### 1.1 발견된 파일

| 항목 | 상태 | 경로/내용 |
|------|------|----------|
| `functions/` 디렉토리 | ❌ 없었음 | 신규 생성 필요 |
| `firebase.json` | ✅ 있었음 | `firestore`, `hosting` 설정만 있음 (functions 없음) |
| `.firebaserc` | ✅ 있었음 | 프로젝트: `wings-baseball-club` |
| `firestore.rules` | ✅ 있었음 | 144줄, 보안 규칙 정의됨 |
| `storage.rules` | ❌ 없음 | - |
| FCM 토큰 처리 | ❌ 없음 | TODO 주석만 있음 (`SettingsPage.tsx`) |
| Functions 초기화 코드 | ⚠️ 부분 | `config.ts`에 `getFunctions` import, 실제 사용 안 됨 |

### 1.2 확인된 사항

- **패키지 매니저**: npm (package-lock.json 존재)
- **Node 버전 경고**: 현재 v22.19.0 (Functions는 node 20 요구, 경고만 발생, 빌드 성공)
- **프로젝트 ID**: `wings-baseball-club`
- **Functions 리전**: 클라이언트 코드에서 `asia-northeast3` 사용

---

## 2. ATOM-01: Functions 스캐폴딩 생성 결과

### 2.1 생성된 디렉토리 구조

```
functions/
├── package.json                    ✅ 생성
├── tsconfig.json                   ✅ 생성
├── src/
│   ├── index.ts                    ✅ 생성
│   ├── shared/
│   │   ├── auth.ts                 ✅ 생성
│   │   ├── errors.ts               ✅ 생성
│   │   ├── validate.ts             ✅ 생성
│   │   ├── paths.ts                ✅ 생성
│   │   ├── audit.ts                ✅ 생성
│   │   ├── fcm.ts                  ✅ 생성
│   │   ├── idempotency.ts          ✅ 생성
│   │   └── time.ts                 ✅ 생성
│   ├── callables/
│   │   ├── invites.ts              ✅ 생성 (빈 파일)
│   │   ├── members.ts              ✅ 생성 (빈 파일)
│   │   ├── notices.ts              ✅ 생성 (빈 파일)
│   │   ├── events.ts               ✅ 생성 (빈 파일)
│   │   ├── polls.ts                ✅ 생성 (빈 파일)
│   │   ├── tokens.ts               ✅ 생성 (빈 파일)
│   │   ├── dues.ts                 ✅ 생성 (빈 파일)
│   │   ├── ledger.ts               ✅ 생성 (빈 파일)
│   │   └── games.ts                ✅ 생성 (빈 파일)
│   └── scheduled/
│       └── closeEventVotes.ts      ✅ 생성 (빈 파일)
└── lib/                            ✅ 빌드 산출물 (자동 생성)
    └── index.js                    ✅ 빌드 성공
```

### 2.2 생성된 파일 상세

#### 설정 파일

**`functions/package.json`**
- Node 20 엔진 지정
- 의존성: `firebase-admin@^12.6.0`, `firebase-functions@^4.7.0`
- 빌드 스크립트: `tsc`
- 배포 스크립트 포함

**`functions/tsconfig.json`**
- 타겟: ES2022
- 모듈: commonjs
- 출력: `lib/` 디렉토리
- Strict 모드 활성화

#### 공통 유틸리티 (`shared/`)

**`errors.ts`**
- `Err` 객체로 HttpsError 생성 헬퍼
- 모든 표준 Firebase Functions 에러 코드 지원

**`validate.ts`**
- `reqString`, `optString`, `reqArray`, `reqNumber`, `optNumber`, `reqBoolean` 유효성 검사 함수

**`paths.ts`**
- Firestore 경로 헬퍼 함수들
- `clubRef`, `memberRef`, `postRef`, `inviteCol`, `auditCol`, `fcmTokenCol`, `idemCol`, `userRef`

**`auth.ts`**
- `requireAuth`, `getMemberRole`, `requireRole` 권한 체크 함수
- `isAdminLike`, `isTreasury` 헬퍼
- Role 타입: `PRESIDENT | DIRECTOR | TREASURER | ADMIN | MEMBER`

**`audit.ts`**
- `writeAudit` 감사 로그 기록 함수
- 고권한 변경 시 호출 예정

**`fcm.ts`**
- `upsertFcmToken` 토큰 저장/업데이트
- `getAllTokens`, `getTokensForUids` 토큰 조회
- `sendToTokens`, `sendToClub` 푸시 발송

**`idempotency.ts`**
- `withIdempotency` 멱등성 보장 래퍼
- 중복 호출 방지

**`time.ts`**
- `computeVoteCloseAtKST` 투표 마감 시간 계산 (전날 23:00 KST)

#### 엔트리 파일

**`src/index.ts`**
- Firebase Admin 초기화
- 모든 callable/scheduled 함수 export 구조 (현재는 빈 파일들)

#### Callable 함수 파일 (빈 파일, 추후 구현)

- `invites.ts`: 초대 코드 관리
- `members.ts`: 멤버 관리
- `notices.ts`: 공지 + 푸시
- `events.ts`: 일정 관리
- `polls.ts`: 투표 관리
- `tokens.ts`: FCM 토큰 등록
- `dues.ts`: 회비 관리
- `ledger.ts`: 회계 관리
- `games.ts`: 경기 기록 관리

#### Scheduled 함수 파일 (빈 파일, 추후 구현)

- `closeEventVotes.ts`: 출석 투표 자동 마감

### 2.3 수정된 파일

**`firebase.json`**
- Functions 설정 추가:
  ```json
  "functions": {
    "source": "functions",
    "runtime": "nodejs20"
  }
  ```

---

## 3. 빌드 검증 결과

### 3.1 빌드 커맨드

```bash
cd functions
npm install
npm run build
```

### 3.2 빌드 결과

✅ **성공**: TypeScript 컴파일 완료
- `lib/` 디렉토리 생성됨
- `lib/index.js` 생성됨
- 에러 0개

**경고**:
- Node 버전 경고: `npm warn EBADENGINE` (현재 v22.19.0, 요구사항은 node 20)
  - 빌드에는 영향 없음
  - 프로덕션 배포 시 Firebase Functions 런타임에서 node 20 사용됨

### 3.3 빌드 산출물 확인

```
functions/lib/
└── index.js              ✅ 생성됨 (빌드 성공)
```

---

## 4. 자체 검수 결과

### 4.1 ATOM-00 검수

✅ **완료 기준 충족**:
- [x] functions 존재/미존재 확인 → 미존재 확인
- [x] rules 파일 위치 확인 → `firestore.rules` 존재 확인
- [x] FCM 토큰 저장 방식 확인 → 미구현 확인
- [x] 현황 리포트 작성 → `ATOM-00_REPOSITORY_SCAN_REPORT.md` 생성

### 4.2 ATOM-01 검수

✅ **완료 기준 충족**:
- [x] functions 빌드 성공 → `npm run build` 성공
- [x] index.ts에서 export 구조 확인 → 모든 모듈 export 구조 올바름
- [x] 디렉토리 구조 생성 → PRD 13.1 구조대로 생성
- [x] firebase.json 수정 → functions 설정 추가

### 4.3 제약 사항 준수 확인

✅ **공통 제약 준수**:
- [x] 새 브랜치 생성: `feat/atom-00-01-scaffolding` ✅
- [x] 변경 범위 한정: Functions 스캐폴딩만 생성, 기능 구현 없음 ✅
- [x] PRD v1.0 준수: 구조는 PRD Section 13.1 기준 ✅
- [x] 기능 구현 금지: 모든 callable/scheduled 파일은 빈 파일 ✅

---

## 5. 다음 단계 (권장)

### 5.1 즉시 가능한 작업

1. **에뮬레이터 테스트**:
   ```bash
   firebase emulators:start --only functions
   ```
   - 빈 함수들이 등록되는지 확인

2. **다음 ATOM 작업**: 실제 함수 구현 (ATOM-02 ~ ATOM-17)

### 5.2 주의 사항

1. **Node 버전**: 현재 시스템은 node v22.19.0이지만, 빌드/실행에는 문제 없음
2. **빈 파일들**: 추후 각 ATOM에서 실제 함수 구현 필요
3. **의존성**: `firebase-admin`, `firebase-functions` 설치 완료

---

## 6. 생성된 파일 목록 (전체)

### 새로 생성된 파일 (20개)

1. `functions/package.json`
2. `functions/tsconfig.json`
3. `functions/src/index.ts`
4. `functions/src/shared/auth.ts`
5. `functions/src/shared/errors.ts`
6. `functions/src/shared/validate.ts`
7. `functions/src/shared/paths.ts`
8. `functions/src/shared/audit.ts`
9. `functions/src/shared/fcm.ts`
10. `functions/src/shared/idempotency.ts`
11. `functions/src/shared/time.ts`
12. `functions/src/callables/invites.ts`
13. `functions/src/callables/members.ts`
14. `functions/src/callables/notices.ts`
15. `functions/src/callables/events.ts`
16. `functions/src/callables/polls.ts`
17. `functions/src/callables/tokens.ts`
18. `functions/src/callables/dues.ts`
19. `functions/src/callables/ledger.ts`
20. `functions/src/callables/games.ts`
21. `functions/src/scheduled/closeEventVotes.ts`

### 수정된 파일 (1개)

1. `firebase.json` (functions 설정 추가)

### 생성된 보고서 (2개)

1. `ATOM-00_REPOSITORY_SCAN_REPORT.md`
2. `ATOM-00-01_COMPLETION_REPORT.md` (본 문서)

---

## 7. 검증 커맨드 실행 결과

### 빌드 검증

```bash
cd functions
npm install
npm run build
```

**결과**: ✅ 성공
- TypeScript 컴파일 완료
- `lib/index.js` 생성됨
- 에러 0개

### 예상 에뮬레이터 실행 결과

```bash
firebase emulators:start --only functions
```

**예상 결과**:
- Functions 에뮬레이터 시작
- 빈 함수들이 등록됨 (실제 로직 없음)
- HTTP 엔드포인트는 생성되지만 호출 시 에러 발생 (구현 전이므로 정상)

---

## 8. 작업 완료 확인

### 체크리스트

- [x] ATOM-00 현황 스캔 완료
- [x] 브랜치 생성 완료
- [x] Functions 디렉토리 구조 생성 완료
- [x] 공통 유틸리티 구현 완료
- [x] 빈 함수 파일 생성 완료
- [x] firebase.json 수정 완료
- [x] 빌드 성공 확인
- [x] 자체 검수 완료
- [x] 작업 완료 보고서 작성 완료

---

**작업 완료**: 2024년  
**다음 작업**: ATOM-02 ~ ATOM-17 (개별 함수 구현)

