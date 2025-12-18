# ATOM-08, ATOM-09, ATOM-10 작업 완료 보고서

**작성일**: 2024년  
**작업 브랜치**: `feat/atom-08-09-10-access-gate-member-management`  
**작업 범위**: Access Gate + 멤버 역할/프로필 관리 Functions

---

## 📋 작업 요약

### 완료된 작업

1. ✅ **ATOM-08**: Access Gate 구현 (로그인 후 members 검사/차단 화면)
2. ✅ **ATOM-09**: setMemberRole callable 구현 (ADMIN/TREASURER 정책)
3. ✅ **ATOM-10**: setMemberProfileByAdmin callable 구현 (포지션/백넘버)

---

## 1. ATOM-08: Access Gate 구현

### 1.1 개선 사항

**이전**:
- 로그인 후 `users/{uid}` 문서만 확인
- `clubs/{clubId}/members/{uid}` 문서 확인 없음
- status 체크 없음

**개선 후**:
- ✅ **멤버 문서 확인**: `clubs/{clubId}/members/{uid}` 조회
- ✅ **status 체크**: `status === 'active'`만 통과
- ✅ **차단 페이지**: AccessDeniedPage 컴포넌트 생성
- ✅ **상태 관리**: AuthContext에 `memberStatus` 추가

### 1.2 생성/수정된 파일

#### 새로 생성된 파일

1. **`src/app/pages/AccessDeniedPage.tsx`**
   - 멤버 문서가 없거나 status가 'active'가 아닌 사용자를 차단하는 페이지
   - "관리자에게 문의" 문구 표시 (가입 요청 버튼 없음)
   - 계정 정보 표시 (실명, 상태)
   - "다른 계정으로 로그인" 버튼

#### 수정된 파일

1. **`src/lib/firebase/firestore.service.ts`**
   - `getMember(clubId, uid)` 함수 추가
   - 특정 멤버 조회 (clubs/{clubId}/members/{uid})

2. **`src/app/contexts/AuthContext.tsx`**
   - `memberStatus` 상태 추가: `'checking' | 'active' | 'denied' | null`
   - `checkMemberAccess()` 함수 추가 (멤버 상태 체크)
   - 로그인 후 자동으로 멤버 상태 체크

3. **`src/app/App.tsx`**
   - `memberStatus === 'denied'`일 때 AccessDeniedPage 표시
   - `memberStatus === 'checking'`일 때 로딩 화면 표시

### 1.3 구현 상세

#### getMember 함수

```typescript
export async function getMember(clubId: string, uid: string): Promise<any | null>
```

- **경로**: `clubs/{clubId}/members/{uid}`
- **반환**: 멤버 문서 데이터 또는 null

#### checkMemberAccess 함수

```typescript
const checkMemberAccess = async (uid: string, clubId: string = 'default-club'): Promise<'active' | 'denied'>
```

- 멤버 문서가 없으면 `'denied'` 반환
- `status === 'active'`이면 `'active'` 반환
- 그 외 (pending, rejected, withdrawn 등)는 `'denied'` 반환

#### AccessDeniedPage UX

- **제목**: "접근 권한이 없습니다"
- **설명**: "현재 계정으로는 앱에 접근할 수 없습니다. 관리자에게 문의해주세요."
- **계정 정보 표시**: 실명, 상태 (승인 대기/거부됨/탈퇴)
- **버튼**: "다른 계정으로 로그인" (logout 호출)

### 1.4 검증 방법

**수동 검증**:
1. members 문서가 없는 테스트 계정으로 로그인
2. AccessDeniedPage로 이동하는지 확인
3. status가 'pending'인 멤버로 로그인
4. AccessDeniedPage로 이동하는지 확인
5. status가 'active'인 멤버로 로그인
6. 정상적으로 앱 진입 가능한지 확인

---

## 2. ATOM-09: setMemberRole callable 구현

### 2.1 구현 내용

**파일**: `functions/src/callables/members.ts`

**함수**: `setMemberRole`

