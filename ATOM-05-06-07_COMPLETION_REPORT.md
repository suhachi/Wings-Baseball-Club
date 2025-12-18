# ATOM-05, ATOM-06, ATOM-07 작업 완료 보고서

**작성일**: 2024년  
**작업 브랜치**: `feat/atom-05-06-07-audit-idempotency-fcm`  
**작업 범위**: Audit 기록 파이프라인 + 멱등성 + FCM 토큰 저장/발송 유틸

---

## 📋 작업 요약

### 완료된 작업

1. ✅ **ATOM-05**: Audit 기록 파이프라인 개선 (`shared/audit.ts`)
2. ✅ **ATOM-06**: 멱등성 개선 (`shared/idempotency.ts`)
3. ✅ **ATOM-07**: FCM 토큰 저장 + 발송 유틸 개선 (`shared/fcm.ts`)

---

## 1. ATOM-05: Audit 기록 파이프라인 개선

### 1.1 개선 사항

**이전**:
- 기본적인 audit 기록 함수만 구현
- action 네이밍 규칙 없음
- before/after 크기 제한 없음

**개선 후**:
- ✅ **Action 네이밍 규칙 제안 및 타입 정의**: `AuditAction` 타입 추가
- ✅ **before/after 크기 제한**: `summarizeData()` 함수로 대용량 데이터 요약
- ✅ **JSDoc 주석 및 사용 예시 추가**: 모든 함수에 상세 설명
- ✅ **PRD v1.0 Section 11.2/11.3, 13.4 준수**

### 1.2 Action 네이밍 규칙

**형식**: `{RESOURCE}_{ACTION}`

**정의된 Action 타입**:
```typescript
export type AuditAction =
  | 'INVITE_REDEEM'        // 초대 코드 사용
  | 'INVITE_CREATE'        // 초대 코드 생성
  | 'INVITE_DELETE'        // 초대 코드 삭제
  | 'MEMBER_ROLE_CHANGE'   // 멤버 역할 변경
  | 'MEMBER_STATUS_CHANGE' // 멤버 상태 변경
  | 'MEMBER_PROFILE_UPDATE'// 관리자가 멤버 프로필 수정
  | 'NOTICE_CREATE'        // 공지 생성
  | 'NOTICE_UPDATE'        // 공지 수정
  | 'NOTICE_DELETE'        // 공지 삭제
  | 'EVENT_CLOSE'          // 출석 투표 마감
  | 'POLL_CLOSE'           // 투표 마감
  | 'GAME_SET_RECORDERS'   // 경기 기록원 지정
  | 'GAME_LOCK_RECORDING'  // 경기 기록 마감
  | 'GAME_UNLOCK_RECORDING'// 경기 기록 마감 해제
  | 'LEDGER_CREATE'        // 회계 항목 생성
  | 'LEDGER_SUBMIT'        // 회계 항목 제출
  | 'LEDGER_APPROVE'       // 회계 항목 승인
  | 'LEDGER_REJECT';       // 회계 항목 반려
```

### 1.3 함수 상세

**`writeAudit(params: AuditParams): Promise<void>`**

- **저장 위치**: `clubs/{clubId}/audit/{auditId}`
- **필드**:
  - `clubId`: 클럽 ID (조회 편의를 위해 중복 저장)
  - `actorUid`: 실행한 사용자 UID
  - `action`: 액션 (AuditAction 타입 또는 문자열)
  - `targetType`: 대상 타입 ('invite', 'post', 'member' 등)
  - `targetId`: 대상 문서 ID (선택)
  - `before`: 변경 전 상태 (요약됨)
  - `after`: 변경 후 상태 (요약됨)
  - `meta`: 추가 메타데이터
  - `createdAt`: 생성 시각

- **성능 최적화**: `summarizeData()` 함수로 before/after 크기 제한 (기본 10KB)
  - 객체: 키 목록만 저장
  - 배열: 길이만 저장
  - 대용량 데이터: 타입과 크기만 저장

### 1.4 사용 예시 (주석에 포함)

