# TypeScript 에러 26개 수정 가이드

## 목차
1. [미사용 import/변수 제거 (20개)](#1-미사용-import변수-제거-20개)
2. [타입 불일치 수정 (5개)](#2-타입-불일치-수정-5개)
3. [정의되지 않은 식별자 수정 (1개)](#3-정의되지-않은-식별자-수정-1개)

---

## 1. 미사용 import/변수 제거 (20개)

### 1-1. `src/app/components/CreatePostModal.tsx` (1개)

**에러**: Line 20 - `user` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
const { user, isAdmin } = useAuth();
```

**수정 방법**:
- `user`는 실제로 사용되지 않으므로 destructuring에서 제거

**수정 후 코드**:
```typescript
const { isAdmin } = useAuth();
```

---

### 1-2. `src/app/components/EditPostModal.tsx` (2개)

**에러 1**: Line 2 - `Calendar` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
import { X, Calendar } from 'lucide-react';
```

**수정 방법**:
- `Calendar` 아이콘을 import에서 제거

**수정 후 코드**:
```typescript
import { X } from 'lucide-react';
```

---

**에러 2**: Line 19 - All destructured elements are unused (TS6198)

**현재 코드**:
```typescript
const { user, isAdmin } = useAuth();
```

**확인 필요**: 
- 코드 전체를 확인해보니 `user`와 `isAdmin`이 실제로 사용되는지 확인 필요
- 사용되지 않는다면 이 라인 전체를 제거

**수정 방법**:
- 실제로 사용되지 않는다면 라인 19 전체 제거
- 만약 나중에 권한 체크가 필요하다면 주석 처리 후 TODO 추가

**수정 후 코드** (사용 안 함이 확인된 경우):
```typescript
// const { user, isAdmin } = useAuth(); // 현재 미사용
```

---

### 1-3. `src/app/components/MemberPicker.tsx` (2개)

**에러 1**: Line 1 - `useEffect` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
import React, { useState } from 'react';
```

**확인**: 실제로 `useEffect`가 import 되어 있는지 확인 필요. 에러 메시지상 Line 1인데, 실제로는 다른 라인일 수 있음.

**수정 방법**:
- `useEffect`를 import에서 제거

**수정 후 코드**:
```typescript
import React, { useState } from 'react';
```

---

**에러 2**: Line 3 - `Check` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
import { Search, X, Check, CheckCircle2, PlusCircle } from 'lucide-react';
```

**수정 방법**:
- `Check` 아이콘을 import에서 제거 (실제로는 `CheckCircle2`를 사용 중)

**수정 후 코드**:
```typescript
import { Search, X, CheckCircle2, PlusCircle } from 'lucide-react';
```

---

### 1-4. `src/app/components/PollVoteModal.tsx` (3개)

**에러 1**: Line 2 - `MoreVertical` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
import { X, CheckCircle, MoreVertical, Edit2, Trash2 } from 'lucide-react';
```

**수정 방법**:
- `MoreVertical` 아이콘을 import에서 제거

**수정 후 코드**:
```typescript
import { X, CheckCircle, Edit2, Trash2 } from 'lucide-react';
```

---

**에러 2**: Line 27 - `showMenu` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
const [showMenu, setShowMenu] = useState(false);
```

**수정 방법**:
- `showMenu`와 `setShowMenu`가 실제로 사용되지 않으므로 이 라인 전체 제거
- `handleEdit` 함수 내부의 `setShowMenu(false)` 호출도 제거

**수정 후 코드**:
```typescript
// const [showMenu, setShowMenu] = useState(false); // 미사용
```

그리고 `handleEdit` 함수에서:
```typescript
const handleEdit = () => {
  onEdit?.();
  // setShowMenu(false); // 제거
};
```

그리고 `handleDelete` 함수에서:
```typescript
const handleDelete = () => {
  if (confirm('투표를 삭제하시겠습니까?')) {
    onDelete?.();
  }
  // setShowMenu(false); // 제거
};
```

---

### 1-5. `src/app/pages/BoardsPage.tsx` (1개)

**에러**: Line 3 - `Calendar` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
import { Bell, MessageSquare, Calendar, Users, BarChart3, Trophy, Plus, Pin, MessageCircle } from 'lucide-react';
```

**수정 방법**:
- `Calendar` 아이콘을 import에서 제거

**수정 후 코드**:
```typescript
import { Bell, MessageSquare, Users, BarChart3, Trophy, Plus, Pin, MessageCircle } from 'lucide-react';
```

---

### 1-6. `src/app/pages/FinancePage.tsx` (4개)

**에러 1**: Line 9 - `Filter` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Filter,
  Wallet,
  CreditCard,
  ShoppingBag,
  Package,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
```

**수정 방법**:
- `Filter`를 import에서 제거

---

**에러 2**: Line 11 - `CreditCard` is declared but its value is never read (TS6133)

**수정 방법**:
- `CreditCard`를 import에서 제거

---

**에러 3**: Line 12 - `ShoppingBag` is declared but its value is never read (TS6133)

**수정 방법**:
- `ShoppingBag`를 import에서 제거

---

**수정 후 코드**:
```typescript
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Calendar,
  Wallet,
  Package,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
```

---

**에러 4**: Line 40 - `onBack` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
export const FinancePage: React.FC<FinancePageProps> = ({ onBack }) => {
```

**수정 방법**:
- `onBack` props를 destructuring에서 제거하거나, props interface에서 제거
- 실제로 사용 계획이 없다면 interface에서도 제거하는 것이 좋음

**수정 후 코드**:
```typescript
interface FinancePageProps {
  // onBack?: () => void; // 미사용
}

export const FinancePage: React.FC<FinancePageProps> = () => {
```

---

### 1-7. `src/app/pages/GameRecordPage.tsx` (1개)

**에러**: Line 30 - `user` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
const { user } = useAuth();
```

**수정 방법**:
- `user`를 destructuring에서 제거

**수정 후 코드**:
```typescript
// const { user } = useAuth(); // 미사용
```

---

### 1-8. `src/app/pages/HomePage.tsx` (1개)

**에러**: Line 18 - `user` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
const { user } = useAuth();
```

**수정 방법**:
- `user`를 destructuring에서 제거

**수정 후 코드**:
```typescript
// const { user } = useAuth(); // 미사용
```

---

### 1-9. `src/app/pages/LoginPage.tsx` (1개)

**에러**: Line 21 - `isIOS` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
import {
  isInAppBrowser,
  getBreakoutUrl,
  isAndroid,
  isIOS
} from '../../lib/utils/userAgent';
```

**수정 방법**:
- `isIOS`를 import에서 제거 (실제로 사용되지 않음)

**수정 후 코드**:
```typescript
import {
  isInAppBrowser,
  getBreakoutUrl,
  isAndroid,
} from '../../lib/utils/userAgent';
```

---

### 1-10. `src/app/pages/MyPage.tsx` (1개)

**에러**: Line 5 - `Comment` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
import { useData, Post, Comment } from '../contexts/DataContext';
```

**수정 방법**:
- `Comment`를 import에서 제거

**수정 후 코드**:
```typescript
import { useData, Post } from '../contexts/DataContext';
```

---

### 1-11. `src/app/pages/NotificationPage.tsx` (2개)

**에러 1**: Line 12 - `Trash2` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
import {
  Bell,
  User,
  CheckCheck,
  Trash2,
  ArrowLeft,
} from 'lucide-react';
```

**수정 방법**:
- `Trash2`를 import에서 제거

**수정 후 코드**:
```typescript
import {
  Bell,
  User,
  CheckCheck,
  ArrowLeft,
} from 'lucide-react';
```

---

**에러 2**: Line 28 - `user` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
const { user } = useAuth();
```

**수정 방법**:
- `user`를 destructuring에서 제거

**수정 후 코드**:
```typescript
// const { user } = useAuth(); // 미사용
```

---

### 1-12. `src/app/pages/SchedulePage.tsx` (1개)

**에러**: Line 346 - `user` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
const { user, isAdmin } = useAuth();
```

**확인 필요**:
- `isAdmin`은 사용되는지 확인 필요
- `user`만 사용되지 않는다면 `user`만 제거

**수정 방법** (user만 제거):
```typescript
const { isAdmin } = useAuth();
```

---

### 1-13. `src/app/pages/SettingsPage.tsx` (1개)

**에러**: `onBack` is declared but its value is never read (TS6133)

**현재 코드**:
```typescript
interface SettingsPageProps {
  onBack?: () => void;
}

export const FinancePage: React.FC<SettingsPageProps> = () => {
```

**수정 방법**:
- `onBack` props를 interface에서 제거

**수정 후 코드**:
```typescript
interface SettingsPageProps {
  // onBack?: () => void; // 미사용
}

export const SettingsPage: React.FC<SettingsPageProps> = () => {
```

---

### 1-14. `src/lib/firebase/auth.service.ts` (1개)

**에러**: Line 432 - `role` is declared but its value is never read (TS6133)

**현재 코드** (추정):
```typescript
export function canCreatePosts(role: UserRole): boolean {
  return true; // 모든 회원 가능
}
```

**수정 방법**:
- `role` 매개변수가 사용되지 않으므로, 매개변수 이름 앞에 `_`를 붙여 "의도적으로 사용하지 않음"을 표시

**수정 후 코드**:
```typescript
export function canCreatePosts(_role: UserRole): boolean {
  return true; // 모든 회원 가능
}
```

또는 매개변수를 완전히 제거 (하지만 이는 함수 시그니처 변경이므로 다른 곳에서 호출하는 코드도 확인 필요):

만약 함수 시그니처를 유지해야 한다면:
```typescript
export function canCreatePosts(_role: UserRole): boolean {
  return true; // 모든 회원 가능
}
```

---

## 2. 타입 불일치 수정 (5개)

### 2-1. `src/app/contexts/DataContext.tsx` (3개)

#### 에러 1: Line 323 - `Type 'Date | null' is not assignable to type 'Date | undefined'`

**문제 위치**: `addPost` 함수 내부에서 `newPostData.startAt`에 값을 할당할 때

**현재 코드**:
```typescript
// Event specific
if (postData.eventType) {
  newPostData.eventType = postData.eventType;
  newPostData.startAt = postData.startAt || null;
  newPostData.place = postData.place || null;
  newPostData.opponent = postData.opponent || null;
  newPostData.voteCloseAt = postData.voteCloseAt || null;
  newPostData.voteClosed = false;
}
```

**문제 원인**:
- `postData.startAt`은 `Date | undefined` 타입
- `|| null`을 사용하면 결과가 `Date | null`이 됨
- 하지만 `PostDoc.startAt`은 `Date | null | undefined`를 허용하지만, 타입 시스템이 `Date | null`을 `Date | undefined`로 할당할 수 없다고 판단

**수정 방법**:
- `null` 대신 `undefined`를 사용하거나, 명시적으로 타입 변환
- `PostDoc`의 타입 정의를 확인했을 때 `startAt?: Date | null`이므로, 실제로는 `null`을 허용하지만, 타입 체커가 엄격하게 검사하고 있음

**수정 후 코드**:
```typescript
// Event specific
if (postData.eventType) {
  newPostData.eventType = postData.eventType;
  newPostData.startAt = postData.startAt ?? null;
  newPostData.place = postData.place ?? null;
  newPostData.opponent = postData.opponent ?? null;
  newPostData.voteCloseAt = postData.voteCloseAt ?? null;
  newPostData.voteClosed = false;
}
```

하지만 이것도 타입 에러가 날 수 있으므로, 더 나은 방법은:

```typescript
// Event specific
if (postData.eventType) {
  newPostData.eventType = postData.eventType;
  newPostData.startAt = postData.startAt ?? undefined;
  newPostData.place = postData.place ?? undefined;
  newPostData.opponent = postData.opponent ?? undefined;
  newPostData.voteCloseAt = postData.voteCloseAt ?? undefined;
  newPostData.voteClosed = false;
}
```

하지만 `PostDoc` 타입 정의를 보면 `startAt?: Date | null`이므로, `null`을 허용합니다. 

**최종 수정 방법** (타입 정의와 일치시키기):
- `PostDoc` 타입이 `Date | null`을 허용하므로, 타입 단언을 사용하거나 타입 정의를 확인

실제로는 `PostDoc.startAt`이 `Date | null | undefined`를 허용하는데, `Post.startAt`은 `Date | undefined`만 허용합니다.

**정확한 수정**:
```typescript
newPostData.startAt = (postData.startAt ?? null) as Date | null;
```

또는 더 간단하게:
```typescript
newPostData.startAt = postData.startAt || undefined;
```

하지만 이건 의미가 다릅니다. `postData.startAt`이 `Date`이면 그대로, `undefined`이면 `undefined`가 되어야 하는데 `|| undefined`는 falsy 값을 모두 `undefined`로 바꿔버립니다.

**가장 정확한 수정**:
```typescript
newPostData.startAt = postData.startAt ?? null;
```

그런데 타입 에러가 발생한다는 것은 `PostDoc.startAt`의 타입이 `Date | null`을 허용하지 않는다는 의미입니다.

**타입 정의 재확인 필요**: `src/lib/firebase/types.ts`에서 `PostDoc.startAt`의 타입이 `Date | null`인지 확인

확인 결과 `PostDoc.startAt?: Date | null`로 정의되어 있습니다. 따라서 타입 단언이 필요할 수 있습니다:

```typescript
newPostData.startAt = (postData.startAt ?? null) as Date | null | undefined;
```

하지만 더 나은 방법은 타입 정의를 일치시키는 것입니다.

**최종 해결책**: `??` 연산자를 사용하되, 타입을 명시적으로 처리:

```typescript
newPostData.startAt = postData.startAt !== undefined ? postData.startAt : null;
```

---

#### 에러 2: Line 336 - `Type 'Date | null' is not assignable to type 'Date | undefined'`

**문제 위치**: 동일한 `addPost` 함수 내부, `voteCloseAt` 할당

**수정 방법**: 위와 동일

```typescript
newPostData.voteCloseAt = postData.voteCloseAt !== undefined ? postData.voteCloseAt : null;
```

---

#### 에러 3: Line 427 - `Type 'string | null | undefined' is not assignable to type 'string | undefined'`

**문제 위치**: `loadComments` 함수 내부에서 댓글을 변환할 때

**현재 코드 추정**:
```typescript
const transformedComments: Comment[] = commentsData.map((commentDoc) => ({
  id: commentDoc.id,
  postId: commentDoc.postId,
  content: commentDoc.content,
  author: {
    id: commentDoc.authorId,
    name: commentDoc.authorName,
    photoURL: commentDoc.authorPhotoURL, // 여기서 타입 에러 발생 가능
  },
  // ...
}));
```

**문제 원인**:
- `commentDoc.authorPhotoURL`이 `string | null | undefined` 타입
- `Comment.author.photoURL`은 `string | undefined`만 허용

**수정 방법**:
- `null`을 `undefined`로 변환

**수정 후 코드**:
```typescript
author: {
  id: commentDoc.authorId,
  name: commentDoc.authorName,
  photoURL: commentDoc.authorPhotoURL ?? undefined,
},
```

---

### 2-2. `src/app/pages/AlbumPage.tsx` (1개)

**에러**: Line 59 - `Type 'string | null | undefined' is not assignable to type 'string | undefined'`

**현재 코드 추정**:
```typescript
const mediaType: MediaType | undefined = post.mediaType ?? undefined;
```

또는 다른 변수 할당 부분

**수정 방법**:
- `null`을 `undefined`로 변환

**수정 후 코드** (구체적인 코드 확인 필요):
```typescript
const mediaType: MediaType | undefined = post.mediaType ?? undefined;
```

만약 다른 변수라면:
```typescript
const someVar: string | undefined = post.someField ?? undefined;
```

---

## 3. 정의되지 않은 식별자 수정 (1개)

### 3-1. `src/app/components/PollVoteModal.tsx` (2개 - 동일한 식별자)

**에러 1**: Line 113 - `Cannot find name 'canDelete'. Did you mean 'onDelete'?` (TS2552)

**현재 코드**:
```typescript
{(canEdit || canDelete) && (
  <div className="flex gap-1 mr-2">
    {canEdit && (
      <button
        onClick={handleEdit}
        className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors"
      >
        <Edit2 className="w-4 h-4" />
      </button>
    )}
    {canDelete && (
      <button
        onClick={handleDelete}
        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  </div>
)}
```

**문제 원인**:
- `canDelete` 변수가 선언되지 않음
- `canEdit`은 `user?.id === poll.author.id || isAdmin()`로 정의되어 있지만, `canDelete`는 없음

**수정 방법 1** (삭제 기능 제거):
- 삭제 버튼과 관련 코드 모두 제거

**수정 방법 2** (삭제 기능 추가):
- `canDelete` 변수를 `canEdit`과 동일하게 정의

**수정 후 코드** (방법 2 선택 시):
```typescript
const canEdit = user?.id === poll.author.id || isAdmin();
const canDelete = user?.id === poll.author.id || isAdmin(); // 추가
```

**권장**: `canDelete`도 `canEdit`과 동일한 권한 체크를 하도록 정의

---

**에러 2**: Line 123 - `Cannot find name 'canDelete'. Did you mean 'onDelete'?` (TS2552)

- 위와 동일한 문제

---

### 3-2. `src/app/components/PollVoteModal.tsx` (1개 - 산술 연산)

**에러**: Line 161 - `The left-hand side of an arithmetic operation must be of type 'any', 'number', 'bigint' or an enum type.` (TS2362)

**현재 코드**:
```typescript
const percentage = totalVotes > 0 ? (choice.votes || 0) / totalVotes * 100 : 0;
```

**문제 원인**:
- `choice.votes`가 `string[] | undefined` 타입
- `|| 0`을 사용해도 TypeScript가 타입을 `string[] | 0`으로 추론할 수 있음
- 배열의 길이를 사용해야 함

**수정 방법**:
- `choice.votes`의 길이를 사용

**수정 후 코드**:
```typescript
const percentage = totalVotes > 0 ? ((choice.votes?.length || 0) / totalVotes * 100) : 0;
```

---

## 수정 요약

### 우선순위 1: 타입 에러 (런타임 버그 가능성)
1. DataContext.tsx - 3개 (Date/null 타입 불일치)
2. AlbumPage.tsx - 1개 (string/null 타입 불일치)
3. PollVoteModal.tsx - 산술 연산 타입 에러

### 우선순위 2: 정의되지 않은 식별자
1. PollVoteModal.tsx - `canDelete` 정의 필요

### 우선순위 3: 코드 정리 (기능 영향 없음)
1. 모든 미사용 import/변수 제거 (20개)

---

## 수정 순서 권장

1. **PollVoteModal.tsx** - `canDelete` 정의 및 산술 연산 수정
2. **DataContext.tsx** - null → undefined 변환 (3개)
3. **AlbumPage.tsx** - null → undefined 변환
4. **모든 파일** - 미사용 import/변수 제거