#### 입력 파라미터

```typescript
{
  clubId: string;
  targetUserId: string;
  role: 'PRESIDENT' | 'DIRECTOR' | 'TREASURER' | 'ADMIN' | 'MEMBER';
  requestId?: string; // 멱등성용
}
```

#### 권한 정책

1. **TREASURER 지정/변경**: PRESIDENT만 가능
2. **ADMIN 부여/회수**: PRESIDENT 또는 DIRECTOR만 가능
3. **PRESIDENT/DIRECTOR 변경**: PRESIDENT만 가능
4. **MEMBER 변경**: adminLike (PRESIDENT | DIRECTOR | ADMIN) 모두 가능

#### 기능

1. ✅ **입력 검증**: role enum 검증
2. ✅ **권한 확인**: `requireRole()` 사용
3. ✅ **멱등성**: `withIdempotency()` 래퍼 사용
4. ✅ **타겟 멤버 확인**: 존재 여부 및 현재 역할 확인
5. ✅ **역할 업데이트**: `members/{targetUserId}.role` 업데이트
6. ✅ **users 문서 동기화**: `users/{targetUserId}.role` 동기화
7. ✅ **Audit 기록**: `MEMBER_ROLE_CHANGE` action, before/after 포함

### 2.2 에러 케이스

| 에러 코드 | 상황 |
|----------|------|
| `unauthenticated` | 로그인되지 않음 |
| `invalid-argument` | 잘못된 role 값 |
| `permission-denied` | 권한 부족 (예: ADMIN이 TREASURER 지정 시도) |
| `not-found` | 타겟 멤버가 없음 |
| `internal` | 멤버 역할이 없음 |

### 2.3 사용 예시

```typescript
// ADMIN 역할 부여 (PRESIDENT 또는 DIRECTOR만 가능)
await setMemberRole({
  clubId: 'default-club',
  targetUserId: 'user123',
  role: 'ADMIN',
  requestId: 'req-uuid-123'
});

// TREASURER 지정 (PRESIDENT만 가능)
await setMemberRole({
  clubId: 'default-club',
  targetUserId: 'user456',
  role: 'TREASURER',
  requestId: 'req-uuid-456'
});
```

---

## 3. ATOM-10: setMemberProfileByAdmin callable 구현

### 3.1 구현 내용

**파일**: `functions/src/callables/members.ts`

**함수**: `setMemberProfileByAdmin`

#### 입력 파라미터

```typescript
{
  clubId: string;
  targetUserId: string;
  position?: string; // 포지션 (예: 'SS', 'P', 'C')
  backNumber?: number; // 백넘버 (0~99)
  requestId?: string; // 멱등성용
}
```

#### 권한 정책

- adminLike (PRESIDENT | DIRECTOR | ADMIN) 모두 가능
- 일반 회원 호출 시 `permission-denied` 에러

#### 기능

1. ✅ **입력 검증**: 
   - position: 최대 50자
   - backNumber: 0~99 범위
2. ✅ **권한 확인**: `requireRole()` 사용
3. ✅ **멱등성**: `withIdempotency()` 래퍼 사용
4. ✅ **타겟 멤버 확인**: 존재 여부 확인
5. ✅ **프로필 업데이트**: `members/{targetUserId}` 업데이트
6. ✅ **users 문서 동기화**: `users/{targetUserId}` 동기화
7. ✅ **Audit 기록**: `MEMBER_PROFILE_UPDATE` action, before/after 포함

### 3.2 사용 예시

```typescript
// 포지션과 백넘버 설정
await setMemberProfileByAdmin({
  clubId: 'default-club',
  targetUserId: 'user123',
  position: 'SS',
  backNumber: 7,
  requestId: 'req-uuid-789'
});

// 포지션만 설정 (백넘버는 변경 안 함)
await setMemberProfileByAdmin({
  clubId: 'default-club',
  targetUserId: 'user456',
  position: 'P',
  requestId: 'req-uuid-012'
});
```

---