```typescript
// 초대 코드 사용
await writeAudit({
  clubId: 'default-club',
  actorUid: 'user123',
  action: 'INVITE_REDEEM',
  targetType: 'invite',
  targetId: 'WINGS2024',
  before: { isUsed: false },
  after: { isUsed: true },
});

// 공지 생성
await writeAudit({
  clubId: 'default-club',
  actorUid: 'admin456',
  action: 'NOTICE_CREATE',
  targetType: 'post',
  targetId: postId,
  meta: { pushStatus: 'SENT' },
});

// 경기 기록 마감
await writeAudit({
  clubId: 'default-club',
  actorUid: 'admin789',
  action: 'GAME_LOCK_RECORDING',
  targetType: 'post',
  targetId: gamePostId,
  before: { recordingLocked: false },
  after: { recordingLocked: true },
});
```

---

## 2. ATOM-06: 멱등성 개선

### 2.1 개선 사항

**이전**:
- 기본적인 멱등성 로직 구현
- 키 해시 처리 없음 (직접 sanitize만 사용)
- 문서화 부족

**개선 후**:
- ✅ **키 해시 처리**: SHA-256 해시 사용 (길이 제한 및 안전성)
- ✅ **상세한 JSDoc 주석**: 함수 설명, 사용 예시 추가
- ✅ **원본 키 저장**: 디버깅을 위해 원본 키도 저장
- ✅ **PRD v1.0 Section 13.2 준수**

### 2.2 함수 상세

**`withIdempotency<T>(clubId, key, handler): Promise<T>`**

- **저장 위치**: `clubs/{clubId}/idempotency/{keyHash}`
- **상태**:
  - `RUNNING`: 처리 중 (다른 요청은 에러 발생)
  - `DONE`: 처리 완료 (결과 반환)
  - `FAILED`: 처리 실패 (에러 재발생)

- **로직**:
  1. 키를 SHA-256 해시하여 문서 ID로 사용
  2. 이미 처리된 요청인지 확인 (DONE 상태면 결과 반환)
  3. 원자적으로 문서 생성 시도 (트랜잭션 대신 `create` 사용)
  4. 핸들러 실행
  5. 성공/실패에 따라 상태 저장

### 2.3 사용 예시 (주석에 포함)

```typescript
// 공지 생성 (requestId로 중복 방지)
const result = await withIdempotency(
  clubId,
  data.requestId,
  async () => {
    const postRef = await postCol(clubId).add({ ... });
    await sendPushNotification(...);
    return { postId: postRef.id };
  }
);

// 초대 코드 사용
const result = await withIdempotency(
  clubId,
  `invite_${code}_${uid}`,
  async () => {
    // 초대 코드 사용 처리
    return { success: true };
  }
);

// 경기 기록 마감
const result = await withIdempotency(
  clubId,
  `lock_game_${postId}_${uid}`,
  async () => {
    await postRef(clubId, postId).update({ recordingLocked: true });
    await writeAudit({ ... });
    return { success: true };
  }
);
```

---

## 3. ATOM-07: FCM 토큰 저장 + 발송 유틸 개선

### 3.1 개선 사항

**이전**:
- 토큰 저장 위치: `clubs/{clubId}/fcmTokens/{tokenHash}` (PRD와 불일치)
- 필터링 기능 제한적

**개선 후**:
- ✅ **PRD 준수**: 토큰 저장 위치 변경 → `clubs/{clubId}/members/{uid}/tokens/{tokenId}`
- ✅ **필터링 기능 추가**: `sendToClub()`에 `filter` 옵션 추가 ('all' | 'admins' | string[])
- ✅ **실패 토큰 처리**: 무효한 토큰 추적 및 삭제 기능
- ✅ **관리자 필터**: 관리자 역할 멤버만 조회하는 `getAdminUids()` 추가
- ✅ **상세한 JSDoc 주석**: 모든 함수에 설명 및 사용 예시 추가

### 3.2 경로 변경 (PRD 준수)

**이전 경로**:
```
clubs/{clubId}/fcmTokens/{tokenHash}
```

