# TypeScript 에러 정밀 검수 보고서

**검수 일시**: 현재  
**검수 방법**: `npx tsc --noEmit` 실행 결과 분석  
**전체 에러 수**: 71개

---

## ✅ 수정 완료된 항목 확인

### 1. PollVoteModal.tsx
- ✅ `canDelete` 변수 정의됨 (Line 29)
- ✅ 산술 연산 타입 에러 수정됨 (Line 159: `choice.votes?.length || 0`)

---

## ❌ 여전히 남아있는 에러 카테고리

### 카테고리 1: 미사용 import/변수 (38개)

#### 1.1 Components
- **CreatePostModal.tsx** (1개)
  - Line 20: `user` 미사용
  
- **EditPostModal.tsx** (2개)
  - Line 2: `Calendar` 미사용
  - Line 19: `user`, `isAdmin` 모두 미사용 (TS6198)
  
- **game-record/BatterTable.tsx** (5개)
  - Line 2: `useData` 미사용
  - Line 10: `Save`, `Loader2`, `Trash2` 미사용
  - Line 18: `isLocked` 미사용
  - Line 66: `ids` 매개변수 미사용
  
- **game-record/LineupEditor.tsx** (6개)
  - Line 1: `useCallback` 미사용
  - Line 2: `useAuth` 미사용
  - Line 3: `useData` 미사용
  - Line 9: `Input` 미사용
  - Line 13: `debounce` 미사용 (또한 lodash 타입 정의 없음)
  - Line 36: `isLocked` 미사용
  - Line 164: `ids`, `members` 매개변수 미사용
  
- **game-record/PitcherTable.tsx** (4개)
  - Line 2: `useAuth` 미사용
  - Line 3: `useData` 미사용
  - Line 20: `isLocked` 미사용
  - Line 69: `ids` 매개변수 미사용

#### 1.2 Pages
- **AdminPage.tsx** (2개)
  - Line 67: `setLoading` 미사용
  - Line 92: `loadData` 미사용
  
- **BoardsPage.tsx** (1개)
  - Line 3: `Calendar` 미사용
  
- **FinancePage.tsx** (4개)
  - Line 9: `Filter` 미사용
  - Line 11: `CreditCard` 미사용
  - Line 12: `ShoppingBag` 미사용
  - Line 40: `onBack` 매개변수 미사용
  
- **GameRecordPage.tsx** (3개)
  - Line 36: `user` 미사용
  - Line 143: `isLocking` 미사용
  - Line 162: `canLock` 미사용
  
- **HomePage.tsx** (1개)
  - Line 18: `user` 미사용
  
- **LoginPage.tsx** (1개)
  - Line 21: `isIOS` 미사용
  
- **MyPage.tsx** (1개)
  - Line 5: `Comment` 미사용
  
- **NotificationPage.tsx** (2개)
  - Line 12: `Trash2` 미사용
  - Line 28: `user` 미사용
  
- **SchedulePage.tsx** (1개)
  - Line 346: `user` 미사용

#### 1.3 Services
- **auth.service.ts** (1개)
  - Line 432: `role` 매개변수 미사용 (`canCreatePosts` 함수)

---

### 카테고리 2: 타입 불일치/할당 에러 (11개)

#### 2.1 DataContext.tsx (5개)
- **Line 340**: `newPostData.voteCloseAt = postData.voteCloseAt ?? null;`
  - **문제**: `PostDoc.voteCloseAt`이 `Date | undefined`인데 `Date | null` 할당 시도
  - **원인**: `?? null` 사용으로 인해 `Date | null` 타입이 됨
  - **해결**: `postData.voteCloseAt ?? undefined` 또는 타입 단언 필요
  
- **Line 353**: `newPostData.closeAt = postData.closeAt ?? null;`
  - **문제**: 동일한 이슈
  - **해결**: `postData.closeAt ?? undefined` 또는 타입 단언

- **Line 154-155**: `loadAttendances` 중복 정의
  - **문제**: 같은 함수가 2번 선언됨
  - **해결**: 중복 제거

- **Line 19**: `CommentDoc`, `AttendanceDoc` import 에러
  - **문제**: `types.ts`에서 export되지 않음
  - **해결**: `types.ts`에 타입 정의 추가 필요

#### 2.2 game-record 컴포넌트들 (3개)
- **BatterTable.tsx Line 121**: 함수 시그니처 불일치
  - **문제**: `(ids: string[], members: any[]) => Promise<void>`를 `(ids: string[]) => void`에 할당
  - **해결**: 함수 타입 일치 필요
  
- **LineupEditor.tsx Line 164**: 동일한 함수 시그니처 불일치
  - **문제**: `(ids: any, members: any) => void`를 `(ids: string[]) => void`에 할당
  - **해결**: 함수 타입 일치 필요
  
- **PitcherTable.tsx Line 145**: 동일한 함수 시그니처 불일치
  - **문제**: `(ids: string[], members: any[]) => Promise<void>`를 `(ids: string[]) => void`에 할당
  - **해결**: 함수 타입 일치 필요

