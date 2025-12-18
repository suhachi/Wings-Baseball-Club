# 🔬 프로젝트 초원자단위 정밀 분석 보고서

**생성일**: 2024년  
**분석 범위**: 전체 코드베이스  
**분석 수준**: 원자 단위 (Atomic Level)

---

## 📊 실행 요약 (Executive Summary)

### 전체 상태
- **빌드 상태**: ✅ 성공 (경고 2개)
- **TypeScript 에러**: ❌ **40개** (치명적 8개, 경고 32개)
- **런타임 에러 가능성**: ⚠️ **높음** (데이터 모델 불일치, 타입 불일치)
- **기능 완성도**: ⚠️ **약 70%** (핵심 기능은 구현되었으나 미완성/버그 다수)

### 주요 발견 사항
1. **치명적 타입 에러 8개**: 런타임 에러로 이어질 수 있음
2. **데이터 모델 불일치**: Firestore Rules와 클라이언트 코드 간 불일치
3. **누락된 타입 정의**: `CommentDoc`, `AttendanceDoc`, `FinanceDoc` 미export
4. **권한 체크 불일치**: `author.id` vs `authorId` 혼용
5. **미사용 코드**: 32개 경고 (코드 정리 필요)

---

## 1️⃣ TypeScript 에러 분석 (40개)

### 🔴 치명적 에러 (8개) - 런타임 에러 가능성

#### 1.1 누락된 타입 Export (3개)
**위치**: `src/lib/firebase/types.ts`
- **에러**: `CommentDoc`, `AttendanceDoc`, `FinanceDoc`가 정의되어 있으나 export되지 않음
- **영향 파일**:
  - `src/app/contexts/DataContext.tsx:19` (2개)
  - `src/lib/firebase/firestore.service.ts:21-24` (3개)
  - `src/app/pages/FinancePage.tsx:31` (1개)
- **문제**: 타입을 import할 수 없어 컴파일 실패
- **수정 방법**: `types.ts`에서 해당 인터페이스를 `export interface`로 변경

```typescript
// 현재 (types.ts에 정의되어 있으나 export 안 됨)
interface CommentDoc { ... }

// 수정 필요
export interface CommentDoc { ... }
export interface AttendanceDoc { ... }
export interface FinanceDoc { ... }
```

#### 1.2 중복 식별자 (2개)
**위치**: `src/app/contexts/DataContext.tsx:154-155`
- **에러**: `loadAttendances`가 `DataContextType` 인터페이스에 두 번 선언됨
- **문제**: TypeScript 컴파일 실패
- **수정 방법**: 중복 선언 제거

```typescript
// 현재
interface DataContextType {
  ...
  loadAttendances: (postId: string) => Promise<void>;
  loadAttendances: (postId: string) => Promise<void>; // 중복!
  ...
}

// 수정
interface DataContextType {
  ...
  loadAttendances: (postId: string) => Promise<void>; // 하나만
  ...
}
```

#### 1.3 타입 불일치 - null vs undefined (2개)
**위치**: `src/app/contexts/DataContext.tsx:340, 353`
- **에러**: `Date | null`을 `Date | undefined`에 할당 불가
- **문제**: 
  - Line 340: `newPostData.startAt = postData.startAt ?? null;` → `Date | null`
  - Line 353: `newPostData.voteCloseAt = postData.voteCloseAt ?? null;` → `Date | null`
  - `PostDoc.startAt`은 `Date | null | undefined`이지만, `Post.startAt`은 `Date | undefined`
- **수정 방법**: `?? null` → `?? undefined`로 변경

```typescript
// 현재
newPostData.startAt = postData.startAt ?? null; // Date | null
newPostData.voteCloseAt = postData.voteCloseAt ?? null; // Date | null

// 수정
newPostData.startAt = postData.startAt ?? undefined; // Date | undefined
newPostData.voteCloseAt = postData.voteCloseAt ?? undefined; // Date | undefined
```

#### 1.4 속성 불일치 (1개)
**위치**: `src/app/pages/AlbumPage.tsx:63`
- **에러**: `images` 속성이 `PostDoc`에 존재하지 않음
- **문제**: `PostDoc`는 `mediaUrls`를 사용하지만 코드에서 `images` 사용
- **수정 방법**: `images` → `mediaUrls`로 변경