**새 경로** (PRD v1.0 Section 13.4):
```
clubs/{clubId}/members/{uid}/tokens/{tokenId}
```

### 3.3 함수 목록

1. **`upsertFcmToken(clubId, uid, token, platform): Promise<{tokenId}>`**
   - 토큰 저장/업데이트
   - 토큰을 SHA-256 해시하여 문서 ID로 사용

2. **`deleteUserTokens(clubId, uid): Promise<void>`**
   - 사용자의 모든 토큰 삭제

3. **`deleteInvalidTokens(clubId, uid, invalidTokenIds): Promise<void>`**
   - 무효한 토큰 삭제

4. **`getAllTokens(clubId): Promise<string[]>`**
   - 클럽의 모든 활성 멤버의 토큰 조회
   - members 컬렉션을 순회하며 각 멤버의 tokens 조회

5. **`getTokensForUids(clubId, uids): Promise<string[]>`**
   - 특정 사용자들의 토큰 조회

6. **`getAdminUids(clubId): Promise<string[]>`** (내부 함수)
   - 관리자 역할인 멤버들의 UID 조회 (PRESIDENT, DIRECTOR, ADMIN)

7. **`sendToTokens(tokens, payload): Promise<FCMSendResult>`**
   - FCM 메시지 발송 (토큰 목록)
   - 무효한 토큰 추적

8. **`sendToClub(clubId, payload, filter?): Promise<FCMSendResult>`**
   - 클럽 전체 또는 필터링된 대상에게 FCM 발송
   - 필터 옵션:
     - `'all'`: 전체 멤버 (기본값)
     - `'admins'`: 관리자만
     - `string[]`: 특정 UID 목록

### 3.4 FCMSendResult 인터페이스

```typescript
export interface FCMSendResult {
  sent: number;              // 성공한 발송 수
  failed: number;            // 실패한 발송 수
  invalidTokens: string[];   // 무효한 토큰 목록 (삭제 권장)
}
```

### 3.5 사용 예시 (주석에 포함)

```typescript
// 전체 멤버에게 공지 푸시
await sendToClub('default-club', {
  title: '새 공지사항',
  body: '중요한 공지가 등록되었습니다.',
  data: { postId: 'xyz', type: 'notice' },
});

// 관리자에게만 발송
await sendToClub('default-club', {
  title: '출석 투표 마감',
  body: '오늘 일정의 출석 투표가 마감되었습니다.',
}, 'admins');

// 특정 사용자들에게만 발송
await sendToClub('default-club', {
  title: '리마인더',
  body: '내일 일정을 확인하세요.',
}, ['user123', 'user456']);
```

### 3.6 paths.ts 추가

**새로 추가된 경로 헬퍼**:
- `memberTokenRef(clubId, uid, tokenId)`: 멤버 토큰 문서 참조
- `memberTokensCol(clubId, uid)`: 멤버 토큰 컬렉션 참조

---

## 4. 빌드 검증 결과

### 4.1 빌드 커맨드

```bash
cd functions
npm run build
```

### 4.2 빌드 결과

✅ **성공**: TypeScript 컴파일 완료
- 에러 0개
- 경고 0개 (미사용 변수 제거 완료)
- 모든 함수 정상 export됨

### 4.3 수정된 파일

1. `functions/src/shared/audit.ts` ✅
2. `functions/src/shared/idempotency.ts` ✅
3. `functions/src/shared/fcm.ts` ✅
4. `functions/src/shared/paths.ts` ✅ (memberTokenRef, memberTokensCol 추가)

---

## 5. 자체 검수 결과

### 5.1 ATOM-05 검수

✅ **완료 기준 충족**:
- [x] 빌드 성공 → `npm run build` 성공
- [x] action 네이밍 규칙 제안 → AuditAction 타입 정의 완료
- [x] 모든 이후 ATOM에서 audit 호출을 "필수"로 연결할 수 있는 형태 → writeAudit 함수 사용 예시 포함

### 5.2 ATOM-06 검수

