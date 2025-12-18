# handoff_pack/07_FUNCTIONS_SPEC.md

## 목적/범위
Cloud Functions 구조, callable 함수 목록, 입력/출력 DTO, 실패 조건을 정리합니다.

---

## 현재 상태

### ✅ Cloud Functions 일부 구현 완료

**현재 상태**: `functions/` 폴더 내에 공지 푸시 및 멤버 관리 로직이 구현되어 핵심 기능이 작동 중입니다.

**운영 중인 핵심 기능**:
- **공지사항 푸시 알림**: `createNoticeWithPush` callable 함수를 통해 발송 및 결과 로깅 구현 완료
- **권한 관리**: `setMemberRole` 등 원격 권한 제어 로직 가동 중
- **멱등성/감사**: `withIdempotency`, `writeAudit`을 통한 시스템 안정성 확보

---

## 필요 함수 목록 (구현 필요)

### 1. 출석 투표 자동 마감

**함수명**: `closeAttendanceVotes` (스케줄러)

**트리거**: Cloud Scheduler (매일 23:00 실행) 또는 Firestore TTL

**로직**:
1. `clubs/{clubId}/posts` 쿼리: `type === 'event'`, `voteCloseAt <= now()`, `voteClosed === false`
2. 각 게시글에 대해 `voteClosed: true` 업데이트
3. (선택) 알림 발송 (투표 마감 알림)

**입력**: 없음 (스케줄러)

**출력**: 처리된 게시글 수

**실패 조건**:
- Firestore 쿼리 실패
- 업데이트 실패 (권한/네트워크)

---

### 2. 공지사항 푸시 알림 발송

**함수명**: `sendNoticePushNotification` (callable 또는 트리거)

**트리거**: 
- 옵션 A: `onDocumentCreated` (posts/{postId} where type === 'notice')
- 옵션 B: Callable 함수 (게시글 작성 후 클라이언트에서 호출)

**로직**:
1. `clubs/{clubId}/members` 쿼리: `status === 'active'`
2. 각 활성 회원의 FCM 토큰 조회 (별도 컬렉션 필요)
3. FCM으로 푸시 알림 발송
4. 게시글 `pushStatus` 업데이트 ('SENT' 또는 'FAILED')

**입력 (Callable)**:
```typescript
{
  postId: string;
  clubId: string;
}
```

**출력**:
```typescript
{
  success: boolean;
  sentCount: number;
  failedCount: number;
}
```

**실패 조건**:
- FCM 토큰 없음
- FCM 발송 실패
- 네트워크 오류

**트랜잭션**: 없음 (멱등성 보장 필요)

---

### 3. 회원 승인 알림 발송 (선택)

**함수명**: `sendApprovalNotification` (트리거)

**트리거**: `onDocumentUpdated` (clubs/{clubId}/members/{userId} where status changed to 'active')

**로직**:
1. `status` 필드 변경 감지
2. 승인 알림 발송 (FCM)

**입력**: 없음 (트리거 자동)

**출력**: 없음

---

## 구현 필요 사항

### 1. Functions 폴더 구조

```
functions/
├── src/
│   ├── index.ts
│   ├── attendance.ts      # 출석 마감
│   ├── notifications.ts   # 푸시 알림
│   └── types.ts           # 타입 정의
├── package.json
└── tsconfig.json
```

### 2. FCM 토큰 관리

**필요 컬렉션**: `users/{userId}/fcmTokens/{tokenId}`

```typescript
{
  token: string;
  deviceInfo?: string;
  createdAt: Timestamp;
  lastUsedAt: Timestamp;
}
```

**클라이언트**: 로그인 시 FCM 토큰 등록 함수 필요

---

## TODO/누락

1. **Functions 폴더 생성 및 초기화**
2. **FCM 토큰 관리 컬렉션 추가**
3. **푸시 알림 발송 로직 구현**
4. **스케줄러 설정** (Firebase Console 또는 코드)

---

## 원문 파일

현재 Functions 폴더가 없으므로 원문 파일 없음. 구현 시 `handoff_pack/_raw/functions_*.md`로 제공 예정.