```typescript
// 현재
await createPost(currentClubId, {
  ...
  images: [imageUrl], // ❌ PostDoc에 images 없음
  ...
});

// 수정
await createPost(currentClubId, {
  ...
  mediaUrls: [imageUrl], // ✅ PostDoc.mediaUrls 사용
  ...
});
```

#### 1.5 Props 타입 불일치 (1개)
**위치**: `src/app/pages/GameRecordPage.tsx:393`
- **에러**: `CommentList`에 `comments` prop 전달하나 인터페이스에 없음
- **문제**: `CommentList`는 `postId`만 받는데 `comments`도 전달
- **수정 방법**: `comments` prop 제거 (내부에서 로드)

```typescript
// 현재
<CommentList postId={game.id} comments={[]} /> // ❌ comments prop 없음

// 수정
<CommentList postId={game.id} /> // ✅ postId만 전달
```

### 🟡 논리적 에러 (4개) - 런타임 동작 이상 가능

#### 1.6 타입 비교 불일치 (2개)
**위치**: `src/app/pages/AdminPage.tsx:307-308`
- **에러**: `"active" | "inactive"`와 `"pending"` 비교 (겹치지 않음)
- **문제**: 
  - Line 307: `members.filter(m => m.status === 'pending')` → `status`는 `"active" | "inactive"`인데 `"pending"` 비교
  - 실제 `UserDoc.status`는 `'pending' | 'active' | 'rejected' | 'withdrawn'`
- **원인**: `Member` 타입과 `UserDoc` 타입 불일치
- **수정 방법**: `Member` 타입의 `status`를 `UserDoc.status`와 일치시켜야 함

```typescript
// 현재 (Member 타입이 잘못됨)
interface Member {
  status: 'active' | 'inactive'; // ❌ 'pending' 없음
}

// 수정 필요
interface Member {
  status: 'pending' | 'active' | 'rejected' | 'withdrawn'; // ✅ UserDoc과 일치
}
```

#### 1.7 암시적 any 타입 (2개)
**위치**: `src/app/pages/AdminPage.tsx:463-464`
- **에러**: `string` 타입을 `Record<UserRole, string>` 인덱스로 사용
- **문제**: `role`이 `string`인데 `UserRole` 타입으로 인덱싱
- **수정 방법**: 타입 단언 또는 타입 가드 추가

```typescript
// 현재
const roleLabel = roleLabels[member.role]; // member.role이 string

// 수정
const roleLabel = roleLabels[member.role as UserRole]; // 타입 단언
// 또는
if (member.role in roleLabels) {
  const roleLabel = roleLabels[member.role as UserRole];
}
```

### 🟢 경고 수준 (28개) - 코드 정리 필요

#### 1.8 미사용 변수/Import (28개)
- **CreatePostModal.tsx**: `user` (1개)
- **EditPostModal.tsx**: `Calendar`, destructured elements (2개)
- **game-record 컴포넌트들**: `useData`, `useAuth`, `Save`, `Loader2`, `Trash2`, `isLocked`, `ids`, `useCallback`, `Input`, `debounce` (14개)
- **AdminPage.tsx**: `setLoading`, `loadData` (2개)
- **BoardsPage.tsx**: `Calendar` (1개)
- **FinancePage.tsx**: `Filter`, `CreditCard`, `ShoppingBag`, `onBack` (4개)
- **GameRecordPage.tsx**: `user`, `isLocking`, `canLock` (3개)
- **HomePage.tsx**: `user` (1개)
- **LoginPage.tsx**: `isIOS` (1개)
- **MyPage.tsx**: `Comment` (1개)
- **NotificationPage.tsx**: `Trash2`, `user` (2개)
- **SchedulePage.tsx**: `user` (1개)
- **auth.service.ts**: `role` (1개)

**수정 방법**: 미사용 import/변수 제거 또는 `_` 접두사 추가

---

## 2️⃣ 데이터 모델 불일치 분석

### 2.1 Firestore Rules vs 클라이언트 코드 불일치

#### 문제 1: `author.id` vs `authorId`
**Firestore Rules** (`firestore.rules:54, 68`):
```javascript
allow update: if ... && (resource.data.author.id == request.auth.uid || isAdmin());
allow delete: if ... && (resource.data.author.id == request.auth.uid || isAdmin());
```

**클라이언트 코드** (`PostDoc`):
```typescript
interface PostDoc {
  authorId: string; // ✅ 단일 필드
  authorName: string;
  authorPhotoURL?: string;
}
```