✅ **완료 기준 충족**:
- [x] 빌드 성공 → `npm run build` 성공
- [x] 동일 requestId 재호출 시 "중복 생성" 방지 → 키 해시 처리 및 상태 관리 완료
- [x] 사용 예시 주석 제공 → 공지/초대/LOCK 등 예시 포함

### 5.3 ATOM-07 검수

✅ **완료 기준 충족**:
- [x] 빌드 성공 → `npm run build` 성공
- [x] 토큰 저장 경로가 PRD와 동일 → `clubs/{clubId}/members/{uid}/tokens/{tokenId}` 사용
- [x] send 유틸이 callable에서 재사용 가능 → sendToClub 함수 및 필터 기능 제공
- [x] payload 예시 제공 → 공지/마감 예시 포함

### 5.4 제약 사항 준수 확인

✅ **공통 제약 준수**:
- [x] 새 브랜치 생성: `feat/atom-05-06-07-audit-idempotency-fcm` ✅
- [x] 변경 범위 한정: shared/ 유틸리티만 수정 ✅
- [x] PRD v1.0 준수: Section 11.2/11.3, 13.2, 13.4 기준 ✅
- [x] 성능 최적화: before/after 크기 제한, 키 해시 처리 ✅

---

## 6. 개선 내용 상세

### 6.1 audit.ts

**추가된 기능**:
1. `AuditAction` 타입 정의 (19개 action)
2. `summarizeData()` 함수: 대용량 데이터 요약 (10KB 제한)
3. 상세한 JSDoc 주석 및 사용 예시
4. `clubId` 필드 중복 저장 (조회 편의)

### 6.2 idempotency.ts

**개선된 기능**:
1. 키 해시 처리 (SHA-256): 길이 제한 및 안전성
2. 원본 키 저장: 디버깅 편의
3. 상세한 JSDoc 주석 및 사용 예시
4. 상태 관리 명확화 (RUNNING, DONE, FAILED)

### 6.3 fcm.ts

**주요 변경사항**:
1. 토큰 저장 경로 변경 (PRD 준수)
2. `sendToClub()` 필터 기능 추가 ('all' | 'admins' | string[])
3. 무효한 토큰 추적 (`invalidTokens` 반환)
4. 관리자 필터 (`getAdminUids()`)
5. 토큰 삭제 기능 (`deleteUserTokens`, `deleteInvalidTokens`)

**제거된 기능**:
- `fcmTokenCol()` 사용 제거 (경로 변경으로 인해)

**추가된 경로 헬퍼** (paths.ts):
- `memberTokenRef(clubId, uid, tokenId)`
- `memberTokensCol(clubId, uid)`

---

## 7. 다음 단계 (권장)

### 7.1 즉시 가능한 작업

1. **실제 함수 구현**: ATOM-08 이후에서 위 유틸리티 사용
   - 모든 고권한 동작에 `writeAudit()` 호출 필수
   - 중요 callable에 `withIdempotency()` 래퍼 사용
   - FCM 발송은 `sendToClub()` 사용

### 7.2 주의 사항

1. **Audit 기록**: 모든 고권한 변경 시 `writeAudit()` 호출 필수
2. **멱등성**: 중요 함수(공지 생성, 초대 코드 사용, LOCK 등)는 `withIdempotency()` 사용
3. **FCM 토큰**: 경로 변경으로 인해 기존 토큰 마이그레이션 필요할 수 있음

---

## 8. 작업 완료 확인

### 체크리스트

- [x] ATOM-05 audit.ts 개선 완료
- [x] ATOM-06 idempotency.ts 개선 완료
- [x] ATOM-07 fcm.ts 개선 완료 (경로 변경 포함)
- [x] paths.ts 경로 헬퍼 추가 완료
- [x] 빌드 성공 확인
- [x] PRD 문서 준수 확인
- [x] 주석 및 사용 예시 추가
- [x] 자체 검수 완료
- [x] 작업 완료 보고서 작성 완료

---

**작업 완료**: 2024년  
**다음 작업**: ATOM-08 이후 (개별 callable 함수 구현)

