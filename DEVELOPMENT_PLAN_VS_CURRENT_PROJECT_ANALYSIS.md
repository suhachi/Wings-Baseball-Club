# 개발 기획서(v0.1) vs 현재 프로젝트 비교 분석 보고서

**작성일**: 2024년  
**기준 문서**: `1) 개발 기획계획서 (v0.1).txt`  
**분석 범위**: 전체 기능 및 구현 상태 비교

---

## 📋 목차

1. [전체 요약](#1-전체-요약)
2. [인증/가입 시스템 비교](#2-인증가입-시스템-비교)
3. [Cloud Functions 구현 상태](#3-cloud-functions-구현-상태)
4. [출석/일정 시스템 비교](#4-출석일정-시스템-비교)
5. [공지/게시판 시스템 비교](#5-공지게시판-시스템-비교)
6. [경기 기록 시스템 비교](#6-경기-기록-시스템-비교)
7. [회비/회계 시스템 비교](#7-회비회계-시스템-비교)
8. [멤버/권한 관리 비교](#8-멤버권한-관리-비교)
9. [Firestore Rules 비교](#9-firestore-rules-비교)
10. [미구현 항목 정리](#10-미구현-항목-정리)
11. [프롬프트와 다른 부분](#11-프롬프트와-다른-부분)

---

## 1. 전체 요약

### 1.1 구현 완료율

| 영역 | 기획서 요구사항 | 현재 구현 상태 | 완료율 |
|------|----------------|---------------|--------|
| 인증/가입 | 초대 코드 기반 | Google/Email 기반 (초대 코드 선택적) | ⚠️ 70% |
| Cloud Functions | 17개 함수 필요 | 0개 구현 | ❌ 0% |
| 출석/일정 | 자동 마감 포함 | 수동 마감만 가능 | ⚠️ 60% |
| 공지/게시판 | 푸시 필수 | 푸시 미구현 | ⚠️ 80% |
| 경기 기록 | A안 완전 구현 | 부분 구현 (UI는 있으나 Functions 없음) | ⚠️ 70% |
| 회비/회계 | 완전 구현 | UI만 있음 (승인 워크플로우 미구현) | ⚠️ 40% |
| 멤버/권한 | 완전 구현 | 부분 구현 | ⚠️ 75% |

**전체 완료율**: 약 **65%**

### 1.2 주요 발견 사항

1. **인증 방식 변경**: 기획서는 "초대 코드 기반"인데, 현재는 "Google/Email 로그인 + 초대 코드 선택적" 방식
2. **Cloud Functions 완전 미구현**: 기획서에서 필수로 요구한 모든 Functions가 미구현
3. **자동화 기능 부재**: 출석 마감, 공지 푸시, 스케줄러 등 자동화 기능 모두 미구현
4. **워크플로우 미완성**: 회계 승인, 기록원 지정 등 관리자 워크플로우가 Functions 없이 동작 불가
5. **데이터 구조 일부 불일치**: 기획서와 현재 구현의 데이터 모델 차이 존재

---

## 2. 인증/가입 시스템 비교

### 2.1 기획서 요구사항 (PRD-01)

**요구사항**:
- 초대 코드 입력 또는 초대 링크 진입 시 `clubId` 확정
- 실명 입력 필수
- 가입 완료 시 `members/{userId}` 문서 생성 (role=MEMBER)
- 초대 코드 검증은 서버(Function)에서 수행 권장
- `redeemInvite` callable 함수 사용

**함수명**: `redeemInvite(code, realName, nickname?, phone?, requestId?)`

### 2.2 현재 구현 상태

**구현 위치**: `src/lib/firebase/auth.service.ts`, `src/app/pages/LoginPage.tsx`

**현재 방식**:
1. Google 로그인 또는 Email 회원가입 먼저 수행
2. 로그인 성공 후 `createAccount()` 호출하여 Firestore 문서 생성
3. 초대 코드는 **선택적** (있으면 사용, 없으면 기본 `default-club`, `MEMBER` 역할)

**문제점**:
- ❌ **초대 코드가 필수가 아님**: 기획서는 "초대 기반"인데 현재는 선택적
- ❌ **클라이언트에서 검증**: `validateInviteCode()`가 클라이언트에서 실행 (기획서는 Functions 권장)
- ❌ **`redeemInvite` 함수 없음**: 기획서 명세의 callable 함수 미구현
- ❌ **멤버십 생성 로직 불일치**: 트랜잭션이나 원자적 처리가 부족
- ⚠️ **`clubId` 처리**: 현재 `default-club` 하드코딩 (기획서는 초대 코드에서 가져옴)

**코드 예시** (`src/lib/firebase/auth.service.ts:148-238`):
```typescript
export async function createAccount(
  user: FirebaseUser,
  inviteCode: string | null | undefined, // ❌ 선택적 (기획서는 필수)
  realName: string,
  nickname?: string,
  phone?: string
): Promise<UserDoc> {
  // 초대 코드가 없어도 진행됨 (기획서와 다름)
  if (inviteCode) {
    // 클라이언트에서 검증 (기획서는 Functions 권장)
    const inviteCodesRef = collection(db, 'inviteCodes');
    const q = query(inviteCodesRef, where('code', '==', inviteCode), limit(1));
    // ...
  }
  // 기본값으로 진행
  let role: UserRole = 'MEMBER';
  let clubId = 'default-club'; // ❌ 하드코딩
}
```

### 2.3 수정 필요 사항

1. **초대 코드를 필수로 변경** (또는 기획서 업데이트)
2. **`redeemInvite` Cloud Function 구현** (기획서 14.1 참조)
3. **클라이언트에서 Functions 호출하도록 변경**
4. **멤버십 생성 트랜잭션 보장**

---

## 3. Cloud Functions 구현 상태

### 3.1 기획서 요구사항 (Section 11.3, 13~15)

**필수 Functions 목록** (17개):

#### 인증/초대
1. ❌ `createInvite` (callable) - 초대 코드 생성
2. ❌ `redeemInvite` (callable) - 초대 코드 사용 및 멤버십 생성

#### 멤버/권한
3. ❌ `setMemberRole` (callable) - 역할 변경
4. ❌ `setMemberProfileByAdmin` (callable) - 포지션/백넘버 설정

#### 공지(푸시 필수)
5. ❌ `createNoticeWithPush` (callable) - 공지 생성 + 푸시 발송

#### 일정/출석
6. ❌ `createEventPost` (callable) - 일정 생성
7. ❌ `closeEventVotes` (scheduled) - 전날 23:00 마감 처리

#### 투표
8. ❌ `createPollPost` (callable) - 투표 생성

#### FCM
9. ❌ `registerFcmToken` (callable) - FCM 토큰 등록

#### 회비/회계
10. ❌ `setDueStatus` (callable) - 회비 납부 상태 설정
11. ❌ `createLedgerEntry` (callable) - 회계 항목 작성
12. ❌ `submitLedgerEntry` (callable) - 회계 제출
13. ❌ `approveLedgerEntry` (callable) - 회계 승인
14. ❌ `rejectLedgerEntry` (callable) - 회계 반려

#### 경기결과/기록(A안)
15. ❌ `createGamePost` (callable) - 경기글 생성
16. ❌ `setGameRecorders` (callable) - 기록원 지정
17. ❌ `lockGameRecording` (callable) - 기록 마감

### 3.2 현재 구현 상태

**Functions 디렉토리 존재 여부**: ❌ 없음

**현재 처리 방식**:
- 모든 작업이 **클라이언트에서 직접 Firestore에 쓰기** (`src/lib/firebase/firestore.service.ts`)
- 보안 규칙으로 일부 제어 (`firestore.rules`)
- 트랜잭션/원자성 보장 없음
- 푸시 알림 불가
- 스케줄러 없음

**예시: 공지 작성** (`src/app/components/CreatePostModal.tsx:113`):
```typescript
await addPost(postData); // ❌ 클라이언트에서 직접 작성 (기획서는 createNoticeWithPush 필요)
```

**예시: 일정 생성** (`src/app/components/CreatePostModal.tsx:78-90`):
```typescript
const startAt = new Date(`${startDate}T${startTime}`);
const voteCloseAt = new Date(startAt);
voteCloseAt.setDate(voteCloseAt.getDate() - 1);
voteCloseAt.setHours(23, 0, 0, 0); // ❌ 클라이언트에서 계산 (기획서는 Functions에서 처리)
postData.voteCloseAt = voteCloseAt;
await addPost(postData); // ❌ 클라이언트에서 직접 작성 (기획서는 createEventPost 필요)
```

### 3.3 문제점

1. **보안 취약**: 고권한 작업이 클라이언트에서 직접 수행
2. **트랜잭션 불가**: 멤버십 생성, 초대 코드 사용 등 원자성 보장 불가
3. **푸시 알림 불가**: FCM 토큰 관리 및 푸시 발송 불가
4. **자동화 불가**: 스케줄러 기반 마감 처리 불가
5. **감사로그 부재**: 권한 변경, 회계 승인 등 감사 로그 기록 불가

### 3.4 수정 필요 사항

1. **Functions 디렉토리 생성** (`functions/`)
2. **기획서 Section 13~15 기준으로 모든 Functions 구현**
3. **클라이언트 코드 수정**: Functions 호출하도록 변경
4. **Firestore Rules 수정**: Functions 전용 작업은 클라이언트 쓰기 차단

---

## 4. 출석/일정 시스템 비교

### 4.1 기획서 요구사항 (PRD-04, PRD-05)

**핵심 정책**:
- 출석 마감: **전날 23:00 자동 마감**
- 마감 시각 이후 일반회원 투표 변경 차단
- 마감 시 푸시 알림 발송
- `closeEventVotes` scheduled function 필요
- `voteCloseAtMillis` 필드 저장 (스케줄러 쿼리용)

**함수명**: `createEventPost`, `closeEventVotes`

### 4.2 현재 구현 상태

**구현 위치**: `src/app/components/CreatePostModal.tsx`, `src/app/pages/SchedulePage.tsx`

**현재 방식**:
1. ✅ 일정 생성 시 `voteCloseAt` 계산 (클라이언트에서)
2. ✅ 출석 투표 기능 있음
3. ❌ **자동 마감 없음**: `voteClosed` 플래그를 수동으로 설정해야 함
4. ❌ **스케줄러 없음**: `closeEventVotes` 함수 없음
5. ⚠️ **마감 체크**: 클라이언트에서 `voteClosed` 플래그만 확인 (기획서는 시간 기반 차단)

**코드 예시** (`src/app/components/CreatePostModal.tsx:78-86`):
```typescript
const startAt = new Date(`${startDate}T${startTime}`);
const voteCloseAt = new Date(startAt);
voteCloseAt.setDate(voteCloseAt.getDate() - 1);
voteCloseAt.setHours(23, 0, 0, 0); // ✅ 계산은 맞음

postData.voteCloseAt = voteCloseAt; // ❌ Date 객체 (기획서는 voteCloseAtMillis number 필요)
postData.voteClosed = false;
```

**마감 체크** (`src/app/pages/SchedulePage.tsx:35-46`):
```typescript
const handleAttendance = (eventId: string, status: AttendanceStatus) => {
  const event = posts.find(p => p.id === eventId);
  if (event?.voteClosed) { // ❌ 플래그만 확인 (기획서는 시간 기반 차단 필요)
    toast.error('투표가 마감되었습니다');
    return;
  }
  updateAttendance(eventId, user.id, status);
};
```

### 4.3 문제점

1. **자동 마감 미구현**: 전날 23:00에 자동으로 `voteClosed=true` 설정하는 스케줄러 없음
2. **시간 기반 차단 없음**: 현재는 `voteClosed` 플래그만 확인, `voteCloseAt` 시간 기반 차단 미구현
3. **푸시 알림 없음**: 마감 시 푸시 알림 발송 안 됨
4. **`voteCloseAtMillis` 필드 없음**: 스케줄러가 쿼리할 수 있는 `number` 필드 없음

### 4.4 수정 필요 사항

1. **`createEventPost` Function 구현**: `voteCloseAtMillis` 필드 저장
2. **`closeEventVotes` Scheduled Function 구현**: 매 5분마다 마감 처리
3. **클라이언트 마감 체크 로직 강화**: `voteCloseAt` 시간도 확인
4. **마감 푸시 알림 추가**

---

## 5. 공지/게시판 시스템 비교

### 5.1 기획서 요구사항 (PRD-04)

**핵심 정책**:
- 공지 작성 시 **푸시 발송 필수**
- `createNoticeWithPush` callable 함수 사용
- 푸시 실패 시 재시도 3회 후 실패 기록
- `pushStatus` 필드로 상태 관리 (SENT/FAILED/PENDING)

**함수명**: `createNoticeWithPush(clubId, title, content, pinned?, requestId)`

### 5.2 현재 구현 상태

**구현 위치**: `src/app/components/CreatePostModal.tsx`, `src/app/pages/AdminPage.tsx`

**현재 방식**:
1. ✅ 공지 작성 UI 있음
2. ✅ `pushStatus` 필드 개념 있음 (코드에서 언급)
3. ❌ **푸시 발송 안 됨**: `createPost()` 호출만 함
4. ❌ **`createNoticeWithPush` 함수 없음**
5. ❌ **FCM 토큰 관리 없음**

**코드 예시** (`src/app/pages/AdminPage.tsx_append:12-48`):
```typescript
const handleSubmit = async () => {
  const postData: Omit<PostDoc, 'id' | 'createdAt' | 'updatedAt'> = {
    type: 'notice',
    title: title.trim(),
    content: content.trim(),
    authorId: user.id,
    authorName: user.realName,
    authorPhotoURL: user.photoURL,
    pushStatus: sendPush ? 'PENDING' : undefined, // ⚠️ 필드만 설정 (실제 푸시 없음)
  };
  await createPost(currentClubId, postData); // ❌ 클라이언트에서 직접 작성
  toast.success('공지사항이 등록되었습니다');
};
```

### 5.3 문제점

1. **푸시 발송 미구현**: 공지 작성 시 푸시 알림이 발송되지 않음
2. **Functions 없음**: `createNoticeWithPush` 함수 없음
3. **FCM 토큰 관리 없음**: 사용자 FCM 토큰 등록/관리 시스템 없음
4. **재시도 로직 없음**: 푸시 실패 시 재시도 없음

### 5.4 수정 필요 사항

1. **`createNoticeWithPush` Function 구현** (기획서 14.2 참조)
2. **`registerFcmToken` Function 구현**
3. **클라이언트에서 FCM 토큰 등록 로직 추가**
4. **공지 작성 시 Functions 호출하도록 변경**

---

## 6. 경기 기록 시스템 비교

### 6.1 기획서 요구사항 (PRD-09, WF-07)

**핵심 정책**:
- 기록 입력 가능: 관리자 OR (userId ∈ recorders)
- 기록원 목록 수정: 관리자만
- LOCK 이후: 기록원 수정 불가, 관리자만 수정 가능
- Functions 필요: `setGameRecorders`, `lockGameRecording`

**함수명**: 
- `setGameRecorders(clubId, postId, recorderUserIds, requestId)`
- `lockGameRecording(clubId, postId, requestId)`

### 6.2 현재 구현 상태

**구현 위치**: `src/app/pages/GameRecordPage.tsx`, `src/app/components/game-record/`

**현재 방식**:
1. ✅ 경기 기록 페이지 있음 (`GameRecordPage.tsx`)
2. ✅ 기록원 지정 UI 있음 (MemberPicker 사용)
3. ✅ 라인업/타자/투수 기록 입력 UI 있음
4. ✅ LOCK 기능 있음 (UI에 버튼 있음)
5. ❌ **Functions 없음**: `setGameRecorders`, `lockGameRecording` 없음
6. ❌ **클라이언트에서 직접 수정**: `updatePost()` 호출로 처리
7. ⚠️ **권한 체크**: 클라이언트에서만 체크 (서버 검증 없음)

**코드 예시** (`src/app/pages/GameRecordPage.tsx:144-155`):
```typescript
// Permission Logic (A안: 프롬프트 요구사항 반영)
const isAdminLike = isAdmin();
const isGameRecorder = React.useMemo(() => {
  if (!user) return false;
  return (game.recorders ?? []).includes(user.id);
}, [user, game.recorders]);
const canRecord = isAdminLike || isGameRecorder;
const isLocked = game.recordingLocked === true;
const canEditRecord = React.useMemo(() => {
  if (!user) return false;
  return isAdminLike ? true : (canRecord && !isLocked);
}, [user, isAdminLike, canRecord, isLocked]);
```

**기록원 지정** (`src/app/pages/GameRecordPage.tsx`, 기록원 선택 핸들러):
```typescript
// ❌ 클라이언트에서 직접 updatePost 호출 (기획서는 setGameRecorders 필요)
await updatePost(game.id, {
  recorders: selectedIds,
  recordersSnapshot: snapshotData
});
```

**LOCK 처리** (`src/app/pages/GameRecordPage.tsx`, handleToggleLock):
```typescript
// ❌ 클라이언트에서 직접 updatePost 호출 (기획서는 lockGameRecording 필요)
await updatePost(game.id, {
  recordingLocked: !game.recordingLocked,
  recordingLockedAt: !game.recordingLocked ? new Date() : undefined,
  recordingLockedBy: !game.recordingLocked ? user?.id : undefined
});
```

### 6.3 문제점

1. **Functions 없음**: 기록원 지정, LOCK이 클라이언트에서 직접 처리됨
2. **보안 취약**: 서버 검증 없이 클라이언트 권한 체크만 존재
3. **트랜잭션 없음**: `recordersSnapshot` 생성 시 원자성 보장 없음
4. **감사로그 없음**: 기록원 변경, LOCK 이벤트 감사 로그 없음

### 6.4 수정 필요 사항

1. **`setGameRecorders` Function 구현** (기획서 14.4 참조)
2. **`lockGameRecording` Function 구현**
3. **클라이언트 코드 수정**: Functions 호출하도록 변경
4. **Firestore Rules 강화**: 기록원/LOCK 관련 필드는 Functions만 수정 가능하도록

---

## 7. 회비/회계 시스템 비교

### 7.1 기획서 요구사항 (PRD-08)

**핵심 정책**:
- 회비 납부 상태: 관리자(회장/감독/총무)만 조회
- 회계 항목 작성: 총무만
- 회계 승인/반려: 회장만
- 승인 후 수정 불가
- Functions 필요: `createLedgerEntry`, `submitLedgerEntry`, `approveLedgerEntry`, `rejectLedgerEntry`

**함수명**:
- `createLedgerEntry(clubId, date, title, amount, category, memo?, attachments?)`
- `submitLedgerEntry(clubId, entryId)`
- `approveLedgerEntry(clubId, entryId, reason?)`
- `rejectLedgerEntry(clubId, entryId, reason?)`

### 7.2 현재 구현 상태

**구현 위치**: `src/app/pages/FinancePage.tsx`, `src/lib/firebase/firestore.service.ts`

**현재 방식**:
1. ✅ FinancePage UI 있음
2. ✅ 회비/회계 데이터 구조 있음 (`FinanceDoc`)
3. ❌ **워크플로우 없음**: DRAFT → SUBMITTED → APPROVED/REJECTED 상태 전환 없음
4. ❌ **Functions 없음**: 승인/반려 Functions 없음
5. ❌ **클라이언트에서 직접 수정**: `addFinance()`, `deleteFinance()` 호출

**코드 예시** (`src/lib/firebase/firestore.service.ts:431-459`):
```typescript
// ❌ 클라이언트에서 직접 작성 (기획서는 createLedgerEntry 필요)
export async function addFinance(clubId: string, financeData: Omit<FinanceDoc, 'id' | 'createdAt'>): Promise<string> {
  const financesRef = getClubCol(clubId, 'finances');
  const docRef = await addDoc(financesRef, {
    ...financeData,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteFinance(clubId: string, financeId: string): Promise<void> {
  // ❌ 승인된 항목 삭제 가능 (기획서는 승인 후 수정/삭제 불가)
  const financeRef = getClubDoc(clubId, 'finances', financeId);
  await deleteDoc(financeRef);
}
```

### 7.3 문제점

1. **워크플로우 없음**: DRAFT → SUBMITTED → APPROVED/REJECTED 상태 전환 없음
2. **Functions 없음**: 승인/반려 Functions 없음
3. **권한 검증 부족**: 클라이언트에서만 권한 체크
4. **변경 불가 처리 없음**: 승인 후 수정/삭제 차단 없음
5. **감사로그 없음**: 회계 승인/반려 이력 없음

### 7.4 수정 필요 사항

1. **회계 Functions 4개 구현** (`createLedgerEntry`, `submitLedgerEntry`, `approveLedgerEntry`, `rejectLedgerEntry`)
2. **FinancePage UI 수정**: 상태 전환 버튼 추가
3. **Firestore Rules 수정**: 승인된 항목은 수정/삭제 차단
4. **감사로그 추가**

---

## 8. 멤버/권한 관리 비교

### 8.1 기획서 요구사항 (PRD-02, PRD-03)

**핵심 정책**:
- 관리자 부여/회수: 회장/감독만 가능
- 역할 변경은 audit에 기록
- Functions 필요: `setMemberRole`, `setMemberProfileByAdmin`

**함수명**:
- `setMemberRole(clubId, targetUserId, role)`
- `setMemberProfileByAdmin(clubId, targetUserId, position, backNumber)`

### 8.2 현재 구현 상태

**구현 위치**: `src/app/pages/AdminPage.tsx`, `src/lib/firebase/firestore.service.ts`

**현재 방식**:
1. ✅ 멤버 목록/상세 UI 있음
2. ✅ 역할 변경 UI 있음
3. ❌ **클라이언트에서 직접 수정**: `updateMember()` 호출
4. ❌ **Functions 없음**: `setMemberRole` 없음
5. ❌ **감사로그 없음**: 역할 변경 이력 없음

**코드 예시** (`src/app/pages/AdminPage.tsx`, 역할 변경 핸들러):
```typescript
// ❌ 클라이언트에서 직접 수정 (기획서는 setMemberRole 필요)
await updateMember(currentClubId, memberId, { role: newRole });
```

### 8.3 문제점

1. **Functions 없음**: 역할 변경이 클라이언트에서 직접 처리
2. **감사로그 없음**: 역할 변경 이력 없음
3. **권한 검증 부족**: 클라이언트에서만 권한 체크

### 8.4 수정 필요 사항

1. **`setMemberRole` Function 구현**
2. **`setMemberProfileByAdmin` Function 구현**
3. **클라이언트 코드 수정**: Functions 호출하도록 변경
4. **감사로그 추가**

---

## 9. Firestore Rules 비교

### 9.1 기획서 요구사항 (Section 11.4)

**핵심 원칙**:
- 원칙 B: 고권한/불변성 동작은 Cloud Functions 경유로만 허용
- 원칙 C: 권한·회계·LOCK·기록원 변경은 audit에 기록
- Functions 전용 작업: invites, 역할 변경, 공지 생성, 마감 처리, 기록원/LOCK, 회계 승인

**Rules 요약**:
- `invites`: Functions only (read/write: if false)
- `audit`: Functions only write
- `dues/ledger`: treasury/president만 접근, 승인/상태전환은 Functions
- `record_*`: (adminLike OR uid in recorders) AND recordingLocked==false 일 때만 write

### 9.2 현재 구현 상태

**구현 위치**: `firestore.rules`

**현재 Rules**:
1. ✅ 기본 구조 있음
2. ✅ 멤버십, 게시글, 댓글 규칙 있음
3. ⚠️ **Functions 전용 작업이 클라이언트에서도 허용됨**: 역할 변경, 기록원/LOCK 등
4. ❌ **invites 규칙**: 현재 `allow read, write: if false` (맞음)
5. ❌ **audit 규칙**: Functions only write (맞음)
6. ⚠️ **회계 규칙**: 현재 Rules에 `ledger` 컬렉션 규칙 없음 (추정)

**코드 예시** (`firestore.rules`):
```firestore
match /clubs/{clubId}/members/{memberId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated() && request.auth.uid == memberId;
  allow update: if isAuthenticated() && (request.auth.uid == memberId || isAdminLike(clubId)); 
  // ❌ 역할 변경이 클라이언트에서 가능 (기획서는 Functions만)
}

match /clubs/{clubId}/posts/{postId} {
  allow update: if isActiveMember(clubId) && (
    isAdminLike(clubId)
    || (isPostAuthor() && !updatingProtectedPostFields())
  );
  // ⚠️ recorders, recordingLocked 필드 보호는 있으나, Functions 강제는 없음
}
```

### 9.3 문제점

1. **Functions 강제 없음**: 역할 변경, 기록원/LOCK 등이 클라이언트에서도 가능
2. **회계 규칙 부재**: `ledger` 컬렉션 규칙이 명시적으로 없음
3. **audit 규칙**: 현재 Rules에 audit 컬렉션 규칙이 있는지 확인 필요

### 9.4 수정 필요 사항

1. **Rules 수정**: 고권한 작업은 Functions만 허용하도록 차단
2. **회계 규칙 추가**: `ledger` 컬렉션 규칙 추가
3. **audit 규칙 확인**: 감사 로그 쓰기는 Functions만 허용

---

## 10. 미구현 항목 정리

### 10.1 Cloud Functions (17개, 모두 미구현)

#### 인증/초대 (2개)
- ❌ `createInvite`
- ❌ `redeemInvite`

#### 멤버/권한 (2개)
- ❌ `setMemberRole`
- ❌ `setMemberProfileByAdmin`

#### 공지(푸시 필수) (1개)
- ❌ `createNoticeWithPush`

#### 일정/출석 (2개)
- ❌ `createEventPost`
- ❌ `closeEventVotes` (scheduled)

#### 투표 (1개)
- ❌ `createPollPost`

#### FCM (1개)
- ❌ `registerFcmToken`

#### 회비/회계 (4개)
- ❌ `setDueStatus`
- ❌ `createLedgerEntry`
- ❌ `submitLedgerEntry`
- ❌ `approveLedgerEntry`
- ❌ `rejectLedgerEntry`

#### 경기결과/기록 (4개)
- ❌ `createGamePost`
- ❌ `setGameRecorders`
- ❌ `lockGameRecording`
- ❌ `unlockGameRecording` (선택)

### 10.2 자동화 기능

- ❌ 출석 투표 자동 마감 (전날 23:00)
- ❌ 출석 리마인더 알림 (이벤트 1일 전)
- ❌ 공지 푸시 발송

### 10.3 워크플로우

- ❌ 회계 승인 워크플로우 (DRAFT → SUBMITTED → APPROVED/REJECTED)
- ❌ 초대 코드 생성/관리 워크플로우

### 10.4 데이터 필드

- ❌ `voteCloseAtMillis` (number 필드, 스케줄러 쿼리용)
- ⚠️ `pushStatus` (필드는 있으나 실제 푸시 없음)

### 10.5 감사로그

- ❌ `audit` 컬렉션에 이력 기록 시스템 없음

---

## 11. 프롬프트와 다른 부분

### 11.1 인증 방식 변경

**기획서**: 초대 코드 기반 가입 (필수)
**현재**: Google/Email 로그인 + 초대 코드 선택적

**영향**:
- 초대 코드 검증 로직이 선택적으로 동작
- `redeemInvite` 함수 필요성 감소 (현재 구조에서는)

### 11.2 데이터 구조 차이

**기획서**: `clubs/{clubId}/members/{userId}` 구조
**현재**: `users/{userId}` (전역) + `clubs/{clubId}/members/{userId}` (멤버십)

**영향**:
- 사용자 프로필과 멤버십이 분리되어 있음
- 기획서는 단일 구조를 가정

### 11.3 컬렉션 구조 차이

**기획서**: `clubs/{clubId}/posts/{postId}/record_*` (경기 기록)
**현재**: 동일 구조 사용 중 (일치)

**기획서**: `clubs/{clubId}/ledger/{entryId}` (회계)
**현재**: `clubs/{clubId}/finances/{financeId}` (다른 이름)

### 11.4 필드명 차이

**기획서**: `authorId` (게시글 작성자)
**현재**: `author: { id, name, photoURL }` (중첩 객체)

**영향**:
- 기획서는 `authorId` 단일 필드, 현재는 `author.id` 사용
- Rules에서 `resource.data.authorId` 접근 시 현재 구조와 불일치 가능

### 11.5 상태 필드 차이

**기획서**: `status: ACTIVE|USED|EXPIRED` (invites)
**현재**: `isUsed: boolean, expiresAt: Timestamp` (다른 구조)

---

## 12. 우선순위별 수정 계획

### 12.1 P0 (필수, 즉시 구현 필요)

1. **Cloud Functions 기본 구조 생성**
   - `functions/` 디렉토리 생성
   - `functions/src/index.ts` 생성
   - 공통 유틸 (`shared/auth.ts`, `shared/errors.ts` 등)

2. **핵심 Functions 구현** (5개)
   - `redeemInvite` (가입)
   - `createNoticeWithPush` (공지 + 푸시)
   - `closeEventVotes` (출석 마감)
   - `setGameRecorders` (기록원 지정)
   - `lockGameRecording` (기록 마감)

3. **FCM 토큰 관리**
   - `registerFcmToken` 구현
   - 클라이언트에서 토큰 등록 로직 추가

### 12.2 P1 (높은 우선순위, 1주 이내)

4. **일정 Functions** (2개)
   - `createEventPost` (voteCloseAtMillis 저장)
   - `closeEventVotes` 스케줄러 강화

5. **회계 Functions** (4개)
   - `createLedgerEntry`
   - `submitLedgerEntry`
   - `approveLedgerEntry`
   - `rejectLedgerEntry`

6. **권한 Functions** (2개)
   - `setMemberRole`
   - `setMemberProfileByAdmin`

### 12.3 P2 (중간 우선순위, 2주 이내)

7. **나머지 Functions** (3개)
   - `createInvite`
   - `createPollPost`
   - `setDueStatus`

8. **Firestore Rules 강화**
   - Functions 전용 작업 차단
   - 회계 규칙 추가

9. **감사로그 시스템**
   - `audit` 컬렉션 쓰기 로직
   - Functions에 audit 기록 추가

### 12.4 P3 (낮은 우선순위, 추후)

10. **클라이언트 코드 리팩토링**
    - Functions 호출로 전환
    - 불필요한 클라이언트 직접 쓰기 제거

11. **데이터 구조 정리**
    - `authorId` vs `author.id` 통일
    - `finances` vs `ledger` 컬렉션명 통일

---

## 13. 결론

### 13.1 전체 평가

**현재 상태**: 약 **65% 완료**
- UI/UX는 대부분 구현됨
- **Cloud Functions가 완전히 없음** (가장 큰 차이)
- 자동화 기능 부재
- 보안 취약 (고권한 작업이 클라이언트에서 처리)

### 13.2 가장 시급한 작업

1. **Cloud Functions 기본 구조 생성 및 핵심 5개 함수 구현**
2. **FCM 토큰 관리 및 푸시 알림 구현**
3. **출석 마감 스케줄러 구현**

### 13.3 기획서 준수도

- **UI/데이터 구조**: 약 80% 준수
- **Functions/자동화**: 0% 준수
- **보안/워크플로우**: 약 50% 준수

**전체 준수도**: 약 **60%**

---

**보고서 작성 완료**