**문제**: Rules는 `author.id`를 기대하지만 실제 데이터는 `authorId` 단일 필드
- **영향**: 게시글/댓글 수정/삭제 시 권한 체크 실패 가능
- **수정 방법**: 
  1. Rules 수정: `resource.data.authorId == request.auth.uid`
  2. 또는 데이터 구조 변경: `author: { id, name, photoURL }` (권장하지 않음, 대규모 리팩토링 필요)

#### 문제 2: Comment 구조 불일치
**Rules** (`firestore.rules:68`):
```javascript
allow update: if ... && (resource.data.author.id == request.auth.uid || isAdmin());
```

**실제 데이터** (`CommentDoc`):
```typescript
interface CommentDoc {
  authorId: string; // ✅ 단일 필드
  authorName: string;
  authorPhotoURL?: string;
}
```

**동일한 문제**: Rules는 `author.id`, 실제는 `authorId`

### 2.2 클라이언트 내부 데이터 변환 불일치

#### 문제 3: `Post` vs `PostDoc` 변환
**DataContext.tsx** (`refreshPosts`):
```typescript
const post: Post = {
  ...
  author: {
    id: postDoc.authorId, // ✅ 변환됨
    name: postDoc.authorName,
    photoURL: postDoc.authorPhotoURL,
  },
  ...
};
```

**문제**: `Post`는 `author: { id, name, photoURL }` 구조이지만, `PostDoc`는 `authorId`, `authorName`, `authorPhotoURL` 분리 필드
- **영향**: 일부 컴포넌트에서 `post.author.id` 사용 (정상), 일부에서 `post.authorId` 사용 시도 (에러)

#### 문제 4: `MyPage.tsx`에서 `authorId` 직접 접근
**위치**: `src/app/pages/MyPage.tsx:52, 56`
```typescript
const postCount = (posts || []).filter((post: any) => post.authorId === user.id).length;
const commentCount = allComments.filter((comment: any) => comment.authorId === user.id).length;
```

**문제**: `Post`는 `author.id`를 사용해야 하는데 `authorId` 접근 시도
- **현재**: `any` 타입으로 우회하여 동작하지만 타입 안전성 없음
- **수정 방법**: `post.author.id`, `comment.author.id`로 변경

---

## 3️⃣ 코드 흐름 분석

### 3.1 사용자 등록/로그인 흐름

#### ✅ 정상 흐름
1. **Google 로그인** (`LoginPage.tsx`)
   - `signInWithGoogle()` → Firebase Auth
   - `onAuthStateChanged` → `AuthContext`에서 사용자 감지
   - `checkUserExists()` → Firestore에 사용자 문서 존재 확인
   - 존재하지 않으면 → `createAccount()` 호출

2. **계정 생성** (`auth.service.ts:createAccount`)
   - `status: 'pending'`으로 생성 (Line 194)
   - `users/{uid}` 문서 생성
   - `clubs/{clubId}/members/{uid}` 문서 생성
   - 초대 코드가 있으면 사용 처리

3. **승인 대기 상태**
   - `App.tsx:64-68`: Pending 사용자 차단 로직 **비활성화됨** (주석 처리)
   - `BoardsPage.tsx:120`: Pending 사용자는 글쓰기 제한 (FAB 숨김)
   - `BoardsPage.tsx:131`: Pending 사용자에게 안내 메시지 표시

#### ⚠️ 문제점
- **승인 대기 사용자가 앱 접근 가능**: `App.tsx`에서 차단 로직이 비활성화되어 있어 Pending 사용자도 모든 페이지 접근 가능
- **권한 체크 불완전**: 일부 페이지에서 `user?.status !== 'pending'` 체크하지만 일관성 없음

### 3.2 게시글 생성 흐름

#### ✅ 정상 흐름
1. **CreatePostModal** (`CreatePostModal.tsx`)
   - 사용자 입력 → `postData` 객체 생성
   - `addPost(postData)` 호출

2. **DataContext.addPost** (`DataContext.tsx:319`)
   - `PostDoc` 형식으로 변환
   - `createPostInDb()` 호출

3. **Firestore 저장** (`firestore.service.ts:createPost`)
   - `clubs/{clubId}/posts/{postId}` 문서 생성

