# Auth Rebuild 파일 맵핑 및 분석 (Auth Map)

**작성일**: 2025-12-20
**목표**: 기존 Google OAuth 기반 로그인 및 승인 대기(Pending) 로직이 포함된 파일들을 식별하고, Email/Password 인증으로 전환하기 위한 변경 지점을 정의합니다.

## 1. 개요 (Overview)
현재 시스템은 Google OAuth 로그인을 통해서만 접근 가능하며, 회원가입 시 `status: 'pending'`으로 생성되어 관리자 승인을 기다려야 하는 구조입니다. 이를 제거하고 **Email/Password 가입 + 즉시 활성화('active')** 구조로 변경해야 합니다.

## 2. 핵심 파일 분석 (Core Files Analysis)

### 2.1 인증 서비스 (`src/lib/firebase/auth.service.ts`)
- **현재 상태**:
  - `loginWithGoogle()`: `GoogleAuthProvider` 및 `signInWithPopup` 사용.
  - `createAccount()`: 새 유저 생성 시 `status: 'pending'`으로 하드코딩. `Role`은 'MEMBER'로 고정.
- **변경 필요 사항**:
  - `loginWithEmail()` 함수 추가 (Email/Password).
  - `signupWithEmail()` 함수 추가 (Email/Password/Name/Phone).
  - `createAccount()` 로직 변경: `status`를 기본 `'active'`로 설정.
  - 구글 로그인 함수들은 Legacy로 보존하거나 마이그레이션용으로 격리.

### 2.2 로그인 페이지 (`src/app/pages/LoginPage.tsx`)
- **현재 상태**:
  - 구글 로그인 버튼만 존재.
  - 로그인 성공 후 `checkMemberExists`로 멤버십 확인, 없으면 `createAccount` 호출 후 "승인 대기" 토스트 메시지 출력.
- **변경 필요 사항**:
  - 이메일/비밀번호 입력 폼 추가.
  - 회원가입 버튼 및 페이지(`SignupPage`) 연결.
  - 비밀번호 찾기 링크 추가.
  - "승인 대기" 안내 메시지 제거 (즉시 로그인 처리).

### 2.3 인증 컨텍스트 (`src/app/contexts/AuthContext.tsx`)
- **현재 상태**:
  - `memberStatus`: `'checking' | 'active' | 'denied'` 상태 관리.
  - `checkMemberAccess()`: Firestore에서 멤버 문서 조회 후 `status === 'active'`인지 확인. 아닐 경우 `'denied'` 처리.
- **변경 필요 사항**:
  - `checkMemberAccess()` 로직 단순화: 멤버 문서가 존재하면(가입 완료되면) 무조건 `'active'` 취급 (단, `'withdrawn'`은 차단 유지).
  - `'pending'` 상태에 대한 처리 제거.

### 2.4 데이터 모델 (`src/lib/firebase/types.ts`)
- **현재 상태**:
  - `UserDoc` 인터페이스에 `status: 'pending' | 'active' | 'rejected' | 'withdrawn'` 정의.
- **변경 필요 사항**:
  - `status` 타입에서 `'pending'`, `'rejected'`를 논리적으로 제거 (타입 정의는 유지하되 로직상 미사용).

### 2.5 Firestore 보안 규칙 (`firestore.rules`)
- **현재 상태**:
  - `function isActiveMember(clubId)`: `status == 'active'` 조건을 필수로 체크.
  - `match /clubs/{clubId}`: 읽기 권한이 `isActiveMember`에 의존.
- **변경 필요 사항**:
  - `isActiveMember` 함수를 `isClubMember` (멤버 문서 존재 여부)로 대체하거나, `status` 체크를 완화.
  - "관리자 승인" 없이도 멤버 문서 생성을 허용해야 함 (`match /members/{memberId}` create 규칙).

### 2.6 백엔드 함수 (`functions/src/callables/members.ts`)
- **현재 상태**:
  - `setMemberRole`: 관리자가 멤버 역할을 변경. 승인 로직(`approveMember`)은 별도로 없으나 역할 변경 시 암묵적으로 처리될 수 있음.
- **변경 필요 사항**:
  - 승인 관련 로직이 있다면 제거하고, 역할 관리(Role Management)에 집중.

## 3. 변경 대상 파일 목록 (Target File List)

| 파일 경로 | 주요 변경 내용 | 우선순위 |
|---|---|---|
| `src/lib/firebase/auth.service.ts` | Email/Password 함수 추가, pending 상태 제거 | High |
| `src/app/pages/LoginPage.tsx` | Email 로그인 UI 구현, 가입 링크 추가 | High |
| `src/app/contexts/AuthContext.tsx` | 멤버 상태 체크(`status=='active'`) 로직 완화 | High |
| `src/lib/firebase/firestore.service.ts` | (필요 시) 회원 조회 쿼리에서 `status` 필터 제거 | Medium |
| `functions/src/callables/members.ts` | 관리자 승인 로직 제거, 순수 역할 관리로 전환 | Medium |
| `firestore.rules` | `isActiveMember` 규칙 완화 (승인 불필요) | High |
| `src/app/App.tsx` | 라우팅 보호 로직 재확인 | Low |

## 4. 결론 (Conclusion)
기존의 "선 가입, 후 승인" 모델이 코드 전반(`AuthContext`, `LoginPage`, `auth.service`)에 깊게 박혀 있습니다.
가장 먼저 **데이터 모델의 제약(pending)을 제거**하고, **UI 진입점(LoginPage)**을 교체하는 순서로 작업을 진행해야 합니다.
`Step 1`에서는 `auth.service`와 `LoginPage`를 중점적으로 수정할 계획입니다.