#### 2.3 AlbumPage.tsx (1개)
- **Line 63**: `images` 속성이 `PostDoc`에 없음
  - **문제**: `createPost`에 `images` 속성 전달 시 `PostDoc` 타입에 해당 필드 없음
  - **해결**: `PostDoc` 타입에 `images` 또는 `mediaUrls` 필드 사용 확인 필요

#### 2.4 GameRecordPage.tsx (1개)
- **Line 393**: `CommentList` props 타입 불일치
  - **문제**: `comments` prop이 `CommentListProps`에 없음
  - **해결**: `CommentList` 컴포넌트 props 타입 확인 및 수정

#### 2.5 FinancePage.tsx (1개)
- **Line 31**: `FinanceDoc` import 에러
  - **문제**: `types.ts`에서 export되지 않음
  - **해결**: `types.ts`에 타입 정의 추가 필요

---

### 카테고리 3: 타입 비교/인덱싱 에러 (4개)

#### 3.1 AdminPage.tsx (4개)
- **Line 307-308**: 타입 비교 에러
  - **문제**: `"active" | "inactive"`와 `"pending"` 타입이 겹치지 않음
  - **원인**: Member.status가 `"active" | "inactive"`인데 `"pending"`과 비교 시도
  - **해결**: 타입 정의 확인 및 비교 로직 수정
  
- **Line 463-464**: 인덱싱 타입 에러
  - **문제**: `string` 타입으로 `Record<UserRole, string>` 인덱싱 시도
  - **해결**: 타입 단언 또는 타입 가드 필요

#### 3.2 FinancePage.tsx (2개)
- **Line 433, 468**: 인덱싱 타입 에러
  - **문제**: `any` 타입으로 `Record<CategoryType, ...>` 인덱싱
  - **해결**: 타입 단언 또는 타입 가드 필요

---

### 카테고리 4: 누락된 타입 정의 (4개)

#### 4.1 types.ts에 누락된 타입
- `CommentDoc` - 댓글 문서 타입
- `AttendanceDoc` - 출석 문서 타입
- `FinanceDoc` - 회계 문서 타입

#### 4.2 외부 패키지 타입 정의
- `lodash` - `@types/lodash` 패키지 설치 필요

---

## 📊 에러 현황 요약

| 카테고리 | 개수 | 우선순위 | 상태 |
|---------|------|---------|------|
| 미사용 import/변수 | 38개 | 낮음 | ⚠️ 미수정 |
| 타입 불일치/할당 | 11개 | 높음 | ⚠️ 일부 수정됨 |
| 타입 비교/인덱싱 | 4개 | 중간 | ❌ 미수정 |
| 누락된 타입 정의 | 4개 | 높음 | ❌ 미수정 |
| **합계** | **57개** | - | - |

**참고**: 일부 에러는 중복되거나 연관되어 있어 실제 수정해야 할 파일 수는 더 적을 수 있습니다.

---

## 🔧 즉시 수정 필요한 항목 (우선순위 높음)

### 1. types.ts에 누락된 타입 추가
```typescript
// Comment Document
export interface CommentDoc {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhotoURL?: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Attendance Document
export interface AttendanceDoc {
  id: string;
  postId: string;
  userId: string;
  userName: string;
  status: AttendanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Finance Document
export interface FinanceDoc {
  id: string;
  clubId: string;
  type: 'income' | 'expense';
  category: 'dues' | 'event' | 'equipment' | 'other';
  amount: number;
  description: string;
  date: Date;
  createdBy: string;
  createdByName: string;
  duesPaidBy?: string;
  duesPaidByName?: string;
  duesMonth?: string;
  createdAt: Date;
}
```

### 2. DataContext.tsx 타입 에러 수정
- Line 340: `voteCloseAt` null 처리
- Line 353: `closeAt` null 처리
- Line 154-155: `loadAttendances` 중복 제거

### 3. game-record 컴포넌트 함수 시그니처 수정
- BatterTable, LineupEditor, PitcherTable의 함수 타입 일치

---

## 📝 수정 권장 순서

1. **types.ts** - 누락된 타입 정의 추가 (CommentDoc, AttendanceDoc, FinanceDoc)
2. **DataContext.tsx** - 타입 불일치 및 중복 정의 수정
3. **game-record 컴포넌트들** - 함수 시그니처 일치
4. **AdminPage.tsx, FinancePage.tsx** - 타입 비교/인덱싱 에러 수정
5. **모든 파일** - 미사용 import/변수 제거

---

## ⚠️ 주의사항

1. **DataContext.tsx의 null 처리**: `PostDoc` 타입 정의를 확인하여 `null` 허용 여부 확인 필요
2. **게임 기록 관련 컴포넌트**: 함수 시그니처가 실제 사용과 일치하는지 확인 필요
3. **AdminPage의 상태 비교**: Member.status 타입 정의와 실제 사용 로직 일치 확인 필요