#### ⚠️ 문제점
- **타입 불일치**: `addPost`는 `Omit<Post, ...>`를 받지만 내부에서 `PostDoc`로 변환 시 타입 불일치 (null vs undefined)
- **AlbumPage.tsx**: `images` 필드 사용 (Line 63) → `PostDoc`에는 `mediaUrls`만 존재

### 3.3 댓글 시스템 흐름

#### ✅ 정상 흐름
1. **댓글 로드** (`DataContext.loadComments`)
   - `getComments()` → `CommentDoc[]` 반환
   - `Comment` 형식으로 변환 (`author: { id, name, photoURL }`)

2. **댓글 추가** (`DataContext.addComment`)
   - `addCommentInDb()` 호출
   - `loadComments()` 재호출

#### ⚠️ 문제점
- **CommentList 컴포넌트**: `postId`만 받아야 하는데 `GameRecordPage.tsx:393`에서 `comments` prop도 전달
- **타입 Export 누락**: `CommentDoc`가 export되지 않아 import 실패

### 3.4 출석 투표 흐름

#### ✅ 정상 흐름
1. **출석 투표** (`SchedulePage.tsx:35`)
   - `updateAttendance(eventId, user.id, status)` 호출
   - `DataContext.updateAttendance` → Firestore 업데이트

2. **출석 현황 집계** (`DataContext.loadAttendances`)
   - `getAttendances()` 호출
   - `attendanceSummary` 계산

#### ⚠️ 문제점
- **자동 마감 미구현**: 전날 23시 자동 마감 기능은 Cloud Functions 필요 (미구현)
- **중복 함수 선언**: `loadAttendances`가 `DataContextType`에 두 번 선언됨

### 3.5 경기 기록 시스템 (WF-07)

#### ✅ 구현된 부분
1. **데이터 구조**: `PostDoc`에 `recorders`, `recordingLocked` 필드 존재
2. **Firestore Rules**: `canRecordAdminOverride()` 함수로 권한 체크
3. **UI 컴포넌트**: `GameRecordPage`, `BatterTable`, `PitcherTable`, `LineupEditor` 존재

#### ❌ 문제점
1. **타입 에러 다수**: game-record 컴포넌트들에 미사용 import/변수 14개
2. **함수 시그니처 불일치**: `handleCreate` 함수들이 예상과 다른 매개변수 받음
3. **lodash 타입 누락**: `@types/lodash` 미설치
4. **CommentList Props 오류**: `GameRecordPage.tsx:393`에서 잘못된 props 전달

---

## 4️⃣ 권한 체크 일관성 분석

### 4.1 역할 기반 접근 제어 (RBAC)

#### ✅ 구현된 부분
- **역할 정의**: `PRESIDENT`, `DIRECTOR`, `TREASURER`, `ADMIN`, `MEMBER`
- **isAdmin() 함수**: `AuthContext`에 구현됨
- **Firestore Rules**: `isAdmin()` 헬퍼 함수로 관리자 체크

#### ⚠️ 불일치 사항
1. **Firestore Rules의 isAdmin()**:
   ```javascript
   function isAdmin() {
     return ... && get(...).data.role in ['ADMIN', 'PRESIDENT', 'DIRECTOR', 'TREASURER'];
   }
   ```
   - `PRESIDENT`, `DIRECTOR`, `TREASURER`도 관리자로 간주

2. **클라이언트 isAdmin()**:
   ```typescript
   const isAdmin = () => {
     return user?.role === 'ADMIN' || user?.role === 'PRESIDENT' || 
            user?.role === 'DIRECTOR' || user?.role === 'TREASURER';
   };
   ```
   - ✅ 일치함

### 4.2 승인 상태 기반 접근 제어

#### ⚠️ 불완전한 구현
- **App.tsx**: Pending 사용자 차단 로직 **비활성화됨** (주석 처리)
- **BoardsPage.tsx**: Pending 사용자는 글쓰기 제한 (FAB 숨김)
- **일관성 없음**: 일부 페이지는 체크, 일부는 미체크

---

## 5️⃣ 누락된 기능 분석

### 5.1 Cloud Functions (미구현)

#### 필수 기능
1. **출석 투표 자동 마감** (`scheduledVoteClose`)
   - Cron: 매일 23:00
   - 전날 23시에 마감해야 할 이벤트 찾아서 `voteClosed = true` 설정

