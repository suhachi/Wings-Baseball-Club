# μATOM-0004 결과: Functions 엔드포인트/스케줄러 목록화 (READ-ONLY)

**수집 일시**: 2024년 (현재)  
**작업 방식**: READ-ONLY (코드 변경 없음)  
**근거**: 파일 경로, 라인 번호, export 내용

---

## (A) Functions 엔트리 포인트

**파일**: `functions/src/index.ts`  
**라인**: 1-19

### 현재 Export (활성)

| 함수명 | 소스 파일 | 트리거 타입 | 상태 |
|--------|----------|------------|------|
| `setMemberRole` | `functions/src/callables/members.ts` | callable | ✅ 활성 |
| `setMemberProfileByAdmin` | `functions/src/callables/members.ts` | callable | ✅ 활성 |
| `createNoticeWithPush` | `functions/src/callables/notices.ts` | callable | ✅ 활성 |
| `registerFcmToken` | `functions/src/callables/tokens.ts` | callable | ✅ 활성 |
| `closeEventVotes` | `functions/src/scheduled/closeEventVotes.ts` | scheduled | ⚠️ 빈 구현 |

### 주석 처리됨 (미구현/제외 예정)

| 함수명 | 소스 파일 | 트리거 타입 | 상태 |
|--------|----------|------------|------|
| (events 관련) | `functions/src/callables/events.ts` | callable | ❌ 주석 (빈 파일) |
| (polls 관련) | `functions/src/callables/polls.ts` | callable | ❌ 주석 (빈 파일) |
| (dues 관련) | `functions/src/callables/dues.ts` | callable | ❌ 주석 (빈 파일) |
| (ledger 관련) | `functions/src/callables/ledger.ts` | callable | ❌ 주석 (빈 파일) |
| (games 관련) | `functions/src/callables/games.ts` | callable | ❌ 주석 (빈 파일) |

---

## (B) Callable Functions 상세

### 1. `setMemberRole`
- **파일**: `functions/src/callables/members.ts`
- **라인**: 26
- **트리거**: `onCall` (callable)
- **권한**: `PRESIDENT | DIRECTOR` (ADMIN 부여/회수), `PRESIDENT` (TREASURER 지정)
- **v1.1 유지**: ✅

### 2. `setMemberProfileByAdmin`
- **파일**: `functions/src/callables/members.ts`
- **라인**: 141
- **트리거**: `onCall` (callable)
- **권한**: `adminLike` (PRESIDENT | DIRECTOR | ADMIN)
- **v1.1 유지**: ✅

### 3. `createNoticeWithPush`
- **파일**: `functions/src/callables/notices.ts`
- **라인**: 26
- **트리거**: `onCall` (callable)
- **권한**: `adminLike` (PRESIDENT | DIRECTOR | ADMIN)
- **기능**: 공지 작성 + 푸시 발송
- **v1.1 유지**: ✅

### 4. `registerFcmToken`
- **파일**: `functions/src/callables/tokens.ts`
- **라인**: 25
- **트리거**: `onCall` (callable)
- **권한**: `requireMember` (활성 멤버)
- **기능**: FCM 토큰 등록
- **v1.1 유지**: ✅

---

## (C) Scheduled Functions 상세

### 1. `closeEventVotes`
- **파일**: `functions/src/scheduled/closeEventVotes.ts`
- **라인**: 1-6
- **트리거**: `onSchedule` (예상, 현재 빈 구현)
- **기능**: 이벤트 투표 마감 처리
- **상태**: ⚠️ 빈 구현 (`export {};`)
- **v1.1 유지**: ✅ (구현 필요)

**참고**: `onSchedule` import/export가 현재 파일에 없음. 구현 필요.

---

## (D) 빈 파일 (제외 대상)

### 1. `functions/src/callables/events.ts`
- **내용**: 빈 export (`export {};`)
- **주석**: "Will be implemented in later ATOMs"
- **v1.1 상태**: ⚠️ v1.1에서 `createEventPost` 필요하지만 현재 빈 파일
- **조치**: 구현 필요 또는 제거

### 2. `functions/src/callables/polls.ts`
- **내용**: 빈 export (`export {};`)
- **주석**: "Will be implemented in later ATOMs"
- **v1.1 상태**: ❌ v1.1 제외 대상
- **조치**: 제거

### 3. `functions/src/callables/dues.ts`
- **내용**: 빈 export (`export {};`)
- **주석**: "Will be implemented in later ATOMs"
- **v1.1 상태**: ❌ v1.1 제외 대상
- **조치**: 제거