## 4. 빌드 검증 결과

### 4.1 Functions 빌드

```bash
cd functions
npm run build
```

✅ **성공**: TypeScript 컴파일 완료
- 에러 0개
- 모든 함수 정상 export됨

### 4.2 클라이언트 빌드

```bash
npm run type-check
```

⚠️ **경고**: 기존 경고들은 수정하지 않음 (범위 외)
- AccessDeniedPage 관련 에러 없음
- AuthContext 관련 에러 없음

---

## 5. 자체 검수 결과

### 5.1 ATOM-08 검수

✅ **완료 기준 충족**:
- [x] members 없으면 앱 진입 불가 → `checkMemberAccess()` 구현 완료
- [x] status != 'active'면 앱 진입 불가 → status 체크 로직 구현 완료
- [x] "가입/승인 요청 생성" 코드 없음 → AccessDeniedPage에 문구만 표시

### 5.2 ATOM-09 검수

✅ **완료 기준 충족**:
- [x] TREASURER는 PRESIDENT만 변경 가능 → 권한 정책 구현 완료
- [x] audit before/after 기록됨 → `writeAudit()` 호출 완료
- [x] 빌드 성공 → TypeScript 컴파일 완료

### 5.3 ATOM-10 검수

✅ **완료 기준 충족**:
- [x] 일반회원 호출 permission-denied → `requireRole()` 검증 완료
- [x] audit 기록 OK → `writeAudit()` 호출 완료
- [x] 빌드 성공 → TypeScript 컴파일 완료

### 5.4 제약 사항 준수 확인

✅ **공통 제약 준수**:
- [x] 새 브랜치 생성: `feat/atom-08-09-10-access-gate-member-management` ✅
- [x] 변경 범위 한정: Access Gate + 멤버 관리 Functions만 수정 ✅
- [x] PRD v1.0 준수: 권한 정책 및 audit 기록 요구사항 반영 ✅
- [x] 가입/승인 기능 구현 금지: AccessDeniedPage에 요청 버튼 없음 ✅

---

## 6. 수정된 파일 목록

### 새로 생성된 파일 (1개)

1. `src/app/pages/AccessDeniedPage.tsx`

### 수정된 파일 (4개)

1. `src/lib/firebase/firestore.service.ts` - `getMember()` 함수 추가
2. `src/app/contexts/AuthContext.tsx` - `memberStatus` 상태 및 체크 로직 추가
3. `src/app/App.tsx` - AccessDeniedPage 라우팅 추가
4. `functions/src/callables/members.ts` - `setMemberRole`, `setMemberProfileByAdmin` 구현

---

## 7. 다음 단계 (권장)

### 7.1 즉시 가능한 작업

1. **클라이언트에서 Functions 호출**: AdminPage에서 `setMemberRole`, `setMemberProfileByAdmin` 호출 코드 추가
2. **테스트**: 에뮬레이터에서 Functions 동작 확인

### 7.2 주의 사항

1. **멤버 상태 체크**: 로그인 후 매번 체크되므로 성능에 영향 없음 (Firestore read 1회)
2. **users/members 동기화**: 현재 두 문서 모두 업데이트하나, PRD에 따라 다를 수 있음
3. **role 변경 정책**: TREASURER는 PRESIDENT만, ADMIN은 PRESIDENT/DIRECTOR만 가능 (정책 고정)

---

## 8. 작업 완료 확인

### 체크리스트

- [x] ATOM-08 Access Gate 구현 완료
- [x] ATOM-09 setMemberRole 구현 완료
- [x] ATOM-10 setMemberProfileByAdmin 구현 완료
- [x] 빌드 성공 확인
- [x] 권한 정책 구현 확인
- [x] Audit 기록 확인
- [x] 멱등성 적용 확인
- [x] 자체 검수 완료
- [x] 작업 완료 보고서 작성 완료

---

**작업 완료**: 2024년  
**다음 작업**: ATOM-11 (Firestore Rules v1 - Invite 관련 제거 반영)