2. **출석 리마인더 알림** (`scheduleReminder`)
   - 이벤트 1일 전 20:00
   - 출석 투표 미완료 사용자에게 알림

3. **공지 푸시 알림** (`sendNoticePush`)
   - 공지사항 작성 시 모든 사용자에게 푸시

4. **경기 기록 잠금** (`lockGameRecording`)
   - 관리자 전용 Callable Function
   - `recordingLocked = true` 설정

5. **경기 기록원 지정** (`setGameRecorders`)
   - 관리자 전용 Callable Function
   - `recorders` 배열 업데이트

### 5.2 UI 기능 (부분 구현)

#### 게시판
- ✅ 게시글 목록 조회
- ✅ 게시글 작성 (`CreatePostModal`)
- ✅ 게시글 수정 (`EditPostModal`)
- ✅ 게시글 삭제
- ⚠️ 게시글 상세 페이지 (Modal로 구현됨, 별도 페이지 없음)

#### 투표
- ✅ 투표 생성
- ✅ 투표 조회
- ⚠️ 투표하기 UI (`PollVoteModal` 존재하나 완전하지 않음)

#### 경기 기록
- ✅ 경기 목록 (`GameRecordPage`)
- ✅ 라인업 편집 (`LineupEditor`)
- ✅ 타자 기록 (`BatterTable`)
- ✅ 투수 기록 (`PitcherTable`)
- ⚠️ 기록원 지정 UI (관리자 페이지에서 해야 하나 별도 UI 없음)
- ⚠️ 기록 잠금 UI (GameRecordPage에 있으나 완전하지 않음)

#### 앨범
- ✅ 앨범 목록 (`AlbumPage`)
- ⚠️ 실제 업로드 기능 (Storage 연동은 되었으나 UI 완전하지 않음)

---

## 6️⃣ 런타임 에러 가능성 분석

### 6.1 높은 위험도

#### 1. Firestore Rules 권한 체크 실패
**위치**: 게시글/댓글 수정/삭제 시
**원인**: Rules는 `author.id`를 기대하지만 실제 데이터는 `authorId`
**증상**: 권한이 있어도 수정/삭제 실패
**확률**: **높음** (수정/삭제 시도 시 발생)

#### 2. 타입 불일치로 인한 undefined 접근
**위치**: `MyPage.tsx:52, 56`
**원인**: `post.authorId` 접근 시도 (실제는 `post.author.id`)
**증상**: `undefined === user.id` 비교로 통계 오류
**확률**: **중간** (`any` 타입으로 우회되어 동작하지만 부정확)

#### 3. null vs undefined 불일치
**위치**: `DataContext.tsx:340, 353`
**원인**: `Date | null`을 `Date | undefined`에 할당
**증상**: 타입 에러로 빌드 실패 (런타임 에러는 아님)
**확률**: **높음** (빌드 시 발생)

### 6.2 중간 위험도

#### 4. CommentList Props 오류
**위치**: `GameRecordPage.tsx:393`
**원인**: `comments` prop 전달하나 인터페이스에 없음
**증상**: React 경고 또는 렌더링 오류
**확률**: **중간** (React가 무시할 수도 있음)

#### 5. 미사용 변수로 인한 혼란
**위치**: 다수 파일
**원인**: 미사용 변수가 실제로는 사용되어야 할 수도 있음
**증상**: 기능 미작동
**확률**: **낮음** (코드 리뷰 필요)

---

## 7️⃣ 빌드 및 성능 분석

### 7.1 빌드 상태
- **상태**: ✅ 성공
- **경고**: 2개
  1. Dynamic import 경고: `auth.service.ts`가 동적/정적 import 혼용
  2. Chunk 크기 경고: 메인 번들 1.28MB (압축 후 340KB)

### 7.2 성능 이슈
- **번들 크기**: 1.28MB (압축 후 340KB) → **큼**
- **권장 사항**: Code splitting 적용 필요
  - AdminPage, GameRecordPage 등 큰 페이지는 동적 import
  - Firebase SDK는 이미 동적 import됨

---

## 8️⃣ 수정 우선순위

### 🔴 P0 (즉시 수정 필요 - 런타임 에러 가능)

1. **Firestore Rules 수정** (`firestore.rules`)
   - `author.id` → `authorId`로 변경
   - 영향: 게시글/댓글 수정/삭제 권한 체크