### 4. `functions/src/callables/ledger.ts`
- **내용**: 빈 export (`export {};`)
- **주석**: "Will be implemented in later ATOMs"
- **v1.1 상태**: ❌ v1.1 제외 대상
- **조치**: 제거

### 5. `functions/src/callables/games.ts`
- **내용**: 빈 export (`export {};`)
- **주석**: "Will be implemented in later ATOMs"
- **v1.1 상태**: ❌ v1.1 제외 대상
- **조치**: 제거

---

## (E) v1.1 유지/제외 함수 분류

### ✅ v1.1 유지 대상

| 함수명 | 파일 | 트리거 | 상태 | 비고 |
|--------|------|--------|------|------|
| `setMemberRole` | `members.ts` | callable | ✅ 구현됨 | 멤버 역할 변경 |
| `setMemberProfileByAdmin` | `members.ts` | callable | ✅ 구현됨 | 프로필 수정 |
| `createNoticeWithPush` | `notices.ts` | callable | ✅ 구현됨 | 공지 작성+푸시 |
| `registerFcmToken` | `tokens.ts` | callable | ✅ 구현됨 | FCM 토큰 등록 |
| `createEventPost` | `events.ts` | callable | ⚠️ 미구현 | v1.1 필요 (구현 필요) |
| `closeEventVotes` | `closeEventVotes.ts` | scheduled | ⚠️ 미구현 | v1.1 필요 (구현 필요) |

### ❌ v1.1 제외 대상

| 함수명 | 파일 | 트리거 | 상태 | 비고 |
|--------|------|--------|------|------|
| (polls 관련) | `polls.ts` | callable | ❌ 빈 파일 | 제거 대상 |
| (dues 관련) | `dues.ts` | callable | ❌ 빈 파일 | 제거 대상 |
| (ledger 관련) | `ledger.ts` | callable | ❌ 빈 파일 | 제거 대상 |
| (games 관련) | `games.ts` | callable | ❌ 빈 파일 | 제거 대상 |

---

## (F) Functions 소스 파일 구조

### Callables 디렉토리
```
functions/src/callables/
├── members.ts      ✅ (2개 함수 export)
├── notices.ts      ✅ (1개 함수 export)
├── tokens.ts       ✅ (1개 함수 export)
├── events.ts       ⚠️ (빈 파일, v1.1 필요)
├── polls.ts        ❌ (빈 파일, 제거 대상)
├── dues.ts         ❌ (빈 파일, 제거 대상)
├── ledger.ts       ❌ (빈 파일, 제거 대상)
└── games.ts        ❌ (빈 파일, 제거 대상)
```

### Scheduled 디렉토리
```
functions/src/scheduled/
└── closeEventVotes.ts  ⚠️ (빈 파일, v1.1 필요)
```

### Shared 디렉토리
```
functions/src/shared/
├── audit.ts        ✅ (재사용)
├── auth.ts         ✅ (재사용)
├── errors.ts       ✅ (재사용)
├── fcm.ts          ✅ (재사용)
├── idempotency.ts  ✅ (재사용)
├── paths.ts        ✅ (재사용)
├── time.ts         ✅ (재사용)
└── validate.ts     ✅ (재사용)
```

---

## (G) v1.1 구현 필요 함수

### 1. `createEventPost` (callable)
- **파일**: `functions/src/callables/events.ts`
- **기능**: 연습·시합 게시글 생성 + voteCloseAt 계산
- **권한**: `adminLike`
- **상태**: ⚠️ 미구현 (빈 파일)

### 2. `closeEventVotes` (scheduled)
- **파일**: `functions/src/scheduled/closeEventVotes.ts`
- **기능**: voteCloseAt 지난 event를 voteClosed=true 처리 + 마감 푸시
- **트리거**: `onSchedule` (예상)
- **상태**: ⚠️ 미구현 (빈 파일)

---

## Done 체크리스트

- [x] v1.1 유지/제외 함수 분류 근거 확보
- [x] 함수명/트리거 타입/소스 파일 경로 표 작성
- [x] 빈 파일/미구현 함수 목록 확정
- [x] v1.1 구현 필요 함수 목록 확정

---

**수집 완료일**: 2024년 (현재)  
**수집자**: AI Assistant (Cursor)  
**방식**: READ-ONLY (코드 변경 없음)