2. **타입 Export 추가** (`src/lib/firebase/types.ts`)
   - `CommentDoc`, `AttendanceDoc`, `FinanceDoc` export
   - 영향: 컴파일 실패

3. **중복 선언 제거** (`DataContext.tsx:154-155`)
   - `loadAttendances` 중복 제거
   - 영향: 컴파일 실패

4. **null → undefined 변환** (`DataContext.tsx:340, 353`)
   - `?? null` → `?? undefined`
   - 영향: 타입 에러

5. **AlbumPage.tsx 수정** (`AlbumPage.tsx:63`)
   - `images` → `mediaUrls`
   - 영향: 게시글 생성 실패

6. **GameRecordPage.tsx 수정** (`GameRecordPage.tsx:393`)
   - `comments` prop 제거
   - 영향: React 렌더링 오류

### 🟡 P1 (단기 수정 - 논리적 오류)

7. **Member 타입 수정** (`AdminPage.tsx` 관련)
   - `status: 'active' | 'inactive'` → `'pending' | 'active' | 'rejected' | 'withdrawn'`
   - 영향: Pending 사용자 필터링 실패

8. **MyPage.tsx 수정** (`MyPage.tsx:52, 56`)
   - `post.authorId` → `post.author.id`
   - `comment.authorId` → `comment.author.id`
   - 영향: 통계 오류

9. **AdminPage.tsx 타입 단언** (`AdminPage.tsx:463-464`)
   - `member.role as UserRole` 추가
   - 영향: 타입 에러

### 🟢 P2 (중기 수정 - 코드 정리)

10. **미사용 import/변수 제거** (28개)
    - 모든 파일에서 미사용 코드 제거
    - 영향: 코드 가독성, 유지보수성

11. **lodash 타입 설치**
    - `npm i --save-dev @types/lodash`
    - 영향: 타입 안전성

---

## 9️⃣ 워크플로우 완성도 평가

### ✅ 완전 구현 (100%)
- 사용자 인증 (Google 로그인)
- 게시글 CRUD (생성/조회/수정/삭제)
- 댓글 CRUD
- 출석 투표 (수동)
- 멤버 관리 (기본)

### ⚠️ 부분 구현 (50-80%)
- 투표 시스템 (UI 불완전)
- 경기 기록 (기본 구조만, UI 불완전)
- 앨범 (목록만, 업로드 불완전)
- 알림 시스템 (조회만, 푸시 미구현)

### ❌ 미구현 (0%)
- Cloud Functions (자동 마감, 리마인더, 푸시)
- 경기 기록원 지정 UI
- 경기 기록 잠금 UI (부분만)
- 공지 푸시 알림

---

## 🔟 종합 진단

### 프로젝트 건강도: ⚠️ **주의 필요** (60/100)

#### 강점
1. ✅ 기본 인프라 완성 (Firebase 연동, 인증, Firestore)
2. ✅ 핵심 기능 구현 (게시판, 댓글, 출석)
3. ✅ UI/UX 양호 (모던한 디자인, 애니메이션)
4. ✅ 타입 시스템 구축 (TypeScript)

#### 약점
1. ❌ 타입 에러 40개 (치명적 8개)
2. ❌ 데이터 모델 불일치 (Rules vs 코드)
3. ❌ Cloud Functions 미구현 (자동화 기능 없음)
4. ❌ 일부 기능 미완성 (경기 기록, 앨범 업로드)

### 권장 조치 사항

#### 즉시 (1주일 내)
1. P0 에러 수정 (6개)
2. Firestore Rules 수정
3. 타입 Export 추가

#### 단기 (1개월 내)
1. P1 에러 수정 (3개)
2. 미사용 코드 정리
3. Cloud Functions 기본 구조 구축

#### 중기 (2-3개월 내)
1. Cloud Functions 완전 구현
2. 경기 기록 시스템 완성
3. 앨범 업로드 완성
4. 성능 최적화 (Code splitting)

---

## 📝 결론

현재 프로젝트는 **기본 기능은 작동하나, 타입 안전성과 데이터 일관성에 문제가 있음**. 특히 Firestore Rules와 클라이언트 코드 간 불일치로 인해 권한 체크가 실패할 수 있어 **즉시 수정이 필요**합니다.

**다음 단계**: P0 에러부터 순차적으로 수정하여 안정성을 확보한 후, Cloud Functions 및 미완성 기능을 완성하는 것을 권장합니다.

---

**보고서 작성 완료**

